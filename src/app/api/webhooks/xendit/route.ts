import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { XenditProvider } from '@/lib/payment/xendit';

/**
 * POST /api/webhooks/xendit
 *
 * Receives payment events from Xendit.
 * Register this URL in: Xendit Dashboard → Settings → Webhooks
 *
 * Relevant events:
 *   qr.payment  — PromptPay QR scanned and paid (status: SUCCEEDED)
 *
 * Verification: compare `x-callback-token` header with XENDIT_WEBHOOK_TOKEN env var.
 * Always return HTTP 200 — Xendit retries on non-2xx responses.
 */
export async function POST(request: NextRequest) {
  let payload = '';
  try {
    payload = await request.text();
    const callbackToken = request.headers.get('x-callback-token') || '';

    const provider = new XenditProvider();
    const event = await provider.verifyWebhook(payload, callbackToken);

    const orderId = event.metadata?.orderId;

    if (!orderId) {
      console.error('[Xendit webhook] No orderId in metadata — skipping');
      return NextResponse.json({ received: true });
    }

    if (event.type === 'payment.completed') {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });

      if (!order) {
        console.error(`[Xendit webhook] Order ${orderId} not found`);
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
                provider: 'xendit',
                xenditQrPaymentId: event.paymentId,
                referenceId: event.metadata?.referenceId,
                amount: event.amount / 100,
              },
            },
          });
        });

        console.log(`[Xendit webhook] ✅ Order ${orderId} → PAID`);
      } else {
        console.log(`[Xendit webhook] Order ${orderId} already ${order.status} — skipped`);
      }
    } else {
      console.warn(`[Xendit webhook] ❌ Payment failed — order ${orderId}, event: ${event.metadata?.event}`);
      await prisma.auditLog.create({
        data: {
          action: 'PAYMENT_FAILED_WEBHOOK',
          target: 'ORDER',
          targetId: orderId,
          details: { provider: 'xendit', status: event.metadata?.status },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    // Invalid token or parse error — log but still return 200
    // (returning 4xx would cause Xendit to keep retrying legitimate failures)
    console.error('[Xendit webhook] Error:', error.message);

    if (error.message.includes('Invalid Xendit webhook token')) {
      // Genuine security violation — return 401 to stop retries from bad actors
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ received: true });
  }
}
