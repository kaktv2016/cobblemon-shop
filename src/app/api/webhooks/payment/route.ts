/**
 * Payment Webhook Handler
 *
 * Processes webhook events from payment providers (Stripe, sandbox, etc.)
 * Handles payment confirmations, failures, and refunds.
 *
 * CRITICAL SECURITY NOTES:
 * - Always verify webhook signatures before processing
 * - Always validate payment amounts match order totals (prevents underpayment attacks)
 * - Make all operations idempotent (safe to process same event multiple times)
 * - Log all webhook events for audit trail
 * - Return 200 quickly - do actual processing asynchronously if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payment/provider';
import { getDeliveryAdapter } from '@/lib/delivery/adapter';
import { z } from 'zod';
import crypto from 'crypto';

/**
 * Schema for validating webhook headers and events
 */
const WebhookHeaderSchema = z.object({
  'x-cobblemon-signature': z.string(),
});

interface Order {
  id: string;
  playerId: string;
  playerUuid: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'refunded' | 'failed';
  items: OrderItem[];
  createdAt: Date;
}

interface OrderItem {
  id: string;
  command: string;
  delivered: boolean;
}

interface PaymentTransaction {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string;
  eventId?: string;
  processedAt?: Date;
  createdAt: Date;
}

/**
 * In-memory storage for demo purposes
 * In production, use a proper database
 */
const orders = new Map<string, Order>();
const paymentTransactions = new Map<string, PaymentTransaction>();
const processedWebhookEvents = new Set<string>();

/**
 * Main webhook handler for payment events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the raw body for signature verification
    const body = await request.text();

    if (!body || body.length === 0) {
      console.error('[WEBHOOK] Empty request body');
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    // Get signature from headers
    const signature = request.headers.get('x-cobblemon-signature');
    if (!signature) {
      console.error('[WEBHOOK] Missing signature header');
      return NextResponse.json(
        { error: 'Missing X-Cobblemon-Signature header' },
        { status: 401 }
      );
    }

    // Parse the webhook event
    let webhookEvent;
    try {
      const paymentProvider = getPaymentProvider();

      // Verify signature and parse event
      webhookEvent = await paymentProvider.verifyWebhook(body, signature);

      if (!webhookEvent.eventId) {
        // Generate event ID from body hash if provider doesn't supply one
        webhookEvent.eventId = crypto
          .createHash('sha256')
          .update(body)
          .digest('hex');
      }
    } catch (error) {
      console.error('[WEBHOOK] Signature verification failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Check for idempotency - have we already processed this event?
    if (webhookEvent.eventId && processedWebhookEvents.has(webhookEvent.eventId)) {
      console.log('[WEBHOOK] Event already processed (idempotency):', webhookEvent.eventId);
      return NextResponse.json({ success: true, cached: true }, { status: 200 });
    }

    // Mark event as processed to ensure idempotency
    if (webhookEvent.eventId) {
      processedWebhookEvents.add(webhookEvent.eventId);
    }

    console.log('[WEBHOOK] Processing event:', {
      type: webhookEvent.type,
      paymentId: webhookEvent.paymentId,
      amount: webhookEvent.amount,
    });

    // Route to appropriate handler based on event type
    switch (webhookEvent.type) {
      case 'payment.completed':
        await handlePaymentCompleted(webhookEvent);
        break;

      case 'payment.failed':
        await handlePaymentFailed(webhookEvent);
        break;

      case 'payment.refunded':
        await handlePaymentRefunded(webhookEvent);
        break;

      default:
        console.warn('[WEBHOOK] Unknown event type:', webhookEvent.type);
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    // Return 200 immediately to acknowledge receipt
    // Processing happens async
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle successful payment events
 * CRITICAL: Verify amount matches order total to prevent underpayment attacks
 */
