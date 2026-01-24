import { InvoiceData } from "../types";
import { formatDisplayDate } from "../lib/formatDate";

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

export default function InvoicePreview({ invoice }: { invoice: InvoiceData }) {
  const subtotal = invoice.lines.reduce(
    (sum, line) => sum + line.quantity * line.rate,
    0,
  );
  const chargesTotal = invoice.customCharges.reduce(
    (sum, charge) => sum + Number(charge.amount || 0),
    0,
  );
  const taxAmount = Number(
    ((subtotal * (invoice.taxRate || 0)) / 100).toFixed(2),
  );
  const total = subtotal + taxAmount + chargesTotal;
  const fromAddressLines = [
    invoice.from.addressLine1,
    invoice.from.addressLine2,
    [invoice.from.city, invoice.from.state, invoice.from.postalCode]
      .filter(Boolean)
      .join(", "),
    invoice.from.country,
  ].filter(Boolean);
  const toAddressLines = [
    invoice.to.addressLine1,
    invoice.to.addressLine2,
    [invoice.to.city, invoice.to.state, invoice.to.postalCode]
      .filter(Boolean)
      .join(", "),
    invoice.to.country,
  ].filter(Boolean);

  return (
    <div className="w-full max-w-none rounded-3xl border border-slate-200/80 bg-white text-slate-900 shadow-2xl">
      <div className="flex flex-col gap-6 border-b border-slate-200/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Invoice
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900 break-words">
              {invoice.invoiceNumber}
            </h3>
            <p className="mt-1 text-sm text-slate-500 break-words">
              Issued {formatDisplayDate(invoice.issuedOn)}
            </p>
          </div>
          <div className="min-w-0 text-left text-sm text-slate-500 sm:text-right">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                invoice.paid
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {invoice.paid ? "Paid" : "Unpaid"}
            </span>
            <p className="mt-3 break-words">
              Due {formatDisplayDate(invoice.dueDate)}
            </p>
            <p className="font-medium text-slate-700">{invoice.currency}</p>
          </div>
        </div>
        <div className="grid gap-6 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              From
            </p>
            <p className="mt-2 font-semibold text-slate-800 break-words">
              {invoice.from.name}
            </p>
            <p className="text-slate-500 break-words">{invoice.from.company}</p>
            {fromAddressLines.map((line) => (
              <p key={line} className="text-slate-500 break-words">
                {line}
              </p>
            ))}
            <p className="text-slate-500 break-words">{invoice.from.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Billed to
            </p>
            <p className="mt-2 font-semibold text-slate-800 break-words">
              {invoice.to.name}
            </p>
            <p className="text-slate-500 break-words">{invoice.to.company}</p>
            {toAddressLines.map((line) => (
              <p key={line} className="text-slate-500 break-words">
                {line}
              </p>
            ))}
            <p className="text-slate-500 break-words">{invoice.to.email}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-4 gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400 sm:grid">
            <span className="col-span-2">Description</span>
            <span>Qty</span>
            <span className="text-right">Rate</span>
          </div>
          {invoice.lines.map((line) => (
            <div
              key={line.id}
              className="grid grid-cols-1 gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-700 sm:grid-cols-4 sm:gap-3"
            >
              <span className="min-w-0 break-words font-medium text-slate-800 sm:col-span-2">
                {line.description}
              </span>
              <div className="flex items-center justify-between text-xs text-slate-500 sm:hidden">
                <span>Qty</span>
                <span className="text-slate-700">{line.quantity}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 sm:hidden">
                <span>Rate</span>
                <span className="text-slate-700">
                  {formatCurrency(line.rate, invoice.currency)}
                </span>
              </div>
              <span className="hidden sm:block">{line.quantity}</span>
              <span className="hidden text-right sm:block">
                {formatCurrency(line.rate, invoice.currency)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <p className="text-sm text-slate-500">{invoice.notes}</p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, invoice.currency)}</span>
            </div>
            {invoice.customCharges.map((charge) => (
              <div
                key={charge.id}
                className="mt-2 flex items-center justify-between"
              >
                <span>{charge.label || "Custom charge"}</span>
                <span>{formatCurrency(charge.amount, invoice.currency)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between">
              <span>Tax ({invoice.taxRate || 0}%)</span>
              <span>{formatCurrency(taxAmount, invoice.currency)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
