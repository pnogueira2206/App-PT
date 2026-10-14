import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { saveTvScores } from "@/lib/tv-scores";

/**
 * Plain HTML form post from the TV scoring screen (the gym's old browser can't
 * run the app's JavaScript, so no Server Action): saves and goes back to the block.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "TRAINER") {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  const form = await request.formData();
  const type = String(form.get("type") ?? "");
  const id = String(form.get("id") ?? "");
  const blockId = String(form.get("blockId") ?? "");
  const date = String(form.get("date") ?? "");
  if ((type !== "group" && type !== "student") || !id || !blockId) {
    return NextResponse.redirect(new URL("/tv", request.url), 303);
  }

  const result = await saveTvScores(session.user.id, { type, id }, blockId, form);
  if (result) {
    revalidatePath("/trainer", "layout");
    revalidatePath("/student", "layout");
  }
  const back = new URL(`/tv/${type}/${id}/block/${blockId}`, request.url);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) back.searchParams.set("date", date);
  back.searchParams.set("saved", String(result?.saved ?? 0));
  if (result?.invalid) back.searchParams.set("invalid", String(result.invalid));
  return NextResponse.redirect(back, 303);
}
