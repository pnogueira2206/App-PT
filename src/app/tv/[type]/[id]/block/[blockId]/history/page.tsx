/* eslint-disable @next/next/no-html-link-for-pages -- TV mode runs on an old browser where the app JS fails: plain links on purpose. */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchHistory } from "@/lib/history";
import { getI18n } from "@/i18n/server";
import { TvStyles } from "../../../../../tv-styles";

/**
 * TV: the history of a block's exercise for the group (or the student) — past
 * blocks with the same name and each athlete's score, plus their records.
 * A plain GET form to search another name (no JavaScript needed).
 */
export default async function TvHistoryPage({ params, searchParams }: PageProps<"/tv/[type]/[id]/block/[blockId]/history">) {
  const session = await auth();
  if (!session || session.user.role !== "TRAINER") redirect("/login");
  const { type, id, blockId } = await params;
  const { q } = (await searchParams) as { q?: string };
  if (type !== "group" && type !== "student") notFound();
  const i18n = await getI18n();
  const { t } = i18n;

  const block = await prisma.workoutBlock.findFirst({
    where: { id: blockId, workout: { trainerId: session.user.id } },
    select: { title: true, exercise: { select: { name: true } } },
  });
  if (!block) notFound();
  // "A1. Snatch" → "Snatch"
  const query = (q ?? block.title.replace(/^[A-Z]\d*[.)]\s+/, "")).trim();
  const history = await searchHistory(session.user.id, { type, id }, query, false, i18n, blockId);
  const back = `/tv/${type}/${id}/block/${blockId}`;

  return (
    <div className="tv">
      <TvStyles />
      <div className="tv-head">
        <div>
          <p className="tv-brand">PN COACHING</p>
          <h1 className="tv-title">{t("tvHistory.title", { name: query })}</h1>
        </div>
        <div className="tv-nav">
          <a href={back}>{t("tvHistory.back")}</a>
        </div>
      </div>

      <form method="get" action={`/tv/${type}/${id}/block/${blockId}/history`} className="tv-search">
        <input name="q" defaultValue={query} placeholder={t("historySearch.placeholder")} className="tv-input tv-input-wide" />
        <button type="submit" className="tv-button">
          {t("tvHistory.search")}
        </button>
      </form>

      {history.blocks.length === 0 && history.metrics.length === 0 && <p className="tv-empty">{t("historySearch.empty")}</p>}

      {history.metrics.length > 0 && (
        <div className="tv-section">
          <p className="tv-label">{t("historySearch.tabMetrics")}</p>
          <table className="tv-table">
            <tbody>
              {history.metrics.map((m) => (
                <tr key={m.id}>
                  {type === "group" && <td className="tv-athlete">{m.name}</td>}
                  <td className="tv-hist-value">{m.value}</td>
                  <td className="tv-current">
                    {m.exercise} · {m.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {history.blocks.length > 0 && (
        <div className="tv-cols">
          {history.blocks.map((b) => (
            <div key={b.id} className="tv-section tv-hist">
              <p className="tv-date tv-hist-date">
                {b.date} · {b.workoutTitle}
              </p>
              <p className="tv-label">
                {b.letter}) {b.title}
              </p>
              {b.description && <p className="tv-text tv-muted">{b.description}</p>}
              <div className="tv-scores">
                {b.results.length === 0 ? (
                  <p>{t("historySearch.noResult")}</p>
                ) : (
                  b.results.map((r, i) => (
                    <p key={i}>
                      {r.name && <b>{r.name} </b>}
                      {r.summary}
                    </p>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
