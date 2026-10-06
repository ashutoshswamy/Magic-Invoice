"use client";

import { useRef } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { useGSAP } from "@gsap/react";
import { RotateCcw } from "lucide-react";

gsap.registerPlugin(TextPlugin);

const PROMPT =
  "Bill Rahul Sharma ₹15,000 for logo design and brand guidelines, 18% GST, due 31 Mar.";

// Sample data for the demo invoice (intra-state, so GST splits into CGST + SGST).
const lines = [
  { desc: "Logo design", sac: "998391", amount: 10000 },
  { desc: "Brand guidelines", sac: "998391", amount: 5000 },
];
const subtotal = 15000;
const tax = [
  { label: "CGST 9%", amount: 1350 },
  { label: "SGST 9%", amount: 1350 },
];
const total = 17700;

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

// The page's signature moment: a sentence is typed, then the invoice it
// describes fills in field by field and gets stamped. Plays once; replayable.
export default function HeroDemo({ delay = 0 }: { delay?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const totalEl = root.current!.querySelector<HTMLElement>("[data-total]")!;
        const counter = { v: 0 };
        tl.current = gsap
          .timeline({ delay, defaults: { ease: "power3.out" } })
          .fromTo("[data-prompt]", { text: "" }, { text: PROMPT, duration: 2.2, ease: "none" })
          .from("[data-caret]", { autoAlpha: 0, duration: 0.2 }, 0)
          .addLabel("typed", 2.4)
          .to("[data-caret]", { autoAlpha: 0, duration: 0.2 }, "typed")
          .from("[data-field]", { autoAlpha: 0, y: 8, duration: 0.45, stagger: 0.12 }, "typed")
          .from("[data-row]", { autoAlpha: 0, x: -12, duration: 0.45, stagger: 0.14 }, "-=0.2")
          .fromTo(
            counter,
            { v: 0 },
            {
              v: total,
              duration: 0.9,
              ease: "power2.out",
              onUpdate: () => {
                totalEl.textContent = inr(counter.v);
              },
            },
            "-=0.3",
          )
          .fromTo(
            "[data-stamp]",
            { autoAlpha: 0, scale: 1.8, rotation: -14 },
            { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.35, ease: "back.out(2.2)" },
            "-=0.1",
          )
          .from("[data-replay]", { autoAlpha: 0, duration: 0.3 });
      });
      gsap.set(root.current, { visibility: "visible" }); // see [data-prehide] in globals.css
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} data-prehide className="relative w-full max-w-[560px] justify-self-end">
      {/* Prompt bar */}
      <div className="rounded-[var(--radius-lg)] border border-line-strong bg-surface px-4 py-3.5 shadow-[var(--shadow)]">
        <p className="font-code text-[11px] uppercase tracking-[0.08em] text-ink-3">You type</p>
        <p className="mt-1.5 min-h-[3.2em] font-code text-[13.5px] leading-relaxed text-ink">
          <span data-prompt>{PROMPT}</span>
          <span data-caret aria-hidden className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-accent" />
        </p>
      </div>

      {/* Invoice paper */}
      <div className="perforated relative mt-3 rounded-b-[var(--radius-lg)] bg-surface px-6 pb-6 pt-8 shadow-[var(--shadow)] sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div data-field>
            <p className="font-head text-xl font-bold [font-stretch:112%]">Tax invoice</p>
            <p className="font-code text-xs text-ink-3">INV-2026-27-014</p>
          </div>
          <div data-field className="text-right">
            <p className="font-code text-[11px] uppercase tracking-[0.08em] text-ink-3">Due</p>
            <p className="text-sm font-medium">31 Mar 2027</p>
          </div>
        </div>

        <div data-field className="mt-5 border-t border-line pt-4">
          <p className="font-code text-[11px] uppercase tracking-[0.08em] text-ink-3">Bill to</p>
          <p className="text-sm font-semibold">Rahul Sharma</p>
          <p className="font-code text-xs text-ink-2">GSTIN 27AABCM1234R1Z5 (Maharashtra)</p>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr data-field className="text-left font-code text-[11px] uppercase tracking-[0.08em] text-ink-3">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 font-medium">SAC</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="font-code">
            {lines.map((l) => (
              <tr data-row key={l.desc} className="border-t border-line">
                <td className="py-2 font-sans">{l.desc}</td>
                <td className="py-2 text-ink-2">{l.sac}</td>
                <td className="py-2 text-right">{inr(l.amount)}</td>
              </tr>
            ))}
            <tr data-row className="border-t border-line text-ink-2">
              <td className="py-2 font-sans" colSpan={2}>Subtotal</td>
              <td className="py-2 text-right">{inr(subtotal)}</td>
            </tr>
            {tax.map((t) => (
              <tr data-row key={t.label} className="text-ink-2">
                <td className="py-1 font-sans" colSpan={2}>{t.label}</td>
                <td className="py-1 text-right">{inr(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div data-row className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
          <span className="font-semibold">Total</span>
          <span data-total className="font-code text-2xl font-semibold tabular-nums">{inr(total)}</span>
        </div>

        <div
          data-stamp
          aria-hidden
          className="pointer-events-none absolute right-6 top-24 -rotate-8 rounded-md border-2 border-accent px-3 py-1.5 font-code text-xs font-semibold uppercase tracking-[0.12em] text-accent opacity-90 sm:right-10"
        >
          CGST + SGST applied
        </div>
      </div>

      <button
        data-replay
        type="button"
        onClick={() => tl.current?.restart(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md motion-reduce:hidden px-2 py-1 text-xs font-medium text-ink-3 transition-colors hover:text-ink"
      >
        <RotateCcw size={13} /> Replay
      </button>
    </div>
  );
}
