import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin/auth";
import { WikiArticleForm } from "@/components/admin/wiki-article-form";

type EditWikiArticlePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Edit Wiki Article - Admin",
  description: "Edit an existing wiki article",
};

export default async function EditWikiArticlePage({
  params,
}: EditWikiArticlePageProps) {
  await requireAdminSession();

  const { id } = await params;

  const [categories, article] = await Promise.all([
    prisma.wikiCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.wikiArticle.findUnique({
      where: { id },
    }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Wiki Article</h1>
        <p className="mt-1 text-slate-400">
          Update the content, metadata, and publishing state for this guide.
        </p>
      </div>

      <WikiArticleForm
        categories={categories}
        articleId={article.id}
        isEditMode
        initialData={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage || "",
          categoryId: article.categoryId,
          isFeatured: article.isFeatured,
          status: article.status,
          sortOrder: article.sortOrder,
          seoTitle: article.seoTitle || "",
          seoDescription: article.seoDescription || "",
          gameVersion: article.gameVersion || "",
          lastReviewedAt: article.lastReviewedAt
            ? article.lastReviewedAt.toISOString().slice(0, 10)
            : "",
          searchKeywords: article.searchKeywords || "",
        }}
      />
    </div>
  );
}
