import { CategoryForm } from "@/components/admin/category-form";

export const metadata = {
  title: "Create Category - Admin",
  description: "Create a new category",
};

export default function CreateCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-heading text-3xl font-bold">Create Category</h1>
        <p className="admin-muted mt-1">Add a new product category</p>
      </div>

      <CategoryForm />
    </div>
  );
}
