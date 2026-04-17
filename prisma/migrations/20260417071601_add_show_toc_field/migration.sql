-- AlterTable
ALTER TABLE "info_sections" ADD COLUMN     "showToc" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "showToc" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "showToc" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "rules" ADD COLUMN     "showToc" BOOLEAN NOT NULL DEFAULT false;
