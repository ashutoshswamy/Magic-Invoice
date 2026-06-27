"use client";

import { useRef } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import Footer from "./components/Footer";
import { HeroSection } from "./components/blocks/hero-section-9";
import { Features } from "./components/blocks/features-8";
import {
  PricingTable,
  MAGIC_INVOICE_PLANS,
} from "./components/ui/pricing-table";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    num: "—01",
    title: "Describe the work",
    description:
      '"Invoice Acme Corp Rs 45,000 for 3 UX screens + workshop, 18% GST, due Feb 1."',
  },
  {
    num: "—02",
    title: "AI parses the details",
    description:
      "Line items, GST type, HSN codes, totals — all extracted and validated instantly.",
  },
  {
    num: "—03",
    title: "Send with confidence",
    description:
      "Download PDF, save to dashboard, or share a link with your client.",
  },
];

const securityPoints = [
  "Row-level security — your data never mingles with another user's",
  "Clerk authentication with MFA support",
  "Immutable financial records with soft-delete audit trail",
  "GST amounts stored at creation — not recomputed from historical rates",
];

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // How it works stagger reveal
    gsap.fromTo(
      ".step-card",
      { opacity: 0, y: 35, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current?.querySelector(".steps-grid"),
          start: "top 80%",
          toggleActions: "play none none none"
        }
      }
    );

    // Security stagger reveal
    gsap.fromTo(
      ".security-card",
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current?.querySelector(".security-grid"),
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} style={{ background: "var(--ink)", minHeight: "100vh" }}>
      <HeroSection />
      <main>
        {/* ── Features ─────────────────────────────────────────────────────── */}
        <Features />

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 24px" }}
        >
          <div style={{ maxWidth: 480, marginBottom: 64 }}>
            <p className="section-label" style={{ marginBottom: 16 }}>
              How it works
            </p>
            <h2
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontWeight: 600,
                fontSize: "clamp(28px, 4vw, 44px)",
                color: "var(--text-primary)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Three steps from thought to invoice.
            </h2>
          </div>
          <div
            className="steps-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {steps.map((step, index) => (
              <div
                key={step.num}
                className="step-card glass-panel"
                style={{
                  padding: "36px",
                  borderTop: "2px solid var(--border-bright)",
                  opacity: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 28,
                    color: "var(--border-bright)",
                    fontWeight: 600,
                    marginBottom: 20,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {step.num}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontWeight: 600,
                    fontSize: 18,
                    color: "var(--text-primary)",
                    marginBottom: 12,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    fontStyle: index === 0 ? "italic" : "normal",
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────────── */}
        <section
          id="pricing"
          style={{
            background: "var(--ink)",
            position: "relative",
            overflow: "hidden",
            padding: "120px 24px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {/* Decorative background element */}
          <div 
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "120%",
              height: "120%",
              background: "radial-gradient(circle at center, rgba(217, 119, 6, 0.03) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p className="section-label" style={{ marginBottom: 16 }}>
                Pricing
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontWeight: 600,
                  fontSize: "clamp(32px, 5vw, 56px)",
                  color: "var(--text-primary)",
                  lineHeight: 1.1,
                  margin: "0 0 24px",
                  letterSpacing: "-0.02em",
                }}
              >
                One plan.{" "}
                <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
                  Zero friction.
                </em>
              </h2>
              <p style={{ 
                fontSize: 16, 
                color: "var(--text-secondary)", 
                maxWidth: 600, 
                margin: "0 auto",
                lineHeight: 1.6
              }}>
                We believe in simple tools for complex problems. Get every feature we offer, for free, forever.
              </p>
            </div>

            <PricingTable
              plans={MAGIC_INVOICE_PLANS}
              billingCycle="monthly"
              onSelect={(id) => console.log("Selected:", id)}
              activePlanId="starter"
            />
          </div>
        </section>

        {/* ── Security ────────────────────────────────────────────────────── */}
        <section
          id="security"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 24px" }}
        >
          <div style={{ maxWidth: 480, marginBottom: 64 }}>
            <p className="section-label" style={{ marginBottom: 16 }}>
              Security
            </p>
            <h2
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontWeight: 600,
                fontSize: "clamp(28px, 4vw, 44px)",
                color: "var(--text-primary)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Your data. Your control.
            </h2>
          </div>
          <div
            className="security-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {securityPoints.map((point, index) => (
              <div
                key={index}
                className="security-card glass-panel"
                style={{
                  padding: "28px 32px",
                  opacity: 0,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {point}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px 96px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontWeight: 600,
              fontSize: "clamp(28px, 4vw, 44px)",
              color: "var(--text-primary)",
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            Ready to invoice{" "}
            <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
              smarter?
            </em>
          </h2>
          <Link
            href={isLoaded && isSignedIn ? "/dashboard" : "/signup"}
            className="btn-gold"
            style={{ textDecoration: "none" }}
          >
            {isLoaded && isSignedIn ? "Go to dashboard" : "Start free →"}
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}