import { z } from "zod";

/**
 * Create coupon schema
 */
export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50, "Coupon code must be at most 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Coupon code can only contain uppercase letters, numbers, underscores, and hyphens"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z
    .number()
    .positive("Discount value must be positive"),
  maxUsagePerUser: z
    .number()
    .int("Max usage per user must be a whole number")
    .min(1, "Max usage per user must be at least 1")
    .nullable(),
  maxTotalUsage: z
    .number()
    .int("Max total usage must be a whole number")
    .min(1, "Max total usage must be at least 1")
    .nullable(),
  minOrderAmount: z
    .number()
    .int("Minimum order amount must be a whole number (cents)")
    .min(0, "Minimum order amount cannot be negative")
    .nullable(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

/**
 * Update coupon schema (all fields optional)
 */
export const updateCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50, "Coupon code must be at most 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Coupon code can only contain uppercase letters, numbers, underscores, and hyphens")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  discountType: z
    .enum(["PERCENTAGE", "FIXED_AMOUNT"])
    .optional(),
  discountValue: z
    .number()
    .positive("Discount value must be positive")
    .optional(),
  maxUsagePerUser: z
    .number()
    .int("Max usage per user must be a whole number")
    .min(1, "Max usage per user must be at least 1")
    .nullable()
    .optional(),
  maxTotalUsage: z
    .number()
    .int("Max total usage must be a whole number")
    .min(1, "Max total usage must be at least 1")
    .nullable()
    .optional(),
  minOrderAmount: z
    .number()
    .int("Minimum order amount must be a whole number (cents)")
    .min(0, "Minimum order amount cannot be negative")
    .nullable()
    .optional(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

/**
 * Validate coupon schema for checkout
 */
export const validateCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required"),
  orderAmount: z
    .number()
    .int("Order amount must be a whole number (cents)")
    .min(0, "Order amount cannot be negative"),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
