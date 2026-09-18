import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "Edit Category - Admin", description: "Edit a category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id }, select: { id: true, name: true, slug: true, description: true, sortOrder: true, isActive: true },
  });
  if (!category) notFound();
  return <div className="space-y-6"><div><h1 className="admin-heading text-3xl font-bold">Edit Category</h1><p className="admin-muted mt-1">Update category information</p></div><CategoryForm initialData={{ ...category, description: category.description || "" }} isEditMode categoryId={id} /></div>;
}
