"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { registarAuditoria } from "@/lib/auditoria";

export async function obterMeusDadosAction() {
  const session = await auth();
  if (!session) throw new Error("Não autenticado.");

  const [conta, comoTreinador, comoAvaliador, registos] = await Promise.all([
    prisma.utilizador.findUnique({
      where: { id: session.user.id },
      select: { id: true, nome: true, email: true, papel: true, ativo: true, createdAt: true },
    }),
    prisma.avaliacao.findMany({
      where: { treinadorId: session.user.id },
      include: { avaliador: { select: { nome: true } }, espaco: true, tipoAula: true },
      orderBy: { guardadaEm: "desc" },
    }),
    prisma.avaliacao.findMany({
      where: { avaliadorId: session.user.id },
      include: { treinador: { select: { nome: true } }, espaco: true, tipoAula: true },
      orderBy: { guardadaEm: "desc" },
    }),
    prisma.registoAuditoria.findMany({
      where: { utilizadorId: session.user.id },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  await registarAuditoria(session.user.id, "EXPORTOU_MEUS_DADOS");

  return {
    geradoEm: new Date().toISOString(),
    conta,
    avaliacoesComoTreinador: comoTreinador.map((a) => ({
      id: a.id,
      data: a.data,
      hora: a.hora,
      espaco: a.espaco.nome,
      tipoAula: a.tipoAula.nome,
      avaliador: a.avaliador.nome,
      classificacaoGeral: a.classificacaoGeral,
      comentarioGeral: a.comentarioGeral,
      respostas: JSON.parse(a.respostas) as unknown,
      observacoes: JSON.parse(a.observacoes) as unknown,
      planoAcao: JSON.parse(a.planoAcao) as unknown,
      guardadaEm: a.guardadaEm.toISOString(),
    })),
    avaliacoesComoAvaliador: comoAvaliador.map((a) => ({
      id: a.id,
      data: a.data,
      hora: a.hora,
      treinador: a.treinador.nome,
      espaco: a.espaco.nome,
      tipoAula: a.tipoAula.nome,
      classificacaoGeral: a.classificacaoGeral,
      guardadaEm: a.guardadaEm.toISOString(),
    })),
    registosDeAtividade: registos.map((r) => ({
      acao: r.acao,
      detalhe: r.detalhe,
      criadoEm: r.criadoEm.toISOString(),
    })),
  };
}
