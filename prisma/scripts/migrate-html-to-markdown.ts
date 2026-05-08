import { PrismaClient } from "@prisma/client";
import { htmlToMarkdown } from "../../lib/utils/html-to-markdown";

const db = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

function snippet(text: string, maxLen = 80): string {
    const clean = text.replace(/\n/g, "\\n");
    return clean.length > maxLen
        ? clean.slice(0, maxLen) + "..."
        : clean;
}

const STRUCTURAL_HTML_RE =
    /<(?:p|h[1-6]|ul|ol|li|table|tr|td|th|blockquote|div|br\s*\/?)[\s>]/i;

function isHtml(text: string): boolean {
    return STRUCTURAL_HTML_RE.test(text);
}

async function migrateTable<
    T extends { id: string; content: string },
>(
    label: string,
    records: T[],
    update: (id: string, content: string) => Promise<void>,
) {
    let converted = 0;
    let skipped = 0;

    for (const record of records) {
        if (!record.content || !isHtml(record.content)) {
            skipped++;
            continue;
        }

        const markdown = htmlToMarkdown(record.content);
        console.log(`  [${label}] id=${record.id}`);
        console.log(`    BEFORE: ${snippet(record.content)}`);
        console.log(`    AFTER:  ${snippet(markdown)}`);

        if (!DRY_RUN) {
            await update(record.id, markdown);
        }

        converted++;
    }

    console.log(
        `  ${label}: ${converted} converted, ${skipped} skipped${DRY_RUN ? " (DRY RUN)" : ""}`,
    );
}

async function main() {
    console.log(
        `\nMigrating HTML to Markdown${DRY_RUN ? " (DRY RUN)" : ""}...\n`,
    );

    const [news, rules, offers, infoSections] = await Promise.all([
        db.news.findMany({ select: { id: true, content: true } }),
        db.rule.findMany({ select: { id: true, content: true } }),
        db.offer.findMany({ select: { id: true, content: true } }),
        db.infoSection.findMany({
            select: { id: true, content: true },
        }),
    ]);

    await migrateTable("News", news, (id, content) =>
        db.news.update({ where: { id }, data: { content } }).then(),
    );

    await migrateTable("Rule", rules, (id, content) =>
        db.rule.update({ where: { id }, data: { content } }).then(),
    );

    await migrateTable("Offer", offers, (id, content) =>
        db.offer
            .update({ where: { id }, data: { content } })
            .then(),
    );

    await migrateTable("InfoSection", infoSections, (id, content) =>
        db.infoSection
            .update({ where: { id }, data: { content } })
            .then(),
    );

    // GDPR SiteSetting
    const gdpr = await db.siteSetting.findUnique({
        where: { key: "gdpr" },
    });

    if (gdpr?.value && isHtml(gdpr.value)) {
        const markdown = htmlToMarkdown(gdpr.value);
        console.log("  [SiteSetting:gdpr]");
        console.log(`    BEFORE: ${snippet(gdpr.value)}`);
        console.log(`    AFTER:  ${snippet(markdown)}`);

        if (!DRY_RUN) {
            await db.siteSetting.update({
                where: { key: "gdpr" },
                data: { value: markdown },
            });
        }

        console.log(
            `  SiteSetting:gdpr: converted${DRY_RUN ? " (DRY RUN)" : ""}`,
        );
    } else {
        console.log("  SiteSetting:gdpr: skipped (not HTML or empty)");
    }

    console.log("\nDone.\n");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => db.$disconnect());
