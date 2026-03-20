-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "bankAccountPrefix" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountBankCode" TEXT,
    "encryptedFioToken" TEXT,
    "fioSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastFioSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CopyData: migrate bank settings from years to global bank_accounts
INSERT INTO "bank_accounts" ("id", "bankAccountPrefix", "bankAccountNumber", "bankAccountBankCode", "encryptedFioToken", "fioSyncEnabled", "lastFioSyncAt", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "bankAccountPrefix", "bankAccountNumber", "bankAccountBankCode", "encryptedFioToken", "fioSyncEnabled", "lastFioSyncAt", NOW(), NOW()
FROM "years"
WHERE "bankAccountNumber" IS NOT NULL
LIMIT 1;

-- DropForeignKey
ALTER TABLE "bank_transactions" DROP CONSTRAINT "bank_transactions_yearId_fkey";

-- AlterTable
ALTER TABLE "bank_transactions" ALTER COLUMN "yearId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "years" DROP COLUMN "bankAccountBankCode",
DROP COLUMN "bankAccountNumber",
DROP COLUMN "bankAccountPrefix",
DROP COLUMN "encryptedFioToken",
DROP COLUMN "fioSyncEnabled",
DROP COLUMN "lastFioSyncAt";

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
