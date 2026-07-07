import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";

interface ProductEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Product - Admin",
  description: "Edit a product",
};

export default async function EditProductPage({ params }: ProductEditPageProps) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        tags: true,
        bundleItems: {
          select: {
            itemId: true,
            quantity: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!product) {
    notFound();
  }

  const initialData = {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription || "",
    description: product.fullDescription || "",
    categoryId: product.categoryId,
    type: product.productType,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
    imageUrl: product.imageUrl || "",
    bannerUrl: product.bannerUrl || "",
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    visibility: product.visibility,
    stockLimit: product.stockLimit ?? undefined,
    purchaseLimit: product.purchaseLimit ?? undefined,
    cooldownMinutes: product.cooldownMinutes ?? undefined,
    startDate: product.startDate ? new Date(product.startDate).toISOString().slice(0, 16) : "",
    endDate: product.endDate ? new Date(product.endDate).toISOString().slice(0, 16) : "",
    deliveryTemplateId: product.deliveryTemplateId || "",
    tags: product.tags.map((tag) => tag.tag),
    bundleItems: product.bundleItems.map((item) => ({
      productId: item.itemId,
      quantity: item.quantity,
    })),
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Product</h1>
        <p className="mt-1 text-slate-400">Update product information</p>
      </div>

      <ProductForm
        categories={categories}
        initialData={initialData}
        isEditMode={true}
        productId={id}
      />
    </div>
  );
}
