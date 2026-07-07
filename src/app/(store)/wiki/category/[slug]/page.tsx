import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BookMarked, Search } from "lucide-react";
import {
  WikiArticleCard,
  WikiFeaturedHeroCard,
} from "@/components/wiki/wiki-cards";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiSearchForm } from "@/components/wiki/wiki-search-form";
import {
  getAllPublicWikiCategorySlugs,
  getPublicWikiCategoryData,
} from "@/lib/public-wiki-cache";
import { getWikiCategoryTheme } from "@/lib/wiki";

export const revalidate = 120;

type WikiCategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
};

export async function generateStaticParams() {
  const categories = await getAllPublicWikiCategorySlugs();
  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: Pick<WikiCategoryPageProps, "params">) {
  const { slug } = await params;
  const data = await getPublicWikiCategoryData(slug);

  if (!data) {
    return {
      title: "Wiki category",
    };
  }

  return {
    title: `${data.category.name} Wiki`,
    description:
      data.category.description ||
      `Browse ${data.category.name} articles in the Cobblemon Divided wiki.`,
    alternates: {
      canonical: `/wiki/category/${data.category.slug}`,
    },
  };
}

export default async function WikiCategoryPage({
  params,
  searchParams,
}: WikiCategoryPageProps) {
  const { slug } = await params;
  const query = (await searchParams).q?.trim() ?? "";
  const data = await getPublicWikiCategoryData(slug, query);

  if (!data) {
    notFound();
  }

  const theme = getWikiCategoryTheme(data.category.slug);
  const leadArticle = data.articles[0] || null;

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <WikiBreadcrumbs
          items={[
            { label: "Wiki", href: "/wiki" },
            { label: data.category.name },
          ]}
        />

        <section className="portal-panel overflow-visible px-6 py-8 sm:px-10 sm:py-10">
          <div className="absolute inset-0 opacity-95" style={{ backgroundImage: theme.glow }} />

          <div className="relative grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-200/80">
                <BookMarked className="h-3.5 w-3.5" />
                Category // {data.category.slug}
              </div>

              <div>
                <h1 className="portal-heading text-4xl sm:text-5xl">
                  {data.category.name}
                </h1>
                <p className="portal-copy mt-5 max-w-2xl text-sm leading-7 sm:text-base">
                  {data.category.description ||
                    "Structured knowledge for this part of the Cobblemon Divided world."}
                </p>
              </div>

              <WikiSearchForm
                action={`/wiki/category/${data.category.slug}`}
                query={query}
                placeholder={`Search inside ${data.category.name}`}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="portal-panel-soft p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Search state
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {query ? `Showing matches for "${query}"` : "Browsing full category"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Search checks article titles, excerpts, keywords, slugs, and markdown content.
                  </p>
                </div>

                <div className="portal-panel-soft p-5">
                  <Search className="h-5 w-5 text-cyan-200" />
                  <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Articles visible
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {data.articles.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Curated pages available in this lane right now.
                  </p>
                </div>
              </div>
            </div>

            <div>
              {leadArticle ? (
                <WikiFeaturedHeroCard article={leadArticle} />
              ) : (
                <div
                  className="portal-panel-soft flex min-h-[24rem] flex-col justify-end p-6 sm:p-8"
                  style={{ backgroundImage: theme.surface }}
                >
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300/70">
                    Category preview
                  </p>
                  <h2 className="portal-heading mt-4 text-3xl">No articles published yet</h2>
                  <p className="portal-copy mt-4 max-w-md text-sm leading-7">
                    Publish your first article in this category from the admin panel and it will surface here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6 border-t border-white/8 pt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="portal-kicker text-cyan-300/78">
                {query ? "FILTERED ARTICLES" : "CATEGORY ARTICLES"}
              </p>
              <h2 className="portal-heading mt-3 text-3xl">
                {data.articles.length} article{data.articles.length === 1 ? "" : "s"}
              </h2>
            </div>

            <Link
              href="/wiki"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-slate-300 transition-colors hover:text-white"
            >
              All categories
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {data.articles.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {data.articles.map((article) => (
                <WikiArticleCard key={article.id} article={article} compact />
              ))}
            </div>
          ) : (
            <div className="portal-panel-soft p-8 text-center">
              <p className="text-lg font-medium text-white">No articles found in this category.</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Try a different search, or return to the full wiki overview to explore other sections.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
