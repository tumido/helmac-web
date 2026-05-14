import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

const SEED_DATA_PATH = resolve("prisma/seed-data.json");
const ADMIN_PASSWORD = "admin123456";

const SEED_USERS = [
    {
        email: "admin@helmac.cz",
        name: "Admin",
        role: "SUPER_ADMIN" as const,
    },
    {
        email: "superadmin@example.com",
        name: "Superadmin",
        role: "SUPER_ADMIN" as const,
    },
    {
        email: "admin1@example.com",
        name: "Admin Jedna",
        role: "ADMIN" as const,
    },
    {
        email: "admin2@example.com",
        name: "Admin Dva",
        role: "ADMIN" as const,
    },
    {
        email: "editor1@example.com",
        name: "Editor Jedna",
        role: "EDITOR" as const,
    },
    {
        email: "editor2@example.com",
        name: "Editor Dva",
        role: "EDITOR" as const,
    },
];

const BANK_ACCOUNT = {
    bankAccountNumber: "1234567890",
    bankAccountBankCode: "0100",
    bankSwift: "KOMBCZPPXXX",
};

// ============================================
// Types for the dump file
// ============================================

interface SeedData {
    year: {
        id?: string;
        year: number;
        title: string;
        subtitle: string | null;
        startDate: string | null;
        endDate: string | null;
        registrationStartDate: string | null;
        headerPhoto: string | null;
        heroPhoto: string | null;
        registrationSuccessContent: unknown;
        confirmationEmailEnabled: boolean;
        confirmationEmailSubject: string | null;
        confirmationEmailBody: string | null;
        confirmationEmailSections: unknown;
        priceChangeEmailEnabled: boolean;
        priceChangeEmailSubject: string | null;
        priceChangeEmailBody: string | null;
        priceChangeEmailSections: unknown;
        paymentEmailEnabled: boolean;
        paymentEmailSubject: string | null;
        paymentEmailBody: string | null;
        paymentEmailSections: unknown;
    };
    pages: {
        id?: string;
        slug: string;
        title: string;
        content: unknown;
        seoTitle: string | null;
        seoDesc: string | null;
        sortOrder: number;
    }[];
    programDays: {
        id?: string;
        date: string;
        label: string;
        sortOrder: number;
        events: {
            id?: string;
            startTime: string;
            endTime: string | null;
            title: string;
            description: string;
            location: string;
            imageUrl: string | null;
            tags: string[];
            storyContent: unknown;
            actionButtons: unknown;
            isPublished: boolean;
            sortOrder: number;
        }[];
    }[];
    sectionTypes: {
        id?: string;
        label: string;
        slug: string;
        icon: string | null;
        sortOrder: number;
        pageTitle: string | null;
        pageSubtitle: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
        featuredOnIndex: boolean;
        description: string | null;
        sections: {
            id?: string;
            title: string;
            subtitle: string | null;
            description: string | null;
            icon: string | null;
            content: unknown;
            showToc: boolean;
            sortOrder: number;
        }[];
    }[];
    news: {
        id?: string;
        slug: string;
        title: string;
        excerpt: string | null;
        content: string;
        coverImage: string | null;
        showToc: boolean;
        actionButtons: unknown;
        isPublished: boolean;
        publishedAt: string | null;
    }[];
    albums: {
        id?: string;
        title: string;
        slug: string;
        description: string | null;
        externalUrl: string;
        coverImage: string | null;
        isPublished: boolean;
        sortOrder: number;
    }[];
    registrationForm: object | null;
    gdpr: string | null;
    homepageSteps: {
        id?: string;
        title: string;
        description: string;
        icon: string;
        sortOrder: number;
    }[];
    conditionalEmails: {
        id?: string;
        name: string;
        enabled: boolean;
        conditionFieldId: string;
        conditionFieldName: string;
        conditionOperator: string;
        conditionValue: string | null;
        subject: string | null;
        body: string | null;
        bcc: string | null;
        sections: unknown;
        sortOrder: number;
    }[];
}

function toDate(
    val: string | null | undefined
): Date | undefined {
    return val ? new Date(val) : undefined;
}

function maybeId(id: string | undefined) {
    return id ? { id } : {};
}

// ============================================
// Seed functions
// ============================================

async function cleanDatabase() {
    await prisma.conditionalEmail.deleteMany();
    await prisma.homepageStep.deleteMany();
    await prisma.bankTransaction.deleteMany();
    await prisma.registrationSubmission.deleteMany();
    await prisma.formPreview.deleteMany();
    await prisma.registrationForm.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.publicUser.deleteMany();
    await prisma.programEvent.deleteMany();
    await prisma.programDay.deleteMany();
    await prisma.news.deleteMany();
    await prisma.album.deleteMany();
    await prisma.section.deleteMany();
    await prisma.sectionType.deleteMany();
    await prisma.page.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.year.deleteMany();
    await prisma.user.deleteMany();
    await prisma.siteSetting.deleteMany();
    await prisma.bankAccount.deleteMany();
    await prisma.emailAccount.deleteMany();
}

