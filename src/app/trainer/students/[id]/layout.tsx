import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Tabs } from "@/components/tabs";
import { getI18n } from "@/i18n/server";

export default async function StudentLayout({
  children,
  params,
}: LayoutProps<"/trainer/students/[id]">) {
  const { id } = await params;
  const session = await requireTrainer();
  const { t } = await getI18n();

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
    include: { memberships: { include: { group: true } } },
  });
  if (!student) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/trainer/students" className="text-sm text-slate-500 hover:text-slate-900">
          {t("students.back")}
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
            <p className="text-sm text-slate-500">{student.email}</p>
          </div>
          <ResetPasswordForm studentId={student.id} />
        </div>
        {student.memberships.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {student.memberships.map((m) => (
              <Link
                key={m.id}
                href={`/trainer/groups/${m.groupId}`}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100"
              >
                👥 {m.group.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Tabs
        tabs={[
          { href: `/trainer/students/${student.id}`, label: t("students.tabCalendar") },
          { href: `/trainer/students/${student.id}/profile`, label: t("students.tabProfile") },

        ]}
      />

      {children}
    </div>
  );
}
