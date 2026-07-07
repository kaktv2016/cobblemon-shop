import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/store/products/[slug] — Public product detail */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      fullDescription: true,
      imageUrl: true,
      bannerUrl: true,
      price: true,
      compareAtPrice: true,
      productType: true,
      isFeatured: true,
      isActive: true,
      visibility: true,
      stockLimit: true,
      stockSold: true,
      purchaseLimit: true,
      startDate: true,
      endDate: true,
      metadata: true,
      category: { select: { id: true, name: true, slug: true } },
      tags: { select: { tag: true } },
      bundleItems: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              imageUrl: true,
              productType: true,
            },
          },
        },
      },
    },
  });

  if (!product || !product.isActive || product.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Check date availability
  const now = new Date();
  if (product.startDate && product.startDate > now) {
    return NextResponse.json({ error: "Product not yet available" }, { status: 404 });
  }
  if (product.endDate && product.endDate < now) {
    return NextResponse.json({ error: "Product no longer available" }, { status: 404 });
  }

  // Related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.category.id,
      id: { not: product.id },
      isActive: true,
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      imageUrl: true,
      productType: true,
      category: { select: { slug: true } },
    },
    take: 4,
  });

  return NextResponse.json({
    ...product,
    relatedProducts,
    available: product.stockLimit !== null
      ? product.stockLimit - product.stockSold
      : null,
  });
}
