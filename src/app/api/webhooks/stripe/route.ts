import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StripePaymentProvider } from "@/lib/payment/stripe";
import { assertPaymentAmount, startPaidOrderDelivery } from "@/lib/services/payment-delivery.service";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature" }, { status: 401 });

  try {
    const event = await new StripePaymentProvider().verifyWebhook(payload, signature);
    const orderId = event.metadata?.orderId;
    if (!orderId || !event.eventId) return NextResponse.json({ received: true, ignored: true });

    try {
      await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: event.eventId,
          eventType: event.metadata?.stripeEventType || event.type,
          status: "PROCESSING",
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw error;
    }

    let shouldQueueDelivery = false;
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        const payment = await tx.paymentTransaction.findFirst({
          where: { provider: "stripe", providerTransactionId: event.paymentId, orderId },
        });
        if (!order || !payment) throw new Error("Stripe event does not match a local order/payment");
        if (event.metadata?.userId && event.metadata.userId !== order.userId) {
          throw new Error("Stripe order ownership mismatch");
        }
        if ((event.metadata?.currency || "").toUpperCase() !== "THB") throw new Error("Stripe currency mismatch");
        if (payment.currency.toUpperCase() !== "THB") throw new Error("Local payment currency mismatch");
        assertPaymentAmount(order.total, event.amount);

        if (event.type === "payment.completed") {
          await tx.paymentTransaction.update({
            where: { id: payment.id },
            data: { status: "COMPLETED" },
          });
          const updated = await tx.order.updateMany({
            where: { id: orderId, status: "PENDING_PAYMENT" },
            data: { status: "PAID" },
          });
          shouldQueueDelivery = updated.count === 1 || ["PAID", "QUEUED_DELIVERY"].includes(order.status);
          await tx.auditLog.create({
            data: {
              action: "PAYMENT_CONFIRMED_WEBHOOK",
              target: "ORDER",
              targetId: orderId,
              details: { provider: "stripe", sessionId: event.paymentId, eventId: event.eventId, amount: event.amount / 100 },
            },
          });
        } else {
          await tx.paymentTransaction.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          });
          await tx.auditLog.create({
            data: {
              action: "PAYMENT_FAILED_WEBHOOK",
              target: "ORDER",
              targetId: orderId,
              details: { provider: "stripe", sessionId: event.paymentId, eventId: event.eventId },
            },
          });
        }

        await tx.paymentWebhookEvent.update({
          where: { provider_eventId: { provider: "stripe", eventId: event.eventId! } },
          data: { status: "PROCESSED", processedAt: new Date() },
        });
      });
    } catch (error) {
      await prisma.paymentWebhookEvent.update({
        where: { provider_eventId: { provider: "stripe", eventId: event.eventId } },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown webhook processing error",
          processedAt: new Date(),
        },
      }).catch(() => undefined);
      throw error;
    }

    if (shouldQueueDelivery) await startPaidOrderDelivery(orderId);
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    const message = error instanceof Error ? error.message : "Stripe webhook failed";
    if (message.startsWith("Unhandled Stripe event type:")) {
      return NextResponse.json({ received: true, ignored: true });
    }
    if (message === "Pending Stripe checkout session") {
      return NextResponse.json({ received: true, pending: true });
    }
    console.error("[Stripe webhook]", message);
    return NextResponse.json({ error: message }, { status: message.includes("signature") ? 401 : 400 });
  }
}
