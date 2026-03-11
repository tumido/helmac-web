-- AlterTable
ALTER TABLE "registration_submissions" ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "years" ADD COLUMN     "confirmationEmailBcc" TEXT,
ADD COLUMN     "confirmationEmailBody" TEXT,
ADD COLUMN     "confirmationEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confirmationEmailSubject" TEXT;
