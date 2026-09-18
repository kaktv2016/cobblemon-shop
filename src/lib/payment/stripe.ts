import Stripe from "stripe";
import type { PaymentIntent, PaymentProvider, WebhookEvent } from "./provider";

function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (!value) throw new Error("NEXT_PUBLIC_SITE_URL or NEXTAUTH_URL is required");
  return value.replace(/\/$/, "");
}

export function mapStripeCheckoutEvent(event: Stripe.Event): WebhookEvent {
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"].includes(event.type)) {
    throw new Error(`Unhandled Stripe event type: ${event.type}`);
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paid =
    event.type === "checkout.session.async_payment_succeeded" ||
    (event.type === "checkout.session.completed" && session.payment_status === "paid");

  // PromptPay is asynchronous. Checkout emits session.completed when the QR
  // is shown/confirmed, then emits async_payment_succeeded or failed later.
  // Never turn that intermediate event into a failed local payment.
  if (event.type === "checkout.session.completed" && !paid) {
    throw new Error("Pending Stripe checkout session");
  }

  return {
    type: paid ? "payment.completed" : "payment.failed",
    paymentId: session.id,
    amount: session.amount_total || 0,
    metadata: {
      ...session.metadata,
      orderId: session.metadata?.orderId || session.client_reference_id || "",
      currency: (session.currency || "").toUpperCase(),
      stripeEventType: event.type,
    },
    eventId: event.id,
  };
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY environment variable is required");
    this.stripe = new Stripe(secretKey);
  }

  async createPayment(
    orderId: string,
    amount: number,
    currency: string,
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    if (!orderId || !Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("A valid order and positive integer amount are required");
    }
    if (currency.toUpperCase() !== "THB") {
      throw new Error("Stripe PromptPay only supports THB in this shop");
    }

    const baseUrl = siteUrl();
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["promptpay"],
        client_reference_id: orderId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "thb",
              unit_amount: amount,
              product_data: {
                name: `Order ${metadata.orderNumber || orderId}`,
                description: "Cobblemon in-game delivery",
              },
            },
          },
        ],
        metadata: { orderId, ...metadata },
        payment_intent_data: { metadata: { orderId, ...metadata } },
        success_url: `${baseUrl}/checkout/success?order=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/account/orders/${encodeURIComponent(orderId)}?payment=cancelled`,
        // Stripe requires expires_at to be at least 30 minutes in the future.
        // One extra minute avoids falling below that boundary during request latency.
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      },
      { idempotencyKey: `checkout-${orderId}-${metadata.paymentAttempt || "1"}` }
    );

    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    return {
      id: session.id,
      amount,
      currency: "THB",
      status: "pending",
      checkoutUrl: session.url,
      metadata: { orderId, ...metadata },
      createdAt: new Date(session.created * 1000),
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is required");
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return mapStripeCheckoutEvent(event);
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    const session = await this.stripe.checkout.sessions.retrieve(paymentId);
    return {
      id: session.id,
      amount: session.amount_total || 0,
      currency: (session.currency || "thb").toUpperCase(),
      status: session.payment_status === "paid" ? "completed" : session.status === "expired" ? "failed" : "pending",
      checkoutUrl: session.url || undefined,
      metadata: session.metadata || undefined,
      createdAt: new Date(session.created * 1000),
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(paymentId);
      if (!session.payment_intent || typeof session.payment_intent !== "string") return false;
      await this.stripe.refunds.create({ payment_intent: session.payment_intent, amount });
      return true;
    } catch {
      return false;
    }
  }
}
