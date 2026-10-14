/* eslint-disable @next/next/no-html-link-for-pages -- TV mode runs on an old browser where the app JS fails: plain links on purpose. */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, formatLongDate, parseDateKey, toDateKey, todayKey } from "@/lib/dates";
import { loadCalendar } from "@/lib/calendar";
import { loadMaxes } from "@/lib/percent-loads";
import { PercentText } from "@/components/percent-text";
import { formatPrescription } from "@/lib/blocks";
import type { CalendarOwner } from "@/lib/workouts";
import { getI18n } from "@/i18n/server";
import { TvStyles } from "../../tv-styles";

/** "A) Back Squat"; keeps the coach's own label when the title already has one. */
function blockLabel(title: string, index: number) {
  return /^[A-Z]\d*[.)]\s/.test(title) ? title : `${String.fromCharCode(65 + index)}) ${title}`;
}

/**
 * TV mode: one day of a group's or student's calendar in large type, read-only,
 * plain links and no JavaScript needed. Reloads itself every 5 minutes.
 */
export default async function TvDayPage({ params, searchParams }: PageProps<"/tv/[type]/[id]">) {
  const session = await auth();
  if (!session || session.user.role !== "TRAINER") redirect("/login");
  const { type, id } = await params;
  const { date: dateParam } = (await searchParams) as { date?: string };
  if (type !== "group" && type !== "student") notFound();
  const i18n = await getI18n();
  const { t, intlLocale } = i18n;
  const trainerId = session.user.id;

  const name =
    type === "group"
      ? (await prisma.group.findFirst({ where: { id, trainerId }, select: { name: true } }))?.name
      : (await prisma.user.findFirst({ where: { id, trainerId, role: "STUDENT" }, select: { name: true } }))?.name;
  if (!name) notFound();

  const isToday = !dateParam;
  const date = (dateParam && parseDateKey(dateParam)) || parseDateKey(todayKey())!;
  const owner: CalendarOwner = { type, id };
  const [all, maxes] = await Promise.all([
    loadCalendar(trainerId, owner, date, 1),
    type === "student" ? loadMaxes(id) : Promise.resolve([]),
  ]);
  const workouts = all.filter((w) => w.status === "PUBLISHED");
  const base = `/tv/${type}/${id}`;

  return (
    <div className="tv">
      <TvStyles />
      {/* Keeps "today" current on a screen that is never touched. */}
      {isToday && <meta httpEquiv="refresh" content="300" />}
      <div className="tv-head">
        <div>
          <p className="tv-brand">PN COACHING</p>
          <h1 className="tv-title">{name}</h1>
          <p className="tv-date">{formatLongDate(date, intlLocale)}</p>
        </div>
        <div className="tv-nav">
          <a href={`${base}?date=${toDateKey(addDays(date, -1))}`}>{t("tv.previous")}</a>
          <a href={base}>{t("common.today")}</a>
          <a href={`${base}?date=${toDateKey(addDays(date, 1))}`}>{t("tv.next")}</a>
          <a href="/tv">{t("tv.change")}</a>
        </div>
      </div>

      {workouts.length === 0 && <p className="tv-empty">{t("tv.empty")}</p>}

      {workouts.map((w) =>
        w.kind === "REST" ? (
          <p key={w.id} className="tv-empty">
            {t("states.rest")}
          </p>
        ) : (
          <div key={w.id} className="tv-cols">
            <div className="tv-section">
              <p className="tv-workout">{w.title}</p>
              {w.description && <p className="tv-text tv-muted">{w.description}</p>}
            </div>
            {w.warmup && (
              <div className="tv-section">
                <p className="tv-label">{t("editor.warmup")}</p>
                <p className="tv-text">{w.warmup}</p>
              </div>
            )}
            {w.blocks.map((block, index) => {
              const prescription = formatPrescription(block, i18n);
              return (
                <div key={block.id} className="tv-section">
                  <p className="tv-label">
                    {/* Tap a block to type the athletes' scores. */}
                    <a href={`${base}/block/${block.id}`} className="tv-block-link">
                      {blockLabel(block.title, index)} <span className="tv-score-hint">✎</span>
                    </a>
                  </p>
                  {prescription && <p className="tv-text tv-muted">{prescription}</p>}
                  {block.description && (
                    <p className="tv-text">
                      <PercentText
                        text={block.description}
                        maxes={maxes}
                        fallbackNames={[block.exerciseName, block.title]}
                        locale={intlLocale}
                        kgClassName="tv-kg"
                      />
                    </p>
                  )}
                  {block.trainerNotes && <p className="tv-text tv-notes">{block.trainerNotes}</p>}
                </div>
              );
            })}
            {w.cooldown && (
              <div className="tv-section">
                <p className="tv-label">{t("editor.cooldown")}</p>
                <p className="tv-text">{w.cooldown}</p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
