import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatDuration, formatPrescription, formatResult } from "@/lib/blocks";
import { formatLongDate, toDateKey } from "@/lib/dates";
import { loadTvBlock } from "@/lib/tv-scores";
import { getI18n } from "@/i18n/server";
import { TvStyles } from "../../../../tv-styles";

/** TV: tap a block → the athletes of the group (or the student) with a field for each score. */
export default async function TvBlockPage({ params, searchParams }: PageProps<"/tv/[type]/[id]/block/[blockId]">) {
  const session = await auth();
  if (!session || session.user.role !== "TRAINER") redirect("/login");
  const { type, id, blockId } = await params;
  const { saved, invalid } = (await searchParams) as { saved?: string; invalid?: string };
  if (type !== "group" && type !== "student") notFound();
  const i18n = await getI18n();
  const { t, intlLocale } = i18n;

  const loaded = await loadTvBlock(session.user.id, { type, id }, blockId);
  if (!loaded) notFound();
  const { block, workout, kind, athletes } = loaded;
  const date = toDateKey(workout.date);
  const prescription = formatPrescription(block, i18n);
  const back = `/tv/${type}/${id}?date=${date}`;
  const label = /^[A-Z]\d*[.)]\s/.test(block.title) ? block.title : `${String.fromCharCode(64 + block.order)}) ${block.title}`;

  const kindHint =
    kind === "MAX_LOAD"
      ? t("tvScores.kg")
      : kind === "TIME"
        ? t("tvScores.time")
        : kind === "ROUNDS_REPS"
          ? t("tvScores.roundsReps")
          : t("tvScores.text");

  return (
    <div className="tv">
      <TvStyles />
      <div className="tv-head">
        <div>
          <p className="tv-brand">PN COACHING</p>
          <h1 className="tv-title">{label}</h1>
          <p className="tv-date">
            {workout.title} · {formatLongDate(workout.date, intlLocale)}
          </p>
        </div>
        <div className="tv-nav">
          <a href={back}>{t("tvScores.back")}</a>
          <a href={`/tv/${type}/${id}/block/${block.id}/history`}>{t("tvHistory.open")}</a>
        </div>
      </div>

      {(prescription || block.description || block.trainerNotes) && (
        <div className="tv-section">
          {prescription && <p className="tv-text tv-muted">{prescription}</p>}
          {block.description && <p className="tv-text">{block.description}</p>}
          {block.trainerNotes && <p className="tv-text tv-notes">{block.trainerNotes}</p>}
        </div>
      )}

      {saved != null && (
        <p className="tv-flash">
          {t("tvScores.saved", { count: Number(saved) || 0 })}
          {invalid ? ` ${t("tvScores.invalid", { count: Number(invalid) || 0 })}` : ""}
        </p>
      )}

      {athletes.length === 0 ? (
        <p className="tv-empty">{t("tvScores.noAthletes")}</p>
      ) : (
        <form method="post" action="/tv/score" className="tv-form">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="blockId" value={block.id} />
          <input type="hidden" name="date" value={date} />
          <p className="tv-label">{kindHint}</p>
          <table className="tv-table">
            <tbody>
              {athletes.map((a) => {
                const r = a.result;
                return (
                  <tr key={a.id}>
                    <td className="tv-athlete">{a.name}</td>
                    <td>
                      {kind === "MAX_LOAD" && (
                        <input name={`kg_${a.id}`} defaultValue={r?.loadKg ?? ""} inputMode="decimal" placeholder="kg" className="tv-input" />
                      )}
                      {kind === "TIME" && (
                        <input
                          name={`time_${a.id}`}
                          defaultValue={r?.timeSeconds != null ? formatDuration(r.timeSeconds) : ""}
                          placeholder="mm:ss"
                          className="tv-input"
                        />
                      )}
                      {kind === "ROUNDS_REPS" && (
                        <>
                          <input name={`rounds_${a.id}`} defaultValue={r?.rounds ?? ""} inputMode="numeric" placeholder={t("tvScores.rounds")} className="tv-input tv-input-small" />
                          <span className="tv-plus">+</span>
                          <input name={`reps_${a.id}`} defaultValue={r?.reps ?? ""} inputMode="numeric" placeholder={t("tvScores.reps")} className="tv-input tv-input-small" />
                        </>
                      )}
                      {kind === "TEXT" && (
                        <input name={`text_${a.id}`} defaultValue={r?.scoreText ?? ""} placeholder={t("tvScores.textPlaceholder")} className="tv-input tv-input-wide" />
                      )}
                    </td>
                    <td className="tv-current">{r ? formatResult(block, r, i18n) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="submit" className="tv-button">
            {t("tvScores.save")}
          </button>
        </form>
      )}
    </div>
  );
}
