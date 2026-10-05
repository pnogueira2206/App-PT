-- CreateTable
CREATE TABLE "CoachingApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "competitionLevel" TEXT,
    "lookingFor" TEXT,
    "trainingBackground" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
