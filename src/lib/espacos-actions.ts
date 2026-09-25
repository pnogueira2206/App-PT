"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function listarEspacos() {
  return prisma.espaco.findMany({ orderBy: { nome: "asc" } });
}

export async function listarEspacosAtivos() {
  return prisma.espaco.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
}

export async function adicionarEspacoAction(nome: string) {
  await prisma.espaco.create({ data: { nome } });
  revalidatePath("/admin/espacos");
}

export async function editarEspacoAction(id: string, nome: string) {
  await prisma.espaco.update({ where: { id }, data: { nome } });
  revalidatePath("/admin/espacos");
}

export async function alternarEspacoAtivoAction(id: string, ativo: boolean) {
  await prisma.espaco.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/espacos");
  revalidatePath("/nova-avaliacao");
}
