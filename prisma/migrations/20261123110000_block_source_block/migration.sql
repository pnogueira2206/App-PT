-- AlterTable
ALTER TABLE "WorkoutBlock" ADD COLUMN "sourceBlockId" TEXT;

-- CreateIndex
CREATE INDEX "WorkoutBlock_workoutId_order_idx" ON "WorkoutBlock"("workoutId", "order");

-- CreateIndex
CREATE INDEX "WorkoutBlock_sourceBlockId_idx" ON "WorkoutBlock"("sourceBlockId");

-- AddForeignKey
ALTER TABLE "WorkoutBlock" ADD CONSTRAINT "WorkoutBlock_sourceBlockId_fkey" FOREIGN KEY ("sourceBlockId") REFERENCES "WorkoutBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: link the blocks of existing adjusted versions to the group block in
-- the same position (how scores were matched until now).
UPDATE "WorkoutBlock" AS copy
SET "sourceBlockId" = (
  SELECT src."id"
  FROM "WorkoutBlock" AS src
  WHERE src."workoutId" = o."sourceWorkoutId" AND src."order" = copy."order"
  ORDER BY src."id"
  LIMIT 1
)
FROM "Workout" AS o
WHERE copy."workoutId" = o."id" AND o."sourceWorkoutId" IS NOT NULL;
