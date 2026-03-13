-- AlterTable: Add externalUrl with default for existing rows
ALTER TABLE "albums" ADD COLUMN "externalUrl" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "images";
