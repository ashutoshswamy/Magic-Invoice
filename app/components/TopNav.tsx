"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebaseClient";
import { useAuth } from "../lib/useAuth";
import { Menu, X, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

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
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#security", label: "Security" },
];

export function Logo() {
  return (
    <span className="nav-logo">
      <span className="nav-logo-mark" aria-hidden>₹</span>
      Magic Invoice
    </span>
  );
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);
  // Close the mobile menu on navigation (derived, no effect needed).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  const isMarketing =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    (isLoaded && !isSignedIn);
  const items = isMarketing ? marketingNav : appNav;

  const handleSignOut = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const authActions =
    isLoaded && isSignedIn ? (
      <Link href="/dashboard" className="btn-primary">
        Open dashboard
      </Link>
    ) : (
      <>
        <Link href="/login" className="btn-ghost">
          Sign in
        </Link>
        <Link href="/signup" className="btn-primary">
          Start free
        </Link>
      </>
    );

  return (
    <header className="nav">
      <nav className="nav-inner" aria-label="Main">
        <Link href={isLoaded && isSignedIn ? "/dashboard" : "/"} aria-label="Magic Invoice home">
          <Logo />
        </Link>

        <div className="nav-links">
          {items.map((item) => {
            const active = !isMarketing && pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <ThemeToggle />

        <div className="nav-actions">
          {isMarketing ? (
            authActions
          ) : (
            <>
              <Link
                href="/settings"
                className="nav-link"
                aria-current={pathname.startsWith("/settings") ? "page" : undefined}
              >
                Settings
              </Link>
              <button onClick={handleSignOut} className="nav-icon" aria-label="Sign out" title="Sign out">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="nav-toggle"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="nav-sheet">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-sheet-link"
              aria-current={!isMarketing && pathname.startsWith(item.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="nav-sheet-actions">
            {isMarketing ? (
              authActions
            ) : (
              <>
                <Link href="/settings" className="btn-ghost">
                  Settings
                </Link>
                <button onClick={handleSignOut} className="btn-ghost">
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
