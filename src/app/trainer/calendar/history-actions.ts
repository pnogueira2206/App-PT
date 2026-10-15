"use server";

import { requireTrainer } from "@/lib/require-session";
import { searchHistory, type HistorySearch } from "@/lib/history";
import type { CalendarOwner } from "@/lib/workouts";
import { getI18n } from "@/i18n/server";

export type { HistorySearch } from "@/lib/history";

export async function searchHistoryAction(owner: CalendarOwner, query: string, exact: boolean): Promise<HistorySearch> {
  const session = await requireTrainer();
  return searchHistory(session.user.id, owner, query, exact, await getI18n());
}
