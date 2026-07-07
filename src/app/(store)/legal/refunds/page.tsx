export const metadata = {
  title: "Refund Policy - CobbleMart",
  description: "Our refund policy for virtual items",
};

export default function RefundsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <article className="prose prose-invert max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-100">Refund Policy</h1>
          <p className="text-sm text-slate-400 mt-2">
            Last updated: April 10, 2026
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">1. Eligibility for Refunds</h2>
          <p className="text-slate-300 leading-relaxed">
            Refunds are available within 7 days of purchase under the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>The item failed to deliver to your account after 24 hours</li>
            <li>You received an incorrect item</li>
            <li>A technical error prevented proper delivery</li>
            <li>There was an issue with the service that prevented you from using the item</li>
          </ul>
          <p className="text-slate-300 leading-relaxed mt-4">
            Refunds for change of mind, accidental purchases, or purchases from out-of-game
            merchants are not eligible. All sales of delivered virtual items are final.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">2. Refund Process</h2>
          <p className="text-slate-300 leading-relaxed">
            To request a refund:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>Go to your Orders and locate the order requiring a refund</li>
            <li>Click "Contact Support" or reach out via Discord or email</li>
            <li>Provide your order number and detailed explanation of the issue</li>
            <li>Include screenshots if relevant to support your request</li>
            <li>Our team will review and respond within 24-48 business hours</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">3. Refund Timeline</h2>
          <p className="text-slate-300 leading-relaxed">
            Once a refund is approved:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Refunds are processed to your original payment method</li>
            <li>Processing typically takes 5-10 business days</li>
            <li>Your bank may take an additional 1-3 business days to display the refund</li>
            <li>For PayPal or digital wallet payments, refunds may appear faster (1-3 days)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">4. Non-Refundable Items</h2>
          <p className="text-slate-300 leading-relaxed">
            The following items are non-refundable under all circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Items that have been successfully delivered and used</li>
            <li>Limited-time offers or time-limited items after expiration</li>
            <li>Items purchased with promotional or discounted coupon codes</li>
            <li>Purchases made by accounts that are suspended or banned</li>
            <li>Items where delivery failed due to incorrect account information provided by you</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">5. Chargebacks</h2>
          <p className="text-slate-300 leading-relaxed">
            Filing a chargeback with your payment provider without first contacting our
            support team may result in account suspension and/or banning. We take chargeback
            fraud seriously and reserve the right to pursue recovery. Always contact us first
            to resolve disputes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">6. Contact Us</h2>
          <p className="text-slate-300 leading-relaxed">
            Questions about our refund policy? Reach out to our support team:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Discord: discord.gg/example</li>
            <li>Email: support@cobblemart.example</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
