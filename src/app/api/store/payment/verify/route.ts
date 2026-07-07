import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/store/payment/verify
 * Body: { orderId: string }
 *
 * Manually verify payment status directly from Omise API.
 * Useful when running on localhost (webhooks can't reach local server)
 * or as a recovery mechanism if the webhook was missed.
 *
 * Flow:
 *   1. Get PaymentTransaction for the order (needs providerTransactionId = chargeId)
 *   2. Call GET /charges/{chargeId} on Omise API
 *   3. If charge.status === 'successful' → update Order → PAID
 *   4. Return current status
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let orderId: string;
  try {
    const body = await request.json();
    orderId = body.orderId;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  // Fetch order with latest payment
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only the owner (or admin) may verify
  const isAdmin = session.user.roles?.includes('admin');
  if (order.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Already paid — nothing to do
  if (order.status !== 'PENDING_PAYMENT') {
    return NextResponse.json({ status: order.status, alreadyUpdated: true });
  }

  const payment = order.payments[0];
  if (!payment) {
    return NextResponse.json({ error: 'No payment transaction found for this order' }, { status: 404 });
  }

  const chargeId = payment.providerTransactionId;
  const provider = payment.provider;

  if (provider !== 'omise' || !chargeId) {
    return NextResponse.json(
      { error: `Manual verify is only supported for Omise (provider: ${provider})` },
      { status: 400 }
    );
  }

  // Call Omise API to get charge status
  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'OMISE_SECRET_KEY not configured' }, { status: 500 });
  }

  const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');
  const omiseRes = await fetch(`https://api.omise.co/charges/${chargeId}`, {
    headers: { Authorization: authHeader },
  });

  if (!omiseRes.ok) {
    const errText = await omiseRes.text().catch(() => '');
    console.error('[verify] Omise charge fetch failed:', omiseRes.status, errText.slice(0, 200));
    return NextResponse.json(
      { error: `Failed to fetch charge from Omise (${omiseRes.status})` },
      { status: 502 }
    );
  }

  const charge = await omiseRes.json();
  const chargeStatus: string = charge.status; // 'successful' | 'pending' | 'failed' | 'expired'

  if (chargeStatus === 'successful') {
    // Update order + payment in a transaction (idempotent)
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      await tx.paymentTransaction.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });

      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_CONFIRMED_MANUAL_VERIFY',
          target: 'ORDER',
          targetId: orderId,
          details: {
            provider: 'omise',
            chargeId,
            chargeStatus,
            verifiedBy: session.user.id,
          },
        },
      });
    });

    console.log(`[verify] ✅ Order ${orderId} → PAID via manual verify (charge: ${chargeId})`);
    return NextResponse.json({ status: 'PAID', chargeStatus, updated: true });
  }

  if (chargeStatus === 'failed' || chargeStatus === 'expired') {
    // Log the failure but don't update order status (let admin handle)
    console.warn(`[verify] ⚠️ Charge ${chargeId} is ${chargeStatus} for order ${orderId}`);
    return NextResponse.json({ status: 'PENDING_PAYMENT', chargeStatus, updated: false });
  }

  // Still pending on Omise side
  return NextResponse.json({ status: 'PENDING_PAYMENT', chargeStatus, updated: false });
}
