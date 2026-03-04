/*
  Warnings:

  - You are about to drop the `registrations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_yearId_fkey";

-- DropTable
DROP TABLE "registrations";

-- DropEnum
DROP TYPE "ExperienceLevel";

-- DropEnum
DROP TYPE "FoodPreference";

-- CreateTable
CREATE TABLE "registration_forms" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_submissions" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registration_forms_yearId_key" ON "registration_forms"("yearId");

-- AddForeignKey
ALTER TABLE "registration_forms" ADD CONSTRAINT "registration_forms_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_submissions" ADD CONSTRAINT "registration_submissions_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_submissions" ADD CONSTRAINT "registration_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "registration_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
