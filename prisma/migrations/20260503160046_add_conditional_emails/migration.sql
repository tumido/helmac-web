-- CreateTable
CREATE TABLE "conditional_emails" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "conditionFieldId" TEXT NOT NULL,
    "conditionFieldName" TEXT NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "bcc" TEXT,
    "accountId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditional_emails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conditional_emails" ADD CONSTRAINT "conditional_emails_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditional_emails" ADD CONSTRAINT "conditional_emails_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
