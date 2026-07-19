/*
  Warnings:

  - You are about to drop the column `order_id` on the `bank_transactions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "bank_transactions" DROP CONSTRAINT "bank_transactions_orderId_fkey";

-- DropForeignKey
ALTER TABLE "bank_transactions" DROP CONSTRAINT "bank_transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_capacity_limits" DROP CONSTRAINT "v2_capacity_limits_field_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_capacity_limits" DROP CONSTRAINT "v2_capacity_limits_form_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_capacity_limits" DROP CONSTRAINT "v2_capacity_limits_year_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_email_sections" DROP CONSTRAINT "v2_email_sections_condition_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_email_sections" DROP CONSTRAINT "v2_email_sections_template_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_email_templates" DROP CONSTRAINT "v2_email_templates_account_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_email_templates" DROP CONSTRAINT "v2_email_templates_condition_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_email_templates" DROP CONSTRAINT "v2_email_templates_year_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_form_condition_rules" DROP CONSTRAINT "v2_form_condition_rules_condition_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_form_condition_rules" DROP CONSTRAINT "v2_form_condition_rules_field_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_form_conditions" DROP CONSTRAINT "v2_form_conditions_form_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_form_conditions" DROP CONSTRAINT "v2_form_conditions_year_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_form_fields" DROP CONSTRAINT "v2_form_fields_form_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_form_fields" DROP CONSTRAINT "v2_form_fields_pricing_definition_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_form_fields" DROP CONSTRAINT "v2_form_fields_year_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_order_line_items" DROP CONSTRAINT "v2_order_line_items_field_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_order_line_items" DROP CONSTRAINT "v2_order_line_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_order_line_items" DROP CONSTRAINT "v2_order_line_items_person_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_order_line_items" DROP CONSTRAINT "v2_order_line_items_pricing_option_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_order_line_items" DROP CONSTRAINT "v2_order_line_items_year_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_order_people" DROP CONSTRAINT "v2_order_people_order_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_orders" DROP CONSTRAINT "v2_orders_form_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_orders" DROP CONSTRAINT "v2_orders_parent_order_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_orders" DROP CONSTRAINT "v2_orders_public_user_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_orders" DROP CONSTRAINT "v2_orders_year_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_price_tiers" DROP CONSTRAINT "v2_price_tiers_form_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_price_tiers" DROP CONSTRAINT "v2_price_tiers_year_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_pricing_definitions" DROP CONSTRAINT "v2_pricing_definitions_form_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_pricing_definitions" DROP CONSTRAINT "v2_pricing_definitions_year_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_pricing_option_prices" DROP CONSTRAINT "v2_pricing_option_prices_option_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_pricing_option_prices" DROP CONSTRAINT "v2_pricing_option_prices_tier_id_fkey";

-- DropForeignKey
ALTER TABLE "v2_pricing_options" DROP CONSTRAINT "v2_pricing_options_definition_id_fkey";

-- AlterTable
ALTER TABLE "bank_transactions" DROP COLUMN "order_id";

-- AlterTable
ALTER TABLE "v2_capacity_limits" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_email_sections" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_email_templates" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_form_condition_rules" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_form_conditions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_form_fields" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_order_line_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_order_people" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_orders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_price_tiers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_pricing_definitions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_pricing_option_prices" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "v2_pricing_options" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bcc" TEXT,
    "accountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recipientFilter" JSONB NOT NULL DEFAULT '{}',
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_queue_items" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "submissionId" TEXT,
    "placeholders" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_queue_items_campaignId_status_idx" ON "email_queue_items"("campaignId", "status");

-- CreateIndex
CREATE INDEX "email_queue_items_sentAt_idx" ON "email_queue_items"("sentAt");

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "v2_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue_items" ADD CONSTRAINT "email_queue_items_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_price_tiers" ADD CONSTRAINT "v2_price_tiers_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "registration_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_price_tiers" ADD CONSTRAINT "v2_price_tiers_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_pricing_definitions" ADD CONSTRAINT "v2_pricing_definitions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "registration_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_pricing_definitions" ADD CONSTRAINT "v2_pricing_definitions_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_pricing_options" ADD CONSTRAINT "v2_pricing_options_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "v2_pricing_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_pricing_option_prices" ADD CONSTRAINT "v2_pricing_option_prices_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "v2_pricing_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_pricing_option_prices" ADD CONSTRAINT "v2_pricing_option_prices_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "v2_price_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_form_fields" ADD CONSTRAINT "v2_form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "registration_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_form_fields" ADD CONSTRAINT "v2_form_fields_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_form_fields" ADD CONSTRAINT "v2_form_fields_pricing_definition_id_fkey" FOREIGN KEY ("pricing_definition_id") REFERENCES "v2_pricing_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_form_conditions" ADD CONSTRAINT "v2_form_conditions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "registration_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_form_conditions" ADD CONSTRAINT "v2_form_conditions_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_form_condition_rules" ADD CONSTRAINT "v2_form_condition_rules_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "v2_form_conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_form_condition_rules" ADD CONSTRAINT "v2_form_condition_rules_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "v2_form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_capacity_limits" ADD CONSTRAINT "v2_capacity_limits_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "registration_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_capacity_limits" ADD CONSTRAINT "v2_capacity_limits_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_capacity_limits" ADD CONSTRAINT "v2_capacity_limits_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "v2_form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_orders" ADD CONSTRAINT "v2_orders_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_orders" ADD CONSTRAINT "v2_orders_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "registration_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_orders" ADD CONSTRAINT "v2_orders_public_user_id_fkey" FOREIGN KEY ("public_user_id") REFERENCES "public_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_orders" ADD CONSTRAINT "v2_orders_parent_order_id_fkey" FOREIGN KEY ("parent_order_id") REFERENCES "v2_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_order_people" ADD CONSTRAINT "v2_order_people_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "v2_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_order_line_items" ADD CONSTRAINT "v2_order_line_items_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "v2_order_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_order_line_items" ADD CONSTRAINT "v2_order_line_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "v2_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_order_line_items" ADD CONSTRAINT "v2_order_line_items_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_order_line_items" ADD CONSTRAINT "v2_order_line_items_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "v2_form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_order_line_items" ADD CONSTRAINT "v2_order_line_items_pricing_option_id_fkey" FOREIGN KEY ("pricing_option_id") REFERENCES "v2_pricing_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_email_templates" ADD CONSTRAINT "v2_email_templates_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_email_templates" ADD CONSTRAINT "v2_email_templates_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "v2_form_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_email_templates" ADD CONSTRAINT "v2_email_templates_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_email_sections" ADD CONSTRAINT "v2_email_sections_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "v2_email_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_email_sections" ADD CONSTRAINT "v2_email_sections_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "v2_form_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
