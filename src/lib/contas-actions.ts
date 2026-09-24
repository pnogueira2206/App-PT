"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function reporPasswordAction(id: string, novaPassword: string): Promise<{ erro?: string }> {
  const session = await auth();
  if (session?.user.papel !== "ADMIN") return { erro: "Não autorizado." };
  if (novaPassword.length < 6) return { erro: "A palavra-passe deve ter pelo menos 6 caracteres." };

  const passwordHash = await bcrypt.hash(novaPassword, 10);
  await prisma.utilizador.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/admin/treinadores");
  revalidatePath("/admin/avaliadores");
  return {};
}

export async function mudarPasswordPropriaAction(passwordAtual: string, novaPassword: string): Promise<{ erro?: string; sucesso?: boolean }> {
  const session = await auth();
  if (!session) return { erro: "Não autenticado." };
  if (novaPassword.length < 6) return { erro: "A nova palavra-passe deve ter pelo menos 6 caracteres." };

  const utilizador = await prisma.utilizador.findUnique({ where: { id: session.user.id } });
  if (!utilizador) return { erro: "Conta não encontrada." };

  const valido = await bcrypt.compare(passwordAtual, utilizador.passwordHash);
  if (!valido) return { erro: "Palavra-passe atual incorreta." };

  const passwordHash = await bcrypt.hash(novaPassword, 10);
  await prisma.utilizador.update({ where: { id: utilizador.id }, data: { passwordHash } });
  return { sucesso: true };
}
