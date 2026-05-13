-- AlterTable
ALTER TABLE "program_events" ADD COLUMN     "actionButtons" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "section_types" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "description" TEXT;
