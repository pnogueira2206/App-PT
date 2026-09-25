"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function registarAuditoria(utilizadorId: string | null, acao: string, detalhe?: string) {
  await prisma.registoAuditoria.create({ data: { utilizadorId, acao, detalhe } });
}

export async function listarAuditoria() {
  const session = await auth();
  if (session?.user.papel !== "ADMIN") return [];

  const linhas = await prisma.registoAuditoria.findMany({
    orderBy: { criadoEm: "desc" },
    take: 200,
    include: { utilizador: { select: { nome: true } } },
  });
  return linhas.map((l) => ({
    id: l.id,
    utilizador: l.utilizador?.nome ?? "(desconhecido)",
    acao: l.acao,
    detalhe: l.detalhe,
    criadoEm: l.criadoEm.toISOString(),
  }));
}
