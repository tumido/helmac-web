-- AlterTable
ALTER TABLE "registration_submissions" ADD COLUMN "pricingSummary" JSONB,
ADD COLUMN "variableSymbol" TEXT,
ADD COLUMN "totalPrice" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "registration_submissions_variableSymbol_key" ON "registration_submissions"("variableSymbol");
