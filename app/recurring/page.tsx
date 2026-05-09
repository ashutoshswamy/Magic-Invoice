"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import {
  Plus,
  Trash2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import TopNav from "../components/TopNav";

type InvoiceLine = {
  description: string;
  quantity: number;
  rate: number;
  hsnSacCode?: string;
};

type RecurringInvoice = {
  id: string;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  next_run_date: string;
  last_run_date: string | null;
  active: boolean;
  from_name: string;
  from_company: string;
  from_email: string;
  to_name: string;
  to_company: string;
  to_email: string;
  currency: string;
  tax_rate: number;
  gst_type: string;
  due_date_days: number;
  notes: string;
  lines: InvoiceLine[];
  custom_charges: Array<{ label: string; amount: number }>;
  created_at: string;
};

type Draft = Omit<
  RecurringInvoice,
  "id" | "last_run_date" | "created_at" | "active"
> & {
  from_address_line1: string;
  from_address_line2: string;
  from_city: string;
  from_state: string;
  from_state_code: string;
  from_postal_code: string;
  from_country: string;
  from_gstin: string;
  to_address_line1: string;
  to_city: string;
  to_state: string;
  to_state_code: string;
  to_country: string;
  to_gstin: string;
};

const FREQ_LABELS: Record<string, string> = {
  weekly: "Every week",
  monthly: "Every month",
  quarterly: "Every quarter",
  yearly: "Every year",
};

const emptyLine = (): InvoiceLine => ({
  description: "",
  quantity: 1,
  rate: 0,
  hsnSacCode: "",
});

const emptyDraft = (): Draft => ({
  frequency: "monthly",
  next_run_date: new Date().toISOString().slice(0, 10),
  from_name: "",
  from_company: "",
  from_email: "",
  from_address_line1: "",
  from_address_line2: "",
  from_city: "",
  from_state: "",
  from_state_code: "",
  from_postal_code: "",
  from_country: "India",
  from_gstin: "",
  to_name: "",
  to_company: "",
  to_email: "",
  to_address_line1: "",
  to_city: "",
  to_state: "",
  to_state_code: "",
  to_country: "India",
  to_gstin: "",
  currency: "INR",
  tax_rate: 18,
  gst_type: "CGST_SGST",
  due_date_days: 14,
  notes: "",
  lines: [emptyLine()],
  custom_charges: [],
});

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const lineTotal = (lines: InvoiceLine[], taxRate: number) => {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.rate, 0);
  return subtotal + (subtotal * taxRate) / 100;
};

