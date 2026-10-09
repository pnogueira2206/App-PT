-- CreateEnum
CREATE TYPE "BenchmarkKind" AS ENUM ('MAX_LOAD', 'TIME');

-- AlterTable
ALTER TABLE "PersonalRecord" ADD COLUMN     "reps" INTEGER;

-- AlterTable
ALTER TABLE "WorkoutBlock" ADD COLUMN     "benchmark" "BenchmarkKind",
ADD COLUMN     "benchmarkReps" INTEGER;

