-- CreateTable
CREATE TABLE "form_previews" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_previews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_previews_yearId_key" ON "form_previews"("yearId");

-- CreateIndex
CREATE UNIQUE INDEX "form_previews_token_key" ON "form_previews"("token");

-- AddForeignKey
ALTER TABLE "form_previews" ADD CONSTRAINT "form_previews_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
