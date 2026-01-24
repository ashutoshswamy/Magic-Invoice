"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import InvoicePreview from "../../components/InvoicePreview";
import { InvoiceData } from "../../types";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  issued_on: string;
  due_date: string;
  paid: boolean | null;
  currency: string;
  notes: string | null;
  from_name: string | null;
  from_company: string | null;
  from_email: string | null;
  from_address_line1: string | null;
  from_address_line2: string | null;
  from_city: string | null;
  from_state: string | null;
  from_postal_code: string | null;
  from_country: string | null;
  to_name: string | null;
  to_company: string | null;
  to_email: string | null;
  to_address_line1: string | null;
  to_address_line2: string | null;
  to_city: string | null;
  to_state: string | null;
  to_postal_code: string | null;
  to_country: string | null;
  tax_rate: number | null;
  custom_charges: Array<{ label?: string; amount?: number }> | null;
};

type LineRow = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

const buildInvoice = (
  invoiceRow: InvoiceRow,
  lineRows: LineRow[],
): InvoiceData => ({
  invoiceNumber: invoiceRow.invoice_number,
  issuedOn: invoiceRow.issued_on,
  dueDate: invoiceRow.due_date,
  paid: Boolean(invoiceRow.paid),
  currency: invoiceRow.currency,
  notes:
    invoiceRow.notes ??
    "Payment is due within the agreed terms. Thank you for choosing Magic Invoice.",
  taxRate: Number(invoiceRow.tax_rate ?? 0),
  customCharges: Array.isArray(invoiceRow.custom_charges)
    ? invoiceRow.custom_charges.map((charge, index) => ({
        id: `${index + 1}`,
        label: charge?.label ?? "Custom charge",
        amount: Number(charge?.amount ?? 0),
      }))
    : [],
  from: {
    name: invoiceRow.from_name ?? "",
    company: invoiceRow.from_company ?? "",
    email: invoiceRow.from_email ?? "",
    addressLine1: invoiceRow.from_address_line1 ?? "",
    addressLine2: invoiceRow.from_address_line2 ?? "",
    city: invoiceRow.from_city ?? "",
    state: invoiceRow.from_state ?? "",
    postalCode: invoiceRow.from_postal_code ?? "",
    country: invoiceRow.from_country ?? "",
  },
  to: {
    name: invoiceRow.to_name ?? "",
    company: invoiceRow.to_company ?? "",
    email: invoiceRow.to_email ?? "",
    addressLine1: invoiceRow.to_address_line1 ?? "",
    addressLine2: invoiceRow.to_address_line2 ?? "",
    city: invoiceRow.to_city ?? "",
    state: invoiceRow.to_state ?? "",
    postalCode: invoiceRow.to_postal_code ?? "",
    country: invoiceRow.to_country ?? "",
  },
  lines: lineRows.map((line) => ({
    id: line.id,
    description: line.description,
    quantity: Number(line.quantity ?? 1),
    rate: Number(line.rate ?? 0),
  })),
});

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!isSupabaseConfigured) {
        setStatus("Connect your workspace to view invoices.");
        setIsLoading(false);
        return;
      }

      const invoiceId = params?.id;
      if (!invoiceId) {
        setStatus("Missing invoice id.");
        setIsLoading(false);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setStatus("Log in to view invoices.");
          setIsLoading(false);
          return;
        }

        const { data: invoiceRow, error: invoiceError } = await supabase
          .from("invoices")
          .select(
            "id, invoice_number, issued_on, due_date, paid, currency, notes, tax_rate, custom_charges, from_name, from_company, from_email, from_address_line1, from_address_line2, from_city, from_state, from_postal_code, from_country, to_name, to_company, to_email, to_address_line1, to_address_line2, to_city, to_state, to_postal_code, to_country",
          )
          .eq("id", invoiceId)
          .single<InvoiceRow>();

        if (invoiceError || !invoiceRow) {
          throw invoiceError ?? new Error("Invoice not found.");
        }

        const { data: lineRows, error: linesError } = await supabase
          .from("invoice_lines")
          .select("id, description, quantity, rate")
          .eq("invoice_id", invoiceId)
          .order("created_at", { ascending: true });

        if (linesError) throw linesError;

        setInvoice(buildInvoice(invoiceRow, (lineRows ?? []) as LineRow[]));
        setStatus(null);
      } catch (error) {
        setStatus("Unable to load invoice.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [params?.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleTogglePaid = async () => {
    if (!invoice) return;
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to update invoices.");
      return;
    }
    setIsUpdatingStatus(true);
    setStatus(null);
    try {
      const nextPaid = !invoice.paid;
      const { error } = await supabase
        .from("invoices")
        .update({ paid: nextPaid })
        .eq("id", params?.id);
      if (error) throw error;
      setInvoice((prev) => (prev ? { ...prev, paid: nextPaid } : prev));
      setStatus(
        nextPaid ? "Invoice marked as paid." : "Invoice marked as unpaid.",
      );
    } catch (error) {
      setStatus("Unable to update invoice status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="no-print">
        <TopNav />
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-16 pt-10">
        <div className="no-print flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Invoice detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              View invoice
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/invoices"
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to invoices
            </Link>
            <button
              onClick={handleTogglePaid}
              disabled={isUpdatingStatus || !invoice}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 disabled:opacity-60"
            >
              {isUpdatingStatus
                ? "Updating..."
                : invoice?.paid
                  ? "Mark unpaid"
                  : "Mark paid"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50"
            >
              <Printer className="h-4 w-4" />
              Print invoice
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="glass rounded-3xl p-6 text-sm text-slate-300">
            Loading invoice...
          </div>
        ) : status ? (
          <div className="glass rounded-3xl p-6 text-sm text-rose-200">
            {status}
          </div>
        ) : invoice ? (
          <div className="print-container">
            <div className="print-area">
              <InvoicePreview invoice={invoice} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
