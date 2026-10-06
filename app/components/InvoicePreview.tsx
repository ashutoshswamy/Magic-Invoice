import { InvoiceData } from "../types";
import { formatDisplayDate } from "../lib/formatDate";
import { amountInWords } from "../lib/amountInWords";

const formatCurrency = (amount: number, currency: string) => {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
};

const qtyFormat = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(n);

type Party = InvoiceData["from"];

const addressLines = (p: Party) =>
  [
    p.addressLine1,
    p.addressLine2,
    [p.city, p.state, p.postalCode].filter(Boolean).join(", "),
    p.country,
  ].filter(Boolean) as string[];

// The invoice is a document clients receive and print, so it always renders on
// white paper with fixed ink colours, independent of the site's light/dark theme.
// Layout adapts to the width of its container (narrow preview panel vs. full page).
function PartyBlock({ label, party }: { label: string; party: Party }) {
  return (
    <div className="min-w-0">
      <p className="font-code text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b707b]">{label}</p>
      <p className="mt-2 break-words font-semibold text-[#15171c]">{party.company || party.name}</p>
      {party.company && party.name && <p className="break-words">{party.name}</p>}
      {addressLines(party).map((line) => (
        <p key={line} className="break-words">{line}</p>
      ))}
      {party.email && <p className="break-words">{party.email}</p>}
      {party.gstin && (
        <p className="mt-2 break-words font-code text-xs text-[#15171c]">
          GSTIN <span className="tracking-wide">{party.gstin}</span>
        </p>
      )}
    </div>
  );
}

