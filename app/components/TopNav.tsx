"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

const appNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/recurring", label: "Recurring" },
  { href: "/clients", label: "Clients" },
  { href: "/expenses", label: "Expenses" },
  { href: "/items", label: "Items" },
  { href: "/gstr", label: "GSTR" },
  { href: "/analytics", label: "Analytics" },
];

const marketingNav = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Free plan" },
  { href: "/#security", label: "Security" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const isMarketing =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
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
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          minHeight: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
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
        </Link>

        {/* Nav links — always visible, wrap on small screens */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {(isMarketing ? marketingNav : appNav).map((item) => {
            const active = !isMarketing && pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: active ? "var(--cream)" : "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                  borderBottom: active
                    ? "1px solid var(--gold)"
                    : "1px solid transparent",
                  paddingBottom: 2,
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.target as HTMLElement).style.color =
                      "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.target as HTMLElement).style.color = "var(--text-muted)";
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          {isMarketing ? (
            isLoaded && isSignedIn ? (
              <Link
                href="/dashboard"
                className="btn-gold"
                style={{ textDecoration: "none", fontSize: 11 }}
              >
                Dashboard →
              </Link>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
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
              </div>
            )
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Link
                href="/settings"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color =
                    "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = "var(--text-muted)";
                }}
              >
                Settings
              </Link>
              <UserButton />
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
