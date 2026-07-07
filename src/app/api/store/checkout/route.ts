import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OrderService } from "@/lib/services/order.service";
import { getPaymentProvider } from "@/lib/payment/provider";
import { prisma } from "@/lib/prisma";

/** POST /api/store/checkout — Create order and initiate payment */
export async function POST(request: NextRequest) {
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
      process.env.DEFAULT_CURRENCY || "THB",
      {
        orderNumber: order.orderNumber,
        userId: session.user.id,
        playerName,
      }
    );

    // Store provider QR data in rawResponse so /api/store/payment/qr can serve it:
    //   omise      → qrDownloadUri (authenticated Omise CDN URL)
    //   xendit     → qrString      (raw EMV payload)
    //   gbprimepay → qrImage       (base64 PNG)
    const rawResponse = payment.metadata?.qrDownloadUri
      ? { qrDownloadUri: payment.metadata.qrDownloadUri, chargeId: payment.metadata.chargeId, sourceId: payment.metadata.sourceId }
      : payment.metadata?.qrString
        ? { qrString: payment.metadata.qrString, xenditQrId: payment.metadata.xenditQrId }
        : payment.metadata?.qrImage
          ? { qrImage: payment.metadata.qrImage, gbpReferenceNo: payment.metadata.gbpReferenceNo }
          : undefined;

    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        providerTransactionId: payment.id,
        amount: order.total,
        currency: process.env.DEFAULT_CURRENCY || "THB",
        status: "PENDING",
        checkoutUrl: payment.checkoutUrl,
        rawResponse,
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
