import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { TvStyles } from "./tv-styles";

/** TV mode: pick the calendar (group or student) to show on the gym screen. */
export default async function TvIndexPage() {
  const session = await auth();
  if (!session || session.user.role !== "TRAINER") redirect("/login");
  const { t } = await getI18n();

  const [groups, students] = await Promise.all([
    prisma.group.findMany({ where: { trainerId: session.user.id }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { trainerId: session.user.id, role: "STUDENT", archivedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="tv">
      <TvStyles />
      <div className="tv-head">
        <div>
          <p className="tv-brand">PN COACHING</p>
          <h1 className="tv-title">{t("tv.title")}</h1>
          <p className="tv-date">{t("tv.choose")}</p>
        </div>
      </div>
      <div className="tv-list">
        {groups.length > 0 && <h2>{t("tv.groups")}</h2>}
        {groups.map((g) => (
          <a key={g.id} href={`/tv/group/${g.id}`}>
            {g.name}
          </a>
        ))}
        {students.length > 0 && <h2>{t("tv.students")}</h2>}
        {students.map((s) => (
          <a key={s.id} href={`/tv/student/${s.id}`}>
            {s.name}
          </a>
        ))}
      </div>
    </div>
  );
}
