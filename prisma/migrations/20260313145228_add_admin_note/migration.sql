-- AlterTable
ALTER TABLE "albums" ALTER COLUMN "externalUrl" DROP DEFAULT;

-- AlterTable
ALTER TABLE "registration_submissions" ADD COLUMN     "adminNote" TEXT;
