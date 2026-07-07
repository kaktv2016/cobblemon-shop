import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

/** GET /api/admin/products/[id] */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      deliveryTemplate: true,
      bundleItems: { include: { item: { select: { id: true, name: true, price: true } } } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

/** PUT /api/admin/products/[id] */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const tags = normalizeTagList(body.tags);
    const bundleItems = normalizeBundleItems(body.bundleItems);

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: body.name,
          slug: body.slug,
          shortDescription: body.shortDescription || null,
          fullDescription: body.fullDescription || null,
          imageUrl: body.imageUrl || null,
          bannerUrl: body.bannerUrl || null,
          categoryId: body.categoryId,
          price: body.price,
          compareAtPrice: body.compareAtPrice ?? null,
          productType: body.productType,
          isFeatured: body.isFeatured,
          isActive: body.isActive,
          visibility: body.visibility,
          stockLimit: body.stockLimit ?? null,
          purchaseLimit: body.purchaseLimit ?? null,
          cooldownMinutes: body.cooldownMinutes ?? null,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          deliveryTemplateId: body.deliveryTemplateId || null,
          metadata: body.metadata || null,
          sortOrder: body.sortOrder || 0,
        },
      });

      await tx.productTag.deleteMany({
        where: { productId: id },
      });

      if (tags.length > 0) {
        await tx.productTag.createMany({
          data: tags.map((tag) => ({
            productId: id,
            tag,
          })),
        });
      }

      await tx.bundleItem.deleteMany({
        where: { bundleId: id },
      });

      if (body.productType === "BUNDLE" && bundleItems.length > 0) {
        await tx.bundleItem.createMany({
          data: bundleItems.map((item) => ({
            bundleId: id,
            itemId: item.productId,
            quantity: item.quantity,
          })),
        });
      }

      return updatedProduct;
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE_PRODUCT",
        target: "product",
        targetId: product.id,
        details: { name: product.name },
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/** DELETE /api/admin/products/[id] */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Soft-delete: hide instead of remove to preserve order history
    await prisma.product.update({
      where: { id },
      data: { isActive: false, visibility: "HIDDEN" },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE_PRODUCT",
        target: "product",
        targetId: id,
        details: { name: product.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