async function handlePaymentCompleted(event: {
  type: string;
  paymentId: string;
  amount: number;
  metadata?: Record<string, string>;
  eventId?: string;
}): Promise<void> {
  const orderId = event.metadata?.orderId;

  if (!orderId) {
    console.error('[WEBHOOK] Payment completed but no orderId in metadata:', event.paymentId);
    return;
  }

  // Find the order
  const order = orders.get(orderId);
  if (!order) {
    console.error('[WEBHOOK] Order not found:', orderId);
    // Create an audit log entry for this orphaned payment
    logAuditEvent('payment_completed_orphaned', {
      paymentId: event.paymentId,
      orderId,
      amount: event.amount,
    });
    return;
  }

  // CRITICAL SECURITY CHECK: Verify amount matches order total
  // This prevents underpayment attacks
  if (event.amount !== order.totalAmount) {
    console.error('[WEBHOOK] SECURITY: Payment amount mismatch!', {
      paymentId: event.paymentId,
      orderId,
      expectedAmount: order.totalAmount,
      receivedAmount: event.amount,
      difference: event.amount - order.totalAmount,
    });

    logAuditEvent('payment_amount_mismatch', {
      paymentId: event.paymentId,
      orderId,
      expectedAmount: order.totalAmount,
      receivedAmount: event.amount,
    });

    return;
  }

  // Check if payment already processed
  const existingTransaction = Array.from(paymentTransactions.values()).find(
    (t) => t.orderId === orderId && t.paymentId === event.paymentId && t.status === 'completed'
  );

  if (existingTransaction) {
    console.log('[WEBHOOK] Payment already processed:', {
      orderId,
      paymentId: event.paymentId,
      transactionId: existingTransaction.id,
    });
    return;
  }

  // Create payment transaction record
  const transactionId = `txn_${crypto.randomBytes(12).toString('hex')}`;
  const transaction: PaymentTransaction = {
    id: transactionId,
    orderId,
    paymentId: event.paymentId,
    amount: event.amount,
    currency: order.currency,
    status: 'completed',
    provider: getPaymentProvider().name,
    eventId: event.eventId,
    processedAt: new Date(),
    createdAt: new Date(),
  };

  paymentTransactions.set(transactionId, transaction);

  console.log('[WEBHOOK] Payment transaction recorded:', transaction);

  // Update order status
  order.status = 'paid';

  logAuditEvent('payment_completed', {
    orderId,
    paymentId: event.paymentId,
    amount: event.amount,
    transactionId,
  });

  // Create delivery jobs for all items in the order
  const deliveryAdapter = getDeliveryAdapter();

  for (const item of order.items) {
    try {
      console.log('[WEBHOOK] Creating delivery job:', {
        orderId,
        itemId: item.id,
        playerName: order.playerId,
        playerUuid: order.playerUuid,
      });

      const result = await deliveryAdapter.execute(item.command, {
        playerName: order.playerId,
        playerUuid: order.playerUuid,
        orderId,
        isDryRun: false,
      });

      if (result.success) {
        item.delivered = true;
        logAuditEvent('item_delivered', {
          orderId,
          itemId: item.id,
          command: item.command,
        });
      } else {
        console.error('[WEBHOOK] Delivery failed:', {
          orderId,
          itemId: item.id,
          error: result.error,
        });

        logAuditEvent('item_delivery_failed', {
          orderId,
          itemId: item.id,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('[WEBHOOK] Delivery error:', error);

      logAuditEvent('item_delivery_error', {
        orderId,
        itemId: item.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update final order status
  const allDelivered = order.items.every((item) => item.delivered);
  order.status = allDelivered ? 'completed' : 'processing';

  logAuditEvent('order_updated', {
    orderId,
    newStatus: order.status,
    itemsDelivered: order.items.filter((i) => i.delivered).length,
    totalItems: order.items.length,
  });
}

/**
 * Handle failed payment events
 */
async function handlePaymentFailed(event: {
  type: string;
  paymentId: string;
  amount: number;
  metadata?: Record<string, string>;
  eventId?: string;
}): Promise<void> {
  const orderId = event.metadata?.orderId;

  if (!orderId) {
    console.error('[WEBHOOK] Payment failed but no orderId in metadata:', event.paymentId);
    return;
  }

  const order = orders.get(orderId);
  if (!order) {
    console.error('[WEBHOOK] Order not found for failed payment:', orderId);
    return;
  }

  // Check if already recorded
  const existingTransaction = Array.from(paymentTransactions.values()).find(
    (t) => t.orderId === orderId && t.paymentId === event.paymentId
  );

  if (existingTransaction && existingTransaction.status === 'failed') {
    console.log('[WEBHOOK] Payment failure already recorded:', {
      orderId,
      paymentId: event.paymentId,
    });
    return;
  }

  // Record failed transaction
  const transactionId = `txn_${crypto.randomBytes(12).toString('hex')}`;
  const transaction: PaymentTransaction = {
    id: transactionId,
    orderId,
    paymentId: event.paymentId,
    amount: event.amount,
    currency: order.currency,
    status: 'failed',
    provider: getPaymentProvider().name,
    eventId: event.eventId,
    processedAt: new Date(),
    createdAt: new Date(),
  };

  paymentTransactions.set(transactionId, transaction);

  // Update order status
  order.status = 'failed';

  logAuditEvent('payment_failed', {
    orderId,
    paymentId: event.paymentId,
    amount: event.amount,
    transactionId,
  });
}

/**
 * Handle refund events
 */
async function handlePaymentRefunded(event: {
  type: string;
  paymentId: string;
  amount: number;
  metadata?: Record<string, string>;
  eventId?: string;
}): Promise<void> {
  const orderId = event.metadata?.orderId;

  if (!orderId) {
    console.error('[WEBHOOK] Refund but no orderId in metadata:', event.paymentId);
    return;
  }

  const order = orders.get(orderId);
  if (!order) {
    console.error('[WEBHOOK] Order not found for refund:', orderId);
    return;
  }

  // Check if refund already recorded
  const existingTransaction = Array.from(paymentTransactions.values()).find(
    (t) => t.orderId === orderId && t.status === 'refunded'
  );

  if (existingTransaction) {
    console.log('[WEBHOOK] Refund already recorded:', {
      orderId,
      paymentId: event.paymentId,
    });
    return;
  }

  // Record refund transaction
  const transactionId = `txn_${crypto.randomBytes(12).toString('hex')}`;
  const transaction: PaymentTransaction = {
    id: transactionId,
    orderId,
    paymentId: event.paymentId,
    amount: event.amount,
    currency: order.currency,
    status: 'refunded',
    provider: getPaymentProvider().name,
    eventId: event.eventId,
    processedAt: new Date(),
    createdAt: new Date(),
  };

  paymentTransactions.set(transactionId, transaction);

  // Update order status
  order.status = 'refunded';

  logAuditEvent('payment_refunded', {
    orderId,
    paymentId: event.paymentId,
    amount: event.amount,
    transactionId,
  });
}

/**
 * Audit logging for all webhook events
 * In production, write to persistent audit log storage
 */
function logAuditEvent(
  eventType: string,
  data: Record<string, unknown>
): void {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    data,
  };

  console.log('[AUDIT]', JSON.stringify(auditEntry));

  // TODO: In production, write to persistent audit log:
  // - Database audit table
  // - External logging service (Sentry, LogRocket, etc.)
  // - CloudWatch/Google Cloud Logging for cloud deployments
}
