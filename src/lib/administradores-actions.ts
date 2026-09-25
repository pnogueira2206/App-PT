"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function listarAdministradores() {
  return prisma.utilizador.findMany({ where: { papel: "ADMIN" }, orderBy: { nome: "asc" } });
}

export async function adicionarAdminAction(nome: string, email: string, password: string): Promise<{ erro?: string }> {
  const existente = await prisma.utilizador.findUnique({ where: { email } });
  if (existente) return { erro: "Já existe uma conta com este email." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.utilizador.create({ data: { nome, email, passwordHash, papel: "ADMIN" } });
  revalidatePath("/admin/administradores");
  return {};
}

export async function editarAdminAction(id: string, nome: string) {
  await prisma.utilizador.update({ where: { id }, data: { nome } });
  revalidatePath("/admin/administradores");
}

export async function alternarAdminAtivoAction(id: string, ativo: boolean): Promise<{ erro?: string }> {
  const session = await auth();
  if (session?.user.papel !== "ADMIN") return { erro: "Não autorizado." };

  if (!ativo) {
    if (id === session.user.id) return { erro: "Não podes desativar a tua própria conta." };
    const outrosAtivos = await prisma.utilizador.count({
      where: { papel: "ADMIN", ativo: true, id: { not: id } },
    });
    if (outrosAtivos === 0) return { erro: "Tem de haver sempre pelo menos um administrador ativo." };
  }

  await prisma.utilizador.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/administradores");
  return {};
}
