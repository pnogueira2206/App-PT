"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Criterio, Seccao, TipoResposta } from "@/data/grelha";

function paraSeccao(s: {
  id: string;
  nome: string;
  percentagem: number;
  ativa: boolean;
  criterios: { id: string; texto: string; pesoMaximo: number | null; tipoResposta: string; dimensao: string | null; ativo: boolean }[];
}): Seccao {
  return {
    id: s.id,
    nome: s.nome,
    percentagem: s.percentagem,
    ativa: s.ativa,
    criterios: s.criterios.map(
      (c): Criterio => ({
        id: c.id,
        texto: c.texto,
        pesoMaximo: c.pesoMaximo,
        tipoResposta: c.tipoResposta as TipoResposta,
        dimensao: c.dimensao ?? undefined,
        ativo: c.ativo,
      })
    ),
  };
}

export async function obterGrelha(): Promise<Seccao[]> {
  const seccoes = await prisma.seccao.findMany({
    orderBy: { ordem: "asc" },
    include: { criterios: { orderBy: { ordem: "asc" } } },
  });
  return seccoes.map(paraSeccao);
}

export async function obterGrelhaAtiva(): Promise<Seccao[]> {
  const todas = await obterGrelha();
  return todas
    .filter((s) => s.ativa !== false)
    .map((s) => ({ ...s, criterios: s.criterios.filter((c) => c.ativo !== false) }));
}

function revalidarGrelha() {
  revalidatePath("/admin/grelha");
  revalidatePath("/admin/criterios-pilares");
  revalidatePath("/nova-avaliacao");
}

export async function editarSeccaoAction(id: string, patch: { nome: string; percentagem: number }) {
  await prisma.seccao.update({ where: { id }, data: patch });
  revalidarGrelha();
}

export async function alternarSeccaoAtivaAction(id: string, ativa: boolean) {
  await prisma.seccao.update({ where: { id }, data: { ativa } });
  revalidarGrelha();
}

export async function adicionarSeccaoAction(nome: string, percentagem: number) {
  const max = await prisma.seccao.aggregate({ _max: { ordem: true } });
  await prisma.seccao.create({ data: { nome, percentagem, ordem: (max._max.ordem ?? -1) + 1 } });
  revalidarGrelha();
}

export async function moverSeccaoAction(id: string, direcao: -1 | 1) {
  const seccoes = await prisma.seccao.findMany({ orderBy: { ordem: "asc" } });
  const i = seccoes.findIndex((s) => s.id === id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= seccoes.length) return;
  await prisma.$transaction([
    prisma.seccao.update({ where: { id: seccoes[i].id }, data: { ordem: seccoes[j].ordem } }),
    prisma.seccao.update({ where: { id: seccoes[j].id }, data: { ordem: seccoes[i].ordem } }),
  ]);
  revalidarGrelha();
}

export async function editarCriterioAction(id: string, patch: { texto: string; pesoMaximo: number | null }) {
  await prisma.criterio.update({ where: { id }, data: patch });
  revalidarGrelha();
}

export async function alternarCriterioAtivoAction(id: string, ativo: boolean) {
  await prisma.criterio.update({ where: { id }, data: { ativo } });
  revalidarGrelha();
}

export async function adicionarCriterioAction(
  seccaoId: string,
  novo: { texto: string; pesoMaximo: number | null; tipoResposta: TipoResposta; dimensao?: string }
) {
  const max = await prisma.criterio.aggregate({ _max: { ordem: true }, where: { seccaoId } });
  await prisma.criterio.create({
    data: { seccaoId, ordem: (max._max.ordem ?? -1) + 1, ...novo },
  });
  revalidarGrelha();
}

export async function moverCriterioAction(seccaoId: string, criterioId: string, direcao: -1 | 1) {
  const criterios = await prisma.criterio.findMany({ where: { seccaoId }, orderBy: { ordem: "asc" } });
  const i = criterios.findIndex((c) => c.id === criterioId);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= criterios.length) return;
  await prisma.$transaction([
    prisma.criterio.update({ where: { id: criterios[i].id }, data: { ordem: criterios[j].ordem } }),
    prisma.criterio.update({ where: { id: criterios[j].id }, data: { ordem: criterios[i].ordem } }),
  ]);
  revalidarGrelha();
}
