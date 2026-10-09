import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { SignOutButton } from "@/components/sign-out-button";
import { StudentTopBar, StudentBottomNav } from "@/components/student-nav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { archivedAt: true },
  });
  if (!user || user.archivedAt) {
    const { t } = await getI18n();
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-sm text-slate-600">{t("auth.archivedAccount")}</p>
        <SignOutButton />
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col">
      <StudentTopBar />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
        {children}
      </main>
      <StudentBottomNav />
    </div>
  );
}
