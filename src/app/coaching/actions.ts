"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendCoachNotification } from "@/lib/notify-email";
import { COMPETITION_LEVELS, GOALS } from "@/lib/coaching-options";

export type ApplicationState =
  | {
      success?: boolean;
      error?: string;
      fieldErrors?: Partial<Record<string, string>>;
    }
  | undefined;

const optionalText = z
  .string()
  .trim()
  .max(2000, "Máximo de 2000 caracteres.")
  .transform((v) => v || null);

const schema = z
  .object({
    fullName: z.string().trim().min(1, "Indica o teu nome.").max(120),
    email: z.email("Indica um email válido.").trim().toLowerCase(),
    goal: z.enum(GOALS, "Escolhe um objetivo."),
    competitionLevel: z.string().trim(),
    lookingFor: optionalText,
    trainingBackground: optionalText,
  })
  .superRefine((data, ctx) => {
    const levels = COMPETITION_LEVELS[data.goal];
    if (levels && !levels.includes(data.competitionLevel)) {
      ctx.addIssue({
        code: "custom",
        path: ["competitionLevel"],
        message: "Escolhe onde competes atualmente.",
      });
    }
  });

export async function submitApplicationAction(
  _prev: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  // Honeypot: real people never see or fill this field.
  if (formData.get("website")) return { success: true };

  const values = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    competitionLevel: String(formData.get("competitionLevel") ?? ""),
    lookingFor: String(formData.get("lookingFor") ?? ""),
    trainingBackground: String(formData.get("trainingBackground") ?? ""),
  };
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  const competitionLevel = COMPETITION_LEVELS[data.goal]
    ? data.competitionLevel
    : null;

  await prisma.coachingApplication.create({
    data: { ...data, competitionLevel },
  });

  try {
    await sendCoachNotification({
      subject: `Nova candidatura: ${data.fullName} (${data.goal})`,
      replyTo: data.email,
      text: [
        `Nome: ${data.fullName}`,
        `Email: ${data.email}`,
        `Objetivo: ${data.goal}`,
        competitionLevel && `Onde compete: ${competitionLevel}`,
        "",
        "O que procura num coach:",
        data.lookingFor ?? "-",
        "",
        "Experiência de treino:",
        data.trainingBackground ?? "-",
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });
  } catch (err) {
    // The application is already saved; a failed email must not lose it.
    console.error("Erro ao enviar notificação:", err);
  }

  return { success: true };
}
