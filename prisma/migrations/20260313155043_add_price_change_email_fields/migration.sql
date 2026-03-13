-- AlterTable
ALTER TABLE "years" ADD COLUMN     "priceChangeEmailBcc" TEXT,
ADD COLUMN     "priceChangeEmailBody" TEXT,
ADD COLUMN     "priceChangeEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceChangeEmailSubject" TEXT;
