"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { signIn } from "@/lib/auth";

// Name/email go back with errors so the form can refill them (React resets forms after an action).
type ActionState = { error?: string; name?: string; email?: string } | undefined;

/** Creates the first trainer account. Only works while no trainer exists. */
export async function createFirstTrainerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fail = (error: string) => ({ error, name, email });

  if (!name || !email || !password) return fail(t("errors.fillAll"));
  if (password.length < 8) return fail(t("errors.passwordMin8"));
  if (password !== confirm) return fail(t("errors.passwordMismatch"));

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // Serializable so two simultaneous submissions can't both create a trainer.
    await prisma.$transaction(
      async (tx) => {
        const trainers = await tx.user.count({ where: { role: "TRAINER" } });
        if (trainers > 0) throw new SetupClosedError();
        await tx.user.create({ data: { name, email, passwordHash, role: "TRAINER" } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof SetupClosedError) {
      return fail(t("errors.trainerExists"));
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return fail(t("errors.emailExists"));
      if (error.code === "P2034") return fail(t("errors.tryAgain"));
    }
    throw error;
  }

  await signIn("credentials", { email, password, redirectTo: "/trainer" });
  return undefined;
}

class SetupClosedError extends Error {}
