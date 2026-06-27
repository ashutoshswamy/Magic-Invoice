"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/* ── Nav items ──────────────────────────────────────────────────────────────── */

const menuItems = [
  { name: "Features", href: "/#features" },
  { name: "How it works", href: "/#how-it-works" },
  { name: "Pricing", href: "/#pricing" },
  { name: "Security", href: "/#security" },
];

/* ── Logo ────────────────────────────────────────────────────────────────────── */

const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <span
      style={{
        width: 28,
        height: 28,
        border: "1px solid var(--gold)",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: "var(--gold)",
          fontSize: 13,
          fontFamily: "var(--font-mono), monospace",
          fontWeight: 600,
        }}
      >
        ₹
      </span>
    </span>
    <span
      style={{
        fontFamily: "var(--font-playfair), serif",
        fontWeight: 600,
        fontSize: 17,
        color: "var(--text-primary)",
        letterSpacing: "-0.01em",
      }}
    >
      Magic Invoice
    </span>
  </div>
);

/* ── Inline invoice mockup ───────────────────────────────────────────────────── */

const parsedFields = [
  { label: "Client", value: "Rahul Sharma" },
  { label: "GST Type", value: "CGST + SGST" },
  { label: "Total", value: "₹17,700" },
  { label: "Invoice", value: "INV-2025-26-001" },
  { label: "HSN / SAC", value: "998312" },
  { label: "Due", value: "Mar 31, 2025" },
];

const bars = [35, 58, 42, 71, 55, 88, 62, 45, 79, 53, 91, 68];

