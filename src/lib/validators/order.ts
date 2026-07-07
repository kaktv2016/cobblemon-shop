import { z } from "zod";
import { OrderStatus } from "@prisma/client";

/**
 * Checkout schema for order creation
 */
export const checkoutSchema = z.object({
  playerName: z
    .string()
    .min(3, "Player name must be at least 3 characters")
    .max(32, "Player name must be at most 32 characters")
    .optional(),
  playerUuid: z
    .string()
    .regex(
      /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i,
      "Invalid Minecraft UUID format"
    )
    .optional(),
  couponCode: z
    .string()
    .min(1, "Coupon code is required if provided")
    .max(50, "Coupon code must be at most 50 characters")
    .optional()
    .nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z
          .number()
          .int("Quantity must be a whole number")
          .min(1, "Quantity must be at least 1")
          .max(1000, "Quantity must be at most 1000"),
      })
    )
    .min(1, "At least one item is required"),
}).refine(
  (data) => data.playerName || data.playerUuid,
  {
    message: "Either player name or UUID is required",
    path: ["playerName"],
  }
);

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Update order status schema
 * Validates valid state transitions
 */
export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z
    .string()
    .max(500, "Notes must be at most 500 characters")
    .optional()
    .nullable(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/**
 * Valid order status transitions
 * Maps from current status to allowed next statuses
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELED, OrderStatus.FAILED_DELIVERY],
  [OrderStatus.PAID]: [OrderStatus.QUEUED_DELIVERY, OrderStatus.REFUNDED],
  [OrderStatus.QUEUED_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.PARTIALLY_DELIVERED, OrderStatus.FAILED_DELIVERY, OrderStatus.REFUNDED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.PARTIALLY_DELIVERED]: [OrderStatus.DELIVERED, OrderStatus.FAILED_DELIVERY, OrderStatus.REFUNDED],
  [OrderStatus.FAILED_DELIVERY]: [OrderStatus.QUEUED_DELIVERY, OrderStatus.CANCELED, OrderStatus.REFUNDED],
  [OrderStatus.CANCELED]: [OrderStatus.PENDING_PAYMENT],
  [OrderStatus.REFUNDED]: [],
};

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}
