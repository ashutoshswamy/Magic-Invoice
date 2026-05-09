"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import TopNav from "../components/TopNav";

const FREE_FEATURES = [
  "Unlimited invoices",
  "Unlimited clients",
  "Unlimited AI invoice generation",
  "GST calculation (CGST/SGST/IGST)",
  "Razorpay payment links",
  "GSTR-1 + GSTR-3B export",
  "Expense tracking + ITC",
  "AI cash flow insights",
  '"Built with Magic Invoice" branding',
];

export default function BillingPage() {
  const fieldLabel = {
    fontFamily: "var(--font-mono), monospace",
    fontSize: 9,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>
            Billing
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontWeight: 600,
              fontSize: "clamp(28px, 4vw, 40px)",
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            Free tier only
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              maxWidth: 680,
              lineHeight: 1.7,
            }}
          >
            Magic Invoice no longer has paid plans. Everything is included in
            the free tier, with no checkout flow, no subscription renewal, and
            no upgrade prompts.
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <p style={fieldLabel}>Included</p>
          <p
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 32,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "8px 0 4px",
            }}
          >
            Free
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 24,
            }}
          >
            No card needed. No paid upgrade path.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FREE_FEATURES.map((f) => (
              <div
                key={f}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <CheckCircle2
                  size={14}
                  style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }}
                />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Link
              href="/dashboard"
              className="btn-gold"
              style={{ textDecoration: "none", display: "inline-flex" }}
            >
              Open dashboard →
            </Link>
          </div>
        </div>

        <div
          className="card"
          style={{ padding: "20px 24px", borderLeft: "2px solid var(--gold)" }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.75,
            }}
          >
            <strong style={{ color: "var(--text-secondary)" }}>
              Need help?
            </strong>{" "}
            Email{" "}
            <span style={{ color: "var(--gold)" }}>
              support@magicinvoice.ai
            </span>
            . Billing is permanently disabled in this workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
