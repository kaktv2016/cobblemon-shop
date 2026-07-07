import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OmiseProvider } from '@/lib/payment/omise';

/**
 * POST /api/webhooks/omise
 *
 * Receives payment events from Omise.
 * Register in: Omise Dashboard → Developers → Webhooks → Add Endpoint
 *
 * Key event:
 *   charge.complete  — PromptPay QR scanned and paid (status: "successful")
 *
 * Verification: HMAC-SHA256 of raw body using OMISE_WEBHOOK_SECRET
 * Header: x-omise-webhook-signature
 *
 * Always return HTTP 200 — Omise retries on non-2xx responses.
 */
export async function POST(request: NextRequest) {
  let payload = '';
  try {
    payload = await request.text();
    const signature = request.headers.get('x-omise-webhook-signature') || '';

    const provider = new OmiseProvider();
    const event = await provider.verifyWebhook(payload, signature);

    const orderId = event.metadata?.orderId;

    if (!orderId) {
      console.error('[Omise webhook] No order_id in charge metadata — skipping');
      return NextResponse.json({ received: true });
    }

    if (event.type === 'payment.completed') {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });

      if (!order) {
        console.error(`[Omise webhook] Order ${orderId} not found`);
        return NextResponse.json({ received: true });
      }

      // Idempotent — skip if already paid
      if (order.status === 'PENDING_PAYMENT') {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { status: 'PAID' },
          });

          if (order.payments[0]) {
            await tx.paymentTransaction.update({
              where: { id: order.payments[0].id },
              data: {
                status: 'COMPLETED',
                providerTransactionId: event.paymentId,
              },
            });
          }

          await tx.auditLog.create({
            data: {
              action: 'PAYMENT_CONFIRMED_WEBHOOK',
              target: 'ORDER',
              targetId: orderId,
              details: {
                provider: 'omise',
                chargeId: event.paymentId,
                orderNumber: event.metadata?.orderNumber,
                amount: event.amount / 100,
              },
            },
          });
        });

        console.log(`[Omise webhook] ✅ Order ${orderId} → PAID (charge: ${event.paymentId})`);
      } else {
        console.log(`[Omise webhook] Order ${orderId} already ${order.status} — skipped`);
      }
    } else {
      console.warn(
        `[Omise webhook] ❌ Payment not successful — order ${orderId}, status: ${event.metadata?.status}`
      );
      await prisma.auditLog.create({
        data: {
          action: 'PAYMENT_FAILED_WEBHOOK',
          target: 'ORDER',
          targetId: orderId,
          details: {
            provider: 'omise',
            chargeId: event.paymentId,
            status: event.metadata?.status,
          },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Omise webhook] Error:', error.message);

    if (error.message.includes('Invalid Omise webhook signature')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Other errors — return 200 to prevent Omise from retrying a bad payload
    return NextResponse.json({ received: true });
  }
}
