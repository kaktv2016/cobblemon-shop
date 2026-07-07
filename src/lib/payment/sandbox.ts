/**
 * Sandbox Payment Provider
 *
 * Development and testing payment provider that simulates payment flows.
 * No real payment processing occurs.
 * Useful for testing order flows and webhook integration.
 */

import crypto from 'crypto';
import { PaymentProvider, PaymentIntent, WebhookEvent } from './provider';

interface SandboxPaymentData {
  intent: PaymentIntent;
  completed: boolean;
}

export class SandboxPaymentProvider implements PaymentProvider {
  name = 'Sandbox (Development/Testing)';

  private payments: Map<string, SandboxPaymentData> = new Map();
  private webhookSecret = 'sandbox-webhook-secret';

  /**
   * Create a new payment intent in sandbox mode
   * Returns a checkout URL pointing to a local callback endpoint
   */
  async createPayment(
    orderId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    // Validate inputs
    if (!orderId || orderId.trim().length === 0) {
      throw new Error('Order ID is required');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!currency || currency.trim().length === 0) {
      throw new Error('Currency is required');
    }

    // Generate a fake payment ID
    const paymentId = `sandbox_${crypto.randomBytes(12).toString('hex')}`;

    const intent: PaymentIntent = {
      id: paymentId,
      amount,
      currency,
      status: 'pending',
      checkoutUrl: `/api/webhooks/payment/sandbox-callback?paymentId=${paymentId}&orderId=${encodeURIComponent(orderId)}`,
      metadata: {
        ...metadata,
        orderId,
      },
      createdAt: new Date(),
    };

    // Store in memory
    this.payments.set(paymentId, {
      intent,
      completed: false,
    });

    console.log('[SANDBOX] Payment created:', {
      paymentId,
      orderId,
      amount,
      currency,
      checkoutUrl: intent.checkoutUrl,
    });

    return intent;
  }

  /**
   * Verify a webhook in sandbox mode
   * In sandbox, all properly formed webhooks are valid
   */
  async verifyWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    try {
      // Parse the payload
      const data = JSON.parse(payload);

      // Verify signature for sandbox
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      // Note: In sandbox we could be more lenient, but keeping strict
      if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
        throw new Error('Invalid webhook signature');
      }

      // Validate required fields
      if (!data.type || !data.paymentId || typeof data.amount !== 'number') {
        throw new Error('Invalid webhook payload structure');
      }

      // Validate event type
      const validTypes = ['payment.completed', 'payment.failed', 'payment.refunded'];
      if (!validTypes.includes(data.type)) {
        throw new Error(`Invalid event type: ${data.type}`);
      }

      const event: WebhookEvent = {
        type: data.type,
        paymentId: data.paymentId,
        amount: data.amount,
        metadata: data.metadata,
        eventId: data.eventId,
      };

      console.log('[SANDBOX] Webhook verified:', event);

      return event;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to verify webhook: ${error.message}`);
      }
      throw new Error('Failed to verify webhook: Unknown error');
    }
  }

  /**
   * Get the status of a payment
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    return payment.intent;
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    if (payment.intent.status !== 'completed') {
      throw new Error(`Cannot refund payment with status: ${payment.intent.status}`);
    }

    // Validate refund amount
    if (amount && amount > payment.intent.amount) {
      throw new Error(`Refund amount (${amount}) exceeds payment amount (${payment.intent.amount})`);
    }

    const refundAmount = amount || payment.intent.amount;

    console.log('[SANDBOX] Payment refunded:', {
      paymentId,
      refundAmount,
      originalAmount: payment.intent.amount,
    });

    // Mark as refunded
    payment.intent.status = 'failed'; // In sandbox, refunds mark payment as failed
    payment.intent.completedAt = new Date();

    return true;
  }

  /**
   * Simulate completing a payment
   * Call this from test endpoints to simulate successful payment
   */
  async simulatePaymentCompletion(paymentId: string): Promise<WebhookEvent> {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    // Update payment status
    payment.intent.status = 'completed';
    payment.intent.completedAt = new Date();
    payment.completed = true;

    const event: WebhookEvent = {
      type: 'payment.completed',
      paymentId: paymentId,
      amount: payment.intent.amount,
      metadata: payment.intent.metadata,
      eventId: `sandbox_event_${crypto.randomBytes(12).toString('hex')}`,
    };

    console.log('[SANDBOX] Payment completed (simulated):', event);

    return event;
  }

  /**
   * Simulate a failed payment
   * Call this from test endpoints to simulate failed payment
   */
  async simulatePaymentFailure(paymentId: string, reason = 'Declined'): Promise<WebhookEvent> {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    // Update payment status
    payment.intent.status = 'failed';
    payment.intent.completedAt = new Date();

    const event: WebhookEvent = {
      type: 'payment.failed',
      paymentId: paymentId,
      amount: payment.intent.amount,
      metadata: {
        ...payment.intent.metadata,
        reason,
      },
      eventId: `sandbox_event_${crypto.randomBytes(12).toString('hex')}`,
    };

    console.log('[SANDBOX] Payment failed (simulated):', event);

    return event;
  }

  /**
   * Get all payments in the sandbox (for testing/debugging)
   */
  getAllPayments(): SandboxPaymentData[] {
    return Array.from(this.payments.values());
  }

  /**
   * Get payments for a specific order
   */
  getPaymentsForOrder(orderId: string): SandboxPaymentData[] {
    return Array.from(this.payments.values()).filter(
      (p) => p.intent.metadata?.orderId === orderId
    );
  }

  /**
   * Clear all payments (for test cleanup)
   */
  clearAllPayments(): void {
    this.payments.clear();
    console.log('[SANDBOX] All payments cleared');
  }

  /**
   * Create a webhook signature for testing
   */
  createWebhookSignature(payload: WebhookEvent): string {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', this.webhookSecret).update(payloadString).digest('hex');
  }
}
