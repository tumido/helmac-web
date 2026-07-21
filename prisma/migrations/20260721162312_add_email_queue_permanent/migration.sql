-- AlterTable
ALTER TABLE "email_queue_items" ADD COLUMN "permanent" BOOLEAN NOT NULL DEFAULT false;
