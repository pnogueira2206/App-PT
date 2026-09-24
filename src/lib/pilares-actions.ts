"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Pilar as PilarPrisma } from "@prisma/client";
import { Pilar } from "@/data/pilares";

const PARA_ENUM: Record<Pilar, PilarPrisma> = {
  Ensinar: "ENSINAR",
  Ver: "VER",
  Corrigir: "CORRIGIR",
  "Gestão de Grupo": "GESTAO_GRUPO",
  "Presença e Atitude": "PRESENCA_ATITUDE",
  Demonstração: "DEMONSTRACAO",
};

const PARA_PILAR: Record<PilarPrisma, Pilar> = {
  ENSINAR: "Ensinar",
  VER: "Ver",
  CORRIGIR: "Corrigir",
  GESTAO_GRUPO: "Gestão de Grupo",
  PRESENCA_ATITUDE: "Presença e Atitude",
  DEMONSTRACAO: "Demonstração",
};

export type AtribuicoesPilares = Record<string, Pilar[]>;

export async function obterAtribuicoesPilares(): Promise<AtribuicoesPilares> {
  const linhas = await prisma.criterioPilar.findMany();
  const atribuicoes: AtribuicoesPilares = {};
  for (const l of linhas) {
    (atribuicoes[l.criterioId] ??= []).push(PARA_PILAR[l.pilar]);
  }
  return atribuicoes;
}

export async function alternarPilarAction(criterioId: string, pilar: Pilar) {
  const pilarEnum = PARA_ENUM[pilar];
  const existente = await prisma.criterioPilar.findUnique({
    where: { criterioId_pilar: { criterioId, pilar: pilarEnum } },
  });
  if (existente) {
    await prisma.criterioPilar.delete({ where: { criterioId_pilar: { criterioId, pilar: pilarEnum } } });
  } else {
    await prisma.criterioPilar.create({ data: { criterioId, pilar: pilarEnum } });
  }
  revalidatePath("/admin/criterios-pilares");
  revalidatePath("/por-treinador");
}
