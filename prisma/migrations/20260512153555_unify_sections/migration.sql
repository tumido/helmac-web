-- CreateTable
CREATE TABLE "section_types" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "pageTitle" TEXT,
    "pageSubtitle" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "sectionTypeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "icon" TEXT,
    "content" JSONB NOT NULL DEFAULT '[]',
    "showToc" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "section_types_yearId_slug_key" ON "section_types"("yearId", "slug");

-- AddForeignKey
ALTER TABLE "section_types" ADD CONSTRAINT "section_types_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_sectionTypeId_fkey" FOREIGN KEY ("sectionTypeId") REFERENCES "section_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: Create section types for each year
INSERT INTO "section_types" ("id", "yearId", "label", "slug", "icon", "sortOrder", "pageTitle", "pageSubtitle", "metaTitle", "metaDescription", "updatedAt")
SELECT
    gen_random_uuid()::text, y."id",
    'Co nabízíme', 'co-nabizime', NULL, 0,
    'Co nabízíme', 'Co vám naše akce nabízí',
    'Co nabízíme | Helmáč', 'Co vám naše akce nabízí',
    CURRENT_TIMESTAMP
FROM "years" y;

INSERT INTO "section_types" ("id", "yearId", "label", "slug", "icon", "sortOrder", "pageTitle", "pageSubtitle", "metaTitle", "metaDescription", "updatedAt")
SELECT
    gen_random_uuid()::text, y."id",
    'Info', 'info', NULL, 1,
    'Informace', 'Důležité informace pro účastníky',
    'Info | Helmáč', 'Důležité informace pro účastníky akce Helmáč',
    CURRENT_TIMESTAMP
FROM "years" y;

INSERT INTO "section_types" ("id", "yearId", "label", "slug", "icon", "sortOrder", "pageTitle", "pageSubtitle", "metaTitle", "metaDescription", "updatedAt")
SELECT
    gen_random_uuid()::text, y."id",
    'Pravidla', 'pravidla', NULL, 2,
    'Pravidla', 'Herní pravidla a pokyny pro účastníky',
    'Pravidla | Helmáč', 'Pravidla akce Helmáč - herní pravidla a pokyny pro účastníky',
    CURRENT_TIMESTAMP
FROM "years" y;

-- MigrateData: Move offers -> sections (co-nabizime type)
INSERT INTO "sections" ("id", "sectionTypeId", "title", "subtitle", "icon", "content", "showToc", "sortOrder", "createdAt", "updatedAt")
SELECT
    o."id", st."id",
    o."title", o."subtitle", o."icon", o."content", o."showToc", o."sortOrder",
    o."createdAt", o."updatedAt"
FROM "offers" o
JOIN "section_types" st ON st."yearId" = o."yearId" AND st."slug" = 'co-nabizime';

-- MigrateData: Move info_sections -> sections (info type)
INSERT INTO "sections" ("id", "sectionTypeId", "title", "subtitle", "icon", "content", "showToc", "sortOrder", "createdAt", "updatedAt")
SELECT
    i."id", st."id",
    i."title", i."subtitle", i."icon", i."content", i."showToc", i."sortOrder",
    i."createdAt", i."updatedAt"
FROM "info_sections" i
JOIN "section_types" st ON st."yearId" = i."yearId" AND st."slug" = 'info';

-- MigrateData: Move rules -> sections (pravidla type)
INSERT INTO "sections" ("id", "sectionTypeId", "title", "subtitle", "icon", "content", "showToc", "sortOrder", "createdAt", "updatedAt")
SELECT
    r."id", st."id",
    r."title", r."subtitle", r."icon", r."content", r."showToc", r."sortOrder",
    r."createdAt", r."updatedAt"
FROM "rules" r
JOIN "section_types" st ON st."yearId" = r."yearId" AND st."slug" = 'pravidla';

-- DropForeignKey
ALTER TABLE "info_sections" DROP CONSTRAINT "info_sections_yearId_fkey";
ALTER TABLE "offers" DROP CONSTRAINT "offers_yearId_fkey";
ALTER TABLE "rules" DROP CONSTRAINT "rules_yearId_fkey";

-- DropTable
DROP TABLE "info_sections";
DROP TABLE "offers";
DROP TABLE "rules";
