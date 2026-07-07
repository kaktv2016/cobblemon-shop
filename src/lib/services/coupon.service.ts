import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(["FIXED", "PERCENTAGE"]),
  discountValue: z.coerce.number().positive("Discount value must be positive"),
  minCartValue: z.coerce.number().positive().optional().nullable(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().default(1),
  applicableProductIds: z.array(z.string()).optional(),
  applicableCategoryIds: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateCouponSchema = createCouponSchema.partial();

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

export interface ValidateCouponResult {
  valid: boolean;
  reason?: string;
  discountAmount: Prisma.Decimal;
}

/**
 * CouponService handles all coupon-related business logic
 */
export class CouponService {
  /**
   * Validate a coupon code with comprehensive checks
   */
  static async validateCoupon(
    code: string,
    cartItems: Array<{ productId: string; quantity: number }>,
    userId: string
  ): Promise<ValidateCouponResult> {
    const upperCode = code.toUpperCase();
    const zero = new Prisma.Decimal(0);

    const coupon = await prisma.coupon.findUnique({
      where: { code: upperCode },
      include: {
        applicableProducts: { select: { productId: true } },
        applicableCategories: { select: { categoryId: true } },
      },
    });

    if (!coupon) {
      return { valid: false, reason: "Coupon code not found", discountAmount: zero };
    }

    if (!coupon.isActive) {
      return { valid: false, reason: "Coupon code is inactive", discountAmount: zero };
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return { valid: false, reason: "Coupon is not yet valid", discountAmount: zero };
    }
    if (coupon.endDate && coupon.endDate < now) {
      return { valid: false, reason: "Coupon has expired", discountAmount: zero };
    }

    // Check total usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, reason: "Coupon usage limit reached", discountAmount: zero };
    }

    // Check per-user usage limit
    if (coupon.perUserLimit > 0) {
      const userUsageCount = await prisma.order.count({
        where: {
          userId,
          couponCode: upperCode,
          status: { in: ["PAID", "DELIVERED", "QUEUED_DELIVERY"] },
        },
      });

      if (userUsageCount >= coupon.perUserLimit) {
        return { valid: false, reason: "You have reached the maximum uses for this coupon", discountAmount: zero };
      }
    }

    // Fetch products for applicability check
    const productIds = cartItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, categoryId: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate applicable subtotal
    const applicableProductIds = coupon.applicableProducts.map((p) => p.productId);
    const applicableCategoryIds = coupon.applicableCategories.map((c) => c.categoryId);
    const hasProductRestrictions = applicableProductIds.length > 0;
    const hasCategoryRestrictions = applicableCategoryIds.length > 0;

    let applicableSubtotal = new Prisma.Decimal(0);
    let hasApplicableItems = false;

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      let isApplicable = true;
      if (hasProductRestrictions || hasCategoryRestrictions) {
        isApplicable = false;
        if (hasProductRestrictions && applicableProductIds.includes(item.productId)) {
          isApplicable = true;
        }
        if (hasCategoryRestrictions && applicableCategoryIds.includes(product.categoryId)) {
          isApplicable = true;
        }
      }

      if (isApplicable) {
        hasApplicableItems = true;
        applicableSubtotal = applicableSubtotal.plus(
          new Prisma.Decimal(product.price).times(item.quantity)
        );
      }
    }

    if ((hasProductRestrictions || hasCategoryRestrictions) && !hasApplicableItems) {
      return { valid: false, reason: "Coupon does not apply to items in your cart", discountAmount: zero };
    }

    // Check minimum cart value
    if (coupon.minCartValue && applicableSubtotal.lessThan(coupon.minCartValue)) {
      return {
        valid: false,
        reason: `Minimum cart value of ${coupon.minCartValue} not met`,
        discountAmount: zero,
      };
    }

    // Calculate discount
    let discountAmount: Prisma.Decimal;
    if (coupon.discountType === "FIXED") {
      discountAmount = new Prisma.Decimal(coupon.discountValue);
      if (discountAmount.greaterThan(applicableSubtotal)) {
        discountAmount = applicableSubtotal;
      }
    } else {
      const pct = new Prisma.Decimal(coupon.discountValue).dividedBy(100);
      discountAmount = applicableSubtotal.times(pct).toDecimalPlaces(2);
    }

    return { valid: true, discountAmount: discountAmount.toDecimalPlaces(2) };
  }

  /**
   * Create a new coupon
   */
  static async createCoupon(data: CreateCouponInput) {
    const validated = createCouponSchema.parse(data);

    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code },
    });
    if (existing) {
      throw new Error(`Coupon with code "${validated.code}" already exists`);
    }

    return await prisma.coupon.create({
      data: {
        code: validated.code,
        description: validated.description,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        minCartValue: validated.minCartValue ?? null,
        maxUses: validated.maxUses ?? null,
        perUserLimit: validated.perUserLimit,
        startDate: validated.startDate ?? null,
        endDate: validated.endDate ?? null,
        isActive: validated.isActive,
        applicableProducts: validated.applicableProductIds?.length
          ? { create: validated.applicableProductIds.map((pid) => ({ productId: pid })) }
          : undefined,
        applicableCategories: validated.applicableCategoryIds?.length
          ? { create: validated.applicableCategoryIds.map((cid) => ({ categoryId: cid })) }
          : undefined,
      },
      include: {
        applicableProducts: true,
        applicableCategories: true,
      },
    });
  }

  /**
   * Update a coupon
   */
  static async updateCoupon(id: string, data: UpdateCouponInput) {
    const validated = updateCouponSchema.parse(data);

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new Error(`Coupon "${id}" not found`);

    if (validated.code && validated.code !== coupon.code) {
      const existing = await prisma.coupon.findUnique({ where: { code: validated.code } });
      if (existing) throw new Error(`Coupon "${validated.code}" already exists`);
    }

    const updateData: any = {};
    if (validated.code !== undefined) updateData.code = validated.code;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.discountType !== undefined) updateData.discountType = validated.discountType;
    if (validated.discountValue !== undefined) updateData.discountValue = validated.discountValue;
    if (validated.minCartValue !== undefined) updateData.minCartValue = validated.minCartValue;
    if (validated.maxUses !== undefined) updateData.maxUses = validated.maxUses;
    if (validated.perUserLimit !== undefined) updateData.perUserLimit = validated.perUserLimit;
    if (validated.startDate !== undefined) updateData.startDate = validated.startDate;
    if (validated.endDate !== undefined) updateData.endDate = validated.endDate;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    return await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        applicableProducts: true,
        applicableCategories: true,
      },
    });
  }

  /**
   * Delete a coupon
   */
  static async deleteCoupon(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new Error(`Coupon "${id}" not found`);
    return await prisma.coupon.delete({ where: { id } });
  }

  /**
   * List coupons with pagination
   */
  static async listCoupons(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        include: {
          applicableProducts: true,
          applicableCategories: true,
          _count: { select: { orders: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.coupon.count(),
    ]);
    return { data: coupons, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Get coupon by ID
   */
  static async getCouponById(id: string) {
    return await prisma.coupon.findUnique({
      where: { id },
      include: {
        applicableProducts: true,
        applicableCategories: true,
      },
    });
  }
}
