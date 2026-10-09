-- AlterTable
ALTER TABLE "TrainingDay" ADD COLUMN     "groupId" TEXT,
ALTER COLUMN "studentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "cooldown" TEXT,
ADD COLUMN     "warmup" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TrainingDay_groupId_weekday_key" ON "TrainingDay"("groupId", "weekday");

-- AddForeignKey
ALTER TABLE "TrainingDay" ADD CONSTRAINT "TrainingDay_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