async function seedUsers() {
    const passwordHash = await argon2.hash(ADMIN_PASSWORD);
    const users = [];
    for (const u of SEED_USERS) {
        const user = await prisma.user.create({
            data: { ...u, passwordHash },
        });
        users.push(user);
    }
    const admin = users[0];
    await prisma.publicUser.create({
        data: {
            email: admin.email,
            passwordHash,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            gdprConsentAt: new Date(),
        },
    });
    console.log(
        `  Users: ${users.length} admin + 1 public (${admin.email})`
    );
    return admin;
}

async function seedBankAccount() {
    await prisma.bankAccount.create({
        data: { ...BANK_ACCOUNT, fioSyncEnabled: false },
    });
    console.log("  Bank account created");
}

async function seedEmailAccount() {
    const account = await prisma.emailAccount.create({
        data: {
            email: "registrace@example.com",
            encryptedPassword: "dummy:dummy:dummy",
            isMain: true,
            label: "Registrace",
        },
    });
    console.log("  Email account created");
    return account;
}

async function seedYear(data: SeedData) {
    const y = data.year;
    const year = await prisma.year.create({
        data: {
            ...maybeId(y.id),
            year: y.year,
            title: y.title,
            subtitle: y.subtitle,
            isActive: true,
            startDate: toDate(y.startDate),
            endDate: toDate(y.endDate),
            registrationOpen: false,
            registrationStartDate: toDate(
                y.registrationStartDate
            ),
            headerPhoto: y.headerPhoto,
            heroPhoto: y.heroPhoto,
            registrationSuccessContent:
                y.registrationSuccessContent as object,
            confirmationEmailEnabled:
                y.confirmationEmailEnabled,
            confirmationEmailSubject:
                y.confirmationEmailSubject,
            confirmationEmailBody: y.confirmationEmailBody,
            confirmationEmailSections:
                y.confirmationEmailSections as object,
            priceChangeEmailEnabled:
                y.priceChangeEmailEnabled,
            priceChangeEmailSubject:
                y.priceChangeEmailSubject,
            priceChangeEmailBody: y.priceChangeEmailBody,
            priceChangeEmailSections:
                y.priceChangeEmailSections as object,
            paymentEmailEnabled: y.paymentEmailEnabled,
            paymentEmailSubject: y.paymentEmailSubject,
            paymentEmailBody: y.paymentEmailBody,
            paymentEmailSections:
                y.paymentEmailSections as object,
        },
    });
    console.log(`  Year: ${year.title}`);
    return year;
}

async function seedPages(
    yearId: string,
    data: SeedData
) {
    for (const p of data.pages) {
        await prisma.page.create({
            data: {
                ...maybeId(p.id),
                yearId,
                slug: p.slug,
                title: p.title,
                content:
                    (p.content as object) ?? {
                        sections: [],
                    },
                seoTitle: p.seoTitle,
                seoDesc: p.seoDesc,
                isPublished: true,
                sortOrder: p.sortOrder,
            },
        });
    }
    console.log(`  Pages: ${data.pages.length}`);
}

async function seedProgram(
    yearId: string,
    data: SeedData
) {
    let eventCount = 0;
    for (const day of data.programDays) {
        const created = await prisma.programDay.create({
            data: {
                ...maybeId(day.id),
                yearId,
                date: new Date(day.date),
                label: day.label,
                sortOrder: day.sortOrder,
            },
        });
        for (const event of day.events) {
            await prisma.programEvent.create({
                data: {
                    ...maybeId(event.id),
                    dayId: created.id,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    imageUrl: event.imageUrl,
                    tags: event.tags,
                    storyContent:
                        event.storyContent as object,
                    actionButtons:
                        event.actionButtons as object,
                    isPublished: event.isPublished,
                    sortOrder: event.sortOrder,
                },
            });
            eventCount++;
        }
    }
    console.log(
        `  Program: ${data.programDays.length} days, ${eventCount} events`
    );
}

async function seedSections(
    yearId: string,
    data: SeedData
) {
    let sectionCount = 0;
    for (const st of data.sectionTypes) {
        const created = await prisma.sectionType.create({
            data: {
                ...(st.id ? { id: st.id } : {}),
                yearId,
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
            },
        });
        for (const s of st.sections) {
            await prisma.section.create({
                data: {
                    ...(s.id ? { id: s.id } : {}),
                    sectionTypeId: created.id,
                    title: s.title,
                    subtitle: s.subtitle,
                    description: s.description,
                    icon: s.icon,
                    content: s.content as object,
                    showToc: s.showToc,
                    sortOrder: s.sortOrder,
                },
            });
            sectionCount++;
        }
    }
    console.log(
        `  Sections: ${data.sectionTypes.length} types, ${sectionCount} sections`
    );
}

