"use client";

import TopNav from "../components/TopNav";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using Magic Invoice (the \"Service\"), you agree to these Terms. If you do not agree, do not use the Service.",
  },
  {
    title: "2. AI Output Disclaimer",
    content: "The Service uses generative AI to draft invoice content. AI output can be incomplete or inaccurate. You are responsible for reviewing, verifying, and approving invoices before sending them.",
  },
  {
    title: "3. User Responsibilities",
    list: [
      "Provide accurate and lawful billing information.",
      "Ensure you have permission to invoice your clients.",
      "Comply with applicable tax and invoicing requirements.",
    ],
  },
  {
    title: "4. Account Security",
    content: "You are responsible for safeguarding access to your account and for all activity under your credentials.",
  },
  {
    title: "5. Termination",
    content: "We may suspend or terminate access to the Service at any time for any reason, including misuse or violations of these Terms.",
  },
  {
    title: "6. Limitation of Liability",
    content: "To the maximum extent permitted by law, Magic Invoice is not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.",
  },
  {
    title: "7. Changes",
    content: "We may update these Terms from time to time by posting a revised version on this page.",
  },
  {
    title: "8. Contact Us",
    contact: true,
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: "clamp(28px, 5vw, 44px)", color: "var(--text-primary)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Terms of Service
          </h1>
          <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            Last updated: January 18, 2026
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {sections.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "28px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
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
                  For questions, contact{" "}
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
