-- CreateEnum
CREATE TYPE "EstadoPlano" AS ENUM ('POR_AVALIAR', 'AVALIADO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "AvaliacaoPlaneada" (
    "id" TEXT NOT NULL,
    "treinadorId" TEXT NOT NULL,
    "avaliadorId" TEXT NOT NULL,
    "espacoId" TEXT,
    "semana" TEXT NOT NULL,
    "dia" TEXT,
    "notas" TEXT NOT NULL DEFAULT '',
    "estado" "EstadoPlano" NOT NULL DEFAULT 'POR_AVALIAR',
    "avaliacaoId" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvaliacaoPlaneada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoPlaneada_avaliacaoId_key" ON "AvaliacaoPlaneada"("avaliacaoId");

-- CreateIndex
CREATE INDEX "AvaliacaoPlaneada_semana_idx" ON "AvaliacaoPlaneada"("semana");

-- AddForeignKey
ALTER TABLE "AvaliacaoPlaneada" ADD CONSTRAINT "AvaliacaoPlaneada_treinadorId_fkey" FOREIGN KEY ("treinadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoPlaneada" ADD CONSTRAINT "AvaliacaoPlaneada_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoPlaneada" ADD CONSTRAINT "AvaliacaoPlaneada_espacoId_fkey" FOREIGN KEY ("espacoId") REFERENCES "Espaco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoPlaneada" ADD CONSTRAINT "AvaliacaoPlaneada_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoPlaneada" ADD CONSTRAINT "AvaliacaoPlaneada_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