async function seedNews(
    yearId: string,
    authorId: string,
    data: SeedData
) {
    for (const n of data.news) {
        await prisma.news.create({
            data: {
                ...maybeId(n.id),
                yearId,
                authorId,
                slug: n.slug,
                title: n.title,
                excerpt: n.excerpt,
                content: n.content,
                coverImage: n.coverImage,
                showToc: n.showToc,
                actionButtons:
                    n.actionButtons as object,
                isPublished: n.isPublished,
                publishedAt: toDate(n.publishedAt),
            },
        });
    }
    console.log(`  News: ${data.news.length}`);
}

async function seedAlbums(
    yearId: string,
    data: SeedData
) {
    for (const a of data.albums) {
        await prisma.album.create({
            data: {
                ...maybeId(a.id),
                yearId,
                title: a.title,
                slug: a.slug,
                description: a.description,
                externalUrl: a.externalUrl,
                coverImage: a.coverImage,
                isPublished: a.isPublished,
                sortOrder: a.sortOrder,
            },
        });
    }
    console.log(`  Albums: ${data.albums.length}`);
}

async function seedRegistrationForm(
    yearId: string,
    data: SeedData
) {
    if (!data.registrationForm) {
        console.log(
            "  Registration form: skipped (not in dump)"
        );
        return;
    }
    await prisma.registrationForm.create({
        data: {
            yearId,
            fields: data.registrationForm,
        },
    });
    console.log("  Registration form created");
}

async function seedHomepageSteps(
    yearId: string,
    data: SeedData
) {
    for (const s of data.homepageSteps) {
        await prisma.homepageStep.create({
            data: {
                ...maybeId(s.id),
                yearId,
                title: s.title,
                description: s.description,
                icon: s.icon,
                sortOrder: s.sortOrder,
            },
        });
    }
    console.log(
        `  Homepage steps: ${data.homepageSteps.length}`
    );
}

async function seedConditionalEmails(
    yearId: string,
    emailAccountId: string,
    data: SeedData
) {
    for (const e of data.conditionalEmails) {
        await prisma.conditionalEmail.create({
            data: {
                ...maybeId(e.id),
                yearId,
                accountId: emailAccountId,
                name: e.name,
                enabled: e.enabled,
                conditionFieldId: e.conditionFieldId,
                conditionFieldName: e.conditionFieldName,
                conditionOperator: e.conditionOperator,
                conditionValue: e.conditionValue,
                subject: e.subject,
                body: e.body,
                bcc: e.bcc,
                sections: e.sections as object,
                sortOrder: e.sortOrder,
            },
        });
    }
    console.log(
        `  Conditional emails: ${data.conditionalEmails.length}`
    );
}

async function seedGdpr(data: SeedData) {
    if (!data.gdpr) {
        console.log("  GDPR: skipped (not in dump)");
        return;
    }
    await prisma.siteSetting.create({
        data: { key: "gdpr", value: data.gdpr },
    });
    console.log("  GDPR site setting created");
}

// ============================================
// Main
// ============================================

function isLocalDatabase(url: string): boolean {
    return /localhost|127\.0\.0\.1|\.local[:/]/.test(url);
}

async function main() {
    if (!existsSync(SEED_DATA_PATH)) {
        console.error(
            `Seed data not found at ${SEED_DATA_PATH}\n` +
                "Run 'npm run db:dump' first to generate it."
        );
        process.exit(1);
    }

    const dbUrl = process.env.DATABASE_URL || "";
    const masked = dbUrl.replace(
        /\/\/([^:]+):([^@]+)@/,
        "//$1:***@"
    );
    const forceFlag = process.argv.includes("--force");

    if (!isLocalDatabase(dbUrl)) {
        console.error(
            "\n🚫 REFUSING TO SEED — target is not a local database!\n"
        );
        console.error(`  Target: ${masked}\n`);
        if (!forceFlag) {
            console.error(
                "  This looks like a remote/production database."
            );
            console.error(
                "  If you really mean it, re-run with --force\n"
            );
            process.exit(1);
        }
        console.warn(
            "  --force flag detected, proceeding anyway...\n"
        );
    } else {
        console.log(`\n  Target: ${masked}\n`);
    }

    const data: SeedData = JSON.parse(
        readFileSync(SEED_DATA_PATH, "utf-8")
    );

    console.log("Seeding database...\n");

    console.log("1. Cleaning database...");
    await cleanDatabase();

    console.log("2. Inserting seed data...");
    const admin = await seedUsers();
    await seedBankAccount();
    const emailAccount = await seedEmailAccount();
    const year = await seedYear(data);

    await seedPages(year.id, data);
    await seedProgram(year.id, data);
    await seedSections(year.id, data);
    await seedNews(year.id, admin.id, data);
    await seedAlbums(year.id, data);
    await seedRegistrationForm(year.id, data);
    await seedHomepageSteps(year.id, data);
    await seedConditionalEmails(
        year.id,
        emailAccount.id,
        data
    );
    await seedGdpr(data);

    console.log("\nSeeding completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
