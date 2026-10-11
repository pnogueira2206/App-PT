"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import {
  GOALS,
  HEADER,
  MAX_LIFTS,
  MENTAL,
  MOVEMENT,
  PROFILE,
  RATIOS,
  SUMMARY,
  VALUES,
  actualRatio,
  movementSummary,
  type LiftGroup,
  type Levels,
  type OnboardingData,
  type Rated,
  type Scale,
} from "@/lib/onboarding";
import {
  saveOnboardingAction,
  saveOnboardingLevelsAction,
  type OnboardingProfile,
} from "@/app/onboarding/actions";

type Tab = "profile" | "movement" | "lifts" | "mental" | "goals" | "summary" | "ratios";

// The spreadsheet's sheet names, in order.
const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Athlete Profile" },
  { key: "movement", label: "Movement Self-Assessment" },
  { key: "lifts", label: "Max Lifts / Benchmarks" },
  { key: "mental", label: "Mental Performance Self-Assessment" },
  { key: "goals", label: "Goal Setting" },
  { key: "summary", label: "Onboarding Summary" },
  { key: "ratios", label: "Strength Ratios" },
];

const field = "w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm";
const sectionTitle = "text-sm font-bold uppercase tracking-wide text-brand-text";
const th = "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

const RATING_TONES = ["", "bg-red-500", "bg-orange-400", "bg-amber-300", "bg-lime-500", "bg-emerald-600"];

