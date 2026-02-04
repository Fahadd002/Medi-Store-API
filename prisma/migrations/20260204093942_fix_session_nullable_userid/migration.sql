-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");
