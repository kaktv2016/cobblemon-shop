/**
 * Stripe Payment Provider (Scaffold)
 *
 * This adapter integrates with Stripe for payment processing.
 * Currently a scaffold - requires installation of Stripe SDK to complete.
 *
 * To complete implementation:
 * 1. npm install stripe
 * 2. Uncomment the import below
 * 3. Implement the TODO sections
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret API key
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret
 * - STRIPE_SUCCESS_URL: URL to redirect after successful payment (default: /order/success)
 * - STRIPE_CANCEL_URL: URL to redirect on cancelled payment (default: /order/cancel)
 */

import { PaymentProvider, PaymentIntent, WebhookEvent } from './provider';

// TODO: Uncomment once stripe package is installed
// import Stripe from 'stripe';

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
}

export class StripePaymentProvider implements PaymentProvider {
  name = 'Stripe';

  private config: StripeConfig;
  // TODO: private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required for Stripe provider');
    }

    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET environment variable is required for Stripe webhook verification'
      );
    }

    this.config = {
      secretKey,
      webhookSecret,
      successUrl: process.env.STRIPE_SUCCESS_URL || '/order/success',
      cancelUrl: process.env.STRIPE_CANCEL_URL || '/order/cancel',
    };

    // TODO: Initialize Stripe client
    // this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

    console.log('[STRIPE] Provider initialized');
  }

  /**
   * Create a new payment intent with Stripe
   *
   * TODO: Implementation steps:
   * 1. Create a Stripe Checkout Session
   * 2. Set success_url to redirect after payment
   * 3. Set cancel_url for cancelled payments
   * 4. Add metadata with orderId
   * 5. Return PaymentIntent with checkout URL
   *
   * Reference:
   * https://stripe.com/docs/api/checkout/sessions/create
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

    // TODO: Call Stripe API
    // const session = await this.stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: currency.toLowerCase(),
    //         unit_amount: amount,
    //         product_data: {
    //           name: `Order ${orderId}`,
    //           description: 'Cobblemon Shop Purchase',
    //         },
    //       },
    //       quantity: 1,
    //     },
    //   ],
    //   mode: 'payment',
    //   success_url: `${this.config.successUrl}?sessionId={CHECKOUT_SESSION_ID}`,
    //   cancel_url: this.config.cancelUrl,
    //   metadata: {
    //     orderId,
    //     ...metadata,
    //   },
    // });

    // TODO: Return properly formatted PaymentIntent
    // return {
    //   id: session.id,
    //   amount,
    //   currency,
    //   status: 'pending',
    //   checkoutUrl: session.url || undefined,
    //   metadata: { orderId, ...metadata },
    //   createdAt: new Date(session.created * 1000),
    // };

    throw this.getScaffoldError('createPayment');
  }

  /**
   * Verify and parse a Stripe webhook
   *
   * TODO: Implementation steps:
   * 1. Verify webhook signature using Stripe.webhooks.constructEvent()
   * 2. Handle different event types: charge.succeeded, charge.failed, charge.refunded
   * 3. Map Stripe events to WebhookEvent type
   * 4. Extract payment ID and amount from event data
   * 5. Return structured WebhookEvent
   *
   * Reference:
   * https://stripe.com/docs/webhooks/build
   */
  async verifyWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    // TODO: Verify Stripe signature
    // const event = this.stripe.webhooks.constructEvent(
    //   payload,
    //   signature,
    //   this.config.webhookSecret
    // );

    // TODO: Handle different event types
    // switch (event.type) {
    //   case 'charge.succeeded': {
    //     const charge = event.data.object as Stripe.Charge;
    //     return {
    //       type: 'payment.completed',
    //       paymentId: charge.id,
    //       amount: charge.amount,
    //       metadata: charge.metadata,
    //       eventId: event.id,
    //     };
    //   }
    //   case 'charge.failed': {
    //     const charge = event.data.object as Stripe.Charge;
    //     return {
    //       type: 'payment.failed',
    //       paymentId: charge.id,
    //       amount: charge.amount,
    //       metadata: { ...charge.metadata, reason: charge.failure_message || 'Unknown' },
    //       eventId: event.id,
    //     };
    //   }
    //   case 'charge.refunded': {
    //     const charge = event.data.object as Stripe.Charge;
    //     return {
    //       type: 'payment.refunded',
    //       paymentId: charge.id,
    //       amount: charge.refunded || charge.amount,
    //       metadata: charge.metadata,
    //       eventId: event.id,
    //     };
    //   }
    //   default:
    //     throw new Error(`Unhandled event type: ${event.type}`);
    // }

    throw this.getScaffoldError('verifyWebhook');
  }

  /**
   * Get the current status of a payment
   *
   * TODO: Implementation steps:
   * 1. Retrieve charge from Stripe using paymentId
   * 2. Map Stripe charge status to PaymentIntent status
   * 3. Return current state
   *
   * Reference:
   * https://stripe.com/docs/api/charges/retrieve
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    // TODO: Retrieve charge from Stripe
    // const charge = await this.stripe.charges.retrieve(paymentId);
    //
    // return {
    //   id: charge.id,
    //   amount: charge.amount,
    //   currency: (charge.currency || 'usd').toUpperCase(),
    //   status: charge.paid ? 'completed' : 'failed',
    //   metadata: charge.metadata,
    //   createdAt: new Date(charge.created * 1000),
    // };

    throw this.getScaffoldError('getPaymentStatus');
  }

  /**
   * Refund a Stripe payment
   *
   * TODO: Implementation steps:
   * 1. Call Stripe refund API with paymentId
   * 2. Optionally specify amount for partial refunds
   * 3. Return success/failure
   *
   * Reference:
   * https://stripe.com/docs/api/refunds/create
   */
  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    // TODO: Create refund in Stripe
    // try {
    //   const refund = await this.stripe.refunds.create({
    //     charge: paymentId,
    //     amount,
    //   });
    //   return !!refund.id;
    // } catch (error) {
    //   console.error('Stripe refund failed:', error);
    //   return false;
    // }

    throw this.getScaffoldError('refundPayment');
  }

  /**
   * Generate a descriptive error message for unimplemented methods
   */
  private getScaffoldError(method: string): Error {
    return new Error(
      `Stripe provider not fully implemented. To complete ${method}:

1. Install Stripe SDK:
   npm install stripe

2. Uncomment the import at the top of this file

3. Uncomment and complete the TODO sections in the ${method} method

4. Configure environment variables:
   - STRIPE_SECRET_KEY: Your Stripe secret key
   - STRIPE_WEBHOOK_SECRET: Your webhook signing secret
   - STRIPE_SUCCESS_URL: (optional) Success redirect URL
   - STRIPE_CANCEL_URL: (optional) Cancellation redirect URL

Current config:
- Secret Key: ${this.config.secretKey.substring(0, 10)}...
- Webhook Secret: ${this.config.webhookSecret.substring(0, 10)}...`
    );
  }
}

/**
 * Example of completed implementation:
 *
 * async createPayment(
 *   orderId: string,
 *   amount: number,
 *   currency: string,
 *   metadata?: Record<string, string>
 * ): Promise<PaymentIntent> {
 *   const session = await this.stripe.checkout.sessions.create({
 *     payment_method_types: ['card'],
 *     line_items: [{
 *       price_data: {
 *         currency: currency.toLowerCase(),
 *         unit_amount: amount,
 *         product_data: {
 *           name: `Order ${orderId}`,
 *         },
 *       },
 *       quantity: 1,
 *     }],
 *     mode: 'payment',
 *     success_url: `${this.config.successUrl}?session={CHECKOUT_SESSION_ID}`,
 *     cancel_url: this.config.cancelUrl,
 *     metadata: { orderId, ...metadata },
 *   });
 *
 *   return {
 *     id: session.id,
 *     amount,
 *     currency,
 *     status: 'pending',
 *     checkoutUrl: session.url || undefined,
 *     metadata: { orderId, ...metadata },
 *     createdAt: new Date(session.created * 1000),
 *   };
 * }
 */
