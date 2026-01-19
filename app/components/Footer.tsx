"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
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
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold">Magic Invoice</p>
            <p className="mt-2 max-w-sm text-sm text-slate-300">
              The AI-ready invoice workspace that transforms a single sentence
              into a client-ready document.
            </p>
            <a
              href="https://www.producthunt.com/products/magic-invoice-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-magic-invoice-2"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1065115&theme=light&t=1768842848845"
                alt="Magic Invoice - Turn a sentence into a client-ready invoice. | Product Hunt"
                width="250"
                height="54"
                className="transition hover:opacity-90"
              />
            </a>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-300">
            {isSignedIn ? null : (
              <>
                <Link href="/login" className="transition hover:text-white">
                  Sign in
                </Link>
                <Link href="/signup" className="transition hover:text-white">
                  Start free
                </Link>
              </>
            )}
            <Link href="/dashboard" className="transition hover:text-white">
              Dashboard
            </Link>
            <a
              className="inline-flex items-center gap-1 text-emerald-300 transition hover:text-emerald-200"
              href="mailto:ashutoshswamy397@gmail.com"
            >
              Contact sales <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>
            © {new Date().getFullYear()} Magic Invoice. All rights reserved.
          </span>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy policy
            </Link>
            <Link href="/cookies" className="transition hover:text-white">
              Cookie policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
