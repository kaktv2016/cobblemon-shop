import { CategoryForm } from "@/components/admin/category-form";

interface CategoryEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Category - Admin",
  description: "Edit a category",
};

export default async function EditCategoryPage({ params }: CategoryEditPageProps) {
  const { id } = await params;

  const mockCategory = {
    id,
    name: "Cosmetics",
    slug: "cosmetics",
    description: "All cosmetic items and skins",
    sortOrder: 1,
    isActive: true,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Category</h1>
        <p className="text-slate-400 mt-1">Update category information</p>
      </div>

      <CategoryForm
        initialData={mockCategory}
        isEditMode={true}
        categoryId={id}
      />
    </div>
  );
}
