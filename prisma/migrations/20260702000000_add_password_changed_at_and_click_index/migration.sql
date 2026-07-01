-- AlterTable: track last password change for single-use resets + session invalidation
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- CreateIndex: backs per-url daily/weekly click counts and history ordering
CREATE INDEX "Click_urlId_clickedAt_idx" ON "Click"("urlId", "clickedAt");
