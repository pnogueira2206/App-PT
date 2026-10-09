"use client";

import { createContext, useContext, useMemo } from "react";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { createTranslator, type Messages } from "@/i18n/translator";

const I18nContext = createContext<{ locale: Locale; messages: Messages } | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Translator for Client Components. */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  const { locale, messages } = context;
  return useMemo(
    () => ({ locale, intlLocale: INTL_LOCALE[locale], t: createTranslator(locale, messages) }),
    [locale, messages]
  );
}
