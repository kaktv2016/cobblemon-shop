import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function normalizeTagList(tags: unknown) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
}

function normalizeBundleItems(bundleItems: unknown) {
  if (!Array.isArray(bundleItems)) {
    return [];
  }

  return bundleItems
    .map((item) => ({
      productId: String(item?.productId || "").trim(),
      quantity: Number(item?.quantity || 0),
    }))
    .filter((item) => item.productId && item.quantity > 0);
}

/** GET /api/admin/products — List products with filters */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const type = searchParams.get("type") || "";
  const visibility = searchParams.get("visibility") || "";

  const skip = (page - 1) * limit;
  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
    ];
  }
  if (category) where.categoryId = category;
  if (type) where.productType = type as any;
  if (visibility) where.visibility = visibility as any;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        deliveryTemplate: { select: { id: true, name: true } },
        _count: { select: { orderItems: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

/** POST /api/admin/products — Create product */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const tags = normalizeTagList(body.tags);
    const bundleItems = normalizeBundleItems(body.bundleItems);

    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          name: body.name,
          slug: body.slug,
          shortDescription: body.shortDescription || null,
          fullDescription: body.fullDescription || null,
          imageUrl: body.imageUrl || null,
          bannerUrl: body.bannerUrl || null,
          categoryId: body.categoryId,
          price: body.price,
          compareAtPrice: body.compareAtPrice || null,
          productType: body.productType,
          isFeatured: body.isFeatured || false,
          isActive: body.isActive ?? true,
          visibility: body.visibility || "DRAFT",
          stockLimit: body.stockLimit || null,
          purchaseLimit: body.purchaseLimit || null,
          cooldownMinutes: body.cooldownMinutes || null,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          deliveryTemplateId: body.deliveryTemplateId || null,
          metadata: body.metadata || null,
          sortOrder: body.sortOrder || 0,
        },
      });

      if (tags.length > 0) {
        await tx.productTag.createMany({
          data: tags.map((tag) => ({
            productId: createdProduct.id,
            tag,
          })),
        });
      }

      if (body.productType === "BUNDLE" && bundleItems.length > 0) {
        await tx.bundleItem.createMany({
          data: bundleItems.map((item) => ({
            bundleId: createdProduct.id,
            itemId: item.productId,
            quantity: item.quantity,
          })),
        });
      }

      return createdProduct;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_PRODUCT",
        target: "product",
        targetId: product.id,
        details: { name: product.name },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 400 });
  }
}
