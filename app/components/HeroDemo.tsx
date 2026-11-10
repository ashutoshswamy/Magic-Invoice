"use client";


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

// Static preview: the typed sentence and the invoice it describes.
export default function HeroDemo() {
  return (
    <div className="relative w-full max-w-[560px] justify-self-end">
      {/* Prompt bar */}
      <div className="rounded-[var(--radius-lg)] border border-line-strong bg-surface px-4 py-3.5 shadow-[var(--shadow)]">
        <p className="font-code text-[11px] uppercase tracking-[0.08em] text-ink-3">You type</p>
        <p className="mt-1.5 min-h-[3.2em] font-code text-[13.5px] leading-relaxed text-ink">
          <span>{PROMPT}</span>
        </p>
      </div>

      {/* Invoice paper */}
      <div className="perforated relative mt-3 rounded-b-[var(--radius-lg)] bg-surface px-6 pb-6 pt-8 shadow-[var(--shadow)] sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-head text-xl font-bold [font-stretch:112%]">Tax invoice</p>
            <p className="font-code text-xs text-ink-3">INV-2026-27-014</p>
          </div>
          <div className="text-right">
            <p className="font-code text-[11px] uppercase tracking-[0.08em] text-ink-3">Due</p>
            <p className="text-sm font-medium">31 Mar 2027</p>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="font-code text-[11px] uppercase tracking-[0.08em] text-ink-3">Bill to</p>
          <p className="text-sm font-semibold">Rahul Sharma</p>
          <p className="font-code text-xs text-ink-2">GSTIN 27AABCM1234R1Z5 (Maharashtra)</p>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="text-left font-code text-[11px] uppercase tracking-[0.08em] text-ink-3">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 font-medium">SAC</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="font-code">
            {lines.map((l) => (
              <tr key={l.desc} className="border-t border-line">
                <td className="py-2 font-sans">{l.desc}</td>
                <td className="py-2 text-ink-2">{l.sac}</td>
                <td className="py-2 text-right">{inr(l.amount)}</td>
              </tr>
            ))}
            <tr className="border-t border-line text-ink-2">
              <td className="py-2 font-sans" colSpan={2}>Subtotal</td>
              <td className="py-2 text-right">{inr(subtotal)}</td>
            </tr>
            {tax.map((t) => (
              <tr key={t.label} className="text-ink-2">
                <td className="py-1 font-sans" colSpan={2}>{t.label}</td>
                <td className="py-1 text-right">{inr(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-code text-2xl font-semibold tabular-nums">{inr(total)}</span>
        </div>

        <div
         
          aria-hidden
          className="pointer-events-none absolute right-3 top-24 -rotate-8 rounded-md border-2 border-accent px-2 py-1 font-code text-[10px] font-semibold uppercase tracking-[0.1em] text-accent opacity-90 sm:right-10 sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.12em]"
        >
          CGST + SGST applied
        </div>
      </div>

    </div>
  );
}
