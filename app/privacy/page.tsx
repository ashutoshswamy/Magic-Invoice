"use client";

import TopNav from "../components/TopNav";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. Overview",
    content: "This policy explains how Magic Invoice handles your personal information when you use our AI-powered invoicing service.",
  },
  {
    title: "2. Data We Collect",
    list: [
      "Identity data such as name and email address.",
      "Invoice data you create, including client details.",
      "Usage data to help improve the service.",
    ],
  },
  {
    title: "3. How We Use Your Data",
    list: [
      "Generate and store invoices you create.",
      "Maintain your account and preferences.",
      "Improve product performance and reliability.",
    ],
  },
  {
    title: "4. Data Sharing",
    content: "We do not sell your data. We share information only with service providers needed to operate Magic Invoice, including our authentication and storage providers and AI providers for invoice drafting.",
  },
  {
    title: "5. Data Security",
    content: "We rely on secure infrastructure and industry-standard protections to keep your data safe.",
  },
  {
    title: "6. Your Rights",
    list: [
      "Access, correct, or delete your account data.",
      "Request export of your invoice data.",
    ],
  },
  {
    title: "7. Changes",
    content: "We may update this policy by posting a revised version here.",
  },
  {
    title: "8. Contact Us",
    contact: true,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: "clamp(28px, 5vw, 44px)", color: "var(--text-primary)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            Last updated: January 18, 2026
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ padding: "28px 0", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: 17, color: "var(--text-primary)", margin: "0 0 12px" }}>
                {s.title}
              </h2>
              {s.content && (
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>{s.content}</p>
              )}
              {s.list && (
                <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.list.map((item, j) => (
                    <li key={j} style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>{item}</li>
                  ))}
                </ul>
              )}
              {s.contact && (
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>
                  For privacy questions, contact{" "}
                  <a href="mailto:ashutoshswamy397@gmail.com" style={{ color: "var(--gold)", textDecoration: "none" }}>
                    ashutoshswamy397@gmail.com
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
