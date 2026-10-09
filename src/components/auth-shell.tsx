import { GoldRule, Wordmark } from "@/components/brand";
import { PreferencesMenu } from "@/components/preferences-menu";

/** Layout of the login/setup screens, following the PN Coaching site. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <PreferencesMenu />
      </div>
      <div className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <Wordmark />
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
            {title}
          </h1>
          <GoldRule />
          <p className="max-w-sm text-base leading-relaxed text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">{children}</div>
      </div>
    </div>
  );
}

export const authLabel =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700";
export const authInput =
  "w-full rounded-md border border-slate-200 px-3.5 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
export const authButton =
  "w-full rounded-md bg-brand px-4 py-3 text-xs font-bold uppercase tracking-[0.25em] text-brand-ink transition hover:bg-brand-hover disabled:opacity-60";
