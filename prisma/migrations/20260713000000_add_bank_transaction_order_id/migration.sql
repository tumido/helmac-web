-- Add orderId column to bank_transactions for the V2Order relation.
-- This table uses camelCase column names (no @map directives in schema).
ALTER TABLE "bank_transactions"
    ADD COLUMN IF NOT EXISTS "orderId" TEXT REFERENCES "v2_orders"("id") ON DELETE SET NULL;
