/**
 * Migration script: Storage URL migration to Cloudflare R2
 *
 * Dynamically scans ALL tables and ALL text/json columns in the
 * database for source domain URLs, then downloads and re-uploads
 * referenced images to R2 and updates the URLs.
 *
 * Environment variables:
 *   MIGRATE_SOURCE_DOMAIN  - domain to search for (e.g. "vqgv1mhndudhvlpf.public.blob.vercel-storage.com")
 *   BLOB_READ_WRITE_TOKEN  - Vercel Blob token for authenticated downloads (optional)
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME - R2 config
 *
 * Usage:
 *   MIGRATE_SOURCE_DOMAIN="xyz.public.blob.vercel-storage.com" npm run migrate:blob-to-r2 -- --dry-run
 *   MIGRATE_SOURCE_DOMAIN="xyz.public.blob.vercel-storage.com" npm run migrate:blob-to-r2
 */

import { PrismaClient, Prisma } from "@prisma/client";
import {
    S3Client,
    PutObjectCommand,
} from "@aws-sdk/client-s3";

const sourceDomain: string = process.env.MIGRATE_SOURCE_DOMAIN ?? "";
if (!sourceDomain) {
    console.error("MIGRATE_SOURCE_DOMAIN is required.\n");
    console.error("Example:");
    console.error('  MIGRATE_SOURCE_DOMAIN="vqgv1mhndudhvlpf.public.blob.vercel-storage.com" npm run migrate:blob-to-r2 -- --dry-run\n');
    process.exit(1);
}

const escapedDomain = sourceDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SOURCE_URL_PATTERN = new RegExp(`https?://[^"'\\s]*${escapedDomain}[^"'\\s]*`, "g");
const SOURCE_LIKE = `%${sourceDomain}%`;

const db = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

function getR2Client(): S3Client {
    return new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
    });
}

function extractBlobUrls(value: unknown): string[] {
    if (!value) return [];
    const text = typeof value === "string"
        ? value
        : JSON.stringify(value);
    return [...new Set(text.match(SOURCE_URL_PATTERN) ?? [])];
}

function extractKeyFromBlobUrl(url: string): string {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const filename = pathParts[pathParts.length - 1];
    return `uploads/${filename}`;
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
        const headers: Record<string, string> = {};
        if (blobToken) {
            headers["Authorization"] = `Bearer ${blobToken}`;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            console.error(`  Failed to download ${url}: ${response.status}`);
            return null;
        }
        const contentType = response.headers.get("content-type") ?? "image/jpeg";
        const buffer = Buffer.from(await response.arrayBuffer());
        return { buffer, contentType };
    } catch (error) {
        console.error(`  Failed to download ${url}:`, error);
        return null;
    }
}

async function uploadToR2(
    client: S3Client,
    key: string,
    body: Buffer,
    contentType: string
): Promise<void> {
    await client.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    );
}

interface VercelBlob {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: string;
}

async function listAllVercelBlobs(): Promise<VercelBlob[]> {
    if (!blobToken) return [];

    const blobs: VercelBlob[] = [];
    let cursor: string | undefined;

    do {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);

        const response = await fetch(
            `https://blob.vercel-storage.com?${params}`,
            { headers: { Authorization: `Bearer ${blobToken}` } }
        );

        if (!response.ok) {
            console.error(`Failed to list Vercel blobs: ${response.status}`);
            return blobs;
        }

        const data = await response.json() as {
            blobs: VercelBlob[];
            cursor?: string;
            hasMore: boolean;
        };

        blobs.push(...data.blobs);
        cursor = data.hasMore ? data.cursor : undefined;
    } while (cursor);

    return blobs;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ColumnInfo {
    table: string;
    column: string;
    dataType: string;
}

interface AffectedRecord {
    table: string;
    id: string;
    column: string;
    dataType: string;
    urls: string[];
}

async function discoverTextColumns(): Promise<ColumnInfo[]> {
    const rows = await db.$queryRaw<ColumnInfo[]>`
        SELECT
            table_name AS "table",
            column_name AS "column",
            data_type AS "dataType"
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type IN ('text', 'character varying', 'json', 'jsonb')
        ORDER BY table_name, ordinal_position
    `;
    return rows;
}

async function findRowsWithBlobUrls(
    table: string,
    column: string,
    dataType: string
): Promise<{ id: string; value: unknown }[]> {
    const castColumn = dataType === "json" || dataType === "jsonb"
        ? Prisma.sql`CAST(${Prisma.raw(`"${column}"`)} AS text)`
        : Prisma.raw(`"${column}"`);

    const rows = await db.$queryRaw<{ id: string; value: string }[]>`
        SELECT "id", ${Prisma.raw(`"${column}"`)}::text AS "value"
        FROM ${Prisma.raw(`"${table}"`)}
        WHERE ${castColumn} LIKE ${SOURCE_LIKE}
    `;
    return rows;
}

