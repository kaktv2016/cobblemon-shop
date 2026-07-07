import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/store/products — Public product listing */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const type = searchParams.get("type") || undefined;
  const featured = searchParams.get("featured") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    visibility: "PUBLIC",
  };

  if (category) {
    where.category = { slug: category };
  }
  if (type) where.productType = type;
  if (featured === "true") where.isFeatured = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
    ];
  }

  // Check date availability
  const now = new Date();
  where.AND = [
    { OR: [{ startDate: null }, { startDate: { lte: now } }] },
    { OR: [{ endDate: null }, { endDate: { gte: now } }] },
  ];

  let orderBy: any;
  switch (sort) {
    case "price-asc": orderBy = { price: "asc" }; break;
    case "price-desc": orderBy = { price: "desc" }; break;
    case "name": orderBy = { name: "asc" }; break;
    case "popular": orderBy = { stockSold: "desc" }; break;
    default: orderBy = { createdAt: "desc" };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        imageUrl: true,
        price: true,
        compareAtPrice: true,
        productType: true,
        isFeatured: true,
        stockLimit: true,
        stockSold: true,
        startDate: true,
        endDate: true,
        category: { select: { name: true, slug: true } },
      },
      skip,
      take: limit,
      orderBy,
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
