import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { requireEditor } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}${ext}`;
}

function sanitizeFilename(filename: string): string {
    // Remove any path components and sanitize the filename
    const baseName = path.basename(filename);
    // Replace any potentially dangerous characters
    return baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        await requireEditor();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Zadny soubor nebyl nahran" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Nepodporovany typ souboru. Povolene typy: JPG, PNG, WebP, GIF" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "Soubor je prilis velky. Maximum je 5 MB" },
                { status: 400 }
            );
        }

        // Generate a safe filename
        const sanitized = sanitizeFilename(file.name);
        const filename = generateFilename(sanitized);

        let url: string;

        if (process.env.VERCEL) {
            // Vercel: upload to Vercel Blob
            const blob = await put(`uploads/${filename}`, file, {
                access: "public",
            });
            url = blob.url;
        } else {
            // Local: save to public/uploads/
            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const filepath = path.join(UPLOAD_DIR, filename);
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filepath, buffer);

            url = `/uploads/${filename}`;
        }

        return NextResponse.json({ url, filename });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Nahravani selhalo" },
            { status: 500 }
        );
    }
}
