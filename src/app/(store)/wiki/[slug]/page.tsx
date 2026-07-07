import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, RefreshCcw, Sparkles } from "lucide-react";
import { WikiArticleCard } from "@/components/wiki/wiki-cards";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiMarkdown, extractMarkdownHeadings } from "@/components/wiki/wiki-markdown";
import {
  getAllPublicWikiArticleSlugs,
  getPublicWikiArticleData,
} from "@/lib/public-wiki-cache";
import {
  getWikiCategoryTheme,
  getWikiStatusMeta,
  parseSearchKeywords,
} from "@/lib/wiki";

export const revalidate = 120;

type WikiArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const articles = await getAllPublicWikiArticleSlugs();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: WikiArticlePageProps) {
  const { slug } = await params;
  const data = await getPublicWikiArticleData(slug);

  if (!data) {
    return {
      title: "Wiki article",
    };
  }

  return {
    title: data.article.seoTitle || data.article.title,
    description: data.article.seoDescription || data.article.excerpt,
    alternates: {
      canonical: `/wiki/${data.article.slug}`,
    },
  };
}

function formatWikiDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function WikiArticlePage({ params }: WikiArticlePageProps) {
  const { slug } = await params;
  const data = await getPublicWikiArticleData(slug);

  if (!data) {
    notFound();
  }

  const { article, relatedArticles } = data;
  const headings = extractMarkdownHeadings(article.content);
  const status = getWikiStatusMeta(article.status);
  const keywords = parseSearchKeywords(article.searchKeywords);
  const theme = getWikiCategoryTheme(article.category.slug);

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <WikiBreadcrumbs
          items={[
            { label: "Wiki", href: "/wiki" },
            { label: article.category.name, href: `/wiki/category/${article.category.slug}` },
            { label: article.title },
          ]}
        />

        <section className="portal-panel overflow-visible px-6 py-8 sm:px-10 sm:py-10">
          <div className="absolute inset-0 opacity-95" style={{ backgroundImage: theme.glow }} />

          <div className="relative grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/wiki/category/${article.category.slug}`}
                  className="portal-chip px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-cyan-100"
                >
                  {article.category.name}
                </Link>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${status.tone}`}>
                  {status.label}
                </span>
                {article.gameVersion ? (
                  <span className="portal-chip px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                    {article.gameVersion}
                  </span>
                ) : null}
              </div>

              <h1 className="portal-heading mt-6 text-4xl sm:text-5xl lg:text-6xl">
                {article.title}
              </h1>
              <p className="portal-copy mt-6 max-w-3xl text-sm leading-7 sm:text-lg">
                {article.excerpt}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5 text-xs uppercase tracking-[0.18em] text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  Updated {formatWikiDate(article.updatedAt)}
                </span>

                {article.lastReviewedAt ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Reviewed {formatWikiDate(article.lastReviewedAt)}
                  </span>
                ) : null}
              </div>

              {keywords.length > 0 ? (
                <div className="mt-8 flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <span key={keyword} className="portal-chip px-3 py-1.5 text-xs text-slate-200">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div
                className="portal-panel-soft relative min-h-[24rem] overflow-hidden p-0"
                style={{ backgroundImage: theme.surface }}
              >
                {article.coverImage ? (
                  <>
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,24,0.14),rgba(5,10,24,0.52)_38%,rgba(5,10,24,0.92)_72%,rgba(5,10,24,1))]" />
                  </>
                ) : null}

                <div className="absolute inset-0" style={{ backgroundImage: theme.glow }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_24%),linear-gradient(180deg,transparent,rgba(5,10,24,0.18)_52%,rgba(5,10,24,0.4))]" />

                <div className="relative flex h-full flex-col justify-end p-5 sm:p-6">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300/70">
                    Article cover
                  </p>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200/80">
                    The visual panel anchors this article to the same premium portal tone as the storefront.
                  </p>
                </div>
              </div>

              <div className="portal-panel-soft p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Article status
                </p>
                <p className="mt-2 text-xl font-semibold text-white">{status.label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{status.description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <article className="portal-panel p-6 sm:p-8 lg:p-10">
            <WikiMarkdown content={article.content} headings={headings} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {headings.length > 0 ? (
              <div className="portal-panel-soft p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/78">
                  Table of contents
                </p>
                <nav className="mt-4">
                  <ol className="space-y-2">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className={`block text-sm leading-6 text-slate-300 transition-colors hover:text-white ${
                            heading.level > 2 ? "pl-4 text-slate-400" : ""
                          }`}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            ) : null}

            <div className="portal-panel-soft p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Category
              </p>
              <p className="mt-2 text-xl font-semibold text-white">{article.category.name}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {article.category.description || "More articles connected to the same gameplay system."}
              </p>
              <Link
                href={`/wiki/category/${article.category.slug}`}
                className="mt-5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-slate-300 transition-colors hover:text-white"
              >
                Browse category
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>

        <section className="space-y-6 border-t border-white/8 pt-12">
          <div>
            <p className="portal-kicker text-cyan-300/78">RELATED ARTICLES</p>
            <h2 className="portal-heading mt-3 text-3xl">Continue exploring</h2>
          </div>

          {relatedArticles.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <WikiArticleCard key={relatedArticle.id} article={relatedArticle} compact />
              ))}
            </div>
          ) : (
            <div className="portal-panel-soft p-8 text-center">
              <p className="text-lg font-medium text-white">No related articles yet.</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Add more content in this category from the admin panel to surface related reading here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
