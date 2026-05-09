"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";

export default function Footer() {
  const { isSignedIn } = useAuth();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--ink)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "64px 24px 40px",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 48,
            paddingBottom: 48,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  border: "1px solid var(--gold)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "var(--gold)", fontSize: 11, fontFamily: "var(--font-mono), monospace", fontWeight: 600 }}>₹</span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontWeight: 600,
                  fontSize: 15,
                  color: "var(--text-primary)",
                }}
              >
                Magic Invoice
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 260, margin: "0 0 24px" }}>
              India-first AI invoicing. GST-compliant, Gemini-powered, built for
              freelancers and SMEs.
            </p>
            <a
              href="https://www.producthunt.com/products/magic-invoice-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-magic-invoice-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1065115&theme=light&t=1768842848845"
                alt="Magic Invoice on Product Hunt"
                width={200}
                height={44}
                style={{ opacity: 0.85, transition: "opacity 0.15s" }}
                unoptimized
              />
            </a>
          </div>

          {/* Product links */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 20,
              }}
            >
              Product
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { href: "/#how-it-works", label: "How it works" },
                { href: "/#pricing", label: "Pricing" },
                { href: "/#security", label: "Security" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    letterSpacing: "0.06em",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Account links */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 20,
              }}
            >
              Account
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {isSignedIn ? (
                <>
                  <Link href="/invoices" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.06em" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}>
                    Invoices
                  </Link>
                  <Link href="/clients" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.06em" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}>
                    Clients
                  </Link>
                  <Link href="/settings" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.06em" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}>
                    Settings
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.06em" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}>
                    Sign in
                  </Link>
                  <Link href="/signup" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.06em" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}>
                    Start free
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 20,
              }}
            >
              Contact
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { href: "mailto:ashutoshswamy397@gmail.com", label: "Email us" },
                { href: "https://github.com/ashutoshswamy", label: "GitHub" },
                { href: "https://linkedin.com/in/ashutoshswamy", label: "LinkedIn" },
                { href: "https://twitter.com/ashutoshswamy_", label: "Twitter" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.href.startsWith("mailto") ? undefined : "_blank"}
                  rel={item.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    letterSpacing: "0.06em",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--gold)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  {item.label} ↗
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            paddingTop: 28,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
            }}
          >
            © {new Date().getFullYear()} Magic Invoice. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { href: "/terms", label: "Terms" },
              { href: "/privacy", label: "Privacy" },
              { href: "/cookies", label: "Cookies" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  letterSpacing: "0.06em",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
