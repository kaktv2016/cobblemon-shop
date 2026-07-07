import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin/auth";
import { WikiArticleForm } from "@/components/admin/wiki-article-form";

export const metadata = {
  title: "Create Wiki Article - Admin",
  description: "Create a new wiki article",
};

export default async function CreateWikiArticlePage() {
  await requireAdminSession();

  const categories = await prisma.wikiCategory.findMany({
    where: {
      isVisible: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Create Wiki Article</h1>
        <p className="mt-1 text-slate-400">
          Add a new player guide to the Cobblemon Divided wiki.
        </p>
      </div>

      <WikiArticleForm categories={categories} />
    </div>
  );
}
