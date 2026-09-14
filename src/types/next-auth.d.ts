import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "TRAINER" | "STUDENT";
    } & DefaultSession["user"];
  }

  interface User {
    role: "TRAINER" | "STUDENT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "TRAINER" | "STUDENT";
  }
}
