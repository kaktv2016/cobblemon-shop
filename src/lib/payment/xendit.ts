import type { PaymentIntent, PaymentProvider, WebhookEvent } from './provider';

/**
 * Xendit payment provider — Thailand PromptPay QR via Xendit (formerly GBPrimePay TH)
 *
 * Flow:
 *   1. createPayment()  → POST /qr_codes to Xendit API
 *                       → receives qr_string (raw EMV QR payload)
 *                       → stores qr_string in metadata (checkout route saves to DB)
 *                       → returns checkoutUrl = /checkout/promptpay?order=<orderId>
 *   2. Customer opens banking app, scans QR → Xendit collects payment
 *   3. Xendit POSTs to /api/webhooks/xendit (callback_url)
 *   4. Webhook verifies x-callback-token → updates Order to PAID automatically
 *
 * Environment variables:
 *   XENDIT_SECRET_KEY      — starts with "xnd_development_" (test) or "xnd_production_" (live)
 *   XENDIT_WEBHOOK_TOKEN   — from Xendit Dashboard → Webhooks → Webhook Token
 *   PAYMENT_FEE_RATE       — fee rate, default 0.015 (1.5%)
 *
 * Xendit API docs: https://developers.xendit.co/api-reference/#create-qr-code
 */

const XENDIT_API_BASE = 'https://api.xendit.co';
const QR_EXPIRE_MINUTES = 30;

export class XenditProvider implements PaymentProvider {
  readonly name = 'xendit';

  private get secretKey(): string {
    const key = process.env.XENDIT_SECRET_KEY;
    if (!key) throw new Error('XENDIT_SECRET_KEY environment variable is not set');
    return key;
  }

  private get authHeader(): string {
    // Xendit uses HTTP Basic auth: base64(secret_key + ":")
    return 'Basic ' + Buffer.from(this.secretKey + ':').toString('base64');
  }

  static get feeRate(): number {
    return parseFloat(process.env.PAYMENT_FEE_RATE || '0.015');
  }

  /**
   * Create a Dynamic PromptPay QR code via Xendit.
   * Amount is in satang (1/100 THB) per PaymentProvider contract.
   */
  async createPayment(
    orderId: string,
    amountInSatang: number,
    _currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    const amountBaht = amountInSatang / 100;
    const referenceId = metadata?.orderNumber || orderId;
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/xendit`;
    const expiresAt = new Date(Date.now() + QR_EXPIRE_MINUTES * 60 * 1000).toISOString();

    const response = await fetch(`${XENDIT_API_BASE}/qr_codes`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        'api-version': '2022-07-31',
      },
      body: JSON.stringify({
        reference_id: referenceId,
        type: 'DYNAMIC',
        currency: 'THB',
        amount: amountBaht,
        callback_url: callbackUrl,
        expires_at: expiresAt,
        metadata: {
          order_id: orderId,
          player_name: metadata?.playerName || '',
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Xendit API error ${response.status}: ${err.message || err.error_code || 'Unknown error'}`
      );
    }

    const data = await response.json();

    // data.qr_string is the raw EMV QR payload — render to image client-side via /api/store/payment/qr
    return {
      id: data.id,                  // e.g. "qr_xxxxxxxxxxxx"
      amount: amountInSatang,
      currency: 'THB',
      status: 'pending',
      checkoutUrl: `/checkout/promptpay?order=${orderId}`,
      metadata: {
        ...metadata,
        qrString: data.qr_string || '',   // raw EMV string (not base64 image)
        xenditQrId: data.id,
        expiresAt,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Verify a Xendit webhook by comparing x-callback-token header.
   * The payload is JSON with event type and payment data.
   */
  async verifyWebhook(payload: string, callbackToken: string): Promise<WebhookEvent> {
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
    if (!expectedToken) throw new Error('XENDIT_WEBHOOK_TOKEN is not configured');

    if (callbackToken !== expectedToken) {
      throw new Error('Invalid Xendit webhook token');
    }

    const body = JSON.parse(payload);

    // event types: "qr.payment" for PromptPay QR success
    const isSuccess =
      body.event === 'qr.payment' && body.data?.status === 'SUCCEEDED';

    const orderId = body.data?.metadata?.order_id || '';
    const amount = body.data?.amount || 0;
    const qrId = body.data?.qr_id || body.data?.id || '';

    return {
      type: isSuccess ? 'payment.completed' : 'payment.failed',
      paymentId: qrId,
      amount: Math.round(amount * 100), // baht → satang
      metadata: {
        orderId,
        event: body.event,
        status: body.data?.status,
        referenceId: body.data?.reference_id || '',
      },
      eventId: body.data?.id || '',
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

  async refundPayment(_paymentId: string, _amount?: number): Promise<boolean> {
    throw new Error(
      'Xendit refunds must be processed via the Xendit Dashboard → Transactions.'
    );
  }
}
