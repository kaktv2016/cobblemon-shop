export const metadata = {
  title: "Privacy Policy - CobbleMart",
  description: "Our privacy policy and data practices",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <article className="prose prose-invert max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-100">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mt-2">
            Last updated: April 10, 2026
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">1. Information We Collect</h2>
          <p className="text-slate-300 leading-relaxed">
            We collect the following information from our users:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Account information: email, username, password (hashed)</li>
            <li>Minecraft account information: username, UUID (Universally Unique Identifier)</li>
            <li>Payment information: credit card details (processed securely by third parties)</li>
            <li>Order history: products purchased, prices, delivery status</li>
            <li>Technical information: IP address, browser type, pages visited</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">2. How We Use Your Information</h2>
          <p className="text-slate-300 leading-relaxed">
            Your information is used to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Process purchases and deliver items to your account</li>
            <li>Send order confirmations and delivery notifications</li>
            <li>Prevent fraud and protect account security</li>
            <li>Respond to support inquiries</li>
            <li>Improve our service and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">3. Minecraft Account Data</h2>
          <p className="text-slate-300 leading-relaxed">
            When you link your Minecraft account, we access and store your Minecraft username
            and UUID. This information is used solely to verify your account ownership and
            deliver items to the correct player. We do not share this data with third parties
            except as necessary to provide our service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">4. Cookies and Tracking</h2>
          <p className="text-slate-300 leading-relaxed">
            We use cookies to maintain your session and remember your preferences. Cookies are
            small files stored on your device that help us recognize you when you return. You
            can disable cookies in your browser settings, though this may limit functionality.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">5. Third-Party Services</h2>
          <p className="text-slate-300 leading-relaxed">
            We share limited information with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Payment processors: to securely process your payment</li>
            <li>Hosting providers: to operate our servers</li>
            <li>Minecraft/Mojang: for account verification and item delivery</li>
          </ul>
          <p className="text-slate-300 leading-relaxed mt-4">
            These third parties are contractually obligated to use your information only
            as necessary to provide our service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">6. Data Retention</h2>
          <p className="text-slate-300 leading-relaxed">
            We retain your information for as long as necessary to provide our service and
            comply with legal obligations. You may request deletion of your account at any
            time, though we may retain order history as required by law for 7 years.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">7. Your Rights</h2>
          <p className="text-slate-300 leading-relaxed">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal holds)</li>
            <li>Export your data in a portable format</li>
            <li>Opt-out of marketing communications</li>
          </ul>
          <p className="text-slate-300 leading-relaxed mt-4">
            To exercise these rights, contact support@cobblemart.example.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">8. Children's Privacy</h2>
          <p className="text-slate-300 leading-relaxed">
            Our service is not intended for children under 13. We do not knowingly collect
            information from children under 13. If we discover we have collected such
            information, we will delete it immediately. Parents who believe their child has
            provided information to us should contact support.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">9. Changes to This Policy</h2>
          <p className="text-slate-300 leading-relaxed">
            We may update this privacy policy from time to time. We will notify you of
            significant changes by email or by posting a prominent notice on our website.
            Your continued use of our service constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">10. Contact Us</h2>
          <p className="text-slate-300 leading-relaxed">
            If you have questions about our privacy practices, please contact us:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Email: privacy@cobblemart.example</li>
            <li>Discord: discord.gg/example</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
