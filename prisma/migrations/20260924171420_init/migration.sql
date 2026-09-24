-- CreateTable
CREATE TABLE "Utilizador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TipoAula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Seccao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "percentagem" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Criterio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seccaoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "pesoMaximo" REAL,
    "tipoResposta" TEXT NOT NULL,
    "dimensao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,
    CONSTRAINT "Criterio_seccaoId_fkey" FOREIGN KEY ("seccaoId") REFERENCES "Seccao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CriterioPilar" (
    "criterioId" TEXT NOT NULL,
    "pilar" TEXT NOT NULL,

    PRIMARY KEY ("criterioId", "pilar"),
    CONSTRAINT "CriterioPilar_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "Criterio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "guardadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Avaliacao_treinadorId_fkey" FOREIGN KEY ("treinadorId") REFERENCES "Utilizador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Avaliacao_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "Utilizador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Avaliacao_tipoAulaId_fkey" FOREIGN KEY ("tipoAulaId") REFERENCES "TipoAula" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_email_key" ON "Utilizador"("email");
