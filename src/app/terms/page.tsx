// src/app/terms/page.tsx
import Link from "next/link";
import { currentLegalDate } from "@/lib/compliance/current-version";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Eduyro mastery learning platform.",
};

export default async function TermsPage() {
  const lastUpdated = await currentLegalDate("TERMS");
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted hover:text-ink transition-colors">
          ← Back to home
        </Link>
      </div>

      <h1 className="font-serif text-4xl font-bold mb-2">Terms of Service</h1>
      {lastUpdated && (
        <p className="text-sm text-muted mb-10">Last updated: {lastUpdated}</p>
      )}

      <div className="prose prose-sm max-w-none space-y-8 text-ink">

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed text-muted">
            By creating an account or using Eduyro ("Service"), you agree to these Terms of Service ("Terms"). 
            If you are a parent or guardian creating an account on behalf of a child, you agree to these Terms 
            on their behalf. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">2. Description of Service</h2>
          <p className="text-sm leading-relaxed text-muted">
            Eduyro is a mastery-based learning platform for Pre-K through Grade 12 students. We provide 
            daily printable worksheets, placement testing, progress tracking, and printable worksheet packs 
            across Math, Reading, Writing, and Science.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">3. Accounts and Registration</h2>
          <p className="text-sm leading-relaxed text-muted mb-3">
            You must provide accurate information when creating an account. You are responsible for 
            maintaining the security of your account credentials. You must notify us immediately of any 
            unauthorized use of your account.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Parent accounts are required for children under 13 years of age in accordance with COPPA 
            (Children's Online Privacy Protection Act). Parents must provide verifiable parental consent 
            before a child account is activated.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">4. Subscriptions and Payments</h2>
          <p className="text-sm leading-relaxed text-muted mb-3">
            Eduyro offers monthly subscriptions. The first child costs $9.99/month with a 7-day free trial. 
            Additional children cost $5.99/month each. No credit card is required during the free trial period.
          </p>
          <p className="text-sm leading-relaxed text-muted mb-3">
            Subscriptions automatically renew each month unless cancelled. You may cancel at any time from 
            your account dashboard. Cancellations take effect at the end of the current billing period.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            All payments are processed securely through Stripe. We do not store your payment card information.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">5. Shop Purchases</h2>
          <p className="text-sm leading-relaxed text-muted mb-3">
            Worksheet packs purchased from the Eduyro Shop are digital products delivered as downloadable PDFs.
            We offer a 7-day money-back guarantee: if you're not satisfied with a pack, email
            support@eduyro.com within 7 days of purchase and we'll refund you in full. After 7 days, sales are
            considered final due to the digital nature of the products.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Purchased worksheets are licensed for personal, non-commercial use only. You may print them for 
            use with your own children. You may not resell, redistribute, or share worksheet files with others.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">6. Intellectual Property</h2>
          <p className="text-sm leading-relaxed text-muted">
            All content on Eduyro — including worksheets, curriculum, software, and design — is owned by 
            Eduyro Education Inc. and protected by copyright law. You may not copy, modify, distribute, 
            or create derivative works without our written permission.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">7. Acceptable Use</h2>
          <p className="text-sm leading-relaxed text-muted mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Share your account credentials with others</li>
            <li>Reproduce or redistribute worksheet content for commercial purposes</li>
            <li>Interfere with the operation of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">8. Children's Privacy (COPPA)</h2>
          <p className="text-sm leading-relaxed text-muted">
            We take children's privacy seriously. Children under 13 may only use Eduyro through a parent 
            account. We collect only the minimum information necessary to provide the Service. We do not 
            sell or share children's personal information with third parties for advertising purposes. 
            See our Privacy Policy for full details.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">9. Disclaimer of Warranties</h2>
          <p className="text-sm leading-relaxed text-muted">
            The Service is provided "as is" without warranties of any kind. We do not guarantee that the 
            Service will be uninterrupted, error-free, or meet your specific educational requirements. 
            Educational outcomes vary by student and are not guaranteed.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">10. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed text-muted">
            To the maximum extent permitted by law, Eduyro Education Inc. shall not be liable for any 
            indirect, incidental, or consequential damages arising from your use of the Service. Our 
            total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">11. Changes to Terms</h2>
          <p className="text-sm leading-relaxed text-muted">
            We may update these Terms from time to time. We will notify you of material changes by email 
            or by displaying a notice on the Service. Continued use of the Service after changes constitutes 
            acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">12. Governing Law</h2>
          <p className="text-sm leading-relaxed text-muted">
            These Terms are governed by the laws of the Province of Ontario, Canada. Any disputes shall 
            be resolved in the courts of Ontario.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">13. Contact</h2>
          <p className="text-sm leading-relaxed text-muted">
            For questions about these Terms, contact us at{" "}
            <a href="mailto:support@eduyro.com" className="text-brand-blue hover:underline">
              support@eduyro.com
            </a>.
          </p>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-border text-center">
        <Link href="/privacy" className="text-sm text-brand-blue hover:underline">
          Read our Privacy Policy →
        </Link>
      </div>
    </main>
  );
}
