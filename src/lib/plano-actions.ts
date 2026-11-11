"use server";

import { revalidatePath } from "next/cache";
import { EstadoPlano } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { registarAuditoria } from "@/lib/auditoria";
import { segundaDaSemana } from "@/lib/plano-datas";

export interface PlanoItem {
  id: string;
  treinadorId: string;
  treinador: string;
  avaliadorId: string;
  avaliador: string;
  espacoId: string | null;
  espaco: string | null;
  semana: string;
  dia: string | null;
  notas: string;
  estado: EstadoPlano;
  avaliacaoId: string | null;
  classificacao: number | null;
  criadoPor: string;
}

export interface DadosPlano {
  treinadorId: string;
  avaliadorId: string;
  espacoId: string | null;
  semana: string;
  dia: string | null;
  notas: string;
}

const ROTULO_ESTADO: Record<EstadoPlano, string> = {
  POR_AVALIAR: "Por avaliar",
  AVALIADO: "Avaliado",
  FINALIZADO: "Finalizado",
};

async function exigirAdmin() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") throw new Error("Não autorizado.");
  return session;
}

function normalizar(dados: DadosPlano) {
  const semana = segundaDaSemana(dados.semana);
  // Um dia fora da semana escolhida não faz sentido — nesse caso fica só a semana.
  const dia = dados.dia && segundaDaSemana(dados.dia) === semana ? dados.dia : null;
  return {
    treinadorId: dados.treinadorId,
    avaliadorId: dados.avaliadorId,
    espacoId: dados.espacoId || null,
    semana,
    dia,
    notas: dados.notas.trim(),
  };
}

/** Agendamentos das semanas entre `desde` e `ate` (segundas-feiras, inclusive). */
export async function listarPlano(desde: string, ate: string): Promise<PlanoItem[]> {
  await exigirAdmin();
  const linhas = await prisma.avaliacaoPlaneada.findMany({
    where: { semana: { gte: desde, lte: ate } },
    include: { treinador: true, avaliador: true, espaco: true, criadoPor: true, avaliacao: true },
    orderBy: [{ semana: "asc" }, { dia: "asc" }, { criadoEm: "asc" }],
  });
  return linhas.map((l) => ({
    id: l.id,
    treinadorId: l.treinadorId,
    treinador: l.treinador.nome,
    avaliadorId: l.avaliadorId,
    avaliador: l.avaliador.nome,
    espacoId: l.espacoId,
    espaco: l.espaco?.nome ?? null,
    semana: l.semana,
    dia: l.dia,
    notas: l.notas,
    estado: l.estado,
    avaliacaoId: l.avaliacaoId,
    classificacao: l.avaliacao?.classificacaoGeral ?? null,
    criadoPor: l.criadoPor.nome,
  }));
}

export async function criarPlanoAction(dados: DadosPlano) {
  const session = await exigirAdmin();
  const plano = await prisma.avaliacaoPlaneada.create({
    data: { ...normalizar(dados), criadoPorId: session.user.id },
    include: { treinador: true },
  });
  await registarAuditoria(session.user.id, "AGENDOU_AVALIACAO", `${plano.treinador.nome}, semana de ${plano.semana}`);
  revalidatePath("/admin/plano");
}

export async function editarPlanoAction(id: string, dados: DadosPlano) {
  const session = await exigirAdmin();
  const plano = await prisma.avaliacaoPlaneada.update({
    where: { id },
    data: normalizar(dados),
    include: { treinador: true },
  });
  await registarAuditoria(session.user.id, "EDITOU_AGENDAMENTO", `${plano.treinador.nome}, semana de ${plano.semana}`);
  revalidatePath("/admin/plano");
}

export async function mudarEstadoPlanoAction(id: string, estado: EstadoPlano) {
  const session = await exigirAdmin();
  const plano = await prisma.avaliacaoPlaneada.update({
    where: { id },
    data: { estado },
    include: { treinador: true },
  });
  await registarAuditoria(
    session.user.id,
    "MUDOU_ESTADO_AGENDAMENTO",
    `${plano.treinador.nome}, semana de ${plano.semana}: ${ROTULO_ESTADO[estado]}`
  );
  revalidatePath("/admin/plano");
}

export async function apagarPlanoAction(id: string) {
  const session = await exigirAdmin();
  const plano = await prisma.avaliacaoPlaneada.delete({ where: { id }, include: { treinador: true } });
  await registarAuditoria(session.user.id, "APAGOU_AGENDAMENTO", `${plano.treinador.nome}, semana de ${plano.semana}`);
  revalidatePath("/admin/plano");
}
