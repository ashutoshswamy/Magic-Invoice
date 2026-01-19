"use client";

import TopNav from "../components/TopNav";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pb-16 pt-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Terms
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Last updated: January 18, 2026
          </p>
        </div>
        <div className="glass rounded-3xl p-6 text-sm text-slate-300 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing or using Magic Invoice (the “Service”), you agree to
              these Terms. If you do not agree, do not use the Service.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              2. AI Output Disclaimer
            </h2>
            <p className="mt-2">
              The Service uses generative AI to draft invoice content. AI output
              can be incomplete or inaccurate. You are responsible for
              reviewing, verifying, and approving invoices before sending them.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              3. User Responsibilities
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Provide accurate and lawful billing information.</li>
              <li>Ensure you have permission to invoice your clients.</li>
              <li>Comply with applicable tax and invoicing requirements.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              4. Account Security
            </h2>
            <p className="mt-2">
              You are responsible for safeguarding access to your account and
              for all activity under your credentials.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              5. Termination
            </h2>
            <p className="mt-2">
              We may suspend or terminate access to the Service at any time for
              any reason, including misuse or violations of these Terms.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              6. Limitation of Liability
            </h2>
            <p className="mt-2">
              To the maximum extent permitted by law, Magic Invoice is not
              liable for indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">7. Changes</h2>
            <p className="mt-2">
              We may update these Terms from time to time by posting a revised
              version on this page.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              8. Contact Us
            </h2>
            <p className="mt-2">
              For questions, contact{" "}
              <a
                className="text-emerald-200 underline"
                href="mailto:ashutoshswamy397@gmail.com"
              >
                ashutoshswamy397@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
