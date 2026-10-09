import { INTL_LOCALE, type Locale } from "@/i18n/config";

/** Plural forms, picked with Intl.PluralRules (Russian uses one/few/many). */
export type Plural = { one: string; few?: string; many?: string; other: string };

type Widen<T> = T extends string
  ? string
  : T extends { other: string }
    ? Plural
    : { [K in keyof T]: Widen<T[K]> };

/** Dotted paths to every message ("calendar.publishWeek"). */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string | Plural
    ? `${Prefix}${K}`
    : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

import type { pt } from "@/i18n/messages/pt";

export type Messages = Widen<typeof pt>;
export type MessageKey = Paths<Messages>;
export type TranslateVars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: TranslateVars) => string;

export function createTranslator(locale: Locale, messages: Messages): Translate {
  const rules = new Intl.PluralRules(INTL_LOCALE[locale]);

  return (key, vars) => {
    let node: unknown = messages;
    for (const part of key.split(".")) node = (node as Record<string, unknown>)?.[part];

    let text: string;
    if (typeof node === "string") {
      text = node;
    } else if (node && typeof node === "object" && "other" in node) {
      const plural = node as Plural;
      const category = rules.select(Number(vars?.count ?? 0)) as keyof Plural;
      text = plural[category] ?? plural.other;
    } else {
      return key;
    }

    return vars ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : text;
  };
}
