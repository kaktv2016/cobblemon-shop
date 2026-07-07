/**
 * Payment Provider Interface
 *
 * Defines the contract for payment processing providers.
 * Allows flexible switching between Stripe, sandbox, and other providers.
 */

export interface PaymentIntent {
  /**
   * Unique identifier for this payment
   */
  id: string;

  /**
   * Amount in cents (e.g., 2999 = $29.99)
   */
  amount: number;

  /**
   * Currency code (e.g., 'USD', 'EUR')
   */
  currency: string;

  /**
   * Current status of the payment
   */
  status: 'pending' | 'completed' | 'failed';

  /**
   * URL for customer to complete payment (if applicable)
   */
  checkoutUrl?: string;

  /**
   * Additional metadata attached to the payment
   */
  metadata?: Record<string, string>;

  /**
   * Created timestamp
   */
  createdAt?: Date;

  /**
   * Completed/failed timestamp
   */
  completedAt?: Date;
}

export interface WebhookEvent {
  /**
   * Type of webhook event
   */
  type: 'payment.completed' | 'payment.failed' | 'payment.refunded';

  /**
   * Payment ID from the provider
   */
  paymentId: string;

  /**
   * Amount in cents
   */
  amount: number;

  /**
   * Additional metadata from the event
   */
  metadata?: Record<string, string>;

  /**
   * Raw event ID for idempotency tracking
   */
  eventId?: string;
}

export interface PaymentProvider {
  /**
   * Human-readable name of the provider
   */
  name: string;

  /**
   * Create a new payment intent
   * @param orderId Unique order identifier
   * @param amount Amount in cents (e.g., 2999 = $29.99)
   * @param currency Currency code (e.g., 'USD')
   * @param metadata Optional metadata to attach to payment
   * @returns Payment intent with checkout URL if applicable
   */
  createPayment(
    orderId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent>;

  /**
   * Verify and parse a webhook event
   * @param payload Raw webhook payload
   * @param signature Webhook signature for verification
   * @returns Parsed webhook event
   * @throws If signature is invalid or payload cannot be parsed
   */
  verifyWebhook(payload: string, signature: string): Promise<WebhookEvent>;

  /**
   * Get current status of a payment
   * @param paymentId Payment ID from the provider
   * @returns Current payment intent state
   */
  getPaymentStatus(paymentId: string): Promise<PaymentIntent>;

  /**
   * Refund a payment (fully or partially)
   * @param paymentId Payment ID to refund
   * @param amount Optional partial refund amount in cents. If omitted, full refund.
   * @returns Whether refund succeeded
   */
  refundPayment(paymentId: string, amount?: number): Promise<boolean>;
}

/**
 * Factory function to get the appropriate payment provider based on environment
 *
 * Environment variables:
 * - PAYMENT_PROVIDER: 'stripe' | 'sandbox' | 'promptpay' (default: 'sandbox')
 * - For Stripe:
 *   - STRIPE_SECRET_KEY: Stripe secret API key
 *   - STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret
 * - For PromptPay:
 *   - PROMPTPAY_ID: Phone number (0XXXXXXXXX) or national ID (13 digits)
 * - For Sandbox:
 *   - (No additional config required)
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || 'sandbox').toLowerCase();

  switch (provider) {
    case 'stripe':
      // Lazy load to avoid import errors if Stripe SDK isn't installed
      const { StripePaymentProvider } = require('./stripe');
      return new StripePaymentProvider();

    case 'promptpay':
      const { PromptPayProvider } = require('./promptpay');
      return new PromptPayProvider();

    case 'gbprimepay':
      const { GBPrimePayProvider } = require('./gbprimepay');
      return new GBPrimePayProvider();

    case 'xendit':
      const { XenditProvider } = require('./xendit');
      return new XenditProvider();

    case 'omise':
      const { OmiseProvider } = require('./omise');
      return new OmiseProvider();

    case 'sandbox':
    default:
      // Lazy load to avoid import errors if dependencies aren't installed
      const { SandboxPaymentProvider } = require('./sandbox');
      return new SandboxPaymentProvider();
  }
}
