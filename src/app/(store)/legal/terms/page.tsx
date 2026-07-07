export const metadata = {
  title: "Terms of Service - CobbleMart",
  description: "Terms and conditions for using CobbleMart",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <article className="prose prose-invert max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-100">Terms of Service</h1>
          <p className="text-sm text-slate-400 mt-2">
            Last updated: April 10, 2026
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">1. Acceptance of Terms</h2>
          <p className="text-slate-300 leading-relaxed">
            By accessing and using CobbleMart ("the Service"), you accept and agree to be bound
            by the terms and provisions of this agreement. If you do not agree to abide by the
            above, please do not use this service. These terms of service are subject to change
            without notice.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">2. Eligibility</h2>
          <p className="text-slate-300 leading-relaxed">
            You must be at least 13 years old to use this service. If you are under 18, you
            represent that you have obtained parental or guardian consent to use this service.
            By using the service, you represent and warrant that you have the right, authority,
            and capacity to enter into this agreement.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">3. Account Registration</h2>
          <p className="text-slate-300 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account information
            and password. You agree to accept responsibility for all activities that occur under
            your account. You must notify us immediately of any unauthorized use of your account
            or any other breach of security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">4. Purchases and Virtual Items</h2>
          <p className="text-slate-300 leading-relaxed">
            All purchases on CobbleMart are final and non-refundable except where required by
            law or in our sole discretion. Virtual items are delivered via in-game systems to
            your linked Minecraft account. You acknowledge that you are purchasing a digital
            product and not a physical good.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">5. Delivery of Items</h2>
          <p className="text-slate-300 leading-relaxed">
            We make commercially reasonable efforts to deliver items promptly. Delivery times
            may vary based on server status and technical factors. Failed deliveries may be
            retried up to 3 times. We are not responsible for items not delivered due to
            account suspension, bans, or incorrect account information provided by the user.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">6. Refunds</h2>
          <p className="text-slate-300 leading-relaxed">
            Refunds may be available within 7 days of purchase if items were not delivered
            properly or due to technical issues. Refunds for change of mind are not available.
            Refund requests must be submitted with proof of the issue. Processing typically
            takes 5-10 business days.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">7. Prohibited Conduct</h2>
          <p className="text-slate-300 leading-relaxed">
            You agree not to use the service for any unlawful purposes or in any way that could
            damage the service. Prohibited behaviors include: attempting to gain unauthorized
            access, disrupting service operations, using the service to harass or threaten
            others, and attempting to circumvent payment systems.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">8. Termination</h2>
          <p className="text-slate-300 leading-relaxed">
            We may terminate your account and access to the service at any time for violation
            of these terms or for any other reason at our sole discretion. Upon termination,
            your right to use the service immediately ceases.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">9. Limitation of Liability</h2>
          <p className="text-slate-300 leading-relaxed">
            CobbleMart is provided "as is" and we make no warranties, express or implied, about
            its fitness for a particular purpose. To the fullest extent permitted by law, we
            are not liable for any indirect, incidental, special, or consequential damages
            arising from your use of the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">10. Changes to Terms</h2>
          <p className="text-slate-300 leading-relaxed">
            We reserve the right to modify these terms at any time. Continued use of the
            service following notification of changes constitutes your acceptance of the
            revised terms. We encourage you to review these terms regularly.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">11. Contact Information</h2>
          <p className="text-slate-300 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at
            support@cobblemart.example or join our Discord community at discord.gg/example.
          </p>
        </section>
      </article>
    </main>
  );
}
