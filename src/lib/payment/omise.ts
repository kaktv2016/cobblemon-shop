import { createHmac } from 'crypto';
import type { PaymentIntent, PaymentProvider, WebhookEvent } from './provider';

/**
 * Omise payment provider — PromptPay QR via Omise (opn.ooo)
 *
 * Supports individual accounts (บุคคลธรรมดา) — no company registration required.
 *
 * Flow:
 *   1. createPayment()
 *        → POST /sources   (type: "promptpay") → get QR image download_uri
 *        → POST /charges   (source: src_xxx)   → creates the actual charge
 *        → stores { qrDownloadUri, chargeId } in metadata
 *        → checkout route saves to DB rawResponse
 *        → returns checkoutUrl = /checkout/promptpay?order=<orderId>
 *
 *   2. Customer scans QR in banking app → Omise collects payment
 *
 *   3. Omise POSTs "charge.complete" to /api/webhooks/omise
 *        → webhook verifies HMAC-SHA256 signature
 *        → Order transitions PENDING_PAYMENT → PAID automatically
 *
 * Environment variables:
 *   OMISE_SECRET_KEY     — starts with "skey_test_" (test) or "skey_live_" (production)
 *   OMISE_WEBHOOK_SECRET — from Omise Dashboard → Developers → Webhooks → Secret
 *   PAYMENT_FEE_RATE     — fee rate, default 0.015 (1.5% PromptPay)
 *
 * Omise API docs: https://docs.opn.ooo/charges#create-a-charge
 */

const OMISE_API_BASE = 'https://api.omise.co';

export class OmiseProvider implements PaymentProvider {
  readonly name = 'omise';

  private get secretKey(): string {
    const key = process.env.OMISE_SECRET_KEY;
    if (!key) throw new Error('OMISE_SECRET_KEY environment variable is not set');
    return key;
  }

  private get authHeader(): string {
    // Omise uses HTTP Basic auth: base64(secret_key + ":")
    return 'Basic ' + Buffer.from(this.secretKey + ':').toString('base64');
  }

  static get feeRate(): number {
    return parseFloat(process.env.PAYMENT_FEE_RATE || '0.015');
  }

  private async omiseFetch(path: string, body?: Record<string, unknown>) {
    const res = await fetch(`${OMISE_API_BASE}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        `Omise API error ${res.status}: ${data.message || data.code || 'Unknown error'}`
      );
    }

    return data;
  }

  /**
   * Create a PromptPay QR charge via Omise.
   * Amount is in satang (1/100 THB) per PaymentProvider contract.
   */
  async createPayment(
    orderId: string,
    amountInSatang: number,
    _currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    // Step 1: Create a PromptPay source → get QR image
    const source = await this.omiseFetch('/sources', {
      type: 'promptpay',
      amount: amountInSatang,  // Omise uses satang natively
      currency: 'thb',
    });

    const qrDownloadUri: string =
      source.scannable_code?.image?.download_uri || '';

    // Step 2: Create a charge linked to the source
    const charge = await this.omiseFetch('/charges', {
      amount: amountInSatang,
      currency: 'thb',
      source: source.id,
      return_uri: `${process.env.NEXTAUTH_URL}/checkout/promptpay?order=${orderId}`,
      metadata: {
        order_id: orderId,
        order_number: metadata?.orderNumber || '',
        player_name: metadata?.playerName || '',
      },
    });

    return {
      id: charge.id,          // chrg_xxx
      amount: amountInSatang,
      currency: 'THB',
      status: 'pending',
      checkoutUrl: `/checkout/promptpay?order=${orderId}`,
      metadata: {
        ...metadata,
        // stored in rawResponse by checkout route → used by /api/store/payment/qr
        qrDownloadUri,        // authenticated Omise image URL (we proxy this)
        sourceId: source.id,
        chargeId: charge.id,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Verify Omise webhook using HMAC-SHA256 signature.
   * Header: x-omise-webhook-signature
   * Formula: base64( HMAC-SHA256(secret, rawBody) )
   */
  async verifyWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    const secret = process.env.OMISE_WEBHOOK_SECRET;
    if (!secret) throw new Error('OMISE_WEBHOOK_SECRET is not configured');

    const expected = createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    if (expected !== signature) {
      throw new Error('Invalid Omise webhook signature');
    }

    const body = JSON.parse(payload);
    const eventKey: string = body.key || '';
    const charge = body.data || {};

    const isSuccess =
      eventKey === 'charge.complete' && charge.status === 'successful';

    const orderId: string = charge.metadata?.order_id || '';
    const amount: number = charge.amount || 0; // already in satang

    return {
      type: isSuccess ? 'payment.completed' : 'payment.failed',
      paymentId: charge.id || '',
      amount,
      metadata: {
        orderId,
        eventKey,
        status: charge.status,
        orderNumber: charge.metadata?.order_number || '',
      },
      eventId: charge.id || '',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    const { prisma } = await import('@/lib/prisma');
    const tx = await prisma.paymentTransaction.findFirst({
      where: { providerTransactionId: paymentId },
    });
    if (!tx) throw new Error(`PaymentTransaction ${paymentId} not found`);
    return {
      id: paymentId,
      amount: Math.round(Number(tx.amount) * 100),
      currency: tx.currency,
      status:
        tx.status === 'COMPLETED' ? 'completed'
        : tx.status === 'FAILED'  ? 'failed'
        : 'pending',
      createdAt: tx.createdAt,
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      const body: Record<string, unknown> = {};
      if (amount !== undefined) body.amount = amount; // partial refund in satang

      await this.omiseFetch(`/charges/${paymentId}/refunds`, body);
      return true;
    } catch {
      return false;
    }
  }
}