const InvoiceMockup = () => (
  <div
    style={{
      background: "var(--ink-soft)",
      border: "1px solid var(--border-bright)",
      borderRadius: 3,
      overflow: "hidden",
      fontFamily: "var(--font-mono), monospace",
      boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(215,183,120,0.1)",
    }}
  >
    {/* Window chrome */}
    <div
      style={{
        background: "var(--ink-muted)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {["var(--ink-raised)", "var(--ink-raised)", "rgba(217,119,6,0.45)"].map(
        (bg, i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: bg,
              display: "block",
            }}
          />
        ),
      )}
      <span
        style={{
          marginLeft: "auto",
          fontSize: 8,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Magic Invoice · AI Studio
      </span>
    </div>

    {/* AI Prompt */}
    <div
      style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}
    >
      <p
        style={{
          fontSize: 8,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--gold)",
          marginBottom: 10,
        }}
      >
        AI Prompt
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          lineHeight: 1.75,
          margin: 0,
        }}
      >
        <span style={{ color: "var(--gold)", marginRight: 6 }}>›</span>
        &ldquo;Bill Rahul ₹15,000 for logo design + brand guidelines, 18% GST,
        due Mar 31. GSTIN 27AABCM1234R1Z5.&rdquo;
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 12,
            background: "var(--gold)",
            marginLeft: 3,
            verticalAlign: "middle",
            borderRadius: 1,
            animationName: "hero-blink",
            animationDuration: "1.1s",
            animationTimingFunction: "step-end",
            animationIterationCount: "infinite",
          }}
        />
      </p>
    </div>

    {/* Parsed fields */}
    <div
      style={{
        padding: "16px 24px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px 24px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {parsedFields.map(({ label, value }) => (
        <div key={label}>
          <p
            style={{
              fontSize: 7,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 4,
            }}
          >
            {label}
          </p>
          <p style={{ fontSize: 11, color: "var(--cream)", margin: 0 }}>
            {value}
          </p>
        </div>
      ))}
    </div>

    {/* Bar chart */}
    <div style={{ padding: "14px 24px 18px" }}>
      <p
        style={{
          fontSize: 7,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        Invoice volume — last 12 months
      </p>
      <div
        style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 32 }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background:
                i === 11
                  ? "var(--gold)"
                  : i >= 9
                    ? "rgba(217,119,6,0.25)"
                    : "var(--ink-raised)",
              borderRadius: "1px 1px 0 0",
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

/* ── Trust items ─────────────────────────────────────────────────────────────── */

const trustItems = [
  "CGST / SGST / IGST",
  "GSTR-1 Ready",
  "HSN / SAC Lookup",
  "Advanced AI Parser",
  "Supabase RLS",
  "Clerk Auth",
  "Resend Email",
  "Next.js 16",
];

/* ── HeroSection (main export) ───────────────────────────────────────────────── */

export const HeroSection = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(".hi-pill", { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.1 })
      .fromTo(".hi-h1", { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.9 }, "-=0.6")
      .fromTo(".hi-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .fromTo(".hi-cta", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .fromTo(".hi-mockup", { opacity: 0, x: 50, scale: 0.96 }, { opacity: 1, x: 0, scale: 1, duration: 1.1, ease: "back.out(1.15)" }, "-=0.7")
      .fromTo(".trust-item", { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.6 }, "-=0.5");
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <style>{`
        @keyframes hero-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .hi-pill, .hi-h1, .hi-sub, .hi-cta, .hi-mockup, .trust-item { opacity: 0; }

        .hi-nav-link {
          font-family: var(--font-mono), monospace;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-muted); text-decoration: none;
          transition: color 0.15s;
          white-space: nowrap;
        }
        .hi-nav-link:hover { color: var(--text-secondary); }
        .hi-mob-link {
          font-family: var(--font-mono), monospace;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text-secondary); text-decoration: none;
          display: block; padding: 13px 0;
          border-bottom: 1px solid var(--border);
          transition: color 0.15s;
        }
        .hi-mob-link:hover { color: var(--cream); }

        @media (max-width: 768px) {
          .hi-hero-grid { flex-direction: column !important; padding: 48px 24px 40px !important; }
          .hi-mockup-col { display: none !important; }
          .hi-copy-col { max-width: 100% !important; }
        }
        @media (max-width: 480px) {
          .hi-sub { font-size: 15px !important; }
        }
      `}</style>

      {/* ── Sticky nav ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: scrolled
            ? "1px solid var(--border)"
            : "1px solid transparent",
          background: scrolled ? "rgba(12,10,6,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <nav
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            minHeight: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            aria-label="Home"
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <Logo />
          </Link>

          {/* Desktop centre links */}
          <div
            className="hidden lg:flex"
            style={{
              alignItems: "center",
              gap: 28,
              flex: 1,
              justifyContent: "center",
            }}
          >
            {menuItems.map((item) => (
              <a key={item.name} href={item.href} className="hi-nav-link">
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop right CTAs */}
          <div
            className="hidden lg:flex"
            style={{ alignItems: "center", gap: 10, flexShrink: 0 }}
          >
            {isLoaded && isSignedIn ? (
              <Link
                href="/dashboard"
                className="btn-gold"
                style={{ textDecoration: "none" }}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-ghost"
                  style={{ textDecoration: "none" }}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="btn-gold"
                  style={{ textDecoration: "none" }}
                >
                  Start free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="lg:hidden"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              lineHeight: 0,
            }}
          >
            {menuOpen ? (
              <X size={22} style={{ color: "var(--text-primary)" }} />
            ) : (
              <Menu size={22} style={{ color: "var(--text-secondary)" }} />
            )}
          </button>
        </nav>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="lg:hidden"
            style={{
              background: "rgba(12,10,6,0.97)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderTop: "1px solid var(--border)",
              padding: "0 24px 24px",
            }}
          >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="hi-mob-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div style={{ display: "flex", gap: 10, paddingTop: 20 }}>
                {isLoaded && isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="btn-gold"
                    style={{ textDecoration: "none" }}
                  >
                    Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="btn-ghost"
                      style={{ textDecoration: "none" }}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="btn-gold"
                      style={{ textDecoration: "none" }}
                    >
                      Start free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero section ── */}
      <section
        style={{
          position: "relative",
          overflow: "clip",
          background: "var(--ink)",
          minHeight: "calc(100vh - 60px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Ruled-line texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(transparent,transparent 39px,rgba(215,183,120,0.04) 39px,rgba(215,183,120,0.04) 40px)",
            pointerEvents: "none",
          }}
        />

        {/* Gold radial glow — left-biased */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "-10%",
            width: "60vw",
            height: "70vh",
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(217,119,6,0.07) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Subtle right-side glow for mockup depth */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-5%",
            width: "45vw",
            height: "60vh",
            background:
              "radial-gradient(ellipse at 70% 50%, rgba(217,119,6,0.04) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Two-column grid ── */}
        <div
          className="hi-hero-grid"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "64px 64px 56px",
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 64,
          }}
        >
          {/* Left: copy column */}
          <div
            className="hi-copy-col"
            style={{ flex: "0 0 auto", maxWidth: 500 }}
          >
            {/* Pill badge */}
            <div className="hi-pill" style={{ marginBottom: 28 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  border: "1px solid var(--border-bright)",
                  padding: "5px 14px",
                  borderRadius: 1,
                }}
              >
                <Sparkles size={11} />
                India-first AI invoicing · Built for GST
              </span>
            </div>

            {/* H1 */}
            <h1
              className="hi-h1"
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontWeight: 600,
                fontSize: "clamp(36px, 4.5vw, 62px)",
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                color: "var(--text-primary)",
                margin: "0 0 22px",
              }}
            >
              Turn a sentence into{" "}
              <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
                a GST&#8209;ready invoice.
              </em>
            </h1>

            {/* Sub-copy */}
            <p
              className="hi-sub"
              style={{
                fontSize: 16,
                lineHeight: 1.75,
                color: "var(--text-secondary)",
                margin: "0 0 36px",
                maxWidth: 440,
              }}
            >
              Magic Invoice parses natural language, auto-detects CGST/SGST vs
              IGST, looks up HSN/SAC codes, and delivers a client-ready PDF in
              seconds.
            </p>

            {/* CTAs */}
            <div
              className="hi-cta"
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 44,
              }}
            >
              {isLoaded && isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="btn-gold"
                  style={{ textDecoration: "none" }}
                >
                  Go to dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="btn-gold"
                    style={{ textDecoration: "none" }}
                  >
                    Start free — no card needed
                  </Link>
                  <Link
                    href="/login"
                    className="btn-ghost"
                    style={{ textDecoration: "none" }}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            {/* Inline trust row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 12px",
                paddingTop: 20,
                borderTop: "1px solid var(--border)",
              }}
            >
              {[
                "CGST / SGST / IGST",
                "GSTR-1 Ready",
                "HSN / SAC Lookup",
                "AI-Powered Parsing",
              ].map((item) => (
                <span
                  key={item}
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span style={{ color: "var(--border-bright)", fontSize: 10 }}>
                    ⊕
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right: mockup column */}
          <div
            className="hi-mockup-col hi-mockup"
            style={{
              flex: 1,
              minWidth: 0,
              position: "relative",
            }}
          >
            {/* Gold underglow */}
            <div
              style={{
                position: "absolute",
                bottom: -24,
                left: "5%",
                right: "5%",
                height: 60,
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(217,119,6,0.2) 0%, transparent 70%)",
                filter: "blur(12px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Mockup — upright, full width of column */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                maskImage:
                  "linear-gradient(to bottom, black 75%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 75%, transparent 100%)",
              }}
            >
              <InvoiceMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section
        style={{
          background: "var(--ink-soft)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "32px 24px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Built on trusted infrastructure · India GST compliant
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px 16px",
            }}
          >
            {trustItems.map((item) => (
              <span
                key={item}
                className="trust-item"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                  padding: "4px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
