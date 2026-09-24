-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'AVALIADOR', 'TREINADOR');

-- CreateEnum
CREATE TYPE "TipoResposta" AS ENUM ('PONTOS', 'TEXTO_LIVRE');

-- CreateEnum
CREATE TYPE "Pilar" AS ENUM ('ENSINAR', 'VER', 'CORRIGIR', 'GESTAO_GRUPO', 'PRESENCA_ATITUDE', 'DEMONSTRACAO');

-- CreateTable
CREATE TABLE "Utilizador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilizador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoAula" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoAula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seccao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "percentagem" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Seccao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterio" (
    "id" TEXT NOT NULL,
    "seccaoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "pesoMaximo" DOUBLE PRECISION,
    "tipoResposta" "TipoResposta" NOT NULL,
    "dimensao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Criterio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioPilar" (
    "criterioId" TEXT NOT NULL,
    "pilar" "Pilar" NOT NULL,

    CONSTRAINT "CriterioPilar_pkey" PRIMARY KEY ("criterioId","pilar")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "treinadorId" TEXT NOT NULL,
    "avaliadorId" TEXT NOT NULL,
    "espaco" TEXT NOT NULL,
    "tipoAulaId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "nAlunos" INTEGER NOT NULL,
    "respostas" TEXT NOT NULL,
    "observacoes" TEXT NOT NULL,
    "grelhaSnapshot" TEXT NOT NULL,
    "classificacaoGeral" INTEGER NOT NULL,
    "comentarioGeral" TEXT NOT NULL,
    "confirmacaoAvaliadorData" TEXT,
    "confirmacaoTreinadorData" TEXT,
    "guardadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_email_key" ON "Utilizador"("email");

-- AddForeignKey
ALTER TABLE "Criterio" ADD CONSTRAINT "Criterio_seccaoId_fkey" FOREIGN KEY ("seccaoId") REFERENCES "Seccao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioPilar" ADD CONSTRAINT "CriterioPilar_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "Criterio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_treinadorId_fkey" FOREIGN KEY ("treinadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_tipoAulaId_fkey" FOREIGN KEY ("tipoAulaId") REFERENCES "TipoAula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
