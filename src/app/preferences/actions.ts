"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, THEME_COOKIE, isLocale, isTheme } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function setPreference(name: string, value: string) {
  (await cookies()).set(name, value, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  await setPreference(LOCALE_COOKIE, locale);
}

export async function setThemeAction(theme: string) {
  if (!isTheme(theme)) return;
  await setPreference(THEME_COOKIE, theme);
}
