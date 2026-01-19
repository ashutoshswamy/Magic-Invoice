"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, DollarSign, FileText, PieChart, Users } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

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
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!isSupabaseConfigured) {
        setStatus("Connect your workspace to view analytics.");
        return;
      }
      setIsLoading(true);
      setStatus(null);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        const userId = user?.id;
        if (!userId) {
          setStatus("Log in to view analytics.");
          return;
        }
        const defaults =
          (user.user_metadata?.invoice_defaults as Record<string, string>) ??
          {};
        setCurrency(defaults.currency ?? "USD");

        const { data: invoices, error: invoiceError } = await supabase
          .from("invoices")
          .select("id, paid")
          .eq("user_id", userId);
        if (invoiceError) throw invoiceError;

        const invoiceRows = (invoices ?? []) as InvoiceRow[];
        const paid = invoiceRows.filter((row) => row.paid).length;
        const unpaid = invoiceRows.length - paid;

        setInvoiceCount(invoiceRows.length);
        setPaidCount(paid);
        setUnpaidCount(unpaid);

        const invoiceIds = invoiceRows.map((row) => row.id);
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
      } catch (error) {
        setStatus("Unable to load analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const cards = useMemo(() => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    });
    return [
      {
        label: "Total invoices",
        value: invoiceCount.toLocaleString(),
        icon: FileText,
      },
      {
        label: "Paid invoices",
        value: paidCount.toLocaleString(),
        icon: PieChart,
      },
      {
        label: "Unpaid invoices",
        value: unpaidCount.toLocaleString(),
        icon: BarChart2,
      },
      {
        label: "Total revenue",
        value: formatter.format(totalRevenue),
        icon: DollarSign,
      },
      {
        label: "Saved clients",
        value: clientCount.toLocaleString(),
        icon: Users,
      },
    ];
  }, [
    clientCount,
    currency,
    invoiceCount,
    paidCount,
    totalRevenue,
    unpaidCount,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Analytics
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Invoice analytics
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Track totals, revenue, and client growth across your invoices.
          </p>
        </div>

        {isLoading ? (
          <div className="glass rounded-3xl p-6 text-sm text-slate-300">
            Loading analytics...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  className="glass rounded-2xl p-5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <span>{card.label}</span>
                    <Icon className="h-4 w-4 text-emerald-200" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {card.value}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}

        {status ? <p className="text-xs text-emerald-200">{status}</p> : null}
      </div>
    </div>
  );
}
