import { z } from "zod";
import { ProductType } from "@prisma/client";

/**
 * Create product schema
 */
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(256, "Product name must be at most 256 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .max(128, "Slug must be at most 128 characters")
    .optional(),
  price: z
    .number()
    .int("Price must be a whole number (cents)")
    .min(0, "Price cannot be negative"),
  type: z.nativeEnum(ProductType),
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .nullable(),
  deliveryTemplateId: z
    .string()
    .min(1, "Delivery template is required"),
  metadata: z.record(z.any()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Update product schema (all fields optional)
 */
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(256, "Product name must be at most 256 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .max(128, "Slug must be at most 128 characters")
    .optional(),
  price: z
    .number()
    .int("Price must be a whole number (cents)")
    .min(0, "Price cannot be negative")
    .optional(),
  type: z
    .nativeEnum(ProductType)
    .optional(),
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .nullable()
    .optional(),
  deliveryTemplateId: z
    .string()
    .min(1, "Delivery template is required")
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
