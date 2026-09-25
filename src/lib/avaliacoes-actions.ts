"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { registarAuditoria } from "@/lib/auditoria";
import { Seccao } from "@/data/grelha";
import { AvaliacaoDraft, AvaliacaoGuardada, PlanoAcaoItem, Respostas } from "@/types/avaliacao";

const INCLUDE = { treinador: true, avaliador: true, espaco: true, tipoAula: true } as const;

type LinhaComRelacoes = {
  id: string;
  treinador: { nome: string };
  avaliador: { nome: string };
  espaco: { nome: string };
  tipoAula: { nome: string };
  data: string;
  hora: string;
  nAlunos: number;
  respostas: string;
  observacoes: string;
  grelhaSnapshot: string;
  classificacaoGeral: number;
  comentarioGeral: string;
  planoAcao: string;
  confirmacaoAvaliadorData: string | null;
  confirmacaoTreinadorData: string | null;
  relatorioEnviadoEm: Date | null;
  guardadaEm: Date;
};

function paraAvaliacaoGuardada(row: LinhaComRelacoes): AvaliacaoGuardada {
  return {
    id: row.id,
    guardadaEm: row.guardadaEm.toISOString(),
    relatorioEnviadoEm: row.relatorioEnviadoEm ? row.relatorioEnviadoEm.toISOString() : null,
    grelhaSnapshot: JSON.parse(row.grelhaSnapshot) as Seccao[],
    cabecalho: {
      treinador: row.treinador.nome,
      avaliador: row.avaliador.nome,
      espaco: row.espaco.nome,
      data: row.data,
      hora: row.hora,
      tipoAula: row.tipoAula.nome,
      nAlunos: String(row.nAlunos),
    },
    respostas: JSON.parse(row.respostas) as Respostas,
    observacoes: JSON.parse(row.observacoes),
    classificacaoGeral: String(row.classificacaoGeral),
    comentarioGeral: row.comentarioGeral,
    planoAcao: JSON.parse(row.planoAcao) as PlanoAcaoItem[],
    confirmacaoAvaliador: { nome: row.avaliador.nome, data: row.confirmacaoAvaliadorData ?? "" },
    confirmacaoTreinador: { nome: row.treinador.nome, data: row.confirmacaoTreinadorData ?? "" },
  };
}

export async function listarAvaliacoes(): Promise<AvaliacaoGuardada[]> {
  const session = await auth();
  if (!session) return [];

  const where = session.user.papel === "TREINADOR" ? { treinadorId: session.user.id } : {};
  const linhas = await prisma.avaliacao.findMany({ where, include: INCLUDE, orderBy: { guardadaEm: "desc" } });
  return linhas.map(paraAvaliacaoGuardada);
}

export async function obterAvaliacao(id: string): Promise<AvaliacaoGuardada | undefined> {
  const session = await auth();
  if (!session) return undefined;

  const linha = await prisma.avaliacao.findUnique({ where: { id }, include: INCLUDE });
  if (!linha) return undefined;
  if (session.user.papel === "TREINADOR" && linha.treinadorId !== session.user.id) return undefined;
  await registarAuditoria(session.user.id, "VIU_AVALIACAO", `${id} (${linha.treinador.nome})`);
  return paraAvaliacaoGuardada(linha);
}

export async function guardarAvaliacaoAction(draft: AvaliacaoDraft, grelhaSnapshot: Seccao[]) {
  const session = await auth();
  if (!session || session.user.papel === "TREINADOR") throw new Error("Não autorizado.");

  const treinador = await prisma.utilizador.findFirst({
    where: { nome: draft.cabecalho.treinador, papel: "TREINADOR" },
  });
  if (!treinador) throw new Error("Treinador não encontrado.");
  const tipoAula = await prisma.tipoAula.findFirst({ where: { nome: draft.cabecalho.tipoAula } });
  if (!tipoAula) throw new Error("Tipo de aula não encontrado.");
  const espaco = await prisma.espaco.findFirst({ where: { nome: draft.cabecalho.espaco } });
  if (!espaco) throw new Error("Espaço não encontrado.");

  const avaliacao = await prisma.avaliacao.create({
    data: {
      treinadorId: treinador.id,
      avaliadorId: session.user.id,
      espacoId: espaco.id,
      tipoAulaId: tipoAula.id,
      data: draft.cabecalho.data,
      hora: draft.cabecalho.hora,
      nAlunos: Number(draft.cabecalho.nAlunos),
      respostas: JSON.stringify(draft.respostas),
      observacoes: JSON.stringify(draft.observacoes),
      grelhaSnapshot: JSON.stringify(grelhaSnapshot),
      classificacaoGeral: Number(draft.classificacaoGeral),
      comentarioGeral: draft.comentarioGeral,
      planoAcao: JSON.stringify(draft.planoAcao.filter((p) => p.texto.trim() !== "")),
      confirmacaoAvaliadorData: draft.confirmacaoAvaliador.data || new Date().toISOString().slice(0, 10),
      confirmacaoTreinadorData: draft.confirmacaoTreinador.data || null,
    },
  });
  await registarAuditoria(session.user.id, "CRIOU_AVALIACAO", `${avaliacao.id} (${treinador.nome})`);
  revalidatePath("/historico");
  revalidatePath("/por-treinador");
}

export async function exportarAvaliacoesCsvAction(): Promise<AvaliacaoGuardada[]> {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") throw new Error("Não autorizado.");

  const avaliacoes = await listarAvaliacoes();
  await registarAuditoria(session.user.id, "EXPORTOU_CSV", `${avaliacoes.length} avaliações`);
  return avaliacoes;
}

export async function confirmarComoTreinadorAction(avaliacaoId: string) {
  const session = await auth();
  if (!session || session.user.papel !== "TREINADOR") throw new Error("Não autorizado.");

  const avaliacao = await prisma.avaliacao.findUnique({ where: { id: avaliacaoId } });
  if (!avaliacao || avaliacao.treinadorId !== session.user.id) throw new Error("Não autorizado.");

  await prisma.avaliacao.update({
    where: { id: avaliacaoId },
    data: { confirmacaoTreinadorData: new Date().toISOString().slice(0, 10) },
  });
  await registarAuditoria(session.user.id, "CONFIRMOU_AVALIACAO", avaliacaoId);
  revalidatePath("/historico");
}
