-- AlterTable
ALTER TABLE "conditional_emails" ADD COLUMN     "conditionOperator" TEXT NOT NULL DEFAULT 'equals',
ALTER COLUMN "conditionValue" DROP NOT NULL;
