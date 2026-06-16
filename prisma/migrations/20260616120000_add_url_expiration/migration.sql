-- AlterTable
ALTER TABLE "Url" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Url_expiresAt_idx" ON "Url"("expiresAt");
