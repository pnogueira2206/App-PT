import { cookies } from "next/headers";
import type { CalendarOwner } from "@/lib/workouts";

// The trainer's copy/paste clipboard lives in a cookie so it survives
// navigating between calendars (e.g. copy Ana's week, paste into Bruno's).

const COOKIE_NAME = "pt_clipboard";

// Display names are stored (not a ready-made label) so the banner follows the UI language.
export type Clipboard =
  | { kind: "workout"; workoutId: string; title: string }
  | { kind: "day"; owner: CalendarOwner; date: string; ownerName: string }
  | { kind: "week"; owner: CalendarOwner; weekStart: string; ownerName: string };


export async function readClipboard(): Promise<Clipboard | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Clipboard;
    // Ignore cookies written by an older version of the clipboard format.
    const valid =
      (value.kind === "workout" && typeof value.title === "string") ||
      ((value.kind === "day" || value.kind === "week") && typeof value.ownerName === "string");
    return valid ? value : null;
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
