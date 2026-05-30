// src/app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Eduyro",
  description: "Privacy Policy for Eduyro mastery learning platform.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted hover:text-ink transition-colors">
          ← Back to home
        </Link>
      </div>

      <h1 className="font-serif text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted mb-10">Last updated: May 27, 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-ink">

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">1. Introduction</h2>
          <p className="text-sm leading-relaxed text-muted">
            Eduyro Education Inc. ("we", "us", "our") operates eduyro.com. This Privacy Policy explains 
            how we collect, use, and protect your personal information when you use our Service. We are 
            committed to protecting the privacy of children and families.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">2. Information We Collect</h2>
          <p className="text-sm leading-relaxed text-muted mb-3">
            <strong>Account Information:</strong> Name, email address, password (encrypted), and role 
            (parent or student) when you register.
          </p>
          <p className="text-sm leading-relaxed text-muted mb-3">
            <strong>Child Information:</strong> First name, grade level, date of birth (to verify age 
            for COPPA compliance), and learning progress data.
          </p>
          <p className="text-sm leading-relaxed text-muted mb-3">
            <strong>Usage Data:</strong> Worksheet completion, scores, streak data, and placement test 
            results. This data is used solely to personalize the learning experience.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            <strong>Payment Information:</strong> Billing is handled entirely by Stripe. We do not store 
            credit card numbers or payment details on our servers.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">3. Children's Privacy (COPPA)</h2>
          <p className="text-sm leading-relaxed text-muted mb-3">
            We comply with the Children's Online Privacy Protection Act (COPPA). We do not knowingly 
            collect personal information from children under 13 without verifiable parental consent.
          </p>
          <p className="text-sm leading-relaxed text-muted mb-3">
            Children under 13 may only use Eduyro through a parent account. Before activating a child 
            account, we require the parent to verify consent. Parents may review, update, or delete their 
            child's information at any time by contacting us at{" "}
            <a href="mailto:privacy@eduyro.com" className="text-brand-blue hover:underline">
              privacy@eduyro.com
            </a>.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            We do not use children's data for advertising, we do not share it with third parties for 
            marketing, and we collect only what is necessary to provide the educational service.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">4. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted">
            <li>To provide and personalize the learning experience</li>
            <li>To track progress and generate daily worksheet packets</li>
            <li>To send account-related emails (verification, password reset, progress updates)</li>
            <li>To process payments and manage subscriptions</li>
            <li>To improve our curriculum and platform</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">5. Information Sharing</h2>
          <p className="text-sm leading-relaxed text-muted mb-3">
            We do not sell your personal information. We share information only with:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted">
            <li><strong>Stripe</strong> — for payment processing</li>
            <li><strong>Resend</strong> — for transactional email delivery</li>
            <li><strong>Neon</strong> — for secure database hosting</li>
            <li><strong>Vercel</strong> — for application hosting</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted mt-3">
            Each of these providers is bound by their own privacy policies and data protection agreements.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">6. Data Retention</h2>
          <p className="text-sm leading-relaxed text-muted">
            We retain your account data for as long as your account is active. If you delete your account, 
            we will delete your personal data within 30 days, except where we are required to retain it 
            for legal or financial compliance purposes.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">7. Security</h2>
          <p className="text-sm leading-relaxed text-muted">
            We use industry-standard security measures including encrypted passwords (bcrypt), HTTPS 
            throughout, and secure database hosting. While we take security seriously, no system is 
            completely immune to risk.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">8. Your Rights</h2>
          <p className="text-sm leading-relaxed text-muted mb-3">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent for data processing</li>
            <li>Export your data in a portable format</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@eduyro.com" className="text-brand-blue hover:underline">
              privacy@eduyro.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">9. Cookies</h2>
          <p className="text-sm leading-relaxed text-muted">
            We use essential cookies only — for authentication sessions and security tokens. We do not 
            use advertising cookies or third-party tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">10. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed text-muted">
            We may update this Privacy Policy from time to time. We will notify you of significant 
            changes by email. Continued use of the Service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">11. Contact</h2>
          <p className="text-sm leading-relaxed text-muted">
            For privacy questions or to exercise your rights, contact us at{" "}
            <a href="mailto:privacy@eduyro.com" className="text-brand-blue hover:underline">
              privacy@eduyro.com
            </a>.
          </p>
          <p className="text-sm leading-relaxed text-muted mt-2">
            Eduyro Education Inc.<br />
            Brampton, Ontario, Canada
          </p>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-border text-center">
        <Link href="/terms" className="text-sm text-brand-blue hover:underline">
          Read our Terms of Service →
        </Link>
      </div>
    </main>
  );
}
