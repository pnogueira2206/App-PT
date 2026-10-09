export const LOCALES = ["pt", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt";

/** BCP 47 tags for <html lang> and Intl formatting. */
export const INTL_LOCALE: Record<Locale, string> = { pt: "pt-PT", en: "en-GB", ru: "ru-RU" };

export const LOCALE_NAMES: Record<Locale, string> = { pt: "Português", en: "English", ru: "Русский" };

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const LOCALE_COOKIE = "pn_locale";
export const THEME_COOKIE = "pn_theme";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}
