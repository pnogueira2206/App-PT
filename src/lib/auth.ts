import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registarAuditoria } from "@/lib/auditoria";

const LIMIAR_TENTATIVAS = 5;
const DURACAO_BLOQUEIO_MIN = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!email || !password) return null;

        const utilizador = await prisma.utilizador.findUnique({ where: { email } });
        if (!utilizador || !utilizador.ativo) {
          await registarAuditoria(null, "LOGIN_FALHOU", email);
          return null;
        }

        if (utilizador.bloqueadoAte && utilizador.bloqueadoAte > new Date()) {
          await registarAuditoria(utilizador.id, "LOGIN_BLOQUEADO", email);
          return null;
        }

        const valido = await bcrypt.compare(password, utilizador.passwordHash);
        if (!valido) {
          const tentativas = utilizador.tentativasFalhadas + 1;
          const bloquear = tentativas >= LIMIAR_TENTATIVAS;
          await prisma.utilizador.update({
            where: { id: utilizador.id },
            data: {
              tentativasFalhadas: bloquear ? 0 : tentativas,
              bloqueadoAte: bloquear ? new Date(Date.now() + DURACAO_BLOQUEIO_MIN * 60_000) : null,
            },
          });
          await registarAuditoria(
            utilizador.id,
            bloquear ? "LOGIN_BLOQUEADO" : "LOGIN_FALHOU",
            bloquear ? `conta bloqueada ${DURACAO_BLOQUEIO_MIN} min após ${tentativas} tentativas` : email
          );
          return null;
        }

        if (utilizador.tentativasFalhadas > 0 || utilizador.bloqueadoAte) {
          await prisma.utilizador.update({
            where: { id: utilizador.id },
            data: { tentativasFalhadas: 0, bloqueadoAte: null },
          });
        }
        await registarAuditoria(utilizador.id, "LOGIN");

        return { id: utilizador.id, name: utilizador.nome, email: utilizador.email, papel: utilizador.papel };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.papel = user.papel;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.papel = token.papel;
      return session;
    },
  },
});
