"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ShieldCheck, KeyRound, History, Landmark } from "lucide-react";
import { useAuth } from "../lib/useAuth";
import TopNav from "./TopNav";
import Footer from "./Footer";
import HeroDemo from "./HeroDemo";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    title: "Describe the work",
    body: "Write one sentence the way you would text a colleague: who, what, how much, when it is due.",
  },
  {
    title: "Check the draft",
    body: "Line items, SAC codes and the GST split come back filled in. Edit anything before you save.",
  },
  {
    title: "Send and get paid",
    body: "Save it as a PDF or share a Razorpay link your client can pay by UPI or card.",
  },
];

const included = [
  "Unlimited invoices",
  "Sentence-to-invoice drafting",
  "CGST, SGST and IGST detection",
  "HSN and SAC codes on every line",
  "GSTR-1 export and GSTR-3B summary",
  "Expenses and input tax credit",
  "Recurring invoice templates",
  "Print-ready PDF invoices",
  "Cash flow insights",
];

const security = [
  { icon: ShieldCheck, title: "Isolated by account", body: "Firestore security rules keep your records readable only by you." },
  { icon: KeyRound, title: "Google or email sign-in", body: "Authentication runs on Firebase, with session cookies set server-side." },
  { icon: History, title: "Deleted invoices are kept", body: "Removing an invoice hides it instead of erasing it, so your sales history stays intact." },
  { icon: Landmark, title: "Tax rate locked per invoice", body: "Each invoice keeps the GST rate and type it was issued with, even if you change defaults later." },
];

const codes = [
  { code: "998391", label: "Specialty design" },
  { code: "998314", label: "IT design and development" },
  { code: "998313", label: "IT consulting and support" },
];

