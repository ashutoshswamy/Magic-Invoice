"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebaseClient";
import { useAuth } from "../lib/useAuth";
import { Menu, X, LogOut } from "lucide-react";

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
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };
  const isMarketing =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu when pathname changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: scrolled
          ? "1px solid var(--border)"
          : "1px solid transparent",
        background: scrolled || menuOpen ? "rgba(12,10,6,0.95)" : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(12px)" : "none",
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
            zIndex: 60,
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

        {/* Desktop Nav links — hidden on mobile */}
        <div
          className="desktop-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
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
            zIndex: 60,
          }}
        >
          {isMarketing ? (
            isLoaded && isSignedIn ? (
              <Link
                href="/dashboard"
                className="btn-gold desktop-only"
                style={{ textDecoration: "none", fontSize: 11 }}
              >
                Dashboard →
              </Link>
            ) : (
              <div
                className="desktop-only"
                style={{ display: "flex", gap: 10 }}
              >
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
                className="desktop-only"
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
              <button
                onClick={handleSignOut}
                className="desktop-only"
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: 4,
              display: "none",
            }}
            className="mobile-menu-toggle"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: "fixed",
            top: 60,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--ink)",
            zIndex: 40,
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p className="section-label" style={{ fontSize: 10 }}>Navigation</p>
            {(isMarketing ? marketingNav : appNav).map((item) => {
              const active = !isMarketing && pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: 24,
                    fontWeight: 600,
                    color: active ? "var(--gold)" : "var(--text-primary)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {!isMarketing && (
             <div style={{ marginTop: "auto", paddingTop: 32, borderTop: "1px solid var(--border)" }}>
                <Link
                  href="/settings"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 14,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                  }}
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{
                    marginTop: 16,
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 14,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Sign out
                </button>
             </div>
          )}

          {isMarketing && !isSignedIn && (
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              <Link
                href="/login"
                className="btn-ghost"
                style={{ textDecoration: "none", justifyContent: "center", fontSize: 13, padding: "14px" }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="btn-gold"
                style={{ textDecoration: "none", justifyContent: "center", fontSize: 13, padding: "14px" }}
              >
                Start free →
              </Link>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 960px) {
          .desktop-nav, .desktop-only {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
