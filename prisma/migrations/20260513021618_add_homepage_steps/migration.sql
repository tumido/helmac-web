-- CreateTable
CREATE TABLE "homepage_steps" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_steps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "homepage_steps" ADD CONSTRAINT "homepage_steps_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