export default function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const signedIn = isLoaded && isSignedIn;
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero copy settles in before the demo starts typing.
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .from(".hero-line", { yPercent: 110, duration: 0.9, stagger: 0.08 })
          .from(".hero-fade", { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.08 }, "-=0.5");
        gsap.set(".hero-copy", { visibility: "visible" });

        // Feature tiles arrive as a group, not one by one per scroll tick.
        ScrollTrigger.batch(".bento-cell", {
          start: "top 85%",
          once: true,
          onEnter: (els) =>
            gsap.from(els, { autoAlpha: 0, y: 28, duration: 0.7, stagger: 0.08, ease: "power3.out" }),
        });

        // The step connector draws with scroll: the sequence is the point.
        gsap.from(".steps-rule", {
          scaleX: 0,
          transformOrigin: "left center",
          ease: "none",
          scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 60%", scrub: 0.6 },
        });
        gsap.utils.toArray<HTMLElement>(".step").forEach((el) =>
          gsap.from(el, {
            autoAlpha: 0,
            y: 20,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
          }),
        );

        // Receipt rows print in, top to bottom.
        gsap.from(".receipt-row", {
          autoAlpha: 0,
          y: -6,
          duration: 0.35,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: { trigger: ".receipt", start: "top 75%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const primaryCta = signedIn
    ? { href: "/dashboard", label: "Open dashboard" }
    : { href: "/signup", label: "Start free" };

  return (
    <div ref={root} className="min-h-dvh bg-bg text-ink">
      <TopNav />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:min-h-[calc(100dvh-64px)] lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pb-16 lg:pt-8">
          <div data-prehide className="hero-copy max-w-[660px]">
            <h1 className="font-head text-[clamp(38px,4.6vw,62px)] font-extrabold leading-[1] [font-stretch:112%]">
              <span className="block overflow-hidden pb-1"><span className="hero-line block">Type the job.</span></span>
              <span className="block overflow-hidden pb-1"><span className="hero-line block text-accent">Get a GST invoice.</span></span>
            </h1>
            <p className="hero-fade mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-2">
              Describe your work in one sentence. Magic Invoice writes the line items, SAC codes and tax split.
            </p>
            <div className="hero-fade mt-8 flex flex-wrap gap-3">
              <Link href={primaryCta.href} className="btn-primary !px-6 !py-3.5 !text-[15px]">
                {primaryCta.label} <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-ghost !px-6 !py-3.5 !text-[15px]">
                How it works
              </a>
            </div>
          </div>

          <HeroDemo delay={0.9} />
        </section>

        {/* ── Features (bento, 5 cells) ─────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-24 sm:px-6">
          <h2 className="max-w-[18ch] font-head text-[clamp(30px,4vw,48px)] font-bold leading-[1.05]">
            Everything an Indian invoice needs.
          </h2>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            <article className="bento-cell rounded-[var(--radius-lg)] border border-line bg-surface p-7 lg:col-span-2">
              <h3 className="font-head text-2xl font-bold">Write it like a message</h3>
              <p className="mt-2 max-w-[48ch] text-ink-2">
                No forms to start. The AI reads your sentence and pulls out every field an invoice needs.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-code text-[13px]">
                {[
                  ["client", "Rahul Sharma"],
                  ["amount", "₹15,000"],
                  ["gst", "18%"],
                  ["due", "31 Mar"],
                  ["items", "2"],
                ].map(([k, v]) => (
                  <span key={k} className="rounded-md border border-line-strong bg-bg px-2.5 py-1.5">
                    <span className="text-ink-3">{k}</span> <span className="text-accent">{v}</span>
                  </span>
                ))}
              </div>
            </article>

            <article className="bento-cell rounded-[var(--radius-lg)] border border-line bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] p-7">
              <h3 className="font-head text-2xl font-bold">The right GST split</h3>
              <p className="mt-2 text-ink-2">Same state or across states, the tax type is chosen from both GSTINs.</p>
              <dl className="mt-6 space-y-3 font-code text-[13px]">
                <div className="flex justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-ink-2">MH to MH</dt>
                  <dd className="text-accent">CGST 9% + SGST 9%</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-ink-2">MH to KA</dt>
                  <dd className="text-accent">IGST 18%</dd>
                </div>
              </dl>
            </article>

            <article className="bento-cell rounded-[var(--radius-lg)] border border-line bg-surface p-7">
              <h3 className="font-head text-2xl font-bold">Codes filled in</h3>
              <p className="mt-2 text-ink-2">The AI adds an HSN or SAC code to each line. Saved items keep their own.</p>
              <ul className="mt-6 space-y-2 font-code text-[13px]">
                {codes.map((c) => (
                  <li key={c.code} className="flex gap-3">
                    <span className="text-accent">{c.code}</span>
                    <span className="text-ink-2">{c.label}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="bento-cell flex flex-col justify-between rounded-[var(--radius-lg)] bg-accent p-7 text-on-accent">
              <h3 className="font-head text-2xl font-bold">GSTR-1 export, 3B summary</h3>
              <p className="mt-6 opacity-85">
                Download GSTR-1 as CSV or JSON and see your 3B tax totals, built from the invoices you already issued.
              </p>
            </article>

            <article className="bento-cell rounded-[var(--radius-lg)] border border-line bg-surface-2 p-7">
              <h3 className="font-head text-2xl font-bold">Paid by link</h3>
              <p className="mt-2 text-ink-2">
                Attach a Razorpay payment link. Status flips to paid on its own when the money lands.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 font-code text-[13px]">
                <span className="stamp-sent">Sent</span>
                <ArrowRight size={14} className="text-ink-3" />
                <span className="stamp-paid">Paid</span>
              </p>
            </article>
          </div>
        </section>

        {/* ── How it works (a real sequence, so it is numbered) ─────────────── */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="steps mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
            <h2 className="font-head text-[clamp(30px,4vw,48px)] font-bold leading-[1.05]">
              From sentence to sent in three steps.
            </h2>
            <div className="relative mt-14">
              <div className="steps-rule absolute left-5 right-[calc((100%-4rem)/3-20px)] top-[19px] hidden h-[2px] bg-accent md:block" aria-hidden />
              <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
                {steps.map((s, i) => (
                  <li key={s.title} className="step relative">
                    <span className="relative grid size-10 place-items-center rounded-full border-2 border-accent bg-surface font-code text-sm font-semibold text-accent">
                      {i + 1}
                    </span>
                    <h3 className="mt-5 font-head text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 max-w-[34ch] text-ink-2">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── Pricing (receipt) ─────────────────────────────────────────────── */}
        <section id="pricing" className="mx-auto grid max-w-[1240px] scroll-mt-20 items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="section-label">Pricing</p>
            <h2 className="mt-4 font-head text-[clamp(30px,4vw,48px)] font-bold leading-[1.05]">
              Free, with every feature.
            </h2>
            <p className="mt-4 max-w-[44ch] text-lg text-ink-2">
              One plan. No invoice limits, no card on file, nothing locked behind an upgrade.
            </p>
          </div>

          <div className="receipt perforated mx-auto w-full max-w-[440px] rounded-b-[var(--radius-lg)] bg-surface px-7 pb-7 pt-9 font-code text-[13.5px] shadow-[var(--shadow)]">
            <p className="receipt-row text-center text-xs uppercase tracking-[0.12em] text-ink-3">Starter plan</p>
            <ul className="mt-5 border-t border-dashed border-line-strong pt-4">
              {included.map((f) => (
                <li key={f} className="receipt-row flex justify-between gap-4 py-1">
                  <span className="text-ink">{f}</span>
                  <span className="text-ink-3">₹0</span>
                </li>
              ))}
            </ul>
            <div className="receipt-row mt-4 flex items-baseline justify-between border-t border-dashed border-line-strong pt-4">
              <span className="font-sans font-semibold">Total per month</span>
              <span className="text-3xl font-semibold text-accent">₹0</span>
            </div>
            <Link href={primaryCta.href} className="receipt-row btn-primary mt-6 w-full !py-3.5 font-sans">
              {primaryCta.label}
            </Link>
          </div>
        </section>

        {/* ── Security ──────────────────────────────────────────────────────── */}
        <section id="security" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 pb-24 sm:px-6">
          <h2 className="font-head text-[clamp(30px,4vw,48px)] font-bold leading-[1.05]">Your books stay yours.</h2>
          <div className="mt-12 grid gap-x-12 gap-y-10 border-t border-line pt-10 sm:grid-cols-2">
            {security.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <Icon size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <h3 className="font-sans text-base font-semibold tracking-normal [font-stretch:100%]">{title}</h3>
                  <p className="mt-1 max-w-[42ch] text-ink-2">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 rounded-[var(--radius-lg)] border border-line bg-surface p-8 sm:p-12 md:flex-row md:items-center">
            <h2 className="max-w-[20ch] font-head text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.08]">
              Your next invoice is one sentence away.
            </h2>
            <Link href={primaryCta.href} className="btn-primary !px-7 !py-4 !text-base">
              {primaryCta.label} <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
