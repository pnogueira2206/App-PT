import Link from "next/link";
import { requireTrainer } from "@/lib/require-session";
import { getFeed } from "@/lib/feed";
import { getI18n } from "@/i18n/server";
import { FeedEntryCard } from "@/components/feed-entry-card";
import { markAllSeenAction } from "@/app/trainer/feed/actions";

export default async function FeedPage({ searchParams }: PageProps<"/trainer/feed">) {
  const { show } = (await searchParams) as { show?: string };
  const showAll = show === "all";
  const session = await requireTrainer();
  const i18n = await getI18n();
  const { t } = i18n;

  const entries = await getFeed(session.user.id);
  const unseen = entries.filter((e) => e.unseen);
  const visible = showAll ? entries : unseen;

  const tab = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      active ? "bg-brand text-brand-ink" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("feed.title")}</h1>
        <p className="text-sm text-slate-500">{t("feed.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1">
          <Link href="/trainer/feed" className={tab(!showAll)}>
            {t("feed.tabUnseen", { count: unseen.length })}
          </Link>
          <Link href="/trainer/feed?show=all" className={tab(showAll)}>
            {t("feed.tabAll")}
          </Link>
        </nav>
        {unseen.length > 0 && (
          <form action={markAllSeenAction}>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-900">
              {t("feed.markAllSeen")}
            </button>
          </form>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {showAll ? t("feed.emptyAll") : t("feed.empty")}
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((entry) => (
            <FeedEntryCard key={entry.key} entry={entry} i18n={i18n} />
          ))}
        </div>
      )}
    </div>
  );
}
