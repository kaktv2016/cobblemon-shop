import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus } from "@prisma/client";
import { CouponService } from "./coupon.service";

/**
 * Valid order status transitions — strict state machine
 */
const VALID_STATE_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELED"],
  PAID: ["QUEUED_DELIVERY", "REFUNDED"],
  QUEUED_DELIVERY: ["DELIVERED", "PARTIALLY_DELIVERED", "FAILED_DELIVERY"],
  DELIVERED: [],
  FAILED_DELIVERY: ["QUEUED_DELIVERY", "REFUNDED"],
  PARTIALLY_DELIVERED: ["DELIVERED", "FAILED_DELIVERY"],
  CANCELED: [],
  REFUNDED: [],
};

export interface CreateOrderInput {
  userId: string;
  couponCode?: string;
  playerName?: string;
  playerUuid?: string;
}

/**
 * OrderService handles all order-related business logic
 * Server-side total computation, strict state transitions
 * No tax — Thailand-based shop
 */
export class OrderService {
  /**
   * Create order from user's cart
   * Recomputes totals server-side, validates availability, applies coupon
   */
  static async createOrder(input: CreateOrderInput) {
    const { userId, couponCode, playerName, playerUuid } = input;

    // Fetch cart items with product details
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            productType: true,
            isActive: true,
            visibility: true,
            stockLimit: true,
            stockSold: true,
            deliveryTemplateId: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Validate all products and compute subtotal server-side
    let subtotal = new Prisma.Decimal(0);
    const orderItemsData: any[] = [];

    for (const item of cartItems) {
      if (!item.product) {
        throw new Error(`Product not found for cart item`);
      }

      if (!item.product.isActive || item.product.visibility !== "PUBLIC") {
        throw new Error(`Product "${item.product.name}" is no longer available`);
      }

      if (item.product.stockLimit !== null) {
        const available = item.product.stockLimit - item.product.stockSold;
        if (available < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.product.name}". Available: ${available}`
          );
        }
      }

      const unitPrice = new Prisma.Decimal(item.product.price);
      const totalPrice = unitPrice.times(item.quantity);
      subtotal = subtotal.plus(totalPrice);

      orderItemsData.push({
        productId: item.product.id,
        productName: item.product.name,
        productType: item.product.productType,
        quantity: item.quantity,
        unitPrice: unitPrice.toDecimalPlaces(2),
        totalPrice: totalPrice.toDecimalPlaces(2),
      });
    }

    // Apply coupon server-side
    let discount = new Prisma.Decimal(0);
    let couponId: string | null = null;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const couponResult = await CouponService.validateCoupon(
        couponCode,
        cartItems.map((ci) => ({ productId: ci.productId, quantity: ci.quantity })),
        userId
      );

      if (!couponResult.valid) {
        throw new Error(couponResult.reason || "Coupon is invalid");
      }

      discount = couponResult.discountAmount;
      appliedCouponCode = couponCode.toUpperCase();

      const coupon = await prisma.coupon.findUnique({
        where: { code: appliedCouponCode },
      });
      couponId = coupon?.id ?? null;
    }

    // Total = subtotal - discount (no tax)
    const total = subtotal.minus(discount).toDecimalPlaces(2);

    if (total.lessThan(0)) {
      throw new Error("Order total cannot be negative");
    }

    const orderNumber = this.generateOrderNumber();

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: "PENDING_PAYMENT",
          subtotal: subtotal.toDecimalPlaces(2),
          discount: discount.toDecimalPlaces(2),
          total,
          couponId,
          couponCode: appliedCouponCode,
          playerName: playerName || null,
          playerUuid: playerUuid || null,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // Reserve stock
      for (const item of cartItems) {
        if (item.product?.stockLimit !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockSold: { increment: item.quantity } },
          });
        }
      }

      // Increment coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return createdOrder;
    });

    return order;
  }

  /**
   * Get order by ID with full details
   */
  static async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { slug: true, imageUrl: true } } } },
        payments: true,
        deliveryJobs: { include: { logs: { orderBy: { executedAt: "desc" }, take: 5 } } },
        user: { select: { id: true, username: true, email: true } },
      },
    });
  }

  /**
   * Get order by order number
   */
  static async getOrderByNumber(orderNumber: string) {
    return await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payments: true,
        deliveryJobs: true,
      },
    });
  }

  /**
   * Get orders by user with pagination
   */
  static async getOrdersByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
          payments: { select: { status: true, provider: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update order status with strict state transition validation
   */
  static async updateOrderStatus(orderId: string, newStatus: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order "${orderId}" not found`);
    }

    const currentStatus = order.status;
    const validNextStates = VALID_STATE_TRANSITIONS[currentStatus] || [];

    if (!validNextStates.includes(newStatus)) {
      throw new Error(
        `Invalid transition: ${currentStatus} → ${newStatus}. Allowed: ${validNextStates.join(", ") || "none"}`
      );
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as OrderStatus },
      include: {
        items: true,
        payments: true,
        deliveryJobs: true,
      },
    });
  }

  /**
   * List orders with filters (admin)
   */
  static async listOrders(
    filters: {
      status?: string;
      userId?: string;
      search?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};

    if (filters.status) where.status = filters.status as OrderStatus;
    if (filters.userId) where.userId = filters.userId;

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search } },
        { playerName: { contains: filters.search } },
        { user: { username: { contains: filters.search } } },
        { user: { email: { contains: filters.search } } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          payments: { select: { status: true, provider: true } },
          user: { select: { username: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Get order statistics for dashboard
   */
  static async getOrderStats() {
    const [byStatus, totalRevenue, orderCount, recentOrders] = await Promise.all([
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["PAID", "DELIVERED", "QUEUED_DELIVERY"] } },
      }),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { username: true } },
        },
      }),
    ]);

    return {
      byStatus: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count.id])
      ),
      totalOrders: orderCount,
      totalRevenue: totalRevenue._sum.total || new Prisma.Decimal(0),
      recentOrders,
    };
  }

  /**
   * Generate unique order number: ORD-YYYYMMDD-XXXXXX
   */
  private static generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${dateStr}-${randomCode}`;
  }
}
