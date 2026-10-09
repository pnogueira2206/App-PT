import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/translator";
import { pt } from "@/i18n/messages/pt";
import { en } from "@/i18n/messages/en";
import { ru } from "@/i18n/messages/ru";

export const MESSAGES: Record<Locale, Messages> = { pt, en, ru };
