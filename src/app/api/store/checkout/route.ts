import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OrderService } from "@/lib/services/order.service";
import { getPaymentProvider } from "@/lib/payment/provider";
import { prisma } from "@/lib/prisma";
import { isCommerceMaintenanceMode } from "@/lib/store-settings";

/** POST /api/store/checkout — Create order and initiate payment */
export async function POST(request: NextRequest) {
  if (await isCommerceMaintenanceMode()) {
    return NextResponse.json({ error: "Shop is under maintenance" }, { status: 503 });
  }
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนชำระเงิน" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Try to find linked Minecraft account first
    const mcAccount = await prisma.minecraftAccount.findUnique({
      where: { userId: session.user.id },
    });

    // Fall back to the AuthMe username from the session when no account is linked.
    // Since users log in via AuthMe their username IS their Minecraft username.
    const playerName = mcAccount?.username ?? session.user.username;
    const playerUuid = mcAccount?.uuid ?? undefined;

    // Create order from cart (server-side totals)
    const order = await OrderService.createOrder({
      userId: session.user.id,
      couponCode: body.couponCode,
      playerName,
      playerUuid,
    });

    // Initiate payment
    const provider = getPaymentProvider();
    const totalInSatang = Math.round(Number(order.total) * 100); // satang = 1/100 THB

    const payment = await provider.createPayment(
      order.id,
      totalInSatang,
      "THB",
      {
        orderNumber: order.orderNumber,
        userId: session.user.id,
        playerName,
        paymentAttempt: "1",
      }
    );

    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        providerTransactionId: payment.id,
        amount: order.total,
        currency: "THB",
        status: "PENDING",
        checkoutUrl: payment.checkoutUrl,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      checkoutUrl: payment.checkoutUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
