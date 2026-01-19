"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { formatDisplayDate } from "../lib/formatDate";

type StoredInvoice = {
  id: string;
  invoiceNumber: string;
  created_at?: string;
  paid?: boolean | null;
};

const sampleInvoices = [
  { id: "1", invoiceNumber: "MI-20260115-882", created_at: "2026-01-15" },
  { id: "2", invoiceNumber: "MI-20260112-640", created_at: "2026-01-12" },
  { id: "3", invoiceNumber: "MI-20260108-312", created_at: "2026-01-08" },
];

export default function InvoicesPage() {
  const [stored, setStored] = useState<StoredInvoice[]>(sampleInvoices);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFromSupabase = async () => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to sync invoices.");
      return;
    }
    setIsLoading(true);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, created_at, paid")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setStored(
        (data ?? []).map((item, index) => ({
          id: item.id ?? `${index}`,
          invoiceNumber: item.invoice_number ?? "Untitled invoice",
          created_at: item.created_at ?? "",
          paid: item.paid ?? false,
        })),
      );
      setStatus("Synced from database.");
    } catch (error) {
      setStatus("Unable to fetch invoices.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      loadFromSupabase();
    }
  }, []);

  const handleDelete = async (invoiceId: string) => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to delete invoices.");
      return;
    }
    const confirmed = window.confirm(
      "Delete this invoice? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(invoiceId);
    setStatus(null);
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);
      if (error) throw error;
      setStored((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
      setStatus("Invoice deleted.");
    } catch (error) {
      setStatus("Unable to delete invoice.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              All invoices
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Invoice archive
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage drafts and finalized invoices stored in your database.
            </p>
          </div>
          <button
            onClick={loadFromSupabase}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {isLoading ? "Syncing..." : "Sync database"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {stored.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              className="glass flex items-center justify-between rounded-2xl p-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <FileText className="h-4 w-4 text-emerald-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-slate-300">
                    {invoice.created_at
                      ? formatDisplayDate(invoice.created_at)
                      : "Saved in database"}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  invoice.paid
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-amber-400/20 text-amber-200"
                }`}
              >
                {invoice.paid ? "Paid" : "Unpaid"}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs text-slate-100 transition hover:border-white/50"
                >
                  <UploadCloud className="h-3 w-3" />
                  View
                </Link>
                <button
                  onClick={() => handleDelete(invoice.id)}
                  disabled={deletingId === invoice.id}
                  className="flex items-center gap-2 rounded-full border border-rose-400/40 px-3 py-2 text-xs text-rose-100 transition hover:border-rose-300 disabled:opacity-60"
                >
                  <Trash2 className="h-3 w-3" />
                  {deletingId === invoice.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {status ? <p className="text-xs text-emerald-200">{status}</p> : null}
      </div>
    </div>
  );
}
