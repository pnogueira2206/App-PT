import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  INTL_LOCALE,
  LOCALE_COOKIE,
  THEME_COOKIE,
  isLocale,
  isTheme,
  type Locale,
  type Theme,
} from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";

export async function getPreferences(): Promise<{ locale: Locale; theme: Theme }> {
  const store = await cookies();
  const locale = store.get(LOCALE_COOKIE)?.value;
  const theme = store.get(THEME_COOKIE)?.value;
  return {
    locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
    theme: isTheme(theme) ? theme : "system",
  };
}

/** Translator for Server Components and Server Actions. */
export async function getI18n() {
  const { locale } = await getPreferences();
  return {
    locale,
    intlLocale: INTL_LOCALE[locale],
    t: createTranslator(locale, MESSAGES[locale]),
  };
}
