import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
        if (!utilizador || !utilizador.ativo) return null;

        const valido = await bcrypt.compare(password, utilizador.passwordHash);
        if (!valido) return null;

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
