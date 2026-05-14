import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { resolve } from "path";

// ============================================
// CLI flags
// ============================================
// --production  Use SOURCE_DATABASE_URL instead of DATABASE_URL
// --output, -o  Output path (default: prisma/seed-data.json)

const args = process.argv.slice(2);
const useProduction = args.includes("--production");
const outputIdx = args.indexOf("--output") !== -1
    ? args.indexOf("--output")
    : args.indexOf("-o");
const outputPath = resolve(
    outputIdx !== -1 && args[outputIdx + 1]
        ? args[outputIdx + 1]
        : "prisma/seed-data.json"
);

const dbUrl = useProduction
    ? process.env.SOURCE_DATABASE_URL
    : process.env.DATABASE_URL;

if (useProduction && !process.env.SOURCE_DATABASE_URL) {
    console.error(
        "Error: --production requires SOURCE_DATABASE_URL to be set"
    );
    process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: dbUrl });

// ============================================
// Anonymization
// ============================================

const TEXT_REPLACEMENTS: [string | RegExp, string][] = [
    // Contact emails (including typos found in production data)
    ["helmac.registrace@email.cz", "registrace@example.com"],
    ["Helmac.registrace@email.cz", "registrace@example.com"],
    ["hemlac.registrace@email.cz", "registrace@example.com"],
    ["helmac.otrokar@email.cz", "dobrovolnici@example.com"],
    ["helmac@email.cz", "info@example.com"],
    ["elfove.avari@gmail.com", "detskyprogram@example.com"],
    // Real names in contact sections (regex to handle Unicode quotes)
    [/Tomáš\s*.Tumi.\s*Coufal\s*a\s*Kristýna\s*.Sluníčko.\s*Jeklová/g, "Org 3 a Org 4"],
    [/Lukáš\s*.Dub.\s*Dubec/g, "Org 1"],
    [/Petr\s*.Hulk.\s*Chaloupek/g, "Org 2"],
    [/Tomáš\s*.Tumi.\s*Coufal/g, "Org 3"],
    [/Kristýna\s*.Sluníčko.\s*Jeklová/g, "Org 4"],
    // Personal Facebook profiles
    [
        /https:\/\/www\.facebook\.com\/luk\.dub/g,
        "https://example.com/profile",
    ],
    ["BaaTorské Království z.s.", "Příkladový Spolek z.s."],
    ["BaaTorské Království", "Příkladový Spolek"],
    [/IČO:\s*04050754/g, "IČO: 12345678"],
    ["04050754", "12345678"],
    [
        "Vranovská Ves 60, 671 51 Vranovská Ves",
        "Příkladová 1, 100 00 Praha",
    ],
    ["Vranovská Ves 60", "Příkladová 1"],
    ["Vranovská Ves", "Praha"],
    ["671 51", "100 00"],
    [
        /https:\/\/docs\.google\.com\/forms\/[^\s"'<)]+/g,
        "https://example.com/form",
    ],
    [
        /https:\/\/drive\.google\.com\/file\/[^\s"'<)]+/g,
        "https://example.com/file",
    ],
    [
        /https:\/\/docs\.google\.com\/document\/[^\s"'<)]+/g,
        "https://example.com/document",
    ],
];

function anonymize(
    text: string | null | undefined
): string | null {
    if (!text) return text as null;
    let result = text;
    for (const [from, to] of TEXT_REPLACEMENTS) {
        if (from instanceof RegExp) {
            result = result.replace(from, to);
        } else {
            while (result.includes(from)) {
                result = result.replace(from, to);
            }
        }
    }
    return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anonymizeDeep(obj: any): any {
    if (typeof obj === "string") return anonymize(obj);
    if (Array.isArray(obj)) return obj.map(anonymizeDeep);
    if (
        obj !== null &&
        typeof obj === "object" &&
        !(obj instanceof Date)
    ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
            result[k] = anonymizeDeep(v);
        }
        return result;
    }
    return obj;
}

function anonymizeAlbumTitle(
    title: string,
    index: number
): string {
    const dash = title.lastIndexOf(" - ");
    if (dash === -1) return title;
    return (
        title.substring(0, dash) +
        ` - Fotograf ${index + 1}`
    );
}

// ============================================
// Read & anonymize
// ============================================

async function main() {
    console.log(
        useProduction
            ? "Dumping from PRODUCTION database..."
            : "Dumping from LOCAL database..."
    );

    const year = await prisma.year.findFirst({
        where: { isActive: true },
    });
    if (!year) {
        console.error("No active year found");
        process.exit(1);
    }

    const yearId = year.id;

    const [
        pages,
        programDays,
        sectionTypes,
        news,
        albums,
        form,
        gdpr,
        steps,
        condEmails,
    ] = await Promise.all([
        prisma.page.findMany({
            where: { yearId },
            orderBy: { sortOrder: "asc" },
        }),
        prisma.programDay.findMany({
            where: { yearId },
            orderBy: { sortOrder: "asc" },
            include: {
                events: { orderBy: { sortOrder: "asc" } },
            },
        }),
        prisma.sectionType.findMany({
            where: { yearId },
            orderBy: { sortOrder: "asc" },
            include: {
                sections: { orderBy: { sortOrder: "asc" } },
            },
        }),
        prisma.news.findMany({
            where: { yearId },
            orderBy: { publishedAt: "asc" },
        }),
        prisma.album.findMany({
            where: { yearId },
            orderBy: { sortOrder: "asc" },
        }),
        prisma.registrationForm.findFirst({
            where: { yearId },
        }),
        prisma.siteSetting.findFirst({
            where: { key: "gdpr" },
        }),
        prisma.homepageStep.findMany({
            where: { yearId },
            orderBy: { sortOrder: "asc" },
        }),
        prisma.conditionalEmail.findMany({
            where: { yearId },
            orderBy: { sortOrder: "asc" },
        }),
    ]);

    // Build anonymized dump
    const dump = {
        year: {
            id: year.id,
            year: year.year,
            title: year.title,
            subtitle: year.subtitle,
            startDate: year.startDate,
            endDate: year.endDate,
            registrationStartDate: year.registrationStartDate,
            headerPhoto: year.headerPhoto,
            heroPhoto: year.heroPhoto,
            registrationSuccessContent: anonymizeDeep(
                year.registrationSuccessContent
            ),
            confirmationEmailEnabled:
                year.confirmationEmailEnabled,
            confirmationEmailSubject: anonymize(
                year.confirmationEmailSubject
            ),
            confirmationEmailBody: anonymize(
                year.confirmationEmailBody
            ),
            confirmationEmailSections: anonymizeDeep(
                year.confirmationEmailSections
            ),
            priceChangeEmailEnabled:
                year.priceChangeEmailEnabled,
            priceChangeEmailSubject: anonymize(
                year.priceChangeEmailSubject
            ),
            priceChangeEmailBody: anonymize(
                year.priceChangeEmailBody
            ),
            priceChangeEmailSections: anonymizeDeep(
                year.priceChangeEmailSections
            ),
            paymentEmailEnabled: year.paymentEmailEnabled,
            paymentEmailSubject: anonymize(
                year.paymentEmailSubject
            ),
            paymentEmailBody: anonymize(
                year.paymentEmailBody
            ),
            paymentEmailSections: anonymizeDeep(
                year.paymentEmailSections
            ),
        },
        pages: pages.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            content: p.content,
            seoTitle: p.seoTitle,
            seoDesc: p.seoDesc,
            sortOrder: p.sortOrder,
        })),
        programDays: programDays.map((d) => ({
            id: d.id,
            date: d.date,
            label: d.label,
            sortOrder: d.sortOrder,
            events: d.events.map((e) => ({
                id: e.id,
                startTime: e.startTime,
                endTime: e.endTime,
                title: e.title,
                description: anonymize(e.description),
                location: e.location,
                imageUrl: e.imageUrl,
                tags: e.tags,
                storyContent: anonymizeDeep(
                    e.storyContent
                ),
                actionButtons: anonymizeDeep(
                    e.actionButtons
                ),
                isPublished: e.isPublished,
                sortOrder: e.sortOrder,
            })),
        })),
        sectionTypes: sectionTypes.map((st) => ({
            id: st.id,
            label: st.label,
            slug: st.slug,
            icon: st.icon,
            sortOrder: st.sortOrder,
            pageTitle: st.pageTitle,
            pageSubtitle: st.pageSubtitle,
            metaTitle: st.metaTitle,
            metaDescription: st.metaDescription,
            featuredOnIndex: st.featuredOnIndex,
            description: st.description,
            sections: st.sections.map((s) => ({
                id: s.id,
                title: s.title,
                subtitle: s.subtitle,
                description: s.description,
                icon: s.icon,
                content: anonymizeDeep(s.content),
                showToc: s.showToc,
                sortOrder: s.sortOrder,
            })),
        })),
        news: news.map((n) => ({
            id: n.id,
            slug: n.slug,
            title: n.title,
            excerpt: n.excerpt,
            content: anonymize(n.content),
            coverImage: n.coverImage,
            showToc: n.showToc,
            actionButtons: anonymizeDeep(n.actionButtons),
            isPublished: n.isPublished,
            publishedAt: n.publishedAt,
        })),
        albums: albums.map((a, i) => ({
            id: a.id,
            title: anonymizeAlbumTitle(a.title, i),
            slug: `gallery-${i + 1}`,
            description: a.description,
            externalUrl: `https://example.com/gallery-${i + 1}`,
            coverImage: a.coverImage,
            isPublished: a.isPublished,
            sortOrder: a.sortOrder,
        })),
        registrationForm: form
            ? (form.fields as object)
            : null,
        gdpr: gdpr
            ? (anonymize(gdpr.value) as string)
            : null,
        homepageSteps: steps.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            icon: s.icon,
            sortOrder: s.sortOrder,
        })),
        conditionalEmails: condEmails.map((e) => ({
            id: e.id,
            name: e.name,
            enabled: e.enabled,
            conditionFieldId: e.conditionFieldId,
            conditionFieldName: e.conditionFieldName,
            conditionOperator: e.conditionOperator,
            conditionValue: e.conditionValue,
            subject: anonymize(e.subject),
            body: anonymize(e.body),
            bcc: e.bcc,
            sections: anonymizeDeep(e.sections),
            sortOrder: e.sortOrder,
        })),
    };

    writeFileSync(outputPath, JSON.stringify(dump, null, 2));

    const eventCount = programDays.reduce(
        (n, d) => n + d.events.length,
        0
    );
    const sectionCount = sectionTypes.reduce(
        (n, t) => n + t.sections.length,
        0
    );

    console.log(`\nDumped to ${outputPath}:`);
    console.log(`  Year: ${year.title}`);
    console.log(`  Pages: ${pages.length}`);
    console.log(
        `  Program: ${programDays.length} days, ${eventCount} events`
    );
    console.log(
        `  Sections: ${sectionTypes.length} types, ${sectionCount} sections`
    );
    console.log(`  News: ${news.length}`);
    console.log(`  Albums: ${albums.length}`);
    console.log(
        `  Registration form: ${form ? "yes" : "no"}`
    );
    console.log(`  Homepage steps: ${steps.length}`);
    console.log(
        `  Conditional emails: ${condEmails.length}`
    );
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
