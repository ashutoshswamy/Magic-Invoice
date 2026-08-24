"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../lib/useAuth";
import { FileText, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import TopNav from "../components/TopNav";
import {
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import { formatDisplayDate } from "../lib/formatDate";

type StoredInvoice = {
  id: string;
  invoiceNumber: string;
  due_date?: string | null;
  to_email?: string | null;
  created_at?: string;
  paid?: boolean | null;
};

export default function InvoicesPage() {
  const { userId, isLoaded } = useAuth();
  const [stored, setStored] = useState<StoredInvoice[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setStatus(null);
    try {
      const snap = await getDocs(
        query(
          collection(db, "invoices"),
          where("user_id", "==", userId),
          orderBy("created_at", "desc"),
          fsLimit(20),
        ),
      );
      setStored(
        snap.docs.map((d) => {
          const item = d.data();
          return {
            id: d.id,
            invoiceNumber: item.invoice_number ?? "Untitled invoice",
            due_date: item.due_date ?? null,
            to_email: item.to_email ?? null,
            created_at: item.created_at ?? "",
            paid: item.paid ?? false,
          };
        }),
      );
      setStatus("Synced from database.");
    } catch {
      setStatus("Unable to fetch invoices.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isLoaded && userId) loadInvoices();
  }, [isLoaded, userId, loadInvoices]);

  const handleDelete = async (invoiceId: string) => {
    const confirmed = window.confirm(
      "Delete this invoice? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(invoiceId);
    setStatus(null);
    try {
      const linesSnap = await getDocs(
        collection(db, "invoices", invoiceId, "lines"),
      );
      const batch = writeBatch(db);
      linesSnap.docs.forEach((lineDoc) => batch.delete(lineDoc.ref));
      batch.delete(doc(db, "invoices", invoiceId));
      await batch.commit();
      setStored((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
      setStatus("Invoice deleted.");
    } catch {
      setStatus("Unable to delete invoice.");
    } finally {
      setDeletingId(null);
    }
  };



  const today = new Date();
  const isOverdue = (inv: StoredInvoice) =>
    !inv.paid && inv.due_date && new Date(inv.due_date) < today;

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>All invoices</p>
            <h1 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", margin: "0 0 8px" }}>
              Invoice archive
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Manage drafts and finalized invoices stored in your database.</p>
          </div>
          <button onClick={loadInvoices} disabled={isLoading} className="btn-ghost">
            <RefreshCw size={13} />
            {isLoading ? "Syncing..." : "Sync database"}
          </button>
        </div>

        {isLoading && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-mono), monospace" }}>Loading invoices...</p>
        )}

        {!isLoading && stored.length === 0 && (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>No invoices yet</p>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Create your first invoice from the dashboard.</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {stored.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              className="card"
              style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, border: "1px solid var(--border-bright)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={14} style={{ color: "var(--gold)" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {invoice.invoiceNumber}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {invoice.created_at ? formatDisplayDate(invoice.created_at) : "Saved"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
                <span className={invoice.paid ? "stamp-paid" : "stamp-unpaid"}>
                  {invoice.paid ? "Paid" : isOverdue(invoice) ? "Overdue" : "Unpaid"}
                </span>

                <Link href={`/invoices/${invoice.id}`} className="btn-ghost" style={{ fontSize: 10, padding: "5px 12px", textDecoration: "none" }}>
                  <UploadCloud size={11} /> View
                </Link>
                <button
                  onClick={() => handleDelete(invoice.id)}
                  disabled={deletingId === invoice.id}
                  style={{ background: "none", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 2, padding: "5px 12px", fontSize: 10, fontFamily: "var(--font-mono), monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "#FCA5A5", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: deletingId === invoice.id ? 0.5 : 1 }}
                >
                  <Trash2 size={11} />
                  {deletingId === invoice.id ? "..." : "Delete"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {status && <p style={{ fontSize: 11, color: "var(--gold)", fontFamily: "var(--font-mono), monospace" }}>{status}</p>}
      </div>
    </div>
  );
}