export default function RecurringPage() {
  const { userId, isLoaded } = useAuth();
  const [items, setItems] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const notify = (msg: string, ok = true) => {
    setStatus({ msg, ok });
    setTimeout(() => setStatus(null), 4000);
  };

  const load = useCallback(async () => {
    if (!isLoaded || !userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/recurring");
      const json = (await res.json()) as {
        data?: RecurringInvoice[];
        error?: string;
      };
      if (!res.ok) {
        notify(json.error ?? "Failed to load", false);
        return;
      }
      setItems(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!draft.to_name.trim()) {
      notify("Client name required", false);
      return;
    }
    if (!draft.lines.length || !draft.lines[0].description.trim()) {
      notify("At least one line item required", false);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, active: true }),
    });
    const json = (await res.json()) as {
      data?: RecurringInvoice;
      error?: string;
    };
    setSaving(false);
    if (!res.ok) {
      notify(json.error ?? "Failed to save", false);
      return;
    }
    setItems((prev) => [json.data!, ...prev]);
    setDraft(emptyDraft());
    setShowForm(false);
    notify("Recurring invoice created.");
  };

  const toggleActive = async (item: RecurringInvoice) => {
    const res = await fetch("/api/recurring", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    const json = (await res.json()) as {
      data?: RecurringInvoice;
      error?: string;
    };
    if (!res.ok) {
      notify(json.error ?? "Failed to update", false);
      return;
    }
    setItems((prev) => prev.map((r) => (r.id === item.id ? json.data! : r)));
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Delete this recurring template? Already generated invoices are kept.",
      )
    )
      return;
    setDeletingId(id);
    const res = await fetch(`/api/recurring?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      notify("Failed to delete", false);
      return;
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
    notify("Deleted.");
  };

  const handleRunNow = async () => {
    setRunningAll(true);
    const res = await fetch("/api/recurring/run", { method: "POST" });
    const json = (await res.json()) as { generated?: number; error?: string };
    setRunningAll(false);
    if (!res.ok) {
      notify(json.error ?? "Run failed", false);
      return;
    }
    if ((json.generated ?? 0) === 0) {
      notify("No templates due today.");
    } else {
      notify(
        `Generated ${json.generated} invoice${json.generated === 1 ? "" : "s"}.`,
      );
      load();
    }
  };

  const setLine = (
    idx: number,
    field: keyof InvoiceLine,
    value: string | number,
  ) => {
    setDraft((p) => {
      const lines = [...p.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      return { ...p, lines };
    });
  };

  const addLine = () =>
    setDraft((p) => ({ ...p, lines: [...p.lines, emptyLine()] }));
  const removeLine = (idx: number) =>
    setDraft((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));

  const fieldBox = {
    background: "var(--ink-soft)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 5,
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

  const activeItems = items.filter((r) => r.active);
  const pausedItems = items.filter((r) => !r.active);

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>
              Recurring
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
              Recurring Invoices
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Auto-generate invoices on a weekly, monthly, quarterly, or yearly
              schedule.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexShrink: 0,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleRunNow}
              disabled={runningAll}
              className="btn-ghost"
              style={{ fontSize: 12 }}
            >
              <Play size={12} />
              {runningAll ? "Running..." : "Run due now"}
            </button>
            <button
              onClick={() => {
                setShowForm((v) => !v);
                setDraft(emptyDraft());
              }}
              className="btn-gold"
              style={{ fontSize: 12 }}
            >
              <Plus size={12} />
              New schedule
            </button>
          </div>
        </div>

        {status && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "12px 18px",
              borderRadius: 2,
              background: status.ok
                ? "rgba(16,185,129,0.12)"
                : "rgba(248,113,113,0.12)",
              borderLeft: `2px solid ${status.ok ? "#10B981" : "#F87171"}`,
              fontSize: 13,
              color: status.ok ? "#10B981" : "#F87171",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            {status.msg}
          </motion.div>
        )}

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="card"
              style={{ padding: 28 }}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <p className="section-label" style={{ marginBottom: 20 }}>
                New recurring schedule
              </p>

              {/* Schedule settings */}
              <p style={{ ...fieldLabel, marginBottom: 10 }}>Schedule</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div style={fieldBox}>
                  <span style={fieldLabel}>Frequency</span>
                  <select
                    style={{ ...fieldInput, cursor: "pointer" }}
                    value={draft.frequency}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        frequency: e.target.value as Draft["frequency"],
                      }))
                    }
                  >
                    {Object.entries(FREQ_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>First run date</span>
                  <input
                    type="date"
                    style={fieldInput}
                    value={draft.next_run_date}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, next_run_date: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>Due after (days)</span>
                  <input
                    type="number"
                    style={fieldInput}
                    min={1}
                    value={draft.due_date_days}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        due_date_days: Number(e.target.value) || 14,
                      }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>Tax rate (%)</span>
                  <input
                    type="number"
                    style={fieldInput}
                    value={draft.tax_rate}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        tax_rate: Number(e.target.value) || 18,
                      }))
                    }
                  />
                </div>
              </div>

              {/* From */}
              <p style={{ ...fieldLabel, marginBottom: 10 }}>
                From (your details)
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div style={fieldBox}>
                  <span style={fieldLabel}>Name</span>
                  <input
                    style={fieldInput}
                    placeholder="Your name"
                    value={draft.from_name}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, from_name: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>Company</span>
                  <input
                    style={fieldInput}
                    placeholder="Company (optional)"
                    value={draft.from_company}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, from_company: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>Email</span>
                  <input
                    type="email"
                    style={fieldInput}
                    placeholder="you@company.com"
                    value={draft.from_email}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, from_email: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>GSTIN</span>
                  <input
                    style={fieldInput}
                    placeholder="22AAAAA0000A1Z5"
                    value={draft.from_gstin}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, from_gstin: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>State code</span>
                  <input
                    style={fieldInput}
                    placeholder="e.g. MH"
                    maxLength={2}
                    value={draft.from_state_code}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        from_state_code: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
              </div>

              {/* To */}
              <p style={{ ...fieldLabel, marginBottom: 10 }}>
                Bill to (client)
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div style={fieldBox}>
                  <span style={fieldLabel}>Client name *</span>
                  <input
                    style={fieldInput}
                    placeholder="Client name"
                    value={draft.to_name}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, to_name: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>Company</span>
                  <input
                    style={fieldInput}
                    placeholder="Company (optional)"
                    value={draft.to_company}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, to_company: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>Email</span>
                  <input
                    type="email"
                    style={fieldInput}
                    placeholder="client@email.com"
                    value={draft.to_email}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, to_email: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>GSTIN</span>
                  <input
                    style={fieldInput}
                    placeholder="Client GSTIN"
                    value={draft.to_gstin}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, to_gstin: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldBox}>
                  <span style={fieldLabel}>State code</span>
                  <input
                    style={fieldInput}
                    placeholder="e.g. KA"
                    maxLength={2}
                    value={draft.to_state_code}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        to_state_code: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
              </div>

              {/* Lines */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {draft.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="line-item-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 100px 100px 32px",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <div style={fieldBox}>
                      <span style={fieldLabel}>Description</span>
                      <input
                        style={fieldInput}
                        placeholder="Service / product"
                        value={line.description}
                        onChange={(e) =>
                          setLine(idx, "description", e.target.value)
                        }
                      />
                    </div>
                    <div style={fieldBox}>
                      <span style={fieldLabel}>Qty</span>
                      <input
                        type="number"
                        style={fieldInput}
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          setLine(idx, "quantity", Number(e.target.value) || 1)
                        }
                      />
                    </div>
                    <div style={fieldBox}>
                      <span style={fieldLabel}>Rate (₹)</span>
                      <input
                        type="number"
                        style={fieldInput}
                        min={0}
                        value={line.rate || ""}
                        onChange={(e) =>
                          setLine(idx, "rate", Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div style={fieldBox}>
                      <span style={fieldLabel}>HSN/SAC</span>
                      <input
                        style={fieldInput}
                        placeholder="998314"
                        value={line.hsnSacCode || ""}
                        onChange={(e) =>
                          setLine(idx, "hsnSacCode", e.target.value)
                        }
                      />
                    </div>
                    <button
                      onClick={() => removeLine(idx)}
                      disabled={draft.lines.length === 1}
                      style={{
                        background: "none",
                        border: "1px solid rgba(248,113,113,0.2)",
                        borderRadius: 2,
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#FCA5A5",
                        opacity: draft.lines.length === 1 ? 0.3 : 1,
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>

              <style jsx>{`
                @media (max-width: 640px) {
                  .line-item-grid {
                    grid-template-columns: 1fr 1fr !important;
                    gap: 10px !important;
                  }
                  .line-item-grid > div:first-child {
                    grid-column: span 2;
                  }
                }
                @media (max-width: 480px) {
                  .line-item-grid {
                    grid-template-columns: 1fr !important;
                  }
                  .line-item-grid > div:first-child {
                    grid-column: auto;
                  }
                  .line-item-grid button {
                    justify-self: end;
                  }
                }
              `}</style>
              <button
                onClick={addLine}
                className="btn-ghost"
                style={{ fontSize: 11, marginBottom: 20 }}
              >
                <Plus size={11} /> Add line
              </button>

              {/* Notes */}
              <div style={{ ...fieldBox, marginBottom: 20 }}>
                <span style={fieldLabel}>Notes</span>
                <textarea
                  style={{ ...fieldInput, resize: "vertical", minHeight: 56 }}
                  placeholder="Payment terms, bank details, etc."
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-gold"
                  style={{ fontSize: 13 }}
                >
                  <RefreshCw size={13} />{" "}
                  {saving ? "Saving..." : "Create schedule"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-ghost"
                  style={{ fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {loading ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            Loading schedules...
          </p>
        ) : items.length === 0 ? (
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
              No recurring schedules
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Create a schedule to auto-generate invoices for retainer clients.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...activeItems, ...pausedItems].map((item, i) => {
              const total = lineTotal(item.lines ?? [], item.tax_rate);
              const expanded = expandedId === item.id;
              return (
                <motion.div
                  key={item.id}
                  className="card"
                  style={{
                    overflow: "hidden",
                    opacity: item.active ? 1 : 0.55,
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: item.active ? 1 : 0.55, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {/* Row */}
                  <div
                    style={{
                      padding: "18px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap",
                      cursor: "pointer",
                    }}
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                  >
                    {/* Status dot */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: item.active
                          ? "#10B981"
                          : "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 120 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          margin: 0,
                        }}
                      >
                        {item.to_name || "—"}
                        {item.to_company ? (
                          <span
                            style={{
                              fontWeight: 400,
                              color: "var(--text-muted)",
                              marginLeft: 8,
                              fontSize: 12,
                            }}
                          >
                            {item.to_company}
                          </span>
                        ) : null}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono), monospace",
                          marginTop: 2,
                        }}
                      >
                        {FREQ_LABELS[item.frequency]} · next{" "}
                        {item.next_run_date}
                      </p>
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        flexShrink: 0,
                      }}
                    >
                      {formatINR(total)}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActive(item);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: item.active ? "#10B981" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title={item.active ? "Pause" : "Resume"}
                      >
                        {item.active ? (
                          <ToggleRight size={20} />
                        ) : (
                          <ToggleLeft size={20} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        disabled={deletingId === item.id}
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
                          opacity: deletingId === item.id ? 0.4 : 1,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {expanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            padding: "0 24px 20px",
                            borderTop: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill, minmax(140px, 1fr))",
                              gap: 14,
                              paddingTop: 16,
                            }}
                          >
                            {[
                              {
                                label: "From",
                                value:
                                  [item.from_name, item.from_company]
                                    .filter(Boolean)
                                    .join(" / ") || "—",
                              },
                              {
                                label: "To email",
                                value: item.to_email || "—",
                              },
                              { label: "GST type", value: item.gst_type },
                              { label: "Tax rate", value: `${item.tax_rate}%` },
                              {
                                label: "Due in",
                                value: `${item.due_date_days} days`,
                              },
                              {
                                label: "Last run",
                                value: item.last_run_date ?? "never",
                              },
                            ].map((f) => (
                              <div key={f.label}>
                                <p style={{ ...fieldLabel, marginBottom: 4 }}>
                                  {f.label}
                                </p>
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    margin: 0,
                                  }}
                                >
                                  {f.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Lines */}
                          <div style={{ marginTop: 16 }}>
                            <p style={{ ...fieldLabel, marginBottom: 8 }}>
                              Line items
                            </p>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              {(item.lines ?? []).map((line, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    padding: "4px 0",
                                    borderBottom: "1px solid var(--border)",
                                  }}
                                >
                                  <span>{line.description}</span>
                                  <span
                                    style={{
                                      fontFamily: "var(--font-mono), monospace",
                                      color: "var(--text-primary)",
                                    }}
                                  >
                                    {line.quantity} × {formatINR(line.rate)}
                                  </span>
                                </div>
                              ))}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 12,
                                  padding: "6px 0",
                                }}
                              >
                                <span style={{ color: "var(--text-muted)" }}>
                                  Total (incl. {item.tax_rate}% GST)
                                </span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-mono), monospace",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {formatINR(total)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {item.notes && (
                            <div style={{ marginTop: 12 }}>
                              <p style={{ ...fieldLabel, marginBottom: 4 }}>
                                Notes
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-muted)",
                                  margin: 0,
                                }}
                              >
                                {item.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div
          className="card"
          style={{ padding: "16px 20px", borderLeft: "2px solid var(--gold)" }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.75,
            }}
          >
            <strong style={{ color: "var(--text-secondary)" }}>
              How it works:
            </strong>{" "}
            Each schedule generates a draft invoice on its next run date. Click{" "}
            <strong style={{ color: "var(--text-secondary)" }}>
              Run due now
            </strong>{" "}
            to generate all invoices whose run date is today or in the past. For
            automated generation, call{" "}
            <code
              style={{
                fontFamily: "var(--font-mono), monospace",
                color: "var(--gold)",
              }}
            >
              POST /api/recurring/run
            </code>{" "}
            daily from a cron service.
          </p>
        </div>
      </div>
    </div>
  );
}
