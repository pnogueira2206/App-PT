-- AlterTable
ALTER TABLE "Utilizador" ADD COLUMN     "bloqueadoAte" TIMESTAMP(3),
ADD COLUMN     "tentativasFalhadas" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RegistoAuditoria" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT,
    "acao" TEXT NOT NULL,
    "detalhe" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistoAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistoAuditoria_utilizadorId_idx" ON "RegistoAuditoria"("utilizadorId");

-- CreateIndex
CREATE INDEX "RegistoAuditoria_criadoEm_idx" ON "RegistoAuditoria"("criadoEm");

-- AddForeignKey
ALTER TABLE "RegistoAuditoria" ADD CONSTRAINT "RegistoAuditoria_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
