import { auth } from "@/lib/auth";

export async function requireTrainer() {
  const session = await auth();
  if (!session || session.user.role !== "TRAINER") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function requireStudent() {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Not authorized");
  }
  return session;
}
