"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** Prazo de retenção do registo de atividade (RGPD — princípio da limitação da conservação). */
const RETENCAO_AUDITORIA_DIAS = 365;

export async function registarAuditoria(utilizadorId: string | null, acao: string, detalhe?: string) {
  await prisma.registoAuditoria.create({ data: { utilizadorId, acao, detalhe } });
  try {
    const limite = new Date(Date.now() - RETENCAO_AUDITORIA_DIAS * 24 * 60 * 60 * 1000);
    await prisma.registoAuditoria.deleteMany({ where: { criadoEm: { lt: limite } } });
  } catch {
    // a limpeza é oportunista — uma falha aqui não pode impedir a ação principal.
  }
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
