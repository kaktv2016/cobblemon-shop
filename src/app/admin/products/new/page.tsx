import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Create Product - Admin",
  description: "Create a new product",
};

export default async function CreateProductPage() {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Create Product</h1>
        <p className="mt-1 text-slate-400">Add a new product to your shop</p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
