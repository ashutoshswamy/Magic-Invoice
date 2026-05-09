"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import {
  BarChart2,
  DollarSign,
  FileText,
  MessageSquare,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useSupabase } from "../lib/useSupabase";

type InvoiceRow = {
  id: string;
  paid: boolean | null;
};

type LineRow = {
  invoice_id: string;
  quantity: number;
  rate: number;
};

export default function AnalyticsPage() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiPrediction, setAiPrediction] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !isLoaded || !userId) return;
      setIsLoading(true);
      setStatus(null);
      try {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("currency")
          .eq("user_id", userId)
          .maybeSingle();
        if (settings?.currency) setCurrency(settings.currency);

        const { data: invoiceRows, error } = await supabase
          .from("invoices")
          .select("id, paid")
          .eq("user_id", userId);
        if (error) throw error;
        const rows = (invoiceRows ?? []) as InvoiceRow[];
        const paid = rows.filter((row) => row.paid).length;
        const unpaid = rows.length - paid;

        setInvoiceCount(rows.length);
        setPaidCount(paid);
        setUnpaidCount(unpaid);

        const invoiceIds = rows.map((row) => row.id);
        if (invoiceIds.length) {
          const { data: lines, error: linesError } = await supabase
            .from("invoice_lines")
            .select("invoice_id, quantity, rate")
            .in("invoice_id", invoiceIds);
          if (linesError) throw linesError;
          const lineRows = (lines ?? []) as LineRow[];
          const total = lineRows.reduce(
            (sum, line) =>
              sum + Number(line.quantity ?? 0) * Number(line.rate ?? 0),
            0,
          );
          setTotalRevenue(total);
        } else {
          setTotalRevenue(0);
        }

        const { count: clientsCount, error: clientError } = await supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        if (clientError) throw clientError;
        setClientCount(clientsCount ?? 0);
      } catch {
        setStatus("Unable to load analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isLoaded, userId, supabase]);

  const fetchCashFlow = async () => {
    setIsLoadingInsight(true);
    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cash_flow" }),
      });
      const data = (await res.json()) as { insight?: string; error?: string };
      setAiInsight(data.insight ?? data.error ?? "Unable to generate insight.");
    } catch {
      setAiInsight("AI service unavailable.");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const fetchPrediction = async () => {
    setIsLoadingPrediction(true);
    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment_prediction" }),
      });
      const data = (await res.json()) as { insight?: string; error?: string };
      setAiPrediction(
        data.insight ?? data.error ?? "Unable to generate prediction.",
      );
    } catch {
      setAiPrediction("AI service unavailable.");
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const askAi = async () => {
    if (!aiQuestion.trim()) return;
    setIsAskingAi(true);
    setAiAnswer(null);
    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "question", question: aiQuestion }),
      });
      const data = (await res.json()) as { insight?: string; error?: string };
      setAiAnswer(data.insight ?? data.error ?? "No answer.");
    } catch {
      setAiAnswer("AI service unavailable.");
    } finally {
      setIsAskingAi(false);
    }
  };

  const cards = useMemo(() => {
    return [
      {
        label: "Total invoices",
        value: invoiceCount.toLocaleString(),
        icon: FileText,
        accent: "var(--gold-bright)",
        accentBg: "rgba(245,158,11,0.10)",
        gradient: "linear-gradient(90deg, var(--gold), var(--gold-bright))",
      },
      {
        label: "Paid",
        value: paidCount.toLocaleString(),
        icon: PieChart,
        accent: "#34D399",
        accentBg: "rgba(16,185,129,0.10)",
        gradient: "linear-gradient(90deg, #10B981, #34D399)",
      },
      {
        label: "Unpaid",
        value: unpaidCount.toLocaleString(),
        icon: BarChart2,
        accent: "#FB923C",
        accentBg: "rgba(251,146,60,0.10)",
        gradient: "linear-gradient(90deg, #F97316, #FB923C)",
      },
      {
        label: "Saved clients",
        value: clientCount.toLocaleString(),
        icon: Users,
        accent: "#60A5FA",
        accentBg: "rgba(59,130,246,0.10)",
        gradient: "linear-gradient(90deg, #3B82F6, #60A5FA)",
      },
    ];
    // revenue card is rendered separately below
  }, [
    clientCount,
    invoiceCount,
    paidCount,
    unpaidCount,
  ]);

  const formattedRevenue = useMemo(() => {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(totalRevenue);
  }, [currency, totalRevenue]);

  const collectionRate = useMemo(() => {
    if (invoiceCount === 0) return 0;
    return Math.round((paidCount / invoiceCount) * 100);
  }, [invoiceCount, paidCount]);

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
        {/* ── Hero Header ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart2 size={22} style={{ color: "var(--ink)" }} />
          </div>
          <div>
            <p className="section-label" style={{ margin: 0 }}>
              Analytics
            </p>
            <h1
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontWeight: 600,
                fontSize: "clamp(24px, 4vw, 36px)",
                color: "var(--text-primary)",
                margin: "2px 0 0",
              }}
            >
              Invoice analytics
            </h1>
          </div>
        </motion.div>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "40px 0",
            }}
          >
            <RefreshCw size={14} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              Loading analytics...
            </p>
          </div>
        ) : (
          <>
            {/* ── Revenue Hero Card ────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{
                background: "linear-gradient(135deg, var(--ink-soft) 0%, rgba(22,19,16,0.5) 100%)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 0,
                overflow: "hidden",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-bright), var(--gold), var(--gold-dim))" }} />
              <div style={{ padding: "28px 32px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(217,119,6,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DollarSign size={16} style={{ color: "var(--gold-bright)" }} />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--gold-bright)",
                      }}
                    >
                      Total Revenue
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-playfair), serif",
                      fontSize: "clamp(28px, 5vw, 42px)",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}
                  >
                    {formattedRevenue}
                  </p>
                </div>

                {/* Collection rate mini-viz */}
                <div style={{ minWidth: 180, flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Collection rate
                    </span>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, fontWeight: 600, color: collectionRate >= 75 ? "#34D399" : collectionRate >= 40 ? "var(--gold-bright)" : "#FB923C" }}>
                      {collectionRate}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--ink-muted)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${collectionRate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        background: collectionRate >= 75
                          ? "linear-gradient(90deg, #10B981, #34D399)"
                          : collectionRate >= 40
                            ? "linear-gradient(90deg, var(--gold), var(--gold-bright))"
                            : "linear-gradient(90deg, #F97316, #FB923C)",
                      }}
                    />
                  </div>
                  <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--text-muted)", marginTop: 6, letterSpacing: "0.06em" }}>
                    {paidCount} paid · {unpaidCount} outstanding
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Stat Cards Grid ─────────────────────────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 14,
              }}
            >
              {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.06 }}
                    style={{
                      background: "linear-gradient(168deg, var(--ink-soft) 0%, rgba(22,19,16,0.5) 100%)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ height: 3, background: card.gradient }} />
                    <div style={{ padding: "20px 24px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: card.accentBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={13} style={{ color: card.accent }} />
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: 9,
                            fontWeight: 600,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: card.accent,
                          }}
                        >
                          {card.label}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: "var(--font-playfair), serif",
                          fontSize: 30,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          letterSpacing: "-0.02em",
                          margin: 0,
                        }}
                      >
                        {card.value}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

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

        {/* ── AI Insights Header ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ display: "flex", alignItems: "center", gap: 14 }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={18} style={{ color: "var(--ink)" }} />
          </div>
          <div>
            <p className="section-label" style={{ margin: 0 }}>
              AI Insights
            </p>
            <h2
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "2px 0 0",
              }}
            >
              AI-powered analysis
            </h2>
          </div>
        </motion.div>

        {/* ── AI Cards Grid ──────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}
        >
          {/* Cash Flow Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: "linear-gradient(168deg, var(--ink-soft) 0%, rgba(22,19,16,0.6) 100%)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Top accent */}
            <div style={{ height: 3, background: "linear-gradient(90deg, var(--gold), var(--gold-bright), var(--gold))" }} />

            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "rgba(217,119,6,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={14} style={{ color: "var(--gold-bright)" }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--gold-bright)",
                  }}
                >
                  Cash Flow
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
                AI reads your receivables and payables to give a plain-English cash position.
              </p>

              {aiInsight ? (
                <div
                  style={{
                    background: "rgba(217,119,6,0.06)",
                    border: "1px solid rgba(217,119,6,0.15)",
                    borderRadius: 6,
                    padding: "16px 20px",
                    marginBottom: 14,
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.8, margin: 0 }}>
                    {aiInsight}
                  </p>
                </div>
              ) : null}

              <button
                onClick={fetchCashFlow}
                disabled={isLoadingInsight}
                className={aiInsight ? "btn-ghost" : "btn-gold"}
                style={aiInsight ? { fontSize: 10 } : {}}
              >
                {aiInsight ? <RefreshCw size={11} /> : <TrendingUp size={13} />}{" "}
                {isLoadingInsight ? "Analysing..." : aiInsight ? "Refresh" : "Generate insight"}
              </button>
            </div>
          </motion.div>

          {/* Payment Prediction Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            style={{
              background: "linear-gradient(168deg, var(--ink-soft) 0%, rgba(22,19,16,0.6) 100%)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #3B82F6)" }} />

            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "rgba(59,130,246,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart2 size={14} style={{ color: "#60A5FA" }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#60A5FA",
                  }}
                >
                  Payment Prediction
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
                Predict which invoices are at risk of late payment based on patterns.
              </p>

              {aiPrediction ? (
                <div
                  style={{
                    background: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.15)",
                    borderRadius: 6,
                    padding: "16px 20px",
                    marginBottom: 14,
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.8, margin: 0 }}>
                    {aiPrediction}
                  </p>
                </div>
              ) : null}

              <button
                onClick={fetchPrediction}
                disabled={isLoadingPrediction}
                className={aiPrediction ? "btn-ghost" : "btn-gold"}
                style={aiPrediction ? { fontSize: 10 } : {}}
              >
                {aiPrediction ? <RefreshCw size={11} /> : <BarChart2 size={13} />}{" "}
                {isLoadingPrediction ? "Predicting..." : aiPrediction ? "Refresh" : "Generate prediction"}
              </button>
            </div>
          </motion.div>

          {/* Ask AI Card — full width */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            style={{
              background: "linear-gradient(168deg, var(--ink-soft) 0%, rgba(22,19,16,0.6) 100%)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 0,
              overflow: "hidden",
              gridColumn: "1 / -1",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg, #10B981, #34D399, #10B981)" }} />

            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "rgba(16,185,129,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare size={14} style={{ color: "#34D399" }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#34D399",
                  }}
                >
                  Ask AI
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Ask anything about your invoices, revenue, or clients in plain English.
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") askAi(); }}
                  placeholder='e.g. "Which client owes the most?" or "What was my revenue last month?"'
                  style={{
                    flex: 1,
                    minWidth: 220,
                    background: "var(--ink)",
                    border: "1px solid var(--border-bright)",
                    borderRadius: 6,
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#34D399"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(215,183,120,0.30)"; }}
                />
                <button
                  onClick={askAi}
                  disabled={isAskingAi || !aiQuestion.trim()}
                  className="btn-gold"
                >
                  <MessageSquare size={13} />{" "}
                  {isAskingAi ? "Thinking..." : "Ask"}
                </button>
              </div>

              {aiAnswer && (
                <div
                  style={{
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.15)",
                    borderRadius: 6,
                    padding: "16px 20px",
                    marginTop: 16,
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.8, margin: 0 }}>
                    {aiAnswer}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
