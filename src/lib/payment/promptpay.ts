import type { PaymentIntent, PaymentProvider, WebhookEvent } from './provider';
import generatePayload from 'promptpay-qr';

/**
 * PromptPay payment provider — Thailand mobile banking QR standard (EMV Co.)
 *
 * Flow:
 *   1. createPayment()  → returns checkoutUrl = /checkout/promptpay?order=<orderId>
 *   2. /checkout/promptpay page fetches /api/store/payment/promptpay/qr?order=<orderId>
 *      which calls generateQR() to produce a PNG buffer
 *   3. Customer scans QR, transfers money in their banking app
 *   4. Admin visits order detail, clicks "ยืนยันการชำระเงิน" → order moves to PAID
 *
 * Environment variables:
 *   PROMPTPAY_ID  — phone number (0XXXXXXXXX) or national ID (13 digits)
 */
export class PromptPayProvider implements PaymentProvider {
  readonly name = 'promptpay';

  private get promptPayId(): string {
    const id = process.env.PROMPTPAY_ID;
    if (!id) throw new Error('PROMPTPAY_ID environment variable is not set');
    return id;
  }

  /**
   * Create a PromptPay payment — immediately returns a pending intent.
   * Amount is in satang (1/100 THB), matching the PaymentProvider contract of "cents".
   */
  async createPayment(
    orderId: string,
    amountInSatang: number,
    _currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    const amountInBaht = amountInSatang / 100;

    return {
      id: `pp_${orderId}`,
      amount: amountInSatang,
      currency: 'THB',
      status: 'pending',
      // Customer goes here to see QR code
      checkoutUrl: `/checkout/promptpay?order=${orderId}`,
      metadata: {
        ...metadata,
        amountBaht: String(amountInBaht),
        promptPayId: this.promptPayId,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Generate an EMV QR payload string for the given order amount (in baht).
   */
  generatePayload(amountInBaht: number): string {
    return generatePayload(this.promptPayId, { amount: amountInBaht });
  }

  /**
   * PromptPay has no webhooks — payment is confirmed manually by admin.
   * This method is a no-op but satisfies the interface.
   */
  async verifyWebhook(_payload: string, _signature: string): Promise<WebhookEvent> {
    throw new Error('PromptPay does not support webhooks. Confirm payments manually via the admin panel.');
  }

  /**
   * PromptPay has no external status API — status lives in our own DB.
   * The admin confirm endpoint updates the PaymentTransaction row directly.
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    const { prisma } = await import('@/lib/prisma');

    const tx = await prisma.paymentTransaction.findFirst({
      where: { providerTransactionId: paymentId },
    });

    if (!tx) {
      throw new Error(`PaymentTransaction ${paymentId} not found`);
    }

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

  /**
   * Refunds are handled manually (bank transfer back to customer).
   */
  async refundPayment(_paymentId: string, _amount?: number): Promise<boolean> {
    throw new Error('PromptPay refunds must be processed manually through your banking app.');
  }
}
