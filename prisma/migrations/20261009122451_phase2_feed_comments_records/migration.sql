-- AlterTable
ALTER TABLE "BlockResult" ADD COLUMN     "seenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PersonalRecord" ADD COLUMN     "sourceResultId" TEXT;

-- AlterTable
ALTER TABLE "WorkoutCompletion" ADD COLUMN     "seenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ResultComment" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "ResultComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResultComment_resultId_createdAt_idx" ON "ResultComment"("resultId", "createdAt");

-- CreateIndex
CREATE INDEX "BlockResult_studentId_updatedAt_idx" ON "BlockResult"("studentId", "updatedAt");

-- AddForeignKey
ALTER TABLE "ResultComment" ADD CONSTRAINT "ResultComment_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "BlockResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultComment" ADD CONSTRAINT "ResultComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_sourceResultId_fkey" FOREIGN KEY ("sourceResultId") REFERENCES "BlockResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
