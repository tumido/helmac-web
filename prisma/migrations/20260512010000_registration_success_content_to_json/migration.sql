-- AlterTable
ALTER TABLE "years" DROP COLUMN "registrationSuccessContent";
ALTER TABLE "years" ADD COLUMN "registrationSuccessContent" JSONB NOT NULL DEFAULT '[]';
