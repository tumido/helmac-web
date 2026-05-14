-- AlterTable
ALTER TABLE "conditional_emails" ADD COLUMN     "attachments" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "years" ADD COLUMN     "confirmationEmailAttachments" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "paymentEmailAttachments" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "priceChangeEmailAttachments" JSONB NOT NULL DEFAULT '[]';
