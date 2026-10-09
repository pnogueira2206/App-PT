import { saveRecordFromResultAction } from "@/app/records/actions";
import { formatNumber } from "@/lib/blocks";
import type { RecordCandidate } from "@/lib/records";
import type { Translate } from "@/i18n/translator";

/** "New PR" banner with a button to save it, or the saved state. */
export function RecordSuggestion({
  resultId,
  candidate,
  saved,
  i18n,
}: {
  resultId: string;
  candidate: RecordCandidate | null;
  saved: boolean;
  i18n: { t: Translate; intlLocale: string };
}) {
  const { t, intlLocale } = i18n;

  if (saved) {
    return (
      <p className="inline-block rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
        {t("recordSuggestion.saved")}
      </p>
    );
  }
  if (!candidate) return null;

  const value =
    candidate.type === "WEIGHT"
      ? `${formatNumber(Number(candidate.value), intlLocale)} kg`
      : candidate.value;

  return (
    <form
      action={saveRecordFromResultAction.bind(null, resultId)}
      className="flex flex-wrap items-center gap-2 rounded-md bg-amber-100 px-2 py-1.5 text-sm text-amber-800"
    >
      <span className="font-medium">
        {candidate.first
          ? t("recordSuggestion.firstRecord", { value })
          : t("recordSuggestion.newRecord", { value })}
      </span>
      <button className="rounded-md bg-brand px-2 py-0.5 text-xs font-semibold text-brand-ink hover:bg-brand-hover">
        {t("recordSuggestion.save")}
      </button>
    </form>
  );
}
