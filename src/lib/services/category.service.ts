import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

/**
 * Validation schema for category creation
 */
const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Validation schema for category updates
 */
const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/**
 * CategoryService handles all category-related business logic
 */
export class CategoryService {
  /**
   * List all categories
   */
  static async listCategories(includeInactive: boolean = false) {
    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return categories;
  }

  /**
   * Get category by slug with product count
   */
  static async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return category;
  }

  /**
   * Get category by ID with product count
   */
  static async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return category;
  }

  /**
   * Create a new category
   */
  static async createCategory(data: CreateCategoryInput) {
    // Validate input
    const validated = createCategorySchema.parse(data);

    // Check if slug is unique
    const existing = await prisma.category.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      throw new Error(`Category with slug "${validated.slug}" already exists`);
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        imageUrl: validated.imageUrl,
        isActive: validated.isActive,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return category;
  }

  /**
   * Update a category
   */
  static async updateCategory(id: string, data: UpdateCategoryInput) {
    // Validate input
    const validated = updateCategorySchema.parse(data);

    // Check category exists
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new Error(`Category with ID "${id}" not found`);
    }

    // If slug is being updated, check uniqueness
    if (validated.slug && validated.slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: validated.slug },
      });
      if (existing) {
        throw new Error(`Category with slug "${validated.slug}" already exists`);
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        imageUrl: validated.imageUrl,
        isActive: validated.isActive,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a category (only if it has no products)
   */
  static async deleteCategory(id: string) {
    // Check category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new Error(`Category with ID "${id}" not found`);
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new Error(
        `Cannot delete category with ${category._count.products} products. Move or delete products first.`
      );
    }

    const deleted = await prisma.category.delete({
      where: { id },
    });

    return deleted;
  }
}
