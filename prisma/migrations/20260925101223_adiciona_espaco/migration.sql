/*
  Warnings:

  - You are about to drop the column `espaco` on the `Avaliacao` table. All the data in the column will be lost.
  - Added the required column `espacoId` to the `Avaliacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Avaliacao" DROP COLUMN "espaco",
ADD COLUMN     "espacoId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Espaco" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Espaco_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_espacoId_fkey" FOREIGN KEY ("espacoId") REFERENCES "Espaco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
