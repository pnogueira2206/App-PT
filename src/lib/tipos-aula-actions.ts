"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function listarTiposAula() {
  return prisma.tipoAula.findMany({ orderBy: { nome: "asc" } });
}

export async function listarTiposAulaAtivos() {
  return prisma.tipoAula.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
}

export async function adicionarTipoAulaAction(nome: string) {
  await prisma.tipoAula.create({ data: { nome } });
  revalidatePath("/admin/tipos-aula");
}

export async function editarTipoAulaAction(id: string, nome: string) {
  await prisma.tipoAula.update({ where: { id }, data: { nome } });
  revalidatePath("/admin/tipos-aula");
}

export async function alternarTipoAulaAtivoAction(id: string, ativo: boolean) {
  await prisma.tipoAula.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/tipos-aula");
  revalidatePath("/nova-avaliacao");
}
