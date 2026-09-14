/*
  Warnings:

  - You are about to drop the column `repsCompleted` on the `BlockResult` table. All the data in the column will be lost.
  - You are about to drop the column `rpe` on the `BlockResult` table. All the data in the column will be lost.
  - You are about to drop the column `setsCompleted` on the `BlockResult` table. All the data in the column will be lost.
  - You are about to drop the column `weightUsed` on the `BlockResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "dateOfBirth" DATETIME;
ALTER TABLE "User" ADD COLUMN "heightCm" REAL;
ALTER TABLE "User" ADD COLUMN "weightKg" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlockResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scoreText" TEXT,
    "studentNotes" TEXT,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockResult_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "WorkoutBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlockResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BlockResult" ("blockId", "completedAt", "id", "studentId", "studentNotes") SELECT "blockId", "completedAt", "id", "studentId", "studentNotes" FROM "BlockResult";
DROP TABLE "BlockResult";
ALTER TABLE "new_BlockResult" RENAME TO "BlockResult";
CREATE UNIQUE INDEX "BlockResult_blockId_studentId_key" ON "BlockResult"("blockId", "studentId");
CREATE TABLE "new_PersonalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'WEIGHT',
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "notes" TEXT,
    "recordDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonalRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PersonalRecord_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PersonalRecord" ("createdAt", "exerciseId", "id", "notes", "recordDate", "studentId", "unit", "value") SELECT "createdAt", "exerciseId", "id", "notes", "recordDate", "studentId", "unit", "value" FROM "PersonalRecord";
DROP TABLE "PersonalRecord";
ALTER TABLE "new_PersonalRecord" RENAME TO "PersonalRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
