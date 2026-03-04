-- AlterTable
ALTER TABLE "years" ADD COLUMN     "registrationOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationStartDate" TIMESTAMP(3);
