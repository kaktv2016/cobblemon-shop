import Link from "next/link";
import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import type { PublicWikiArticleCard } from "@/lib/public-wiki-cache";
import { getWikiCategoryTheme, getWikiStatusMeta } from "@/lib/wiki";

function formatWikiDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function WikiFeaturedHeroCard({
  article,
}: {
  article: PublicWikiArticleCard;
}) {
  const status = getWikiStatusMeta(article.status);
  const theme = getWikiCategoryTheme(article.category.slug);

  return (
    <article className="portal-panel spotlight-surface group h-full overflow-hidden p-0">
      <div className="relative flex min-h-[24rem] flex-col justify-end p-6 sm:p-8">
        <div className="absolute inset-0" style={{ backgroundImage: theme.surface }} />

        {article.coverImage ? (
          <>
            <img
              src={article.coverImage}
              alt={article.title}
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,24,0.12),rgba(5,10,24,0.52)_38%,rgba(5,10,24,0.92)_72%,rgba(5,10,24,1))]" />
          </>
        ) : null}

        <div className="absolute inset-0" style={{ backgroundImage: theme.glow }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_24%),linear-gradient(180deg,transparent,rgba(5,10,24,0.16)_56%,rgba(5,10,24,0.26))]" />

        <div className="relative flex flex-wrap items-center gap-3">
          <span className="portal-chip px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-cyan-100">
            {article.category.name}
          </span>
          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${status.tone}`}>
            {status.label}
          </span>
          {article.isFeatured ? (
            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${theme.badge}`}>
              Spotlight
            </span>
          ) : null}
        </div>

        <div className="relative mt-6 max-w-2xl">
          <p className={`text-[11px] uppercase tracking-[0.28em] ${theme.accent}`}>
            FEATURED FIELD NOTE
          </p>
          <h2 className="portal-heading mt-4 text-3xl sm:text-4xl lg:text-5xl">
            {article.title}
          </h2>
          <p className="portal-copy mt-5 max-w-xl text-sm leading-7 sm:text-base">
            {article.excerpt}
          </p>
        </div>

        <div className="relative mt-8 flex flex-wrap items-center gap-5 text-xs uppercase tracking-[0.18em] text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5" />
            Updated {formatWikiDate(article.updatedAt)}
          </span>
          {article.gameVersion ? <span>{article.gameVersion}</span> : null}
        </div>

        <Link
          href={`/wiki/${article.slug}`}
          className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-px hover:border-white/18 hover:bg-white/[0.09]"
        >
          Open article
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function WikiArticleCard({
  article,
  compact = false,
}: {
  article: PublicWikiArticleCard;
  compact?: boolean;
}) {
  const status = getWikiStatusMeta(article.status);
  const theme = getWikiCategoryTheme(article.category.slug);

  return (
    <article className="portal-panel-soft spotlight-surface group h-full overflow-hidden p-0">
      <div className={`relative flex h-full min-h-[20rem] flex-col ${compact ? "sm:min-h-[18rem]" : "sm:min-h-[22rem]"}`}>
        <div className="absolute inset-0" style={{ backgroundImage: theme.surface }} />

        {article.coverImage ? (
          <>
            <img
              src={article.coverImage}
              alt={article.title}
              className="absolute inset-0 h-full w-full object-cover opacity-52 transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,21,0.08),rgba(7,10,21,0.56)_42%,rgba(7,10,21,0.94)_72%,rgba(7,10,21,1))]" />
          </>
        ) : null}

        <div className="absolute inset-0" style={{ backgroundImage: theme.glow }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_22%),linear-gradient(180deg,transparent,rgba(7,10,21,0.22)_58%,rgba(7,10,21,0.42))]" />

        <div className="relative flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${status.tone}`}>
                {status.label}
              </span>
              <span className="portal-chip px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200">
                {article.category.name}
              </span>
            </div>

            {article.isFeatured ? (
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${theme.badge}`}>
                <Sparkles className="h-3.5 w-3.5" />
                Featured
              </span>
            ) : null}
          </div>

          <div className="mt-auto pt-12">
            <p className={`text-[11px] uppercase tracking-[0.26em] ${theme.accent}`}>
              {article.category.name}
            </p>
            <h3 className={`mt-4 font-display font-semibold text-white ${compact ? "text-[1.85rem] leading-[1.02]" : "text-3xl"}`}>
              {article.title}
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/78">
              {article.excerpt}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-5 text-xs uppercase tracking-[0.18em] text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                {formatWikiDate(article.updatedAt)}
              </span>
              {article.gameVersion ? <span>{article.gameVersion}</span> : null}
            </div>

            <Link
              href={`/wiki/${article.slug}`}
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-slate-200 transition-colors hover:text-white"
            >
              Read article
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function WikiCategoryCard({
  category,
}: {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    articleCount: number;
    articles: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string;
      coverImage: string | null;
    }>;
  };
}) {
  const preview = category.articles[0];
  const iconText = (category.icon || category.name).slice(0, 2).toUpperCase();
  const theme = getWikiCategoryTheme(category.slug);

  return (
    <article className="portal-panel-soft spotlight-surface group h-full overflow-hidden p-0">
      <div className="relative flex min-h-[22rem] flex-col p-5 sm:p-6">
        <div className="absolute inset-0" style={{ backgroundImage: theme.surface }} />

        {preview?.coverImage ? (
          <>
            <img
              src={preview.coverImage}
              alt={preview.title}
              className="absolute inset-0 h-full w-full object-cover opacity-28 transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,21,0.2),rgba(7,10,21,0.74)_56%,rgba(7,10,21,0.98))]" />
          </>
        ) : null}

        <div className="absolute inset-0" style={{ backgroundImage: theme.glow }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_24%),linear-gradient(180deg,transparent,rgba(7,10,21,0.22)_58%,rgba(7,10,21,0.42))]" />

        <div className="relative flex items-start justify-between gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-semibold uppercase tracking-[0.18em] ${theme.badge}`}>
            {iconText}
          </div>
          <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
            {category.articleCount} articles
          </span>
        </div>

        <div className="relative mt-auto pt-12">
          <p className={`text-[11px] uppercase tracking-[0.26em] ${theme.accent}`}>
            Knowledge branch
          </p>
          <h3 className="font-display mt-4 text-2xl font-semibold text-white">
            {category.name}
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-200/78">
            {category.description || "Curated game knowledge for this part of the server."}
          </p>

          {preview ? (
            <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-slate-950/46 p-4 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Latest article
              </p>
              <p className="mt-2 text-base font-medium text-white">{preview.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{preview.excerpt}</p>
            </div>
          ) : null}

          <Link
            href={`/wiki/category/${category.slug}`}
            className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-slate-200 transition-colors hover:text-white"
          >
            Explore category
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
