-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'SOME', 'EXPERIENCED', 'VETERAN');

-- CreateEnum
CREATE TYPE "FoodPreference" AS ENUM ('NORMAL', 'VEGETARIAN', 'VEGAN', 'OTHER');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLIST', 'CANCELLED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "years" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "headerPhoto" TEXT,
    "heroPhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_days" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_events" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tags" TEXT[],
    "storyContent" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "info_sections" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "info_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "altText" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "experience" "ExperienceLevel" NOT NULL DEFAULT 'BEGINNER',
    "faction" TEXT,
    "character" TEXT,
    "foodPreference" "FoodPreference" NOT NULL DEFAULT 'NORMAL',
    "allergies" TEXT,
    "notes" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "years_year_key" ON "years"("year");

-- CreateIndex
CREATE UNIQUE INDEX "program_days_yearId_date_key" ON "program_days"("yearId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "pages_yearId_slug_key" ON "pages"("yearId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "news_yearId_slug_key" ON "news"("yearId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "albums_yearId_slug_key" ON "albums"("yearId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_yearId_email_key" ON "registrations"("yearId", "email");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_events" ADD CONSTRAINT "program_events_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "program_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "info_sections" ADD CONSTRAINT "info_sections_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
