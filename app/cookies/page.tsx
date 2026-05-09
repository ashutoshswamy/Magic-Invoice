"use client";

import TopNav from "../components/TopNav";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. What Are Cookies?",
    content: "Cookies are small text files stored on your device that help sites work properly and remember your preferences.",
  },
  {
    title: "2. How We Use Cookies",
    content: "Magic Invoice uses cookies for essential functionality, including authentication and session security.",
    list: [
      "Authentication and login sessions",
      "Security and CSRF protection",
      "Session state and preferences",
    ],
  },
  {
    title: "3. Third-Party Cookies",
    content: "We rely on our authentication provider and may use OAuth providers such as Google or GitHub, which can set their own cookies.",
  },
  {
    title: "4. Managing Cookies",
    content: "Most browsers let you control cookies in settings. Disabling cookies may limit your ability to use core features of Magic Invoice.",
  },
  {
    title: "5. Changes",
    content: "We may update this policy by posting a revised version here.",
  },
  {
    title: "6. Contact Us",
    contact: true,
  },
];

export default function CookiesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: "clamp(28px, 5vw, 44px)", color: "var(--text-primary)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Cookie Policy
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
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: s.list ? 12 : 0 }}>{s.content}</p>
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
