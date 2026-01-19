"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart2,
  FileText,
  LayoutDashboard,
  LogIn,
  Settings,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export default function TopNav() {
  const pathname = usePathname();
  const isMarketing =
    pathname === "/" || pathname === "/login" || pathname === "/signup";
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let isMounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setIsSignedIn(Boolean(data?.user));
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setIsSignedIn(Boolean(session?.user));
      },
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="h-5 w-5 text-emerald-300" />
          </span>
          Magic Invoice
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium text-slate-200 md:flex">
          {isMarketing
            ? [
                { href: "/", label: "Product" },
                { href: "/#how-it-works", label: "How it works" },
                { href: "/#pricing", label: "Pricing" },
                { href: "/#security", label: "Security" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))
            : navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 transition ${
                      active ? "text-white" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
        </div>

        <div className="flex items-center gap-3">
          {isMarketing ? (
            <>
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/50 md:flex"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/50 md:flex"
                  >
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
                  >
                    Start free
                  </Link>
                </>
              )}
            </>
          ) : (
            <Link
              href="/settings"
              className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 md:flex"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          )}

          <motion.div
            layout
            className="md:hidden"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href={
                isMarketing
                  ? isSignedIn
                    ? "/dashboard"
                    : "/login"
                  : "/dashboard"
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              {isMarketing && !isSignedIn ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <LayoutDashboard className="h-4 w-4" />
              )}
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
