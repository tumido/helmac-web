-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bcc" TEXT,
    "account_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recipient_filter" JSONB NOT NULL DEFAULT '{}',
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_queue_items" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "order_id" TEXT,
    "placeholders" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "permanent" BOOLEAN NOT NULL DEFAULT false,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_queue_items_campaign_id_status_idx" ON "email_queue_items"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "email_queue_items_sent_at_idx" ON "email_queue_items"("sent_at");

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue_items" ADD CONSTRAINT "email_queue_items_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue_items" ADD CONSTRAINT "email_queue_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "v2_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
