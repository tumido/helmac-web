-- CreateEnum
CREATE TYPE "BankTransactionMatchStatus" AS ENUM ('UNPROCESSED', 'MATCHED', 'PARTIAL_PAYMENT', 'OVERPAYMENT', 'NO_VARIABLE_SYMBOL', 'UNKNOWN_VS', 'ALREADY_PAID', 'OUTGOING');

-- AlterTable
ALTER TABLE "years" ADD COLUMN     "encryptedFioToken" TEXT,
ADD COLUMN     "fioSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastFioSyncAt" TIMESTAMP(3),
ADD COLUMN     "paymentEmailAccountId" TEXT,
ADD COLUMN     "paymentEmailBcc" TEXT,
ADD COLUMN     "paymentEmailBody" TEXT,
ADD COLUMN     "paymentEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentEmailSubject" TEXT;

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "fioTransactionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "variableSymbol" TEXT,
    "counterpartAccount" TEXT,
    "counterpartName" TEXT,
    "userMessage" TEXT,
    "matchStatus" "BankTransactionMatchStatus" NOT NULL DEFAULT 'UNPROCESSED',
    "submissionId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_fioTransactionId_key" ON "bank_transactions"("fioTransactionId");

-- CreateIndex
CREATE INDEX "bank_transactions_yearId_idx" ON "bank_transactions"("yearId");

-- CreateIndex
CREATE INDEX "bank_transactions_variableSymbol_idx" ON "bank_transactions"("variableSymbol");

-- AddForeignKey
ALTER TABLE "years" ADD CONSTRAINT "years_paymentEmailAccountId_fkey" FOREIGN KEY ("paymentEmailAccountId") REFERENCES "email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "registration_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
