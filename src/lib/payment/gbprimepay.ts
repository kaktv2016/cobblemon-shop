import { createHash } from 'crypto';
import type { PaymentIntent, PaymentProvider, WebhookEvent } from './provider';

/**
 * GBPrimePay payment provider — Thailand QR PromptPay via GBPrimePay gateway
 *
 * Flow:
 *   1. createPayment()  → POST to GBPrimePay /v3/qrcode
 *                       → receives qrImage (base64 PNG) from GBPrimePay
 *                       → stores qrImage in metadata (checkout route saves to DB)
 *                       → returns checkoutUrl = /checkout/promptpay?order=<orderId>
 *   2. Customer scans QR in banking app → GBPrimePay collects payment
 *   3. GBPrimePay POSTs to /api/webhooks/gbprimepay (backgroundUrl)
 *   4. Webhook verifies MD5 checksum → updates Order to PAID automatically
 *
 * Environment variables:
 *   GBPRIMEPAY_PUBLIC_KEY  — token used in API calls (use test key during dev)
 *   GBPRIMEPAY_SECRET_KEY  — used to verify webhook checksum
 *   GBPRIMEPAY_FEE_RATE    — fee rate, default 0.025 (2.5%)
 *
 * Note: For local development, GBPrimePay cannot reach localhost webhooks.
 *       Use ngrok or test the flow by simulating the webhook manually.
 */
export class GBPrimePayProvider implements PaymentProvider {
  readonly name = 'gbprimepay';

  private get publicKey(): string {
    const key = process.env.GBPRIMEPAY_PUBLIC_KEY;
    if (!key) throw new Error('GBPRIMEPAY_PUBLIC_KEY environment variable is not set');
    return key;
  }

  get secretKey(): string {
    const key = process.env.GBPRIMEPAY_SECRET_KEY;
    if (!key) throw new Error('GBPRIMEPAY_SECRET_KEY environment variable is not set');
    return key;
  }

  static get feeRate(): number {
    return parseFloat(process.env.GBPRIMEPAY_FEE_RATE || '0.025');
  }

  /**
   * Calculate the GBPrimePay fee for a given baht amount.
   */
  static calculateFee(amountBaht: number): number {
    return Math.round(amountBaht * GBPrimePayProvider.feeRate * 100) / 100;
  }

  /**
   * Create a QR PromptPay payment via GBPrimePay API.
   * Amount is in satang (1/100 THB) per PaymentProvider contract.
   */
  async createPayment(
    orderId: string,
    amountInSatang: number,
    _currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    const amountBaht = (amountInSatang / 100).toFixed(2);
    const referenceNo = metadata?.orderNumber || orderId;
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/gbprimepay`;

    const params = new URLSearchParams({
      token: this.publicKey,
      amount: amountBaht,
      referenceNo,
      backgroundUrl: webhookUrl,
      detail: 'Cobblemon Divided - Order',
      customerName: metadata?.playerName || 'Player',
      customerEmail: metadata?.customerEmail || '',
      customerTelephone: '',
      // merchantDefined1 stores our internal orderId for webhook lookup
      merchantDefined1: orderId,
    });

    const response = await fetch('https://api.gbprimepay.com/v3/qrcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`GBPrimePay API error: HTTP ${response.status}`);
    }

    const data = await response.json();

    // GBPrimePay returns resultCode "00" for success
    if (data.resultCode !== '00') {
      throw new Error(`GBPrimePay rejected request — resultCode: ${data.resultCode}`);
    }

    return {
      id: data.gbpReferenceNo || `gbp_${orderId}`,
      amount: amountInSatang,
      currency: 'THB',
      status: 'pending',
      checkoutUrl: `/checkout/promptpay?order=${orderId}`,
      metadata: {
        ...metadata,
        // qrImage is a base64 data URI: "data:image/png;base64,..."
        qrImage: data.qrImage || '',
        gbpReferenceNo: data.gbpReferenceNo || '',
        amountBaht,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Verify GBPrimePay webhook checksum.
   * Formula: MD5( secretKey + amount + referenceNo + resultCode )
   */
  verifyChecksum(
    amount: string,
    referenceNo: string,
    resultCode: string,
    receivedChecksum: string
  ): boolean {
    const raw = `${this.secretKey}${amount}${referenceNo}${resultCode}`;
    const expected = createHash('md5').update(raw).digest('hex');
    return expected.toLowerCase() === receivedChecksum.toLowerCase();
  }

  /**
   * Parse and verify a GBPrimePay webhook POST body (application/x-www-form-urlencoded).
   */
  async verifyWebhook(payload: string, _signature: string): Promise<WebhookEvent> {
    const params = new URLSearchParams(payload);

    const resultCode   = params.get('resultCode')   || '';
    const amount       = params.get('amount')        || '';
    const referenceNo  = params.get('referenceNo')   || '';
    const gbpRef       = params.get('gbpReferenceNo')|| '';
    const checksum     = params.get('checksum')      || '';
    const orderId      = params.get('merchantDefined1') || '';

    if (!this.verifyChecksum(amount, referenceNo, resultCode, checksum)) {
      throw new Error('Invalid GBPrimePay webhook checksum');
    }

    return {
      type: resultCode === '00' ? 'payment.completed' : 'payment.failed',
      paymentId: gbpRef,
      amount: Math.round(parseFloat(amount) * 100), // convert baht → satang
      metadata: { orderId, referenceNo, resultCode },
      eventId: gbpRef,
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
      'GBPrimePay refunds must be processed via their merchant portal at https://portal.gbprimepay.com'
    );
  }
}
