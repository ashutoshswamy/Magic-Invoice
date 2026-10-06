"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../lib/useAuth";
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
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  getDoc,
  getCountFromServer,
  doc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebaseClient";

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
      if (!isLoaded || !userId) return;
      setIsLoading(true);
      setStatus(null);
      try {
        const settingsSnap = await getDoc(doc(db, "user_settings", userId));
        const settings = settingsSnap.data();
        if (settings?.currency) setCurrency(settings.currency);

        const invoicesSnap = await getDocs(
          query(collection(db, "invoices"), where("user_id", "==", userId)),
        );
        const rows = invoicesSnap.docs
          .filter((d) => !d.data().deleted_at)
          .map((d) => ({ id: d.id, ...d.data() }) as InvoiceRow);
        const liveIds = new Set(rows.map((r) => r.id));
        const paid = rows.filter((row) => row.paid).length;
        const unpaid = rows.length - paid;

        setInvoiceCount(rows.length);
        setPaidCount(paid);
        setUnpaidCount(unpaid);

        if (rows.length) {
          const linesSnap = await getDocs(
            query(
              collectionGroup(db, "lines"),
              where("user_id", "==", userId),
            ),
          );
          const lineRows = linesSnap.docs
            .map((d) => d.data() as LineRow)
            .filter((line) => liveIds.has(line.invoice_id));
          const total = lineRows.reduce(
            (sum, line) =>
              sum + Number(line.quantity ?? 0) * Number(line.rate ?? 0),
            0,
          );
          setTotalRevenue(total);
        } else {
          setTotalRevenue(0);
        }

        const clientsCountSnap = await getCountFromServer(
          query(collection(db, "clients"), where("user_id", "==", userId)),
        );
        setClientCount(clientsCountSnap.data().count ?? 0);
      } catch {
        setStatus("Unable to load analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isLoaded, userId]);

  const fetchCashFlow = async () => {
    setIsLoadingInsight(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
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
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
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
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
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
        accent: "var(--accent-strong)",
        accentBg: "color-mix(in srgb, var(--accent) 10%, transparent)",
        gradient: "linear-gradient(90deg, var(--accent), var(--accent-strong))",
      },
      {
        label: "Paid",
        value: paidCount.toLocaleString(),
        icon: PieChart,
        accent: "var(--ok)",
        accentBg: "color-mix(in srgb, var(--ok) 10%, transparent)",
        gradient: "linear-gradient(90deg, var(--ok), var(--ok))",
      },
      {
        label: "Unpaid",
        value: unpaidCount.toLocaleString(),
        icon: BarChart2,
        accent: "var(--warn)",
        accentBg: "color-mix(in srgb, var(--warn) 10%, transparent)",
        gradient: "linear-gradient(90deg, var(--warn), var(--warn))",
      },
      {
        label: "Saved clients",
        value: clientCount.toLocaleString(),
        icon: Users,
        accent: "var(--info)",
        accentBg: "color-mix(in srgb, var(--info) 10%, transparent)",
        gradient: "linear-gradient(90deg, var(--info), var(--info))",
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
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
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
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart2 size={22} style={{ color: "var(--bg)" }} />
          </div>
          <div>
            <p className="section-label" style={{ margin: 0 }}>
              Analytics
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 600,
                fontSize: "clamp(24px, 4vw, 36px)",
                color: "var(--text)",
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
            <RefreshCw size={14} style={{ color: "var(--text-3)", animation: "spin 1s linear infinite" }} />
            <p
              style={{
                fontSize: 13,
                color: "var(--text-3)",
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
                background: "linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 50%, transparent) 100%)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 0,
                overflow: "hidden",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent-dim), var(--accent), var(--accent-strong), var(--accent), var(--accent-dim))" }} />
              <div style={{ padding: "28px 32px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DollarSign size={16} style={{ color: "var(--accent-strong)" }} />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--accent-strong)",
                      }}
                    >
                      Total Revenue
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-display), serif",
                      fontSize: "clamp(28px, 5vw, 42px)",
                      fontWeight: 600,
                      color: "var(--text)",
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
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
                      Collection rate
                    </span>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, fontWeight: 600, color: collectionRate >= 75 ? "var(--ok)" : collectionRate >= 40 ? "var(--accent-strong)" : "var(--warn)" }}>
                      {collectionRate}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: "var(--surface-2)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${collectionRate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      style={{
                        height: "100%",
                        borderRadius: 6,
                        background: collectionRate >= 75
                          ? "linear-gradient(90deg, var(--ok), var(--ok))"
                          : collectionRate >= 40
                            ? "linear-gradient(90deg, var(--accent), var(--accent-strong))"
                            : "linear-gradient(90deg, var(--warn), var(--warn))",
                      }}
                    />
                  </div>
                  <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--text-3)", marginTop: 6, letterSpacing: "0.06em" }}>
                    {paidCount} paid · {unpaidCount} outstanding
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Stat Cards Grid ─────────────────────────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
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
                      background: "linear-gradient(168deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 50%, transparent) 100%)",
                      border: "1px solid var(--line)",
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
                          fontFamily: "var(--font-display), serif",
                          fontSize: 30,
                          fontWeight: 600,
                          color: "var(--text)",
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
              color: "var(--accent)",
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
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={18} style={{ color: "var(--bg)" }} />
          </div>
          <div>
            <p className="section-label" style={{ margin: 0 }}>
              AI Insights
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--text)",
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
            gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
            gap: 16,
          }}
        >
          {/* Cash Flow Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: "linear-gradient(168deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 60%, transparent) 100%)",
              border: "1px solid var(--line)",
              borderRadius: 6,
              padding: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Top accent */}
            <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--accent-strong), var(--accent))" }} />

            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={14} style={{ color: "var(--accent-strong)" }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--accent-strong)",
                  }}
                >
                  Cash Flow
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 20px", lineHeight: 1.6 }}>
                AI reads your receivables and payables to give a plain-English cash position.
              </p>

              {aiInsight ? (
                <div
                  style={{
                    background: "color-mix(in srgb, var(--accent) 6%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
                    borderRadius: 6,
                    padding: "16px 20px",
                    marginBottom: 14,
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.8, margin: 0 }}>
                    {aiInsight}
                  </p>
                </div>
              ) : null}

              <button
                onClick={fetchCashFlow}
                disabled={isLoadingInsight}
                className={aiInsight ? "btn-ghost" : "btn-primary"}
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
              background: "linear-gradient(168deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 60%, transparent) 100%)",
              border: "1px solid var(--line)",
              borderRadius: 6,
              padding: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg, var(--info), var(--info), var(--info))" }} />

            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "color-mix(in srgb, var(--info) 12%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart2 size={14} style={{ color: "var(--info)" }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--info)",
                  }}
                >
                  Payment Prediction
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 20px", lineHeight: 1.6 }}>
                Predict which invoices are at risk of late payment based on patterns.
              </p>

              {aiPrediction ? (
                <div
                  style={{
                    background: "color-mix(in srgb, var(--info) 6%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--info) 15%, transparent)",
                    borderRadius: 6,
                    padding: "16px 20px",
                    marginBottom: 14,
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.8, margin: 0 }}>
                    {aiPrediction}
                  </p>
                </div>
              ) : null}

              <button
                onClick={fetchPrediction}
                disabled={isLoadingPrediction}
                className={aiPrediction ? "btn-ghost" : "btn-primary"}
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
              background: "linear-gradient(168deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 60%, transparent) 100%)",
              border: "1px solid var(--line)",
              borderRadius: 6,
              padding: 0,
              overflow: "hidden",
              gridColumn: "1 / -1",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg, var(--ok), var(--ok), var(--ok))" }} />

            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "color-mix(in srgb, var(--ok) 12%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare size={14} style={{ color: "var(--ok)" }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ok)",
                  }}
                >
                  Ask AI
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 16px", lineHeight: 1.6 }}>
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
                    background: "var(--bg)",
                    border: "1px solid var(--line-strong)",
                    borderRadius: 6,
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "var(--text)",
                    outline: "none",
                    fontFamily: "var(--font-body), sans-serif",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ok)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--text) 30%, transparent)"; }}
                />
                <button
                  onClick={askAi}
                  disabled={isAskingAi || !aiQuestion.trim()}
                  className="btn-primary"
                >
                  <MessageSquare size={13} />{" "}
                  {isAskingAi ? "Thinking..." : "Ask"}
                </button>
              </div>

              {aiAnswer && (
                <div
                  style={{
                    background: "color-mix(in srgb, var(--ok) 6%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--ok) 15%, transparent)",
                    borderRadius: 6,
                    padding: "16px 20px",
                    marginTop: 16,
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.8, margin: 0 }}>
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
