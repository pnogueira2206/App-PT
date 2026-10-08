import type { NextAuthConfig } from "next-auth";

// Session/JWT config without providers, so the proxy can check the session
// without bundling Prisma or bcrypt (hosts like Netlify reject native addons
// in middleware). The full config with the Credentials provider is in auth.ts.
export const authConfig = {
  session: { strategy: "jwt" },
  // Hosting platforms (Netlify, Vercel) set the Host header behind their proxy.
  // Set in code because Netlify's netlify.toml env vars only reach the build.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: "TRAINER" | "STUDENT" }).role;
        token.id = (user as { id: string }).id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "TRAINER" | "STUDENT";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
