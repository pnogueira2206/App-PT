"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_NAMES, THEMES, type Theme } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { setLocaleAction, setThemeAction } from "@/app/preferences/actions";

function currentTheme(): Theme {
  const root = document.documentElement.classList;
  return root.contains("dark") ? "dark" : root.contains("light") ? "light" : "system";
}

/** Language and light/dark theme picker shown in the headers and on the login page. */
export function PreferencesMenu() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function chooseTheme(next: Theme) {
    // Apply immediately; the cookie keeps it for the next server render.
    const root = document.documentElement.classList;
    root.remove("dark", "light");
    if (next !== "system") root.add(next);
    setTheme(next);
    startTransition(() => setThemeAction(next));
  }

  function chooseLocale(next: string) {
    startTransition(async () => {
      await setLocaleAction(next);
      setOpen(false);
      router.refresh();

    });
  }

  const option = (active: boolean) =>
    `flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
      active ? "bg-brand text-brand-ink" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) setTheme(currentTheme());
          setOpen(!open);
        }}

        aria-label={t("settings.title")}
        aria-expanded={open}
        className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-semibold uppercase text-slate-600 hover:text-slate-900"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>

        {locale}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-60 space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              {t("settings.language")}
            </p>
            <div className="flex gap-1 rounded-lg bg-slate-50 p-0.5">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  disabled={isPending}
                  onClick={() => chooseLocale(l)}
                  className={option(l === locale)}
                  lang={l}
                >
                  {LOCALE_NAMES[l]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              {t("settings.theme")}
            </p>
            <div className="flex gap-1 rounded-lg bg-slate-50 p-0.5">
              {THEMES.map((th) => (
                <button key={th} type="button" onClick={() => chooseTheme(th)} className={option(th === theme)}>
                  {t(`settings.themes.${th}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
