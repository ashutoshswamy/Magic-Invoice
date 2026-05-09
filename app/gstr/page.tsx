"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { Download, RefreshCw } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useSupabase } from "../lib/useSupabase";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  issued_on: string;
  due_date: string;
  paid: boolean;
  status: string;
  currency: string;
  tax_rate: number;
  gst_type: string;
  from_gstin: string;
  from_state_code: string;
  to_name: string;
  to_company: string;
  to_gstin: string;
  to_state_code: string;
};

type LineRow = {
  invoice_id: string;
  quantity: number;
  rate: number;
  hsn_sac_code: string;
};

type InvoiceSummary = InvoiceRow & {
  subtotal: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  isB2B: boolean;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );

const months = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

function getCurrentFY() {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  return m >= 4 ? { start: y, end: y + 1 } : { start: y - 1, end: y };
}

export default function GSTRPage() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"b2b" | "b2c" | "summary">(
    "summary",
  );
  const fy = getCurrentFY();

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !isLoaded || !userId) return;
    setIsLoading(true);
    setStatus(null);
    try {
      const { data: rows, error } = await supabase
        .from("invoices")
        .select(
          "id, invoice_number, issued_on, due_date, paid, status, currency, tax_rate, gst_type, from_gstin, from_state_code, to_name, to_company, to_gstin, to_state_code",
        )
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("issued_on", { ascending: true });
      if (error) throw error;

      const ids = (rows ?? []).map((r) => r.id);
      const { data: lines } = await supabase
        .from("invoice_lines")
        .select("invoice_id, quantity, rate, hsn_sac_code")
        .in("invoice_id", ids);

      const lineMap = new Map<string, LineRow[]>();
      (lines ?? []).forEach((l) => {
        if (!lineMap.has(l.invoice_id)) lineMap.set(l.invoice_id, []);
        lineMap.get(l.invoice_id)!.push(l as LineRow);
      });

      const summaries: InvoiceSummary[] = (rows ?? []).map((row) => {
        const invLines = lineMap.get(row.id) ?? [];
        const subtotal = invLines.reduce(
          (s, l) => s + Number(l.quantity) * Number(l.rate),
          0,
        );
        const taxRate = Number(row.tax_rate ?? 18);
        const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
        const isIGST = row.gst_type === "IGST";
        const cgst = isIGST ? 0 : Number((taxAmount / 2).toFixed(2));
        const sgst = isIGST ? 0 : Number((taxAmount / 2).toFixed(2));
        const igst = isIGST ? taxAmount : 0;
        return {
          ...(row as InvoiceRow),
          subtotal,
          taxAmount,
          cgst,
          sgst,
          igst,
          total: subtotal + taxAmount,
          isB2B: Boolean(row.to_gstin),
        };
      });
      setInvoices(summaries);
    } catch {
      setStatus("Unable to load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, userId, supabase]);

  useEffect(() => {
    if (isLoaded && userId) load();
  }, [isLoaded, userId, load]);

  const b2b = invoices.filter((i) => i.isB2B);
  const b2c = invoices.filter((i) => !i.isB2B);
  const totalTaxable = invoices.reduce((s, i) => s + i.subtotal, 0);
  const totalCGST = invoices.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = invoices.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = invoices.reduce((s, i) => s + i.igst, 0);
  const totalTax = invoices.reduce((s, i) => s + i.taxAmount, 0);
  const grandTotal = invoices.reduce((s, i) => s + i.total, 0);

  const downloadCSV = (rows: InvoiceSummary[], filename: string) => {
    const header =
      "Invoice No,Date,Client,GSTIN,Taxable Value,CGST,SGST,IGST,Total Tax,Invoice Total,GST Type";
    const lines = rows.map((r) =>
      [
        r.invoice_number,
        r.issued_on,
        r.to_name || r.to_company,
        r.to_gstin,
        r.subtotal.toFixed(2),
        r.cgst.toFixed(2),
        r.sgst.toFixed(2),
        r.igst.toFixed(2),
        r.taxAmount.toFixed(2),
        r.total.toFixed(2),
        r.gst_type,
      ].join(","),
    );
    const blob = new Blob([header + "\n" + lines.join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const data = {
      financial_year: `${fy.start}-${String(fy.end).slice(-2)}`,
      generated_at: new Date().toISOString(),
      b2b: b2b.map((r) => ({
        inum: r.invoice_number,
        idt: r.issued_on,
        val: r.total,
        ctin: r.to_gstin,
        pos: r.to_state_code,
        rchrg: "N",
        inv_typ: "R",
        itms: [
          {
            num: 1,
            itm_det: {
              txval: r.subtotal,
              rt: r.tax_rate,
              camt: r.cgst,
              samt: r.sgst,
              csamt: 0,
            },
          },
        ],
      })),
      b2cs: b2c.reduce((acc: Record<string, number>, r) => {
        const key = `${r.tax_rate}%`;
        acc[key] = (acc[key] ?? 0) + r.subtotal;
        return acc;
      }, {}),
      summary: {
        taxable: totalTaxable,
        cgst: totalCGST,
        sgst: totalSGST,
        igst: totalIGST,
        total_tax: totalTax,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR1-${fy.start}-${fy.end}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fieldLabel = {
    fontFamily: "var(--font-mono), monospace",
    fontSize: 9,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>
              GST Returns
            </p>
            <h1
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontWeight: 600,
                fontSize: "clamp(24px, 4vw, 36px)",
                color: "var(--text-primary)",
                margin: "0 0 8px",
              }}
            >
              GSTR-1 Export
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              FY {fy.start}–{String(fy.end).slice(-2)} · {invoices.length}{" "}
              invoice{invoices.length !== 1 ? "s" : ""} · Export for GST portal
              or CA
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={load} disabled={isLoading} className="btn-ghost">
              <RefreshCw size={13} /> {isLoading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => downloadCSV(b2b, `GSTR1-B2B-${fy.start}.csv`)}
              className="btn-ghost"
            >
              <Download size={13} /> B2B CSV
            </button>
            <button
              onClick={() => downloadCSV(b2c, `GSTR1-B2CS-${fy.start}.csv`)}
              className="btn-ghost"
            >
              <Download size={13} /> B2CS CSV
            </button>
            <button onClick={downloadJSON} className="btn-gold">
              <Download size={13} /> GSTR-1 JSON
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { label: "Taxable value", value: formatCurrency(totalTaxable) },
            { label: "CGST", value: formatCurrency(totalCGST) },
            { label: "SGST", value: formatCurrency(totalSGST) },
            { label: "IGST", value: formatCurrency(totalIGST) },
            { label: "Total tax", value: formatCurrency(totalTax) },
            { label: "Invoice total", value: formatCurrency(grandTotal) },
          ].map((c) => (
            <motion.div
              key={c.label}
              className="card"
              style={{ padding: "18px 20px" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span style={fieldLabel}>{c.label}</span>
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginTop: 8,
                }}
              >
                {c.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* GSTR-3B summary */}
        <div
          className="card"
          style={{ padding: 28, borderLeft: "2px solid var(--gold)" }}
        >
          <p className="section-label" style={{ marginBottom: 12 }}>
            GSTR-3B Summary
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                label:
                  "3.1 Outward taxable supplies (other than zero rated, nil and exempted)",
                value: formatCurrency(totalTaxable),
              },
              {
                label: "Integrated Tax (IGST)",
                value: formatCurrency(totalIGST),
              },
              { label: "Central Tax (CGST)", value: formatCurrency(totalCGST) },
              {
                label: "State/UT Tax (SGST)",
                value: formatCurrency(totalSGST),
              },
              { label: "Net GST payable", value: formatCurrency(totalTax) },
            ].map((r) => (
              <div key={r.label}>
                <p style={{ ...fieldLabel, marginBottom: 4 }}>{r.label}</p>
                <p
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  {r.value}
                </p>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 16,
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
            }}
          >
            Magic Invoice generates the data — upload the JSON to the GST portal
            or share with your CA. We do not file directly (that requires GSP
            licence).
          </p>
        </div>

        {/* Tabs */}
        <div>
          <div
            style={{
              display: "flex",
              gap: 24,
              borderBottom: "1px solid var(--border)",
              marginBottom: 20,
            }}
          >
            {(
              [
                ["summary", "All invoices"],
                ["b2b", `B2B (${b2b.length})`],
                ["b2c", `B2CS (${b2c.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`tab${activeTab === key ? " active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              Loading...
            </p>
          ) : (
            <InvoiceTable
              rows={
                activeTab === "b2b" ? b2b : activeTab === "b2c" ? b2c : invoices
              }
            />
          )}
        </div>

        {status && (
          <p
            style={{
              fontSize: 11,
              color: "var(--gold)",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            {status}
          </p>
        )}

        <div
          className="card"
          style={{ padding: "20px 24px", borderLeft: "2px solid var(--gold)" }}
        >
          <p className="section-label" style={{ marginBottom: 8 }}>
            Month-wise breakdown
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 8,
            }}
          >
            {months.map((month, i) => {
              const monthIndex = i < 9 ? i + 4 : i - 8;
              const year = i < 9 ? fy.start : fy.end;
              const monthInvoices = invoices.filter((inv) => {
                const d = new Date(inv.issued_on);
                return (
                  d.getMonth() + 1 === monthIndex && d.getFullYear() === year
                );
              });
              const total = monthInvoices.reduce((s, i) => s + i.total, 0);
              return (
                <div
                  key={month}
                  className="card"
                  style={{ padding: "10px 12px" }}
                >
                  <p style={{ ...fieldLabel, marginBottom: 4 }}>
                    {month} {year}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 12,
                      color: total > 0 ? "var(--gold)" : "var(--text-muted)",
                    }}
                  >
                    {total > 0 ? formatCurrency(total) : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceTable({ rows }: { rows: InvoiceSummary[] }) {
  if (!rows.length)
    return (
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          No invoices in this category.
        </p>
      </div>
    );

  const fieldLabel = {
    fontFamily: "var(--font-mono), monospace",
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {[
              "Invoice No",
              "Date",
              "Client",
              "GSTIN",
              "Taxable",
              "CGST",
              "SGST",
              "IGST",
              "Total",
            ].map((h) => (
              <th
                key={h}
                style={{
                  ...fieldLabel,
                  textAlign: "left",
                  padding: "8px 12px",
                  fontWeight: 500,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.id}
              style={{
                borderBottom: "1px solid var(--border)",
                background: i % 2 === 0 ? "transparent" : "var(--ink-soft)",
              }}
            >
              <td
                style={{
                  padding: "10px 12px",
                  fontFamily: "var(--font-mono), monospace",
                  color: "var(--gold)",
                  fontSize: 12,
                }}
              >
                {r.invoice_number}
              </td>
              <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>
                {r.issued_on}
              </td>
              <td
                style={{ padding: "10px 12px", color: "var(--text-secondary)" }}
              >
                {r.to_name || r.to_company || "—"}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  fontFamily: "var(--font-mono), monospace",
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}
              >
                {r.to_gstin || "B2C"}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                ₹{r.subtotal.toFixed(2)}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                ₹{r.cgst.toFixed(2)}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                ₹{r.sgst.toFixed(2)}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                ₹{r.igst.toFixed(2)}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "var(--cream)",
                  fontFamily: "var(--font-mono), monospace",
                  fontWeight: 600,
                }}
              >
                ₹{r.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
