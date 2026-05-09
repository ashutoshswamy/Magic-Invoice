"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Link2, Printer } from "lucide-react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import InvoicePreview from "../../components/InvoicePreview";
import { InvoiceData } from "../../types";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useSupabase } from "../../lib/useSupabase";

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
  from_state_code: string | null;
  from_postal_code: string | null;
  from_country: string | null;
  from_gstin: string | null;
  to_name: string | null;
  to_company: string | null;
  to_email: string | null;
  to_address_line1: string | null;
  to_address_line2: string | null;
  to_city: string | null;
  to_state: string | null;
  to_state_code: string | null;
  to_postal_code: string | null;
  to_country: string | null;
  to_gstin: string | null;
  tax_rate: number | null;
  custom_charges: Array<{ label?: string; amount?: number }> | null;
};

type LineRow = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  hsn_sac_code: string | null;
};

const buildInvoice = (invoiceRow: InvoiceRow, lineRows: LineRow[]): InvoiceData => ({
  invoiceNumber: invoiceRow.invoice_number,
  issuedOn: invoiceRow.issued_on,
  dueDate: invoiceRow.due_date,
  paid: Boolean(invoiceRow.paid),
  currency: invoiceRow.currency,
  notes: invoiceRow.notes ?? "Payment is due within the agreed terms. Thank you for choosing Magic Invoice.",
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
    stateCode: invoiceRow.from_state_code ?? "",
    postalCode: invoiceRow.from_postal_code ?? "",
    country: invoiceRow.from_country ?? "",
    gstin: invoiceRow.from_gstin ?? "",
  },
  to: {
    name: invoiceRow.to_name ?? "",
    company: invoiceRow.to_company ?? "",
    email: invoiceRow.to_email ?? "",
    addressLine1: invoiceRow.to_address_line1 ?? "",
    addressLine2: invoiceRow.to_address_line2 ?? "",
    city: invoiceRow.to_city ?? "",
    state: invoiceRow.to_state ?? "",
    stateCode: invoiceRow.to_state_code ?? "",
    postalCode: invoiceRow.to_postal_code ?? "",
    country: invoiceRow.to_country ?? "",
    gstin: invoiceRow.to_gstin ?? "",
  },
  lines: lineRows.map((line) => ({
    id: line.id,
    description: line.description,
    quantity: Number(line.quantity ?? 1),
    rate: Number(line.rate ?? 0),
    hsnSacCode: line.hsn_sac_code ?? "",
  })),
});

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!isSupabaseConfigured || !isLoaded) { setIsLoading(false); return; }
      if (!userId) { setStatus("Log in to view invoices."); setIsLoading(false); return; }
      const invoiceId = params?.id;
      if (!invoiceId) { setStatus("Missing invoice id."); setIsLoading(false); return; }
      try {
        const { data: invoiceRow, error: invoiceError } = await supabase
          .from("invoices")
          .select("id, invoice_number, issued_on, due_date, paid, currency, notes, tax_rate, custom_charges, from_name, from_company, from_email, from_address_line1, from_address_line2, from_city, from_state, from_postal_code, from_country, to_name, to_company, to_email, to_address_line1, to_address_line2, to_city, to_state, to_postal_code, to_country")
          .eq("id", invoiceId)
          .single<InvoiceRow>();
        if (invoiceError || !invoiceRow) throw invoiceError ?? new Error("Invoice not found.");
        const { data: lineRows, error: linesError } = await supabase
          .from("invoice_lines")
          .select("id, description, quantity, rate")
          .eq("invoice_id", invoiceId)
          .order("created_at", { ascending: true });
        if (linesError) throw linesError;
        setInvoice(buildInvoice(invoiceRow, (lineRows ?? []) as LineRow[]));
        setStatus(null);
      } catch {
        setStatus("Unable to load invoice.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInvoice();
  }, [params?.id, isLoaded, userId, supabase]);

  const handleTogglePaid = async () => {
    if (!invoice) return;
    if (!isSupabaseConfigured) { setStatus("Connect your workspace to update invoices."); return; }
    setIsUpdatingStatus(true);
    setStatus(null);
    try {
      const nextPaid = !invoice.paid;
      const { error } = await supabase.from("invoices").update({ paid: nextPaid }).eq("id", params?.id);
      if (error) throw error;
      setInvoice((prev) => (prev ? { ...prev, paid: nextPaid } : prev));
      setStatus(nextPaid ? "Invoice marked as paid." : "Invoice marked as unpaid.");
    } catch {
      setStatus("Unable to update invoice status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };



  const handleGetPaymentLink = async () => {
    setIsCreatingLink(true);
    setStatus(null);
    try {
      const res = await fetch("/api/razorpay/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: params?.id }),
      });
      const data = await res.json() as { paymentLinkUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create link");
      setPaymentLinkUrl(data.paymentLinkUrl ?? null);
      setStatus("Payment link created.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Payment link failed.");
    } finally {
      setIsCreatingLink(false);
    }
  };



  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div className="no-print">
        <TopNav />
      </div>
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "40px 24px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Header */}
        <div
          className="no-print"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>Invoice detail</p>
            <h1
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontWeight: 600,
                fontSize: "clamp(22px, 4vw, 34px)",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {invoice?.invoiceNumber ?? "View invoice"}
            </h1>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <Link href="/invoices" className="btn-ghost" style={{ textDecoration: "none" }}>
              <ArrowLeft size={13} /> Back
            </Link>
            <button
              onClick={handleTogglePaid}
              disabled={isUpdatingStatus || !invoice}
              className="btn-ghost"
            >
              {isUpdatingStatus ? "Updating..." : invoice?.paid ? "Mark unpaid" : "Mark paid"}
            </button>
            {invoice && (
              <span className={invoice.paid ? "stamp-paid" : "stamp-unpaid"}>
                {invoice.paid ? "Paid" : "Unpaid"}
              </span>
            )}

            <button
              onClick={handleGetPaymentLink}
              disabled={isCreatingLink || !invoice}
              className="btn-ghost"
            >
              <Link2 size={13} /> {isCreatingLink ? "Creating..." : paymentLinkUrl ? "Regenerate link" : "Payment link"}
            </button>

            <button onClick={() => window.print()} className="btn-ghost">
              <Printer size={13} /> Print
            </button>
          </div>
        </div>
        {paymentLinkUrl && (
          <div className="no-print card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderLeft: "2px solid var(--gold)" }}>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Payment link</span>
            <a href={paymentLinkUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--gold)", wordBreak: "break-all" }}>{paymentLinkUrl}</a>
            <button onClick={() => { navigator.clipboard.writeText(paymentLinkUrl); setStatus("Link copied."); }} className="btn-ghost" style={{ fontSize: 10, padding: "5px 12px", flexShrink: 0 }}>Copy</button>
          </div>
        )}

        {status && (
          <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--gold)", letterSpacing: "0.08em" }}>
            {status}
          </p>
        )}

        {isLoading ? (
          <div className="card" style={{ padding: 32 }}>
            <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Loading invoice...
            </p>
          </div>
        ) : invoice ? (
          <div className="print-container">
            <div className="print-area">
              <InvoicePreview invoice={invoice} />
            </div>
          </div>
        ) : !status ? null : (
          <div className="card" style={{ padding: 32, borderColor: "rgba(248,113,113,0.3)" }}>
            <p style={{ fontSize: 14, color: "#FCA5A5" }}>{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
