-- AlterTable
ALTER TABLE "conditional_emails" ADD COLUMN     "sections" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "years" ADD COLUMN     "confirmationEmailSections" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "paymentEmailSections" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "priceChangeEmailSections" JSONB NOT NULL DEFAULT '[]';
