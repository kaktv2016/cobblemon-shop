import { prisma } from "@/lib/prisma";
import { ProductType, ProductVisibility, Prisma } from "@prisma/client";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  shortDescription: z.string().max(500).optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  categoryId: z.string(),
  productType: z.nativeEnum(ProductType),
  price: z.union([z.string(), z.number()]).refine((val) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return num >= 0;
  }, "Price must be non-negative"),
  compareAtPrice: z.union([z.string(), z.number()]).optional().nullable(),
  stockLimit: z.number().int().min(0).optional().nullable(),
  purchaseLimit: z.number().int().min(0).optional().nullable(),
  cooldownMinutes: z.number().int().min(0).optional().nullable(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  visibility: z.nativeEnum(ProductVisibility).default("PUBLIC"),
  imageUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  deliveryTemplateId: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  sortOrder: z.number().int().default(0),
  tags: z.array(z.string()).optional(),
});

const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export class ProductService {
  static async listProducts(
    filters: {
      categorySlug?: string;
      search?: string;
      productType?: ProductType;
      isFeatured?: boolean;
      isActive?: boolean;
      visibility?: ProductVisibility;
    } = {},
    page: number = 1,
    limit: number = 20,
    sort: string = "createdAt:desc"
  ) {
    const skip = (page - 1) * limit;
    const [sortField, sortOrder] = sort.split(":") as [string, "asc" | "desc"];

    const where: Prisma.ProductWhereInput = {
      isActive: filters.isActive !== undefined ? filters.isActive : true,
    };

    if (filters.visibility) where.visibility = filters.visibility;
    if (filters.productType) where.productType = filters.productType;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters.categorySlug) where.category = { slug: filters.categorySlug };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { shortDescription: { contains: filters.search } },
        { fullDescription: { contains: filters.search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, tags: true },
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    return { data: products, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async getProductBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: { category: true, tags: true, deliveryTemplate: true },
    });
  }

  static async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true, tags: true, deliveryTemplate: true },
    });
  }

  static async createProduct(data: CreateProductInput) {
    const v = createProductSchema.parse(data);

    const existing = await prisma.product.findUnique({ where: { slug: v.slug } });
    if (existing) throw new Error(`Slug "${v.slug}" already exists`);

    const category = await prisma.category.findUnique({ where: { id: v.categoryId } });
    if (!category) throw new Error(`Category "${v.categoryId}" not found`);

    const price = new Prisma.Decimal(String(v.price));
    const compareAtPrice = v.compareAtPrice != null ? new Prisma.Decimal(String(v.compareAtPrice)) : null;

    return prisma.product.create({
      data: {
        name: v.name,
        slug: v.slug,
        shortDescription: v.shortDescription ?? null,
        fullDescription: v.fullDescription ?? null,
        categoryId: v.categoryId,
        productType: v.productType,
        price,
        compareAtPrice,
        stockLimit: v.stockLimit ?? null,
        purchaseLimit: v.purchaseLimit ?? null,
        cooldownMinutes: v.cooldownMinutes ?? null,
        isFeatured: v.isFeatured,
        isActive: v.isActive,
        visibility: v.visibility,
        imageUrl: v.imageUrl ?? null,
        bannerUrl: v.bannerUrl ?? null,
        deliveryTemplateId: v.deliveryTemplateId ?? null,
        startDate: v.startDate ?? null,
        endDate: v.endDate ?? null,
        metadata: v.metadata ?? Prisma.JsonNull,
        sortOrder: v.sortOrder,
      },
      include: { category: true, tags: true, deliveryTemplate: true },
    });
  }

  static async updateProduct(id: string, data: UpdateProductInput) {
    const v = updateProductSchema.parse(data);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error(`Product "${id}" not found`);

    if (v.slug && v.slug !== product.slug) {
      const dup = await prisma.product.findUnique({ where: { slug: v.slug } });
      if (dup) throw new Error(`Slug "${v.slug}" taken`);
    }

    if (v.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: v.categoryId } });
      if (!cat) throw new Error(`Category "${v.categoryId}" not found`);
    }

    const updateData: Prisma.ProductUpdateInput = {};
    if (v.name !== undefined) updateData.name = v.name;
    if (v.slug !== undefined) updateData.slug = v.slug;
    if (v.shortDescription !== undefined) updateData.shortDescription = v.shortDescription;
    if (v.fullDescription !== undefined) updateData.fullDescription = v.fullDescription;
    if (v.categoryId !== undefined) updateData.category = { connect: { id: v.categoryId } };
    if (v.productType !== undefined) updateData.productType = v.productType;
    if (v.isFeatured !== undefined) updateData.isFeatured = v.isFeatured;
    if (v.isActive !== undefined) updateData.isActive = v.isActive;
    if (v.visibility !== undefined) updateData.visibility = v.visibility;
    if (v.imageUrl !== undefined) updateData.imageUrl = v.imageUrl;
    if (v.bannerUrl !== undefined) updateData.bannerUrl = v.bannerUrl;
    if (v.deliveryTemplateId !== undefined) updateData.deliveryTemplate = v.deliveryTemplateId
      ? { connect: { id: v.deliveryTemplateId } }
      : { disconnect: true };
    if (v.stockLimit !== undefined) updateData.stockLimit = v.stockLimit;
    if (v.purchaseLimit !== undefined) updateData.purchaseLimit = v.purchaseLimit;
    if (v.cooldownMinutes !== undefined) updateData.cooldownMinutes = v.cooldownMinutes;
    if (v.startDate !== undefined) updateData.startDate = v.startDate;
    if (v.endDate !== undefined) updateData.endDate = v.endDate;
    if (v.sortOrder !== undefined) updateData.sortOrder = v.sortOrder;
    if (v.metadata !== undefined) updateData.metadata = v.metadata ?? Prisma.JsonNull;

    if (v.price !== undefined) {
      updateData.price = new Prisma.Decimal(String(v.price));
    }
    if (v.compareAtPrice !== undefined) {
      updateData.compareAtPrice = v.compareAtPrice != null
        ? new Prisma.Decimal(String(v.compareAtPrice))
        : null;
    }

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, tags: true, deliveryTemplate: true },
    });
  }

  static async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error(`Product "${id}" not found`);

    return prisma.product.update({
      where: { id },
      data: { isActive: false, visibility: "HIDDEN" },
      include: { category: true, tags: true },
    });
  }

  static async getFeaturedProducts(limit: number = 10) {
    return prisma.product.findMany({
      where: { isFeatured: true, isActive: true, visibility: "PUBLIC" },
      include: { category: true, tags: true },
      take: limit,
      orderBy: { sortOrder: "asc" },
    });
  }

  static async getProductsByCategory(categorySlug: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = {
      category: { slug: categorySlug },
      isActive: true,
      visibility: "PUBLIC" as const,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, tags: true },
        skip,
        take: limit,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    return { data: products, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async checkProductAvailability(productId: string, quantity: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { available: false, reason: "Product not found" };
    if (!product.isActive) return { available: false, reason: "Product is inactive" };
    if (product.visibility !== "PUBLIC") return { available: false, reason: "Product not available" };

    if (product.stockLimit !== null) {
      const remaining = product.stockLimit - product.stockSold;
      if (remaining < quantity) {
        return { available: false, reason: `Only ${remaining} remaining` };
      }
    }

    return { available: true };
  }
}
