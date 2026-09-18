import { describe, expect, it } from "vitest";
import { mapStripeCheckoutEvent } from "@/lib/payment/stripe";
import { assertPaymentAmount } from "@/lib/services/payment-delivery.service";

function stripeEvent(type: string, paymentStatus: string = "unpaid") {
  return {
    id: `evt_${type}`,
    type,
    data: {
      object: {
        id: "cs_test_1",
        amount_total: 12500,
        currency: "thb",
        payment_status: paymentStatus,
        client_reference_id: "order-1",
        metadata: { orderId: "order-1", userId: "user-1" },
      },
    },
  } as any;
}

describe("Stripe PromptPay event mapping", () => {
  it("maps asynchronous success and failure outcomes", () => {
    expect(mapStripeCheckoutEvent(stripeEvent("checkout.session.async_payment_succeeded")).type)
      .toBe("payment.completed");
    expect(mapStripeCheckoutEvent(stripeEvent("checkout.session.async_payment_failed")).type)
      .toBe("payment.failed");
    expect(mapStripeCheckoutEvent(stripeEvent("checkout.session.expired")).type)
      .toBe("payment.failed");
  });

  it("does not mark the intermediate completed event as failed", () => {
    expect(() => mapStripeCheckoutEvent(stripeEvent("checkout.session.completed", "unpaid")))
      .toThrow("Pending Stripe checkout session");
  });

  it("rejects mismatched payment amounts", () => {
    expect(() => assertPaymentAmount(125, 12500)).not.toThrow();
    expect(() => assertPaymentAmount(125, 12499)).toThrow(/amount mismatch/i);
  });
});
