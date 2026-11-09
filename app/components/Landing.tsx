"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ShieldCheck, KeyRound, History, Landmark } from "lucide-react";
import { useAuth } from "../lib/useAuth";
import TopNav from "./TopNav";
import Footer from "./Footer";
import HeroDemo from "./HeroDemo";

gsap.registerPlugin(ScrollTrigger, SplitText, TextPlugin);

const steps = [
  {
    verb: "Type", cap: "#f4b400", capInk: "#17130f",
    title: "Describe the work",
    body: "Write one sentence the way you would text a colleague: who, what, how much, when it is due.",
  },
  {
    verb: "Check", cap: "#c8321a", capInk: "#fff8f0",
    title: "Check the draft",
    body: "Line items, SAC codes and the GST split come back filled in. Edit anything before you save.",
  },
  {
    verb: "Send", cap: "#0b7a6e", capInk: "#ffffff",
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

// Sample data for the how-it-works stage (same invoice as the hero demo).
const SAMPLE_PROMPT = "Bill Rahul Sharma ₹15,000 for logo design and brand guidelines, 18% GST, due 31 Mar.";

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

        // Scroll progress: how far through the page you are, as a carbon-blue hairline.
        gsap.to(".scroll-progress", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.2 },
        });

        // Depth: copy, invoice and glow drift at different speeds as the hero leaves.
        const hero = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
        gsap.to(".hero-copy", { y: 70, ease: "none", scrollTrigger: hero });
        gsap.to(".hero-demo", { y: -70, ease: "none", scrollTrigger: hero });
        gsap.to(".hero-dots", { y: 60, ease: "none", scrollTrigger: hero });

        // Section headings rise out of a line mask.
        gsap.utils.toArray<HTMLElement>(".reveal-h").forEach((el) =>
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 0.9,
                stagger: 0.1,
                ease: "power4.out",
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              }),
          }),
        );

        // Feature tiles arrive as a group, not one by one per scroll tick.
        ScrollTrigger.batch(".bento-cell", {
          start: "top 88%",
          once: true,
          onEnter: (els) =>
            gsap.from(els, {
              autoAlpha: 0,
              y: 48,
              scale: 0.96,
              duration: 0.9,
              stagger: 0.1,
              ease: "power3.out",
              clearProps: "transform,opacity,visibility", // hand transform back to CSS hover
            }),
        });
        // Extracted fields pop in, as if the sentence were being read.
        gsap.from(".field-chip", {
          autoAlpha: 0,
          scale: 0.7,
          y: 10,
          duration: 0.45,
          stagger: 0.09,
          ease: "back.out(2)",
          scrollTrigger: { trigger: ".field-chips", start: "top 85%", once: true },
        });

        // Receipt prints out of the slot, then each row is struck.
        gsap
          .timeline({ scrollTrigger: { trigger: ".receipt", start: "top 80%", once: true } })
          .from(".receipt", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "power2.inOut" })
          .from(".receipt-row", { autoAlpha: 0, y: -6, duration: 0.3, stagger: 0.05, ease: "power2.out" }, "-=0.7");

        // Security points settle in together.
        ScrollTrigger.batch(".sec-item", {
          start: "top 88%",
          once: true,
          onEnter: (els) => gsap.from(els, { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.1, ease: "power3.out" }),
        });

        // Closing panel grows to full width as it arrives.
        gsap.fromTo(
          ".closing-panel",
          { scale: 0.9, borderRadius: 56 },
          {
            scale: 1,
            borderRadius: 18,
            ease: "none",
            scrollTrigger: { trigger: ".closing-panel", start: "top 95%", end: "top 45%", scrub: true },
          },
        );
      });

      // The road: lit stretch of highway follows the scroll, each milestone stone
      // rises as you reach it, and its proof sheet plays once.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lit = (sel: string, from: string, to: string) =>
          gsap.fromTo(sel, { clipPath: from }, {
            clipPath: to,
            ease: "none",
            scrollTrigger: { trigger: ".road-track", start: "top 75%", end: "bottom 55%", scrub: 0.5 },
          });
        const mq = gsap.matchMedia();
        mq.add("(min-width: 1024px)", () => lit(".road-lit-h", "inset(0 100% 0 0)", "inset(0 0% 0 0)"));
        mq.add("(max-width: 1023px)", () => lit(".road-lit-v", "inset(0 0 100% 0)", "inset(0 0 0% 0)"));

        gsap.set(".stone", { autoAlpha: 0, y: 36, scale: 0.8 });
        gsap.set(".scene-prompt", { text: "" });
        gsap.set(".scene-field", { autoAlpha: 0, y: 10 });
        gsap.set(".scene-row", { autoAlpha: 0, x: -12 });
        gsap.set(".scene-pay", { autoAlpha: 0, y: 12 });
        gsap.set(".scene-stamp", { autoAlpha: 0, scale: 1.9, rotation: -16 });

        gsap.utils.toArray<HTMLElement>(".road-step").forEach((el, i) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 72%", once: true } });
          tl.to(el.querySelector(".stone"), { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.8)" });
          if (i === 0)
            tl.to(".scene-prompt", { text: SAMPLE_PROMPT, duration: 1.8, ease: "none" }, "-=0.2")
              .to(".scene-field", { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.12, ease: "power2.out" }, "-=0.2");
          if (i === 1) tl.to(".scene-row", { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.14, ease: "power2.out" }, "-=0.3");
          if (i === 2)
            tl.to(".scene-pay", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.2, ease: "power2.out" }, "-=0.3")
              .to(".scene-stamp", { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.45, ease: "back.out(2.4)" }, "+=0.1");
        });
        return () => mq.revert();
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
      <div
        aria-hidden
        className="scroll-progress fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-accent motion-reduce:hidden"
        style={{ transform: "scaleX(0)" }}
      />
      <TopNav />

      <main>
        {/* Hero: marigold ground, the invoice in a painted frame */}
        <div className="hero hero-ground fringe mb-4">
          <div aria-hidden className="hero-dots pointer-events-none absolute inset-0" />
          <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-24 pt-12 sm:px-6 lg:min-h-[calc(100dvh-64px)] lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-20 lg:pt-8">
            <div data-prehide className="hero-copy max-w-[680px]">
              <h1 className="font-head text-[clamp(38px,4.8vw,72px)] leading-[1.05]">
                <span className="block overflow-hidden pb-3"><span className="hero-line block">Type the job.</span></span>
                <span className="block overflow-hidden pb-3"><span className="hero-line block">Get a <span className="underline-paint">GST invoice.</span></span></span>
              </h1>
              <p className="hero-fade mt-6 max-w-[44ch] text-lg leading-relaxed">
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

            <div className="hero-demo w-full max-w-[580px] justify-self-center lg:justify-self-end">
              <div className="painted-frame -rotate-1">
                <HeroDemo delay={0.9} />
              </div>
            </div>
          </section>
        </div>

        {/* Features: asymmetric bento, five painted cells of different weight */}
        <section id="features" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-24 sm:px-6">
          <h2 className="reveal-h max-w-[18ch] font-head text-[clamp(32px,4.2vw,56px)] leading-[1.05]">
            Everything an Indian invoice needs.
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            {/* A: the sentence, as a painted speech bubble that becomes fields */}
            <article className="bento-cell tone-ink flex flex-col rounded-[var(--radius-lg)] p-7 md:col-span-2 lg:col-span-7 lg:p-9">
              <h3 className="font-head text-3xl lg:text-4xl">Write it like a message</h3>
              <p className="mt-2 max-w-[48ch] text-ink-2">
                No forms to start. The AI reads your sentence and pulls out every field an invoice needs.
              </p>
              <p className="mt-7 max-w-[34ch] rounded-2xl rounded-bl-sm border-2 border-[#17130f] bg-[#f4b400] px-5 py-4 text-[17px] font-medium leading-snug text-[#17130f]">
                Bill Rahul Sharma ₹15,000 for logo design, 18% GST, due 31 Mar.
              </p>
              <div className="field-chips mt-auto flex pt-6 flex-wrap gap-2 font-code text-[13px]">
                {[
                  ["client", "Rahul Sharma"],
                  ["amount", "₹15,000"],
                  ["gst", "18%"],
                  ["due", "31 Mar"],
                  ["items", "2"],
                ].map(([k, v]) => (
                  <span key={k} className="field-chip rounded-lg border border-line-strong px-2.5 py-1.5">
                    <span className="text-ink-3">{k}</span> <span className="text-accent">{v}</span>
                  </span>
                ))}
              </div>
            </article>

            {/* B: tax split, the two outcomes as big numerals */}
            <article className="bento-cell tone-gold flex flex-col rounded-[var(--radius-lg)] p-7 lg:col-span-5 lg:p-9">
              <h3 className="font-head text-3xl lg:text-4xl">The right GST split</h3>
              <p className="mt-2 text-ink-2">Same state or across states, the tax type is chosen from both GSTINs.</p>
              <dl className="mt-auto grid gap-3 pt-7 font-code">
                <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-[#17130f] px-4 py-3">
                  <dt className="text-[13px]">MH to MH</dt>
                  <dd className="font-head text-2xl">9% + 9%</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-[#17130f] bg-[#17130f] px-4 py-3 text-[#f4b400]">
                  <dt className="text-[13px]">MH to KA</dt>
                  <dd className="font-head text-2xl">18%</dd>
                </div>
              </dl>
              <p className="mt-3 font-code text-[12px]">CGST + SGST within a state, IGST across states.</p>
            </article>

            {/* C: codes as stamped tags */}
            <article className="bento-cell flex flex-col rounded-[var(--radius-lg)] border-2 border-ink bg-surface p-7 lg:col-span-4">
              <h3 className="font-head text-3xl">Codes filled in</h3>
              <p className="mt-2 text-ink-2">The AI adds an HSN or SAC code to each line. Saved items keep their own.</p>
              <ul className="mt-auto space-y-3 pt-6">
                {codes.map((c) => (
                  <li key={c.code} className="flex items-center gap-3">
                    <span className="rounded-md border-2 border-accent px-2 py-0.5 font-code text-[13px] font-semibold text-accent">{c.code}</span>
                    <span className="text-[14px] text-ink-2">{c.label}</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* D: GSTR export */}
            <article className="bento-cell tone-red flex flex-col justify-between rounded-[var(--radius-lg)] p-7 md:col-span-2 lg:col-span-3">
              <div>
                <p className="font-head text-4xl leading-none whitespace-nowrap lg:text-5xl">GSTR-1</p>
                <div className="mt-4 flex gap-2 font-code text-[12px] font-semibold">
                  <span className="rounded-md border-2 border-current px-2 py-0.5">CSV</span>
                  <span className="rounded-md border-2 border-current px-2 py-0.5">JSON</span>
                </div>
              </div>
              <p className="mt-8">
                Export GSTR-1 and see your 3B tax totals, built from the invoices you already issued.
              </p>
            </article>

            {/* E: payment link */}
            <article className="bento-cell tone-teal flex flex-col rounded-[var(--radius-lg)] p-7 md:col-span-2 lg:col-span-5">
              <h3 className="font-head text-3xl lg:text-4xl">Paid by link</h3>
              <p className="mt-2 max-w-[40ch]">
                Attach a Razorpay payment link. Status flips to paid on its own when the money lands.
              </p>
              <p className="mt-auto inline-flex items-center gap-3 self-start pt-7">
                <span className="-rotate-2 rounded-md border-[3px] border-current px-3 py-1 font-head text-xl uppercase">Sent</span>
                <ArrowRight size={18} />
                <span className="rotate-2 rounded-md border-[3px] border-current px-3 py-1 font-head text-xl uppercase">Paid</span>
              </p>
            </article>
          </div>
        </section>

        {/* How it works: a highway with three milestone stones */}
        <section id="how-it-works" className="scroll-mt-20 border-y-2 border-ink bg-surface">
          <div className="steps mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
            <h2 className="reveal-h max-w-[16ch] font-head text-[clamp(32px,4.2vw,56px)] leading-[1.05]">
              From sentence to sent in three steps.
            </h2>

            <ol className="road-track relative mt-16 grid gap-14 lg:grid-cols-3 lg:gap-10">
              {/* Road: horizontal on desktop, vertical on small screens. The lit copy is what scroll drives. */}
              <div aria-hidden className="road road-h absolute inset-x-0 top-[92px] hidden h-5 lg:block">
                <div className="road-lit road-lit-h absolute inset-0" style={{ clipPath: "inset(0 100% 0 0)" }} />
              </div>
              <div aria-hidden className="road road-v absolute bottom-0 left-[37px] top-6 w-5 lg:hidden">
                <div className="road-lit road-lit-v absolute inset-0" style={{ clipPath: "inset(0 0 100% 0)" }} />
              </div>

              {steps.map((st, i) => (
                <li key={st.title} className="road-step relative pl-24 lg:pl-0">
                  {/* Milestone stone: arched coloured top, paper base */}
                  <div className="stone absolute left-[9px] top-0 w-[76px] lg:static" aria-hidden>
                    <div className="grid h-[58px] place-items-center rounded-t-[38px] border-[3px] border-b-0 border-[#17130f] font-head text-[34px] leading-none" style={{ background: st.cap, color: st.capInk }}>
                      {i + 1}
                    </div>
                    <div className="grid h-[38px] place-items-center border-[3px] border-[#17130f] bg-[#fbfbf8] font-code text-[11px] font-semibold uppercase tracking-[0.1em] text-[#17130f]">
                      {st.verb}
                    </div>
                  </div>

                  <div className="lg:mt-[52px]">
                    <h3 className="font-head text-2xl md:text-3xl">{st.title}</h3>
                    <p className="mt-2 max-w-[36ch] text-ink-2">{st.body}</p>

                    {/* Proof sheet. Always light, like real stock. */}
                    <div className="paper-light mt-6 rounded-[var(--radius)] border-2 border-[#17130f] p-4 font-code text-[13px] shadow-[var(--shadow)]">
                      {i === 0 && (
                        <>
                          <p className="text-[11px] uppercase tracking-[0.08em] text-ink-3">You type</p>
                          <p className="mt-2 min-h-[6.5em] text-[14px] leading-relaxed">
                            <span className="scene-prompt">{SAMPLE_PROMPT}</span>
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {[["client", "Rahul Sharma"], ["amount", "₹15,000"], ["gst", "18%"]].map(([k, v]) => (
                              <span key={k} className="scene-field rounded-md border border-line-strong px-2 py-1 text-[12px]">
                                <span className="text-ink-3">{k}</span> <span className="font-semibold text-accent">{v}</span>
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      {i === 1 && (
                        <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                          {[["Logo design", "₹10,000"], ["Brand guidelines", "₹5,000"], ["CGST 9% + SGST 9%", "₹2,700"]].map(([d, amt]) => (
                            <div key={d} className="scene-row col-span-2 grid grid-cols-subgrid border-b border-line pb-2">
                              <span className="font-sans">{d}</span>
                              <span className="text-right">{amt}</span>
                            </div>
                          ))}
                          <div className="scene-row col-span-2 flex items-baseline justify-between pt-1">
                            <span className="font-sans font-semibold">Total</span>
                            <span className="font-head text-3xl text-accent">₹17,700</span>
                          </div>
                        </div>
                      )}
                      {i === 2 && (
                        <div className="relative min-h-[11em]">
                          <p className="scene-pay text-[11px] uppercase tracking-[0.08em] text-ink-3">Sent to Rahul Sharma</p>
                          <div className="scene-pay mt-2 flex items-center justify-between gap-3 rounded-md border border-line-strong p-3">
                            <span className="font-sans font-semibold">Pay ₹17,700 by UPI or card</span>
                            <span className="shrink-0 whitespace-nowrap rounded-md bg-accent px-2.5 py-1.5 font-sans text-[12px] font-semibold text-on-accent">Pay now</span>
                          </div>
                          <div aria-hidden className="scene-stamp pointer-events-none absolute bottom-1 right-3 rounded-md border-[3px] border-[var(--ok)] px-4 py-1 font-head text-2xl uppercase tracking-wider text-[var(--ok)]">
                            Paid
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-ink-3">Sample invoice.</p>
          </div>
        </section>

        {/* Pricing: receipt on an ink band */}
        <section id="pricing" className="tone-ink scroll-mt-20">
          <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="reveal-h font-head text-[clamp(32px,4.2vw,56px)] leading-[1.05]">
                Free, with every feature.
              </h2>
              <p className="mt-4 max-w-[44ch] text-lg text-ink-2">
                One plan. No invoice limits, no card on file, nothing locked behind an upgrade.
              </p>
            </div>

            <div className="receipt perforated mx-auto w-full max-w-[440px] rounded-b-[var(--radius-lg)] bg-[#fbfbf8] px-7 pb-7 pt-9 font-code text-[13.5px] text-[#17130f] shadow-[var(--shadow)]">
              <p className="receipt-row text-center text-xs uppercase tracking-[0.12em] text-[#655d52]">Starter plan</p>
              <ul className="mt-5 border-t border-dashed border-[#17130f]/30 pt-4">
                {included.map((f) => (
                  <li key={f} className="receipt-row flex justify-between gap-4 py-1">
                    <span>{f}</span>
                    <span className="text-[#655d52]">₹0</span>
                  </li>
                ))}
              </ul>
              <div className="receipt-row mt-4 flex items-baseline justify-between border-t border-dashed border-[#17130f]/30 pt-4">
                <span className="font-sans font-semibold">Total per month</span>
                <span className="font-head text-4xl text-[#c8321a]">₹0</span>
              </div>
              <Link href={primaryCta.href} className="receipt-row btn-primary mt-6 w-full !py-3.5 font-sans !text-[#fff8f0] !bg-[#c8321a] !border-[#17130f]">
                {primaryCta.label}
              </Link>
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-24 sm:px-6">
          <h2 className="reveal-h font-head text-[clamp(32px,4.2vw,56px)] leading-[1.05]">Your books stay yours.</h2>
          <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {security.map(({ icon: Icon, title, body }) => (
              <div key={title} className="sec-item flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius)] border-2 border-ink bg-gold text-[#17130f]">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-sans text-base font-semibold tracking-normal">{title}</h3>
                  <p className="mt-1 max-w-[42ch] text-ink-2">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
          <div className="closing-panel flex flex-col items-start justify-between gap-8 rounded-[var(--radius-lg)] border-[3px] border-ink p-8 text-on-accent sm:p-12 md:flex-row md:items-center">
            <div>
              <h2 className="reveal-h max-w-[20ch] font-head text-[clamp(30px,3.8vw,52px)] leading-[1.05]">
                Your next invoice is one sentence away.
              </h2>
              <p className="bumper mt-6">Tax OK please</p>
            </div>
            <Link href={primaryCta.href} className="btn-primary !border-[#17130f] !bg-[#f4b400] !px-7 !py-4 !text-base !text-[#17130f] hover:!bg-[#ffc933]">
              {primaryCta.label} <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
