import Link from "next/link";
import { ArrowUpRight, BookOpen, Layers3, Orbit, SearchCheck } from "lucide-react";
import {
  WikiArticleCard,
  WikiCategoryCard,
  WikiFeaturedHeroCard,
} from "@/components/wiki/wiki-cards";
import { WikiSearchForm } from "@/components/wiki/wiki-search-form";
import { getPublicWikiIndexData } from "@/lib/public-wiki-cache";

export const metadata = {
  title: "Wiki",
  description:
    "Player-facing knowledge base for Cobblemon Divided covering progression, regions, raids, commands, and server systems.",
  alternates: {
    canonical: "/wiki",
  },
};

export const revalidate = 120;

type WikiIndexPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function WikiIndexPage({ searchParams }: WikiIndexPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const data = await getPublicWikiIndexData(query);
  const leadArticle = data.featuredArticles[0] || data.recentArticles[0] || null;

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_20%),radial-gradient(circle_at_top_right,rgba(129,140,248,0.12),transparent_24%),radial-gradient(circle_at_50%_36%,rgba(250,204,21,0.05),transparent_18%),linear-gradient(180deg,rgba(2,6,17,0.12),rgba(2,6,17,0))]" />

      <div className="mx-auto max-w-7xl space-y-16">
        <section className="portal-panel overflow-visible px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.08),transparent_20%)]" />
          <div className="absolute -left-8 top-12 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-indigo-400/12 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-2xl space-y-8">
              <div>
                <p className="portal-kicker text-cyan-300/78">
                  WORLD GUIDE // COBBLEMON DIVIDED
                </p>
                <h1 className="portal-heading mt-5 text-4xl sm:text-5xl lg:text-6xl">
                  Game knowledge presented like a live portal, not a generic knowledge base.
                </h1>
                <p className="portal-copy mt-6 max-w-xl text-sm leading-7 sm:text-base">
                  Explore routes, mechanics, progression systems, and server rules in a
                  format that feels closer to a command center than a blog archive.
                </p>
              </div>

              <WikiSearchForm
                action="/wiki"
                query={query}
                placeholder="Search guides, commands, raids, gyms, and progression"
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="portal-panel-soft p-5">
                  <BookOpen className="h-5 w-5 text-cyan-200" />
                  <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Featured guides
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {data.featuredArticles.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Curated articles highlighted for active players and new arrivals.
                  </p>
                </div>

                <div className="portal-panel-soft p-5">
                  <Layers3 className="h-5 w-5 text-indigo-200" />
                  <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Visible categories
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {data.categories.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Browse by system, region, or progression lane instead of raw search alone.
                  </p>
                </div>

                <div className="portal-panel-soft p-5">
                  <SearchCheck className="h-5 w-5 text-amber-200" />
                  <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Search mode
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {query ? "Active" : "Ready"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {query
                      ? `Showing live matches for "${query}".`
                      : "Find articles by title, keywords, excerpts, and article body."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {leadArticle ? <WikiFeaturedHeroCard article={leadArticle} /> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="portal-panel-soft p-5">
                  <Orbit className="h-5 w-5 text-cyan-200" />
                  <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Freshly reviewed
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300/80">
                    Articles marked for review stay visible, but the wiki now surfaces the
                    newest checked pages more clearly.
                  </p>
                </div>

                <div className="portal-panel-soft p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Linked spaces
                  </p>
                  <div className="mt-4 space-y-3">
                    <Link
                      href="/news"
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      News feed
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      Support center
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {data.featuredArticles.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="portal-kicker text-cyan-300/78">SPOTLIGHT</p>
                <h2 className="portal-heading mt-3 text-3xl">Featured articles</h2>
              </div>
              <Link
                href="/wiki"
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-slate-300 transition-colors hover:text-white"
              >
                Wiki directory
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              {data.featuredArticles.map((article) => (
                <WikiArticleCard key={article.id} article={article} compact />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-6">
          <div>
            <p className="portal-kicker text-cyan-300/78">TOPICS</p>
            <h2 className="portal-heading mt-3 text-3xl">Browse by category</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.categories.map((category) => (
              <WikiCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        <section className="grid gap-12 border-t border-white/8 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div>
              <p className="portal-kicker text-cyan-300/78">
                {query ? "SEARCH RESULTS" : "LATEST ARTICLES"}
              </p>
              <h2 className="portal-heading mt-3 text-3xl">
                {query ? `Results for "${query}"` : "Recently updated guides"}
              </h2>
            </div>

            {data.recentArticles.length > 0 ? (
              <div className="grid gap-5">
                {data.recentArticles.map((article) => (
                  <WikiArticleCard key={article.id} article={article} compact />
                ))}
              </div>
            ) : (
              <div className="portal-panel-soft p-8 text-center">
                <p className="text-lg font-medium text-white">No wiki articles match this search.</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Try broader keywords, or browse one of the categories above to keep exploring.
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div>
              <p className="portal-kicker text-cyan-300/78">REVIEW QUEUE</p>
              <h2 className="portal-heading mt-3 text-3xl">Freshly reviewed</h2>
            </div>

            <div className="portal-panel-soft divide-y divide-white/8">
              {data.recentUpdates.map((article) => (
                <Link
                  key={article.id}
                  href={`/wiki/${article.slug}`}
                  className="flex items-start justify-between gap-4 px-5 py-5 transition-colors hover:bg-white/[0.03]"
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                      {article.category.name}
                    </p>
                    <p className="mt-2 text-lg font-medium text-white">{article.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{article.excerpt}</p>
                  </div>

                  <div className="pt-1 text-right text-xs uppercase tracking-[0.18em] text-slate-500">
                    {new Intl.DateTimeFormat("en-US", {
                      day: "2-digit",
                      month: "short",
                    }).format(new Date(article.updatedAt))}
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
