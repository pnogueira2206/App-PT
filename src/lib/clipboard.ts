import { cookies } from "next/headers";
import type { CalendarOwner } from "@/lib/workouts";

// The trainer's copy/paste clipboard lives in a cookie so it survives
// navigating between calendars (e.g. copy Ana's week, paste into Bruno's).

const COOKIE_NAME = "pt_clipboard";

export type Clipboard =
  | { kind: "workout"; workoutId: string; label: string }
  | { kind: "day"; owner: CalendarOwner; date: string; label: string }
  | { kind: "week"; owner: CalendarOwner; weekStart: string; label: string };

export async function readClipboard(): Promise<Clipboard | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Clipboard;
  } catch {
    return null;
  }
}

export async function writeClipboard(clipboard: Clipboard | null) {
  const store = await cookies();
  if (!clipboard) {
    store.delete(COOKIE_NAME);
    return;
  }
  store.set(COOKIE_NAME, JSON.stringify(clipboard), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/trainer",
    maxAge: 60 * 60 * 24 * 7,
  });
}