async function main() {
    console.log(dryRun ? "=== DRY RUN ===" : "=== MIGRATING ===");

    if (!dryRun && !blobToken) {
        console.warn(
            "WARNING: BLOB_READ_WRITE_TOKEN not set.\n" +
            "Downloads will use public URLs (may fail if traffic-limited).\n" +
            "Ask the Vercel admin for the token to bypass limits.\n"
        );
    }

    console.log(`Source domain: ${sourceDomain}\n`);

    if (blobToken) {
        console.log("Using BLOB_READ_WRITE_TOKEN for authenticated downloads.\n");
    }

    // Phase 1: Discover all text/json columns and scan for source URLs
    console.log("Discovering database columns...\n");
    const columns = await discoverTextColumns();
    console.log(`  Found ${columns.length} text/json columns across all tables.\n`);

    console.log("Scanning for source domain URLs...\n");
    const allBlobUrls = new Set<string>();
    const affectedRecords: AffectedRecord[] = [];
    let scannedTables = 0;

    const tableGroups = new Map<string, ColumnInfo[]>();
    for (const col of columns) {
        const group = tableGroups.get(col.table) ?? [];
        group.push(col);
        tableGroups.set(col.table, group);
    }

    for (const [table, cols] of tableGroups) {
        let tableHasId = false;
        try {
            const idCheck = await db.$queryRaw<{ exists: boolean }[]>`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = ${table}
                      AND column_name = 'id'
                ) AS "exists"
            `;
            tableHasId = idCheck[0]?.exists ?? false;
        } catch {
            continue;
        }

        if (!tableHasId) {
            console.log(`  Skipping ${table} (no id column)`);
            continue;
        }

        for (const col of cols) {
            try {
                const rows = await findRowsWithBlobUrls(table, col.column, col.dataType);
                if (rows.length > 0) {
                    for (const row of rows) {
                        const urls = extractBlobUrls(row.value);
                        if (urls.length > 0) {
                            urls.forEach((u) => allBlobUrls.add(u));
                            affectedRecords.push({
                                table,
                                id: row.id,
                                column: col.column,
                                dataType: col.dataType,
                                urls,
                            });
                        }
                    }
                }
            } catch {
                // Skip columns that can't be queried (e.g. array types)
            }
        }
        scannedTables++;
    }

    console.log(`  Scanned ${scannedTables} tables.\n`);

    if (allBlobUrls.size === 0) {
        console.log("No source domain URLs found. Nothing to migrate.");
        return;
    }

    console.log(`Found ${allBlobUrls.size} unique source URL(s):\n`);
    for (const url of allBlobUrls) {
        console.log(`  ${url}`);
    }

    console.log(`\nAffected records (${affectedRecords.length}):\n`);
    for (const rec of affectedRecords) {
        console.log(`  ${rec.table} [${rec.id}] .${rec.column}`);
        for (const url of rec.urls) {
            console.log(`    - ${url}`);
        }
    }

    // Audit: compare DB references against all blobs in Vercel storage
    // Audit: compare DB references against Vercel Blob storage (only for Vercel sources)
    if (blobToken && sourceDomain.includes("blob.vercel-storage.com")) {
        console.log("\nAuditing Vercel Blob storage...\n");
        const allBlobs = await listAllVercelBlobs();

        if (allBlobs.length > 0) {
            const orphaned = allBlobs.filter((b) => !allBlobUrls.has(b.url));
            const used = allBlobs.filter((b) => allBlobUrls.has(b.url));
            const orphanedSize = orphaned.reduce((sum, b) => sum + b.size, 0);

            console.log(`  Total blobs in storage: ${allBlobs.length}`);
            console.log(`  Referenced in DB:       ${used.length}`);
            console.log(`  Orphaned (unused):      ${orphaned.length} (${formatSize(orphanedSize)})`);

            if (orphaned.length > 0) {
                console.log("\n  Orphaned blobs (not referenced in DB):\n");
                for (const blob of orphaned) {
                    console.log(`    ${blob.pathname} (${formatSize(blob.size)}, uploaded ${blob.uploadedAt})`);
                }
            }
        } else {
            console.log("  Could not list blobs (empty response or API error).");
        }
    }

    if (dryRun) {
        console.log("\nDry run complete. No changes made.");
        return;
    }

    // Phase 2: Download from Vercel Blob and upload to R2
    console.log("\nMigrating images...\n");
    const r2Client = getR2Client();
    const urlMap = new Map<string, string>();
    let migrated = 0;
    let failed = 0;

    for (const oldUrl of allBlobUrls) {
        const key = extractKeyFromBlobUrl(oldUrl);
        console.log(`  ${oldUrl}`);
        console.log(`    -> key: ${key}`);

        const image = await downloadImage(oldUrl);
        if (!image) {
            failed++;
            console.log(`    -> FAILED (could not download)\n`);
            continue;
        }

        try {
            await uploadToR2(r2Client, key, image.buffer, image.contentType);
            urlMap.set(oldUrl, key);
            migrated++;
            console.log(`    -> ${key}\n`);
        } catch (error) {
            failed++;
            console.error(`    -> FAILED (upload error):`, error);
        }
    }

    console.log(`\nUploaded: ${migrated}, Failed: ${failed}\n`);

    if (urlMap.size === 0) {
        console.log("No URLs were successfully migrated. Skipping DB updates.");
        return;
    }

    // Phase 3: Update database URLs via raw SQL REPLACE
    console.log("Updating database URLs...\n");
    let updatedRecords = 0;

    for (const rec of affectedRecords) {
        let changed = false;
        const isJson = rec.dataType === "json" || rec.dataType === "jsonb";
        const castBack = isJson ? rec.dataType : "text";

        for (const oldUrl of rec.urls) {
            const newUrl = urlMap.get(oldUrl);
            if (newUrl) {
                await db.$executeRaw`
                    UPDATE ${Prisma.raw(`"${rec.table}"`)}
                    SET ${Prisma.raw(`"${rec.column}"`)} =
                        REPLACE(${Prisma.raw(`"${rec.column}"`)}::text, ${oldUrl}, ${newUrl})::${Prisma.raw(castBack)}
                    WHERE "id" = ${rec.id}
                `;
                changed = true;
            }
        }
        if (changed) {
            updatedRecords++;
            console.log(`  Updated ${rec.table} [${rec.id}] .${rec.column}`);
        }
    }

    console.log(`\nDone. Updated ${updatedRecords} record(s).`);
}

main()
    .catch((error) => {
        console.error("Migration failed:", error);
        process.exit(1);
    })
    .finally(() => db.$disconnect());
