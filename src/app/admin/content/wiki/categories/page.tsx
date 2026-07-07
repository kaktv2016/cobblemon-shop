import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin/auth";
import { WikiCategoriesManager } from "@/components/admin/wiki-categories-manager";

export const metadata = {
  title: "Wiki Categories - Admin",
  description: "Manage wiki categories",
};

export default async function WikiCategoriesPage() {
  await requireAdminSession();

  const categories = await prisma.wikiCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  const initialCategories = categories.map((category) => ({
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Wiki Categories</h1>
        <p className="mt-1 text-slate-400">
          Define the topic structure players use to browse the wiki.
        </p>
      </div>

      <WikiCategoriesManager initialCategories={initialCategories} />
    </div>
  );
}
