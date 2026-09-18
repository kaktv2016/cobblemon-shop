import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StripePaymentProvider } from "@/lib/payment/stripe";
import { isCommerceMaintenanceMode } from "@/lib/store-settings";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (await isCommerceMaintenanceMode()) {
    return NextResponse.json({ error: "Shop is under maintenance" }, { status: 503 });
  }
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Only pending orders can create a payment session" }, { status: 409 });
  }
  if (order.payments.some((payment) => payment.provider !== "stripe")) {
    return NextResponse.json({ error: "This legacy order must finish through its original payment provider" }, { status: 409 });
  }

  try {
    const attempt = order.payments.length + 1;
    const payment = await new StripePaymentProvider().createPayment(
      order.id,
      Math.round(Number(order.total) * 100),
      "THB",
      { orderNumber: order.orderNumber, userId: session.user.id, playerName: order.playerName || "", paymentAttempt: String(attempt) }
    );
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: "stripe",
        providerTransactionId: payment.id,
        amount: order.total,
        currency: "THB",
        status: "PENDING",
        checkoutUrl: payment.checkoutUrl,
      },
    });
    return NextResponse.json({ checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create payment session" }, { status: 400 });
  }
}
