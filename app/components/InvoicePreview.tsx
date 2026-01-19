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
  const total = subtotal;
  const fromAddressLines = [
    invoice.from.addressLine1,
    invoice.from.addressLine2,
    [invoice.from.city, invoice.from.state, invoice.from.postalCode]
      .filter(Boolean)
      .join(", "),
    invoice.from.country,
  ].filter(Boolean);

  return (
    <div className="w-full max-w-none rounded-3xl border border-white/10 bg-white text-slate-900 shadow-xl">
      <div className="flex flex-col gap-6 border-b border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Invoice
            </p>
            <h3 className="text-2xl font-semibold text-slate-900 break-words">
              {invoice.invoiceNumber}
            </h3>
            <p className="mt-1 text-sm text-slate-500 break-words">
              Issued {formatDisplayDate(invoice.issuedOn)}
            </p>
          </div>
          <div className="text-right text-sm text-slate-500 min-w-0">
            <p className="break-words">
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
            <p className="text-slate-500 break-words">{invoice.to.email}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200">
          <div className="grid grid-cols-4 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <span className="col-span-2">Description</span>
            <span>Qty</span>
            <span className="text-right">Rate</span>
          </div>
          {invoice.lines.map((line) => (
            <div
              key={line.id}
              className="grid grid-cols-4 gap-3 border-b border-slate-200 px-4 py-3 text-sm text-slate-700"
            >
              <span className="col-span-2 min-w-0 break-words font-medium text-slate-800">
                {line.description}
              </span>
              <span>{line.quantity}</span>
              <span className="text-right">
                {formatCurrency(line.rate, invoice.currency)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start justify-between">
          <p className="max-w-xs text-sm text-slate-500">{invoice.notes}</p>
          <div className="text-right text-sm text-slate-500">
            <p>Subtotal</p>
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(total, invoice.currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
