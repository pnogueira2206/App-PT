"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function listarTreinadores() {
  return prisma.utilizador.findMany({ where: { papel: "TREINADOR" }, orderBy: { nome: "asc" } });
}

export async function listarTreinadoresAtivos() {
  return prisma.utilizador.findMany({ where: { papel: "TREINADOR", ativo: true }, orderBy: { nome: "asc" } });
}

export async function adicionarTreinadorAction(nome: string, email: string, password: string): Promise<{ erro?: string }> {
  const existente = await prisma.utilizador.findUnique({ where: { email } });
  if (existente) return { erro: "Já existe uma conta com este email." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.utilizador.create({ data: { nome, email, passwordHash, papel: "TREINADOR" } });
  revalidatePath("/admin/treinadores");
  return {};
}

export async function editarTreinadorAction(id: string, nome: string) {
  await prisma.utilizador.update({ where: { id }, data: { nome } });
  revalidatePath("/admin/treinadores");
}

export async function alternarTreinadorAtivoAction(id: string, ativo: boolean) {
  await prisma.utilizador.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/treinadores");
  revalidatePath("/nova-avaliacao");
}
