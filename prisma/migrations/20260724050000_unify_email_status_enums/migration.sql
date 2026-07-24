-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SENDING', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmailQueueItemStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- Normalize existing values before the enum cast
-- (email_campaigns rows are already upper-case; UPPER() is a no-op safeguard)
UPDATE "email_campaigns" SET "status" = UPPER("status");
UPDATE "email_queue_items" SET "status" = UPPER("status");

-- AlterTable: email_campaigns.status String -> EmailCampaignStatus
ALTER TABLE "email_campaigns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "email_campaigns" ALTER COLUMN "status" TYPE "EmailCampaignStatus"
    USING ("status"::text::"EmailCampaignStatus");
ALTER TABLE "email_campaigns" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable: email_queue_items.status String -> EmailQueueItemStatus
ALTER TABLE "email_queue_items" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "email_queue_items" ALTER COLUMN "status" TYPE "EmailQueueItemStatus"
    USING ("status"::text::"EmailQueueItemStatus");
ALTER TABLE "email_queue_items" ALTER COLUMN "status" SET DEFAULT 'PENDING';
