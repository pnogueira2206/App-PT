-- AlterTable
ALTER TABLE "Avaliacao" ADD COLUMN     "editadoEm" TIMESTAMP(3),
ADD COLUMN     "editadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_editadoPorId_fkey" FOREIGN KEY ("editadoPorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