function ScaleLegend({ scale }: { scale: Scale }) {
  return (
    <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className={th}>ESCALA</p>
      <dl className="grid gap-1 text-sm sm:grid-cols-[2rem_11rem_1fr]">
        {scale.map((s) => (
          <div key={s.value} className="contents">
            <dt className="font-semibold text-slate-900">{s.value}</dt>
            <dd className="font-medium text-slate-800">{s.label}</dd>
            <dd className="mb-1 text-slate-500 sm:mb-0">{s.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function RatingInput({ value, scale, onChange }: { value?: number; scale: Scale; onChange: (v?: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup">
      {scale.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${s.value} - ${s.label}`}
            onClick={() => onChange(active ? undefined : s.value)}
            className={`h-8 w-8 rounded-md border text-sm font-semibold ${
              active
                ? `${RATING_TONES[s.value]} border-transparent text-white`
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
            }`}
          >
            {s.value}
          </button>
        );
      })}
    </div>
  );
}

export function OnboardingForm({
  studentId,
  initial,
  initialProfile,
  levels: initialLevels,
  canEditLevels,
  updatedLabel,
}: {
  /** Null when the student fills in their own. */
  studentId: string | null;
  initial: OnboardingData;
  initialProfile: OnboardingProfile;
  levels: Levels;
  canEditLevels: boolean;
  updatedLabel: string | null;
}) {
  const { t, intlLocale } = useI18n();
  const router = useRouter();
  // Like the spreadsheet's "0.0" format: always one decimal.
  const formatAverage = (value: number) =>
    value.toLocaleString(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const [tab, setTab] = useState<Tab>("profile");
  const [data, setData] = useState(initial);
  const [profile, setProfile] = useState(initialProfile);
  const [levels, setLevels] = useState(initialLevels);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = (fn: (d: OnboardingData) => OnboardingData) => {
    setData(fn);
    setDirty(true);
    setMessage(null);
  };
  const setRated = (kind: "movement" | "mental", id: string, changes: Rated) =>
    update((d) => ({ ...d, [kind]: { ...d[kind], [id]: { ...d[kind][id], ...changes } } }));
  const setLift = (id: string, changes: { value?: string; date?: string }) =>
    update((d) => ({ ...d, lifts: { ...d.lifts, [id]: { ...d.lifts[id], ...changes } } }));
  const setListItem = <K extends "values" | "goals">(kind: K, index: number, changes: Partial<OnboardingData[K][number]>) =>
    update((d) => {
      const list = [...d[kind]] as OnboardingData[K];
      list[index] = { ...(list[index] ?? {}), ...changes };
      return { ...d, [kind]: list };
    });

  function save() {
    startTransition(async () => {
      const result = await saveOnboardingAction(studentId, { data, profile });
      setMessage(result);
      if (!result.error) {
        setDirty(false);
        router.refresh();
      }
    });
  }
  function saveLevels() {
    startTransition(async () => setMessage(await saveOnboardingLevelsAction(levels)));
  }

  const movementIds = MOVEMENT.sections.flatMap((s) => s.groups.flatMap((g) => g.rows.map((r) => r.id)));
  const mentalIds = MENTAL.categories.flatMap((c) => c.skills.map((s) => s.id));
  const answered =
    movementIds.filter((id) => data.movement[id]?.rating).length + mentalIds.filter((id) => data.mental[id]?.rating).length;
  const total = movementIds.length + mentalIds.length;
  const summary = movementSummary(data);

  const liftTable = (groups: LiftGroup[], columns: { movement: string; value: string; date: string }) => (
    <div className="space-y-4">
      <div className="hidden gap-2 sm:grid sm:grid-cols-[minmax(9rem,1.2fr)_6rem_9rem_repeat(4,minmax(4rem,1fr))]">
        <span className={th}>{columns.movement}</span>
        <span className={th}>{columns.value}</span>
        <span className={th}>{columns.date}</span>
        {MAX_LIFTS.levels.map((level) => (
          <span key={level} className={th}>
            {level}
          </span>
        ))}
      </div>
      {groups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-900">{group.title}</p>
          {group.rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-2 items-center gap-2 border-b border-slate-100 pb-2 sm:grid-cols-[minmax(9rem,1.2fr)_6rem_9rem_repeat(4,minmax(4rem,1fr))] sm:border-0 sm:pb-0"
            >
              <span className="col-span-2 text-sm text-slate-800 sm:col-span-1">{row.name}</span>
              <input
                aria-label={`${row.name} - ${columns.value}`}
                value={data.lifts[row.id]?.value ?? ""}
                onChange={(e) => setLift(row.id, { value: e.target.value })}
                className={field}
              />
              <input
                type="date"
                aria-label={`${row.name} - ${columns.date}`}
                value={data.lifts[row.id]?.date ?? ""}
                onChange={(e) => setLift(row.id, { date: e.target.value })}
                className={field}
              />
              {MAX_LIFTS.levels.map((level, i) =>
                canEditLevels ? (
                  <input
                    key={level}
                    aria-label={`${row.name} - ${level}`}
                    placeholder={level.replace("NÍVEL ", "")}
                    value={levels[row.id]?.[i] ?? ""}
                    onChange={(e) =>
                      setLevels((current) => {
                        const next = [...(current[row.id] ?? ["", "", "", ""])];
                        next[i] = e.target.value;
                        return { ...current, [row.id]: next };
                      })
                    }
                    className={`${field} border-dashed`}
                  />
                ) : (
                  <span key={level} className="text-sm text-slate-500">
                    <span className="mr-1 text-[10px] uppercase text-slate-400 sm:hidden">{level.replace("NÍVEL ", "")}</span>
                    {levels[row.id]?.[i] || "—"}
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand-text">{HEADER}</p>
        <p className="text-sm text-slate-500">
          {t("onboarding.progress", { done: answered, total })}
          {updatedLabel && ` · ${updatedLabel}`}
        </p>
      </div>

      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`-mb-px shrink-0 border-b-2 px-2.5 py-2 text-sm font-medium ${
              tab === item.key ? "border-brand text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "profile" && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className={sectionTitle}>{PROFILE.title}</h2>
          <div className="grid max-w-md gap-3">
            <label className="grid grid-cols-[9rem_1fr] items-center gap-2 text-sm text-slate-700">
              {PROFILE.fields.dateOfBirth}
              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => (setProfile({ ...profile, dateOfBirth: e.target.value }), setDirty(true))}
                className={field}
              />
            </label>
            <label className="grid grid-cols-[9rem_1fr_2rem] items-center gap-2 text-sm text-slate-700">
              {PROFILE.fields.height}
              <input
                inputMode="decimal"
                value={profile.heightCm}
                onChange={(e) => (setProfile({ ...profile, heightCm: e.target.value }), setDirty(true))}
                className={field}
              />
              <span className="text-slate-400">cm</span>
            </label>
            <label className="grid grid-cols-[9rem_1fr_2rem] items-center gap-2 text-sm text-slate-700">
              {PROFILE.fields.weight}
              <input
                inputMode="decimal"
                value={profile.weightKg}
                onChange={(e) => (setProfile({ ...profile, weightKg: e.target.value }), setDirty(true))}
                className={field}
              />
              <span className="text-slate-400">kg</span>
            </label>
          </div>
        </section>
      )}

      {tab === "movement" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className={sectionTitle}>{MOVEMENT.title}</h2>
          <p className="text-sm text-slate-600">{MOVEMENT.intro}</p>
          <ScaleLegend scale={MOVEMENT.scale} />
          <div className="hidden gap-3 md:grid md:grid-cols-[9rem_minmax(12rem,1fr)_11rem_minmax(10rem,1fr)]">
            <span className={th}>{MOVEMENT.columns.movement}</span>
            <span className={th}>{MOVEMENT.columns.context}</span>
            <span className={th}>{MOVEMENT.columns.rating}</span>
            <span className={th}>{MOVEMENT.columns.notes}</span>
          </div>
          {MOVEMENT.sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <p className="border-b border-slate-300 pb-1 text-sm font-bold text-slate-900">{section.title}</p>
              {section.groups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">{group.title}</p>
                  {group.rows.map((row) => (
                    <div
                      key={row.id}
                      className="grid gap-2 border-b border-slate-100 pb-2 md:grid-cols-[9rem_minmax(12rem,1fr)_11rem_minmax(10rem,1fr)] md:items-center md:gap-3"
                    >
                      <span className="text-sm font-medium text-slate-900">{row.movement}</span>
                      <span className="text-sm text-slate-600">{row.context ?? ""}</span>
                      <RatingInput
                        value={data.movement[row.id]?.rating}
                        scale={MOVEMENT.scale}
                        onChange={(rating) => setRated("movement", row.id, { rating })}
                      />
                      <input
                        aria-label={MOVEMENT.columns.notes}
                        placeholder={MOVEMENT.columns.notes}
                        value={data.movement[row.id]?.notes ?? ""}
                        onChange={(e) => setRated("movement", row.id, { notes: e.target.value })}
                        className={field}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {tab === "lifts" && (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className={sectionTitle}>{MAX_LIFTS.title}</h2>
          {liftTable(MAX_LIFTS.liftGroups, MAX_LIFTS.liftColumns)}
          {liftTable(MAX_LIFTS.testGroups, MAX_LIFTS.testColumns)}
          {canEditLevels && (
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-500">{t("onboarding.levelsHint")}</p>
              <button
                type="button"
                onClick={saveLevels}
                disabled={isPending}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {t("onboarding.saveLevels")}
              </button>
            </div>
          )}
        </section>
      )}

      {tab === "mental" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className={sectionTitle}>{MENTAL.title}</h2>
          <p className="text-sm text-slate-600">{MENTAL.intro}</p>
          <ScaleLegend scale={MENTAL.scale} />
          <div className="hidden gap-3 md:grid md:grid-cols-[minmax(14rem,1.4fr)_11rem_minmax(10rem,1fr)]">
            <span className={th}>{MENTAL.columns.skill}</span>
            <span className={th}>{MENTAL.columns.rating}</span>
            <span className={th}>{MENTAL.columns.notes}</span>
          </div>
          {MENTAL.categories.map((category) => (
            <div key={category.title} className="space-y-2">
              <p className="border-b border-slate-300 pb-1 text-sm font-bold text-slate-900">{category.title}</p>
              {category.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="grid gap-2 border-b border-slate-100 pb-2 md:grid-cols-[minmax(14rem,1.4fr)_11rem_minmax(10rem,1fr)] md:items-center md:gap-3"
                >
                  <span className="text-sm text-slate-800">{skill.text}</span>
                  <RatingInput
                    value={data.mental[skill.id]?.rating}
                    scale={MENTAL.scale}
                    onChange={(rating) => setRated("mental", skill.id, { rating })}
                  />
                  <input
                    aria-label={MENTAL.columns.notes}
                    placeholder={MENTAL.columns.notes}
                    value={data.mental[skill.id]?.notes ?? ""}
                    onChange={(e) => setRated("mental", skill.id, { notes: e.target.value })}
                    className={field}
                  />
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {tab === "goals" && (
        <div className="space-y-4">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className={sectionTitle}>{VALUES.title}</h2>
            <p className="text-sm text-slate-600">{VALUES.intro}</p>
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">{VALUES.examplesTitle}</p>
              <p className="text-slate-500">{VALUES.examples}</p>
            </div>
            {Array.from({ length: VALUES.count }, (_, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[5rem_12rem_1fr] sm:items-start">
                <span className="pt-1.5 text-xs font-semibold text-slate-500">{VALUES.label(i + 1)}</span>
                <input
                  placeholder={VALUES.valueColumn}
                  aria-label={`${VALUES.label(i + 1)} - ${VALUES.valueColumn}`}
                  value={data.values[i]?.value ?? ""}
                  onChange={(e) => setListItem("values", i, { value: e.target.value })}
                  className={field}
                />
                <textarea
                  rows={2}
                  placeholder={VALUES.whyColumn}
                  aria-label={`${VALUES.label(i + 1)} - ${VALUES.whyColumn}`}
                  value={data.values[i]?.why ?? ""}
                  onChange={(e) => setListItem("values", i, { why: e.target.value })}
                  className={field}
                />
              </div>
            ))}
          </section>
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className={sectionTitle}>{GOALS.title}</h2>
            <p className="text-sm text-slate-600">{GOALS.intro}</p>
            {Array.from({ length: GOALS.count }, (_, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">{GOALS.label(i + 1)}</p>
                {(["goal", "until", "obstacles"] as const).map((key) => (
                  <label key={key} className="grid gap-1 text-xs font-medium text-slate-500 sm:grid-cols-[9rem_1fr] sm:items-start">
                    <span className="sm:pt-2">{GOALS.fields[key]}</span>
                    {key === "until" ? (
                      <input
                        value={data.goals[i]?.[key] ?? ""}
                        onChange={(e) => setListItem("goals", i, { [key]: e.target.value })}
                        className={field}
                      />
                    ) : (
                      <textarea
                        rows={2}
                        value={data.goals[i]?.[key] ?? ""}
                        onChange={(e) => setListItem("goals", i, { [key]: e.target.value })}
                        className={field}
                      />
                    )}
                  </label>
                ))}
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === "summary" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className={sectionTitle}>{SUMMARY.section}</h2>
          <table className="w-full max-w-lg text-sm">
            <thead>
              <tr className="text-left">
                <th className={`${th} pb-2`}>{SUMMARY.columns.category}</th>
                <th className={`${th} pb-2`}>{SUMMARY.columns.average}</th>
                <th className="w-1/3" />
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="py-1.5 text-slate-800">{row.label}</td>
                  <td className="py-1.5 font-semibold tabular-nums text-slate-900">
                    {row.average == null ? "" : formatAverage(row.average)}
                  </td>
                  <td className="py-1.5">
                    {row.average != null && (
                      <span className="block h-1.5 rounded-full bg-slate-100">
                        <span
                          className="block h-1.5 rounded-full bg-brand"
                          style={{ width: `${(row.average / 5) * 100}%` }}
                        />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              [SUMMARY.strongest, summary.strongest],
              [SUMMARY.weakest, summary.weakest],
            ] as const).map(([title, list]) => (
              <div key={title} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-1.5 text-sm font-semibold text-slate-900">{title}</p>
                {list.length === 0 ? (
                  <p className="text-sm text-slate-400">—</p>
                ) : (
                  <ol className="space-y-1 text-sm">
                    {list.map((item) => (
                      <li key={item.label} className="flex justify-between gap-2">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {formatAverage(item.average)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "ratios" && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className={sectionTitle}>{RATIOS.title}</h2>
          <table className="w-full max-w-xl text-sm">
            <thead>
              <tr className="text-left">
                <th className={`${th} pb-2`}>{RATIOS.columns.lift}</th>
                <th className={`${th} pb-2`}>{RATIOS.columns.of}</th>
                <th className={`${th} pb-2 text-right`}>{RATIOS.columns.target}</th>
                <th className={`${th} pb-2 text-right`}>{RATIOS.columns.actual}</th>
              </tr>
            </thead>
            {RATIOS.groups.map((group) => (
              <tbody key={group.title}>
                <tr>
                  <td colSpan={4} className="pt-3 pb-1 text-sm font-semibold text-slate-900">
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => {
                  const actual = actualRatio(data, row.num, row.den);
                  return (
                    <tr key={`${row.lift}-${row.of}`} className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-800">{row.lift}</td>
                      <td className="py-1.5 text-slate-600">{row.of}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-600">{Math.round(row.target * 100)}%</td>
                      <td
                        className={`py-1.5 text-right font-semibold tabular-nums ${
                          actual == null ? "text-slate-300" : actual >= row.target ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {actual == null ? "—" : `${Math.round(actual * 100)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
          <p className="text-xs text-slate-500">{t("onboarding.ratiosHint")}</p>
        </section>
      )}

      <div className="sticky bottom-16 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:bottom-4">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-60"
        >
          {isPending ? t("common.saving") : t("onboarding.save")}
        </button>
        {message?.error && <p className="text-sm text-red-600">{message.error}</p>}
        {message?.success && <p className="text-sm text-emerald-600">{message.success}</p>}
        {dirty && !message && <p className="text-xs text-slate-500">{t("onboarding.unsaved")}</p>}
      </div>
    </div>
  );
}
