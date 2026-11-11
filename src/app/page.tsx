import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * The gym TV is an old Chromebox (Chrome 76) where the main app's JS and
 * Tailwind CSS fail, leaving a blank page. Send old Chrome straight to TV mode.
 */
function isOldChrome(userAgent: string) {
  const match = userAgent.match(/Chrome\/(\d+)/);
  return match !== null && Number(match[1]) < 100;
}

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "TRAINER") {
    const userAgent = (await headers()).get("user-agent") ?? "";
    redirect(isOldChrome(userAgent) ? "/tv" : "/trainer");
  }
  redirect("/student");
}
