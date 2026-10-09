import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireTrainer() {
  const session = await auth();
  if (!session || session.user.role !== "TRAINER") {
    throw new Error("Not authorized");
  }
  return session;
}

/** For student pages; the student layout shows a notice instead of the page to archived students. */
export async function requireStudent() {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Not authorized");
  }
  return session;
}

/**
 * For student actions: also refuses archived students, who may still hold a
 * valid session cookie from before they were archived.
 */
export async function requireActiveStudent() {
  const session = await requireStudent();
  await assertNotArchived(session.user.id);
  return session;
}

export async function assertNotArchived(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { archivedAt: true } });
  if (!user || user.archivedAt) throw new Error("Not authorized");
}
