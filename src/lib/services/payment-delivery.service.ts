import { prisma } from "@/lib/prisma";
import { DeliveryService } from "@/lib/services/delivery.service";

/**
 * Start delivery after payment has committed. Delivery failures are recorded in
 * the queue and must never roll back a valid payment confirmation.
 */
export async function startPaidOrderDelivery(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order || !["PAID", "QUEUED_DELIVERY"].includes(order.status)) {
      return { queued: 0, succeeded: 0, failed: 0, skipped: true };
    }

    const result = await DeliveryService.queueOrder(orderId);

    await prisma.auditLog.create({
      data: {
        action: "DELIVERY_QUEUED_AFTER_PAYMENT",
        target: "ORDER",
        targetId: orderId,
        details: result,
      },
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown delivery error";
    console.error(`[delivery] Could not start order ${orderId}:`, message);

    await prisma.auditLog.create({
      data: {
        action: "DELIVERY_QUEUE_FAILED",
        target: "ORDER",
        targetId: orderId,
        details: { error: message },
      },
    }).catch(() => undefined);

    return { queued: 0, succeeded: 0, failed: 1, error: message };
  }
}

export function assertPaymentAmount(orderTotal: unknown, amountInSatang: number) {
  const expected = Math.round(Number(orderTotal) * 100);
  if (!Number.isSafeInteger(amountInSatang) || amountInSatang !== expected) {
    throw new Error(
      `Payment amount mismatch: expected ${expected} satang, received ${amountInSatang}`
    );
  }
}
