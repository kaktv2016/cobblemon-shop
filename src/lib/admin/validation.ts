import { z } from "zod";

const imageReferenceSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) {
      return true;
    }

    if (value.startsWith("/")) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Invalid image URL or local path");

export const ProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  shortDescription: z.string().max(255).optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  type: z.enum([
    "RANK",
    "SUBSCRIPTION",
    "CURRENCY",
    "COSMETIC",
    "CRATE_KEY",
    "BUNDLE",
    "PERK",
    "BATTLE_PASS",
    "LIMITED_OFFER",
    "FREE_REWARD",
  ]),
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0).optional().nullable(),
  imageUrl: imageReferenceSchema,
  bannerUrl: imageReferenceSchema.optional().or(z.literal("")),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  visibility: z.enum(["PUBLIC", "HIDDEN", "DRAFT"]),
  stockLimit: z.number().min(0).optional().nullable(),
  purchaseLimit: z.number().min(0).optional().nullable(),
  cooldownMinutes: z.number().min(0).optional().nullable(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  deliveryTemplateId: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()),
  metadata: z.record(z.any()).optional(),
  bundleItems: z
    .array(z.object({ productId: z.string(), quantity: z.number().min(1) }))
    .optional(),
});

export const CategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string(),
  sortOrder: z.number().min(0).optional(),
  isActive: z.boolean(),
});

export const WikiCategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().max(4000).optional().or(z.literal("")),
  icon: z.string().max(100).optional().or(z.literal("")),
  sortOrder: z.number().min(0).optional(),
  isVisible: z.boolean(),
});

export const WikiArticleFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().min(1, "Excerpt is required").max(500),
  content: z.string().min(1, "Markdown content is required"),
  coverImage: imageReferenceSchema.optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  isFeatured: z.boolean(),
  status: z.enum(["DRAFT", "PUBLISHED", "OUTDATED"]),
  sortOrder: z.number().min(0).optional(),
  seoTitle: z.string().max(255).optional().or(z.literal("")),
  seoDescription: z.string().max(500).optional().or(z.literal("")),
  gameVersion: z.string().max(100).optional().or(z.literal("")),
  lastReviewedAt: z.string().optional().or(z.literal("")),
  searchKeywords: z.string().max(2000).optional().or(z.literal("")),
});

export const CouponFormSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50).toUpperCase(),
  description: z.string(),
  type: z.enum(["fixed", "percentage"]),
  value: z.number().min(0.01, "Value must be greater than 0"),
  maxUses: z.number().min(1, "Max uses must be at least 1"),
  perUserLimit: z.number().min(1, "Per-user limit must be at least 1"),
  minCartValue: z.number().min(0, "Min cart value must be non-negative"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
  applicableProductIds: z.array(z.string()).optional(),
  applicableCategoryIds: z.array(z.string()).optional(),
});

export const AnnouncementFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["banner", "popup", "inline"]),
  isActive: z.boolean(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

export const DeliveryTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  command: z.string().min(1, "Command template is required"),
});

export const SettingsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  shopDescription: z.string(),
  currency: z.string().length(3, "Currency must be 3 characters"),
  deliveryMode: z.enum(["dry-run", "webhook", "rcon"]),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
});

export type ProductFormSchemaType = z.infer<typeof ProductFormSchema>;
export type CategoryFormSchemaType = z.infer<typeof CategoryFormSchema>;
export type WikiCategoryFormSchemaType = z.infer<typeof WikiCategoryFormSchema>;
export type WikiArticleFormSchemaType = z.infer<typeof WikiArticleFormSchema>;
export type CouponFormSchemaType = z.infer<typeof CouponFormSchema>;
export type AnnouncementFormSchemaType = z.infer<typeof AnnouncementFormSchema>;
export type DeliveryTemplateSchemaType = z.infer<typeof DeliveryTemplateSchema>;
export type SettingsSchemaType = z.infer<typeof SettingsSchema>;
