"use client";

import { useActionState } from "react";
import { addCommentAction } from "@/app/comments/actions";
import { useI18n } from "@/i18n/client";
import { APP_TIMEZONE } from "@/lib/dates";

export type ThreadComment = {
  id: string;
  body: string;
  authorName: string;
  fromTrainer: boolean;
  createdAt: Date;
};

/** Conversation about one result, between the trainer and the student. */
export function CommentThread({
  resultId,
  comments,
  viewer,
}: {
  resultId: string;
  comments: ThreadComment[];
  viewer: "trainer" | "student";
}) {
  const { t, intlLocale } = useI18n();
  const [state, formAction, isPending] = useActionState(addCommentAction.bind(null, resultId), undefined);

  const authorLabel = (c: ThreadComment) => {
    const mine = (viewer === "trainer") === c.fromTrainer;
    if (mine) return t("comments.you");
    return c.fromTrainer ? t("comments.coach") : c.authorName;
  };

  return (
    <div className="space-y-2">
      {comments.length > 0 && (
        <ul className="space-y-1.5">
          {comments.map((c) => {
            const mine = (viewer === "trainer") === c.fromTrainer;
            return (
              <li key={c.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
                    c.fromTrainer
                      ? "border border-brand/40 bg-brand/10 text-slate-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="text-[11px] font-medium text-slate-500">
                    {authorLabel(c)} ·{" "}
                    {new Date(c.createdAt).toLocaleString(intlLocale, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: APP_TIMEZONE,
                    })}
                  </p>
                  <p className="whitespace-pre-wrap">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form action={formAction} className="flex items-start gap-2">
        <textarea
          name="body"
          rows={1}
          required
          maxLength={1000}
          placeholder={t("comments.placeholder")}
          className="min-h-9 flex-1 resize-y rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
        >
          {t("comments.send")}
        </button>
      </form>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
