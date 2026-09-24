"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function listarAvaliadores() {
  return prisma.utilizador.findMany({ where: { papel: "AVALIADOR" }, orderBy: { nome: "asc" } });
}

export async function adicionarAvaliadorAction(nome: string, email: string, password: string): Promise<{ erro?: string }> {
  const existente = await prisma.utilizador.findUnique({ where: { email } });
  if (existente) return { erro: "Já existe uma conta com este email." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.utilizador.create({ data: { nome, email, passwordHash, papel: "AVALIADOR" } });
  revalidatePath("/admin/avaliadores");
  return {};
}

export async function editarAvaliadorAction(id: string, nome: string) {
  await prisma.utilizador.update({ where: { id }, data: { nome } });
  revalidatePath("/admin/avaliadores");
}

export async function alternarAvaliadorAtivoAction(id: string, ativo: boolean) {
  await prisma.utilizador.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/avaliadores");
}