export default function InvoicePreview({ invoice, showBranding = false }: { invoice: InvoiceData; showBranding?: boolean }) {
  const subtotal = invoice.lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);
  const chargesTotal = invoice.customCharges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  const taxRate = invoice.taxRate || 0;
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const halfTax = Number((taxAmount / 2).toFixed(2));
  const total = subtotal + taxAmount + chargesTotal;

  const gstType = invoice.gstType ?? "CGST_SGST";
  const isCGST = gstType === "CGST_SGST";
  const isIGST = gstType === "IGST";
  const money = (n: number) => formatCurrency(n, invoice.currency);

  const placeOfSupply = [invoice.to.state, invoice.to.stateCode && `(${invoice.to.stateCode})`]
    .filter(Boolean)
    .join(" ");

  const taxRows: { label: string; amount: number }[] =
    taxRate <= 0
      ? []
      : isCGST
        ? [
            { label: `CGST ${taxRate / 2}%`, amount: halfTax },
            { label: `SGST ${taxRate / 2}%`, amount: halfTax },
          ]
        : [{ label: `${isIGST ? "IGST" : "GST"} ${taxRate}%`, amount: taxAmount }];

  return (
    <article className="@container relative w-full overflow-hidden rounded-xl print:rounded-none print:shadow-none print:ring-0 bg-white text-[13px] leading-relaxed text-[#4a4e58] shadow-[0_1px_0_rgba(21,23,28,0.04),0_18px_40px_-18px_rgba(35,45,110,0.28)] ring-1 ring-[#e3e5e0]">
      {/* Carbon-copy rule: the one brand mark on the document */}
      <div className="h-1.5 bg-[#2e3eb8]" aria-hidden />

      <div className="p-6 @2xl:p-10">
        {/* ── Header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-6 @lg:flex-row @lg:items-start @lg:justify-between">
          <div className="min-w-0">
            <p className="font-head text-2xl font-bold leading-tight tracking-tight text-[#15171c] [font-stretch:112%] @2xl:text-[28px]">
              {invoice.from.company || invoice.from.name}
            </p>
            {invoice.from.gstin && (
              <p className="mt-1 font-code text-xs text-[#6b707b]">GSTIN {invoice.from.gstin}</p>
            )}
          </div>
          <div className="@lg:text-right">
            <p className="font-code text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2e3eb8]">Tax invoice</p>
            <p className="mt-1 break-all font-code text-lg font-semibold text-[#15171c]">{invoice.invoiceNumber}</p>
          </div>
        </header>

        {/* ── Dates ────────────────────────────────────────────── */}
        <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-[#e3e5e0] py-4 @lg:grid-cols-4">
          {[
            ["Issued", formatDisplayDate(invoice.issuedOn)],
            ["Due", formatDisplayDate(invoice.dueDate)],
            ["Place of supply", placeOfSupply || "-"],
            ["Currency", invoice.currency],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="font-code text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b707b]">{k}</dt>
              <dd className="mt-1 break-words font-medium text-[#15171c]">{v}</dd>
            </div>
          ))}
        </dl>

        {/* ── Parties ──────────────────────────────────────────── */}
        <div className="mt-6 grid gap-6 @lg:grid-cols-2">
          <PartyBlock label="From" party={invoice.from} />
          <PartyBlock label="Billed to" party={invoice.to} />
        </div>

        {/* ── Line items ───────────────────────────────────────── */}
        <table className="mt-8 w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[#15171c] text-left font-code text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b707b]">
              <th className="pb-2 pr-3 font-medium">Item</th>
              <th className="hidden pb-2 pr-3 font-medium @lg:table-cell">HSN/SAC</th>
              <th className="hidden pb-2 pr-3 text-right font-medium @lg:table-cell">Qty</th>
              <th className="hidden pb-2 pr-3 text-right font-medium @lg:table-cell">Rate</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="break-inside-avoid border-b border-[#e3e5e0] align-top">
                <td className="py-3 pr-3">
                  <p className="break-words font-medium text-[#15171c]">{line.description}</p>
                  {/* Narrow containers fold the secondary columns under the description */}
                  <p className="mt-0.5 font-code text-[11px] text-[#6b707b] @lg:hidden">
                    {qtyFormat(line.quantity)} × {money(line.rate)}
                    {line.hsnSacCode && <> · HSN/SAC {line.hsnSacCode}</>}
                  </p>
                </td>
                <td className="hidden py-3 pr-3 font-code @lg:table-cell">{line.hsnSacCode || "-"}</td>
                <td className="hidden py-3 pr-3 text-right font-code tabular-nums @lg:table-cell">{qtyFormat(line.quantity)}</td>
                <td className="hidden whitespace-nowrap py-3 pr-3 text-right font-code tabular-nums @lg:table-cell">{money(line.rate)}</td>
                <td className="whitespace-nowrap py-3 text-right font-code font-medium tabular-nums text-[#15171c]">
                  {money(line.quantity * line.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals + footer: kept together on one printed page ── */}
        <div className="break-inside-avoid">
        <div className="mt-6 grid gap-8 @xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
          <div className="order-2 min-w-0 @xl:order-1">
            {invoice.paid && (
              <p className="mb-6 inline-block -rotate-6 rounded-md border-[3px] border-[#2e3eb8] px-4 py-1 font-code text-2xl font-semibold uppercase tracking-[0.2em] text-[#2e3eb8] opacity-85">
                Paid
              </p>
            )}
            {invoice.currency === "INR" && (
              <>
                <p className="font-code text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b707b]">Amount in words</p>
                <p className="mt-1 font-medium text-[#15171c]">{amountInWords(total)}</p>
              </>
            )}
            {invoice.notes && (
              <>
                <p className="mt-5 font-code text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b707b]">Notes</p>
                <p className="mt-1 whitespace-pre-line break-words">{invoice.notes}</p>
              </>
            )}
          </div>

          <dl className="order-1 font-code tabular-nums @xl:order-2">
            <div className="flex justify-between gap-4 py-1">
              <dt className="font-sans">Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {invoice.customCharges.map((charge) => (
              <div key={charge.id} className="flex justify-between gap-4 py-1">
                <dt className="font-sans">{charge.label || "Additional charge"}</dt>
                <dd>{money(Number(charge.amount || 0))}</dd>
              </div>
            ))}
            {taxRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 py-1">
                <dt className="font-sans">{row.label}</dt>
                <dd>{money(row.amount)}</dd>
              </div>
            ))}
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t-2 border-[#15171c] pt-3">
              <dt className="font-sans font-semibold text-[#15171c]">{invoice.paid ? "Total paid" : "Total due"}</dt>
              <dd className="text-xl font-semibold text-[#15171c]">{money(total)}</dd>
            </div>
          </dl>
        </div>

        {showBranding && (
          <p className="mt-10 border-t border-[#e3e5e0] pt-4 text-center text-[11px] text-[#6b707b]">
            Made with{" "}
            <a href="https://magicinvoice.in" target="_blank" rel="noopener noreferrer" className="font-medium text-[#2e3eb8]">
              Magic Invoice
            </a>
          </p>
        )}
        </div>
      </div>
    </article>
  );
}
