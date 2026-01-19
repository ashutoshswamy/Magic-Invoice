"use client";

import TopNav from "../components/TopNav";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pb-16 pt-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Privacy
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Last updated: January 18, 2026
          </p>
        </div>
        <div className="glass rounded-3xl p-6 text-sm text-slate-300 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white">1. Overview</h2>
            <p className="mt-2">
              This policy explains how Magic Invoice handles your personal
              information when you use our AI-powered invoicing service.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              2. Data We Collect
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Identity data such as name and email address.</li>
              <li>Invoice data you create, including client details.</li>
              <li>Usage data to help improve the service.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              3. How We Use Your Data
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Generate and store invoices you create.</li>
              <li>Maintain your account and preferences.</li>
              <li>Improve product performance and reliability.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              4. Data Sharing
            </h2>
            <p className="mt-2">
              We do not sell your data. We share information only with service
              providers needed to operate Magic Invoice, including our
              authentication and storage provider and AI providers for invoice
              drafting.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              5. Data Security
            </h2>
            <p className="mt-2">
              We rely on secure infrastructure and industry-standard protections
              to keep your data safe.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              6. Your Rights
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Access, correct, or delete your account data.</li>
              <li>Request export of your invoice data.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">7. Changes</h2>
            <p className="mt-2">
              We may update this policy by posting a revised version here.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              8. Contact Us
            </h2>
            <p className="mt-2">
              For privacy questions, contact{" "}
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
