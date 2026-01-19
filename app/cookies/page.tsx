"use client";

import TopNav from "../components/TopNav";
import Footer from "../components/Footer";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pb-16 pt-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Cookies
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Cookie Policy
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Last updated: January 18, 2026
          </p>
        </div>
        <div className="glass rounded-3xl p-6 text-sm text-slate-300 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white">
              1. What Are Cookies?
            </h2>
            <p className="mt-2">
              Cookies are small text files stored on your device that help sites
              work properly and remember your preferences.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              2. How We Use Cookies
            </h2>
            <p className="mt-2">
              Magic Invoice uses cookies for essential functionality, including
              authentication and session security.
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Authentication and login sessions</li>
              <li>Security and CSRF protection</li>
              <li>Session state and preferences</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              3. Third-Party Cookies
            </h2>
            <p className="mt-2">
              We rely on our authentication provider and may use OAuth providers
              such as Google or GitHub, which can set their own cookies.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              4. Managing Cookies
            </h2>
            <p className="mt-2">
              Most browsers let you control cookies in settings. Disabling
              cookies may limit your ability to use core features of Magic
              Invoice.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">5. Changes</h2>
            <p className="mt-2">
              We may update this policy by posting a revised version here.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              6. Contact Us
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
