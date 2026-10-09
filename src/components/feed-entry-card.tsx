import Link from "next/link";
import { BLOCK_TYPE_STYLES, formatResult } from "@/lib/blocks";
import { formatLongDate } from "@/lib/dates";
import type { FeedEntry } from "@/lib/feed";
import type { Translate } from "@/i18n/translator";
import { markEntrySeenAction } from "@/app/trainer/feed/actions";
import { CommentThread } from "@/components/comment-thread";
import { RecordSuggestion } from "@/components/record-suggestion";

/** One logged session in the trainer's feed: scores, notes, PRs and comments. */
export function FeedEntryCard({
  entry,
  i18n,
}: {
  entry: FeedEntry;
  i18n: { t: Translate; intlLocale: string };
}) {
  const { t, intlLocale } = i18n;

  return (
    <article
      className={`rounded-xl border bg-white ${entry.unseen ? "border-brand/60" : "border-slate-200"}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="font-semibold text-slate-900">
            <Link href={`/trainer/students/${entry.student.id}`} className="hover:underline">
              {entry.student.name}
            </Link>
            <span className="font-normal text-slate-400"> · </span>
            <Link href={`/trainer/workouts/${entry.workout.id}`} className="font-medium hover:underline">
              {entry.workout.title}
            </Link>
          </p>
          <p className="text-xs text-slate-500 first-letter:uppercase">
            {formatLongDate(entry.workout.date, intlLocale)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entry.unseen && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
              {t("feed.unseen")}
            </span>
          )}
          {entry.unseen && (
            <form action={markEntrySeenAction.bind(null, entry.student.id, entry.workout.id)}>
              <button className="text-xs font-medium text-slate-500 hover:text-slate-900">
                {t("feed.markSeen")}
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="space-y-3 px-4 py-3">
        {entry.completion ? (
          <p className="text-sm text-slate-700">
            ✅ {t("feed.sessionCompleted")}
            {entry.completion.sessionRpe != null &&
              ` · ${t("common.rpe", { value: entry.completion.sessionRpe })}`}
            {entry.completion.notes && (
              <span className="block italic text-slate-500">“{entry.completion.notes}”</span>
            )}
          </p>
        ) : (
          <p className="text-xs text-slate-400">{t("feed.sessionNotCompleted")}</p>
        )}

        {entry.results.map(({ id, block, result, comments, recordSaved, recordCandidate }) => (
          <section key={id} className="space-y-2 rounded-lg border border-slate-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BLOCK_TYPE_STYLES[block.type]}`}>
                {t(`blocks.types.${block.type}`)}
              </span>
              <span className="text-sm font-semibold text-slate-900">{block.title}</span>
              {block.exerciseName && <span className="text-xs text-slate-500">{block.exerciseName}</span>}
            </div>
            <p className="text-sm text-slate-800">{formatResult(block, result, i18n)}</p>
            {result.studentNotes && <p className="text-sm italic text-slate-500">“{result.studentNotes}”</p>}
            <RecordSuggestion resultId={id} candidate={recordCandidate} saved={recordSaved} i18n={i18n} />
            <CommentThread resultId={id} comments={comments} viewer="trainer" />
          </section>
        ))}
      </div>
    </article>
  );
}
