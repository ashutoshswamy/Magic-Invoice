"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BrainCircuit,
  Cloud,
  FileText,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import TopNav from "./components/TopNav";
import Footer from "./components/Footer";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";

const features = [
  {
    title: "Natural language to invoice",
    description:
      "Describe the work in a single sentence and get a polished invoice in seconds.",
    icon: Wand2,
  },
  {
    title: "Secure & reliable",
    description: "Secure authentication and storage built for every invoice.",
    icon: Cloud,
  },
  {
    title: "Client-ready design",
    description:
      "Your invoices look like they were crafted in a premium studio.",
    icon: FileText,
  },
];

const steps = [
  {
    title: "Type the sentence",
    description: "“Invoice Acme for 2 UI screens and 1 workshop due by Feb 1.”",
  },
  {
    title: "AI shapes the details",
    description: "We parse line items, totals, and due dates instantly.",
  },
  {
    title: "Send with confidence",
    description: "Download, save, or share your invoice from the dashboard.",
  },
];

export default function Home() {
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
    <div className="bg-slate-950 text-slate-50">
      <TopNav />
      <main className="bg-grid">
        <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-16">
          <div className="absolute -top-12 right-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-[120px]" />
          <div className="absolute left-6 top-32 h-64 w-64 rounded-full bg-indigo-400/20 blur-[120px]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass flex flex-col gap-8 rounded-3xl p-10"
          >
            <div className="flex items-center gap-3 rounded-full border border-white/15 px-4 py-2 text-sm text-emerald-200">
              <Sparkles className="h-4 w-4" />
              AI invoice studio for modern teams
            </div>
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                Turn a sentence into a client-ready invoice.
              </h1>
              <p className="mt-4 text-lg text-slate-200">
                Magic Invoice captures the job details, calculates totals, and
                produces a professional invoice instantly — powered by your
                connected workspace.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={isSignedIn ? "/dashboard" : "/signup"}
                className="rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
              >
                {isSignedIn ? "Go to dashboard" : "Start free"}
              </Link>
              {isSignedIn ? null : (
                <Link
                  href="/dashboard"
                  className="rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white transition hover:border-white/50"
                >
                  View dashboard
                </Link>
              )}
            </div>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="glass rounded-3xl p-6"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-5 w-5 text-emerald-200" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl px-6 pb-20"
        >
          <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Describe the job. We design the invoice.
              </h2>
              <p className="mt-4 text-slate-300">
                Magic Invoice listens to your language, structures the data, and
                formats a beautiful invoice that’s ready to send.
              </p>
            </div>
            <div className="glass rounded-3xl p-6 md:w-[360px]">
              <div className="flex items-center gap-3 text-sm text-emerald-200">
                <BrainCircuit className="h-4 w-4" />
                AI prompt input
              </div>
              <p className="mt-3 text-sm text-slate-200">
                “Invoice Northwind for 3 UX screens and a product workshop at
                $450 each, due by Feb 1.”
              </p>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                className="rounded-3xl border border-white/10 bg-slate-900/40 p-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <p className="text-sm font-semibold text-emerald-200">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="glass grid gap-8 rounded-3xl p-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                Simple pricing
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Launch with a free workspace.
              </h2>
              <p className="mt-4 text-slate-300">
                Start free and scale as your invoicing needs grow. Connect your
                workspace for storage and authentication.
              </p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-slate-950/60 p-6">
              <h3 className="text-lg font-semibold">Starter</h3>
              <p className="mt-2 text-3xl font-semibold text-emerald-200">
                Free during launch
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Includes AI invoice drafts and secure invoice storage.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {[
                  "Unlimited draft invoices",
                  "Secure authentication",
                  "Branded invoice templates",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={isSignedIn ? "/dashboard" : "/signup"}
                className="mt-6 block rounded-full bg-emerald-400 px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
              >
                {isSignedIn ? "Go to dashboard" : "Create workspace"}
              </Link>
            </div>
          </div>
        </section>

        <section id="security" className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
              <ShieldCheck className="h-6 w-6 text-emerald-200" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                Secure by design
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Secure authentication keeps your client data protected with
                modern standards. Access controls are ready the moment you
                connect.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
              <FileText className="h-6 w-6 text-emerald-200" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                Professional invoices
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Every invoice includes polished typography, line items, and
                totals that clients can trust.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="glass flex flex-col gap-6 rounded-3xl p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                Custom AI builds
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Custom made AI invoice generators
              </h2>
              <p className="mt-4 text-sm text-slate-300">
                Contact ashutoshswamy397@gmail.com to discuss a tailored invoice
                experience for your team.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-slate-200">
              <a
                href="mailto:ashutoshswamy397@gmail.com"
                className="rounded-full border border-white/20 px-5 py-2 text-center font-semibold text-white transition hover:border-white/50"
              >
                Email: ashutoshswamy397@gmail.com
              </a>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/ashutoshswamy"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50"
                >
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/ashutoshswamy"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50"
                >
                  LinkedIn
                </a>
                <a
                  href="https://twitter.com/ashutoshswamy_"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50"
                >
                  Twitter
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
