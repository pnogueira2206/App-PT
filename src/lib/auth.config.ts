import type { NextAuthConfig } from "next-auth";
import type { Papel } from "@prisma/client";

/**
 * Parte da configuração do NextAuth segura para correr no Edge Runtime (usada
 * em src/proxy.ts) — sem o Credentials provider nem chamadas à base de dados,
 * que dependem do motor nativo do Prisma e não corem no Edge. A configuração
 * completa (src/lib/auth.ts) estende esta base.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.papel = token.papel as Papel;
      return session;
    },
  },
} satisfies NextAuthConfig;
