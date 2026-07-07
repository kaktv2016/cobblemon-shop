import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GBPrimePayProvider } from '@/lib/payment/gbprimepay';

/**
 * POST /api/webhooks/gbprimepay
 *
 * Receives payment result from GBPrimePay (backgroundUrl callback).
 * Body is application/x-www-form-urlencoded.
 *
 * Key fields:
 *   resultCode      — "00" = success, anything else = failure
 *   amount          — baht with 2 decimals (e.g. "299.00")
 *   referenceNo     — our order number (ORD-YYYYMMDD-XXXXXX)
 *   gbpReferenceNo  — GBPrimePay's own reference
 *   merchantDefined1 — our internal orderId (cuid)
 *   checksum        — MD5(secretKey + amount + referenceNo + resultCode)
 *
 * GBPrimePay expects HTTP 200 as acknowledgement — do NOT return 4xx/5xx
 * unless you want them to retry.
 */
export async function POST(request: NextRequest) {
  let payload = '';

  try {
    // GBPrimePay sends form-encoded body
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      payload = await request.text();
    } else {
      // Some GBPrimePay versions send JSON — handle both
      const body = await request.json();
      payload = new URLSearchParams(body).toString();
    }

    const provider = new GBPrimePayProvider();
    const event = await provider.verifyWebhook(payload, '');

    const orderId = event.metadata?.orderId;
    if (!orderId) {
      console.error('[GBPrimePay webhook] Missing orderId in merchantDefined1');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (event.type === 'payment.completed') {
      // Find order and update atomically
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (!order) {
        console.error(`[GBPrimePay webhook] Order ${orderId} not found`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Idempotency — only update if still pending
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
                provider: 'gbprimepay',
                gbpReferenceNo: event.paymentId,
                amount: event.amount / 100,
                resultCode: event.metadata?.resultCode,
              },
            },
          });
        });

        console.log(`[GBPrimePay webhook] Order ${orderId} confirmed — PAID`);
      } else {
        console.log(`[GBPrimePay webhook] Order ${orderId} already in status ${order.status}, skipping`);
      }
    } else {
      // Payment failed
      console.warn(`[GBPrimePay webhook] Payment failed for order ${orderId} — resultCode: ${event.metadata?.resultCode}`);
      await prisma.auditLog.create({
        data: {
          action: 'PAYMENT_FAILED_WEBHOOK',
          target: 'ORDER',
          targetId: orderId,
          details: {
            provider: 'gbprimepay',
            resultCode: event.metadata?.resultCode,
          },
        },
      });
    }

    // Always return 200 so GBPrimePay doesn't retry
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[GBPrimePay webhook] Error:', error.message);
    // Return 200 even on error to stop retries; log the error internally
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
