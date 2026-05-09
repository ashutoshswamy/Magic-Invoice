"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { Plus, Trash2 } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useSupabase } from "../lib/useSupabase";

type Expense = {
  id: string;
  vendor: string;
  description: string;
  amount: number;
  gst_paid: number;
  category: string;
  expense_date: string;
  itc_eligible: boolean;
  receipt_url: string | null;
};

type DraftExpense = Omit<Expense, "id">;

const CATEGORIES = [
  "software",
  "hardware",
  "travel",
  "office",
  "marketing",
  "professional",
  "utilities",
  "other",
] as const;

const emptyDraft = (): DraftExpense => ({
  vendor: "",
  description: "",
  amount: 0,
  gst_paid: 0,
  category: "other",
  expense_date: new Date().toISOString().slice(0, 10),
  itc_eligible: true,
  receipt_url: null,
});

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );

export default function ExpensesPage() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftExpense>(emptyDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !isLoaded || !userId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select(
        "id, vendor, description, amount, gst_paid, category, expense_date, itc_eligible, receipt_url",
      )
      .eq("user_id", userId)
      .order("expense_date", { ascending: false });
    setIsLoading(false);
    if (error) {
      setStatus("Unable to load expenses.");
      return;
    }
    setExpenses((data ?? []) as Expense[]);
  }, [isLoaded, userId, supabase]);

  useEffect(() => {
    if (isLoaded && userId) load();
  }, [isLoaded, userId, load]);

  const handleSave = async () => {
    if (!isSupabaseConfigured || !userId) {
      setStatus("Connect Supabase to save expenses.");
      return;
    }
    if (!draft.vendor.trim()) {
      setStatus("Vendor name required.");
      return;
    }
    if (!draft.amount || draft.amount <= 0) {
      setStatus("Amount must be greater than 0.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert({ ...draft, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      setExpenses((prev) => [data as Expense, ...prev]);
      setDraft(emptyDraft());
      setStatus("Expense saved.");
    } catch {
      setStatus("Unable to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured) return;
    if (!window.confirm("Delete this expense?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      setStatus("Unable to delete expense.");
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setStatus("Expense deleted.");
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalGstPaid = expenses.reduce((s, e) => s + Number(e.gst_paid), 0);
  const itcEligible = expenses
    .filter((e) => e.itc_eligible)
    .reduce((s, e) => s + Number(e.gst_paid), 0);

  const fieldBox = {
    background: "var(--ink-soft)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  };
  const fieldLabel = {
    fontFamily: "var(--font-mono), monospace",
    fontSize: 9,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
  };
  const fieldInput = {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontSize: 13,
    fontFamily: "var(--font-dm-sans), sans-serif",
    width: "100%",
    padding: 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "40px 24px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>
            Expense tracker
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
            Expenses &amp; ITC
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Track business expenses and GST paid (Input Tax Credit) for GSTR-3B
            offset.
          </p>
        </div>

        {/* Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { label: "Total expenses", value: formatINR(totalExpenses) },
            { label: "GST paid (total)", value: formatINR(totalGstPaid) },
            { label: "ITC eligible", value: formatINR(itcEligible) },
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

        {/* Add form */}
        <motion.div
          className="card"
          style={{ padding: 28 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="section-label" style={{ marginBottom: 16 }}>
            Add expense
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div style={{ ...fieldBox, gridColumn: "1 / -1" }}>
              <span style={fieldLabel}>Vendor / supplier</span>
              <input
                style={fieldInput}
                placeholder="e.g. Adobe, AWS, Zomato"
                value={draft.vendor}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, vendor: e.target.value }))
                }
              />
            </div>
            <div style={{ ...fieldBox, gridColumn: "1 / -1" }}>
              <span style={fieldLabel}>Description</span>
              <input
                style={fieldInput}
                placeholder="What was purchased"
                value={draft.description}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>Amount (₹)</span>
              <input
                type="number"
                style={fieldInput}
                value={draft.amount || ""}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    amount: Number(e.target.value || 0),
                  }))
                }
              />
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>GST paid (₹)</span>
              <input
                type="number"
                style={fieldInput}
                value={draft.gst_paid || ""}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    gst_paid: Number(e.target.value || 0),
                  }))
                }
              />
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>Category</span>
              <select
                style={{ ...fieldInput, cursor: "pointer" }}
                value={draft.category}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>Date</span>
              <input
                type="date"
                style={fieldInput}
                value={draft.expense_date}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, expense_date: e.target.value }))
                }
              />
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>ITC eligible</span>
              <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                {[true, false].map((v) => (
                  <label
                    key={String(v)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="itc"
                      checked={draft.itc_eligible === v}
                      onChange={() =>
                        setDraft((p) => ({ ...p, itc_eligible: v }))
                      }
                      style={{ accentColor: "var(--gold)" }}
                    />
                    <span
                      style={{ fontSize: 13, color: "var(--text-secondary)" }}
                    >
                      {v ? "Yes" : "No"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 16,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-gold"
            >
              <Plus size={13} /> {isSaving ? "Saving..." : "Add expense"}
            </button>
            {status && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--gold)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {status}
              </span>
            )}
          </div>
        </motion.div>

        {/* Expenses list */}
        {isLoading ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            Loading expenses...
          </p>
        ) : expenses.length === 0 ? (
          <div
            className="card"
            style={{ padding: "48px 32px", textAlign: "center" }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              No expenses yet
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Add your first business expense above to start tracking ITC.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Date",
                    "Vendor",
                    "Description",
                    "Category",
                    "Amount",
                    "GST paid",
                    "ITC",
                    "",
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
                {expenses.map((exp, i) => (
                  <motion.tr
                    key={exp.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background:
                        i % 2 === 0 ? "transparent" : "var(--ink-soft)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {exp.expense_date}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {exp.vendor}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--text-secondary)",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {exp.description || "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--text-muted)",
                        textTransform: "capitalize",
                      }}
                    >
                      {exp.category}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--font-mono), monospace",
                        color: "var(--text-primary)",
                      }}
                    >
                      {formatINR(exp.amount)}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--font-mono), monospace",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {formatINR(exp.gst_paid)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "var(--font-mono), monospace",
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: exp.itc_eligible
                            ? "rgba(16,185,129,0.15)"
                            : "var(--ink-soft)",
                          color: exp.itc_eligible
                            ? "#10B981"
                            : "var(--text-muted)",
                        }}
                      >
                        {exp.itc_eligible ? "eligible" : "no"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        disabled={deletingId === exp.id}
                        style={{
                          background: "none",
                          border: "1px solid rgba(248,113,113,0.2)",
                          borderRadius: 2,
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#FCA5A5",
                          opacity: deletingId === exp.id ? 0.4 : 1,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          className="card"
          style={{ padding: "16px 20px", borderLeft: "2px solid var(--gold)" }}
        >
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-secondary)" }}>
              ITC (Input Tax Credit):
            </strong>{" "}
            GST paid on eligible business expenses can be offset against your
            GST payable in GSTR-3B. Magic Invoice generates the data — your CA
            files the returns.
          </p>
        </div>
      </div>
    </div>
  );
}
