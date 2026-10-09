"use server";

import { signIn } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { AuthError, CredentialsSignin } from "next-auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const { t } = await getI18n();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof CredentialsSignin && err.code === "archived") {
      return { error: t("auth.archivedAccount") };
    }
    if (err instanceof AuthError) {

      return { error: t("auth.invalidCredentials") };
    }
    throw err;
  }

  return {};
}
