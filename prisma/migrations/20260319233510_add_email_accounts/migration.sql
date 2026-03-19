-- AlterTable
ALTER TABLE "years" ADD COLUMN     "confirmationEmailAccountId" TEXT,
ADD COLUMN     "priceChangeEmailAccountId" TEXT;

-- CreateTable
CREATE TABLE "email_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_accounts_email_key" ON "email_accounts"("email");

-- AddForeignKey
ALTER TABLE "years" ADD CONSTRAINT "years_confirmationEmailAccountId_fkey" FOREIGN KEY ("confirmationEmailAccountId") REFERENCES "email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "years" ADD CONSTRAINT "years_priceChangeEmailAccountId_fkey" FOREIGN KEY ("priceChangeEmailAccountId") REFERENCES "email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
