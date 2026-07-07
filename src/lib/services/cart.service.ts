import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CartItemData {
  productId: string;
  quantity: number;
  price?: Prisma.Decimal;
  product?: any;
}

export interface CartSummary {
  items: CartItemData[];
  subtotal: Prisma.Decimal;
  total: Prisma.Decimal;
  itemCount: number;
}

/**
 * CartService handles shopping cart operations
 * All totals are computed server-side, never trusting client values
 * No tax calculation — Thailand-based shop
 */
export class CartService {
  /**
   * Get cart for a user with computed totals
   */
  static async getCart(userId: string): Promise<CartSummary> {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            imageUrl: true,
            isActive: true,
            visibility: true,
            stockLimit: true,
            stockSold: true,
            productType: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return this.computeCartTotals(cartItems);
  }

  /**
   * Add item to cart with availability check
   */
  static async addToCart(
    userId: string,
    productId: string,
    quantity: number
  ) {
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        isActive: true,
        visibility: true,
        stockLimit: true,
        stockSold: true,
        purchaseLimit: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.isActive || product.visibility !== "PUBLIC") {
      throw new Error("Product is not available for purchase");
    }

    // Check stock if limited
    if (product.stockLimit !== null) {
      const available = product.stockLimit - product.stockSold;
      if (available < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${available}, Requested: ${quantity}`
        );
      }
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stockLimit !== null) {
        const available = product.stockLimit - product.stockSold;
        if (newQuantity > available) {
          throw new Error(
            `Total quantity would exceed available stock. Available: ${available}`
          );
        }
      }

      if (product.purchaseLimit !== null && newQuantity > product.purchaseLimit) {
        throw new Error(
          `Purchase limit exceeded. Max: ${product.purchaseLimit}`
        );
      }

      return await prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              slug: true,
            },
          },
        },
      });
    }

    if (product.purchaseLimit !== null && quantity > product.purchaseLimit) {
      throw new Error(
        `Purchase limit exceeded. Max: ${product.purchaseLimit}`
      );
    }

    return await prisma.cartItem.create({
      data: { userId, productId, quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(
    userId: string,
    productId: string,
    quantity: number
  ) {
    if (quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    if (quantity === 0) {
      return await this.removeFromCart(userId, productId);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stockLimit: true,
        stockSold: true,
        purchaseLimit: true,
        isActive: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.stockLimit !== null) {
      const available = product.stockLimit - product.stockSold;
      if (quantity > available) {
        throw new Error(
          `Quantity exceeds available stock. Available: ${available}`
        );
      }
    }

    if (product.purchaseLimit !== null && quantity > product.purchaseLimit) {
      throw new Error(`Purchase limit exceeded. Max: ${product.purchaseLimit}`);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!cartItem) {
      throw new Error("Item not in cart");
    }

    return await prisma.cartItem.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(userId: string, productId: string) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!cartItem) {
      throw new Error("Item not in cart");
    }

    return await prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  /**
   * Clear entire cart
   */
  static async clearCart(userId: string) {
    return await prisma.cartItem.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get cart item count
   */
  static async getCartCount(userId: string): Promise<number> {
    const result = await prisma.cartItem.aggregate({
      where: { userId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  /**
   * Compute cart totals from database prices (ALWAYS server-side)
   * No tax — Thailand-based shop
   */
  static computeCartTotals(
    cartItems: Array<{
      productId: string;
      quantity: number;
      product?: { price: Prisma.Decimal } | null;
    }>
  ): CartSummary {
    let subtotal = new Prisma.Decimal(0);
    let itemCount = 0;

    for (const item of cartItems) {
      if (!item.product) continue;

      const itemTotal = new Prisma.Decimal(item.product.price).times(
        item.quantity
      );
      subtotal = subtotal.plus(itemTotal);
      itemCount += item.quantity;
    }

    return {
      items: cartItems,
      subtotal: subtotal.toDecimalPlaces(2),
      total: subtotal.toDecimalPlaces(2),
      itemCount,
    };
  }
}
