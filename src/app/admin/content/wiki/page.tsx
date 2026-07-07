import Link from "next/link";
import { Plus, Shapes } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin/auth";
import { Button } from "@/components/ui/button";
import { WikiArticleActions } from "@/components/admin/wiki-article-actions";

export const metadata = {
  title: "Wiki Articles - Admin",
  description: "Manage wiki articles for Cobblemon Divided",
};

type WikiArticlesAdminPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
  }>;
};

export default async function WikiArticlesAdminPage({
  searchParams,
}: WikiArticlesAdminPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const category = params.category?.trim() ?? "";

  const [categories, articles] = await Promise.all([
    prisma.wikiCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.wikiArticle.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { title: { contains: query } },
                { slug: { contains: query } },
                { excerpt: { contains: query } },
                { searchKeywords: { contains: query } },
              ],
            }
          : {}),
        ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "OUTDATED" } : {}),
        ...(category ? { categoryId: category } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Wiki Articles</h1>
          <p className="mt-1 text-slate-400">
            Build a dedicated player knowledge base that stays separate from support content.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <Link href="/admin/content/wiki/categories">
              <Shapes className="mr-2 h-4 w-4" />
              Categories
            </Link>
          </Button>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin/content/wiki/new">
              <Plus className="mr-2 h-4 w-4" />
              New article
            </Link>
          </Button>
        </div>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-5 xl:grid-cols-[minmax(0,1fr)_14rem_14rem_auto]">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search title, slug, excerpt, or keywords"
          className="h-11 rounded-xl border border-slate-600 bg-slate-900 px-4 text-sm text-white placeholder:text-slate-500"
        />

        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-xl border border-slate-600 bg-slate-900 px-3 text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="OUTDATED">Outdated</option>
        </select>

        <select
          name="category"
          defaultValue={category}
          className="h-11 rounded-xl border border-slate-600 bg-slate-900 px-3 text-sm text-white"
        >
          <option value="">All categories</option>
          {categories.map((categoryOption) => (
            <option key={categoryOption.id} value={categoryOption.id}>
              {categoryOption.name}
            </option>
          ))}
        </select>

        <Button type="submit" className="bg-slate-700 hover:bg-slate-600">
          Filter
        </Button>
      </form>

      <div className="space-y-4">
        {articles.length > 0 ? (
          articles.map((article) => (
            <div
              key={article.id}
              className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 transition-colors hover:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-white">{article.title}</h2>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                      {article.status}
                    </span>
                    {article.isFeatured ? (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-200">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-7 text-slate-400">{article.excerpt}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span>{article.category.name}</span>
                    <span>{article.slug}</span>
                    <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <WikiArticleActions articleId={article.id} />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-lg font-medium text-white">No wiki articles found.</p>
            <p className="mt-2 text-sm text-slate-400">
              Adjust the filters or create your first guide for the wiki.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
