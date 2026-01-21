"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CloudUpload,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  Wand2,
} from "lucide-react";
import TopNav from "../components/TopNav";
import InvoicePreview from "../components/InvoicePreview";
import { InvoiceData } from "../types";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const defaultInvoice: InvoiceData = {
  invoiceNumber: "",
  issuedOn: new Date().toISOString().slice(0, 10),
  dueDate: "",
  paid: false,
  from: {
    name: "",
    company: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  },
  to: {
    name: "",
    company: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  },
  currency: "USD",
  notes: "",
  taxRate: 0,
  customCharges: [],
  lines: [
    {
      id: "1",
      description: "",
      quantity: 1,
      rate: 0,
    },
  ],
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractTrailingNumber = (value: string, prefix: string) => {
  if (!value) return null;
  const safePrefix = escapeRegExp(prefix);
  const match = value.match(new RegExp(`^${safePrefix}[-_\s]?(\\d+)$`, "i"));
  if (match?.[1]) return Number(match[1]);
  const fallback = value.match(/(\d+)$/);
  return fallback?.[1] ? Number(fallback[1]) : null;
};

const buildNextInvoiceNumber = (prefix: string, lastValue?: string | null) => {
  const cleanPrefix = prefix?.trim() || "MI";
  const lastNumber = lastValue
    ? extractTrailingNumber(lastValue, cleanPrefix)
    : null;
  const next = lastNumber && Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${cleanPrefix}-${String(next).padStart(4, "0")}`;
};

type SavedClient = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [invoice, setInvoice] = useState<InvoiceData>(defaultInvoice);
  const [status, setStatus] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedDefaults, setHasLoadedDefaults] = useState(false);
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientStatus, setClientStatus] = useState<string | null>(null);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [editorTab, setEditorTab] = useState<
    "details" | "parties" | "charges" | "lines"
  >("details");

  const subtotal = useMemo(() => {
    return invoice.lines.reduce(
      (sum, line) => sum + line.quantity * line.rate,
      0,
    );
  }, [invoice.lines]);

  const chargesTotal = useMemo(() => {
    return invoice.customCharges.reduce(
      (sum, charge) => sum + Number(charge.amount || 0),
      0,
    );
  }, [invoice.customCharges]);

  const taxAmount = useMemo(() => {
    const rate = Number(invoice.taxRate || 0);
    return Number(((subtotal * rate) / 100).toFixed(2));
  }, [invoice.taxRate, subtotal]);

  const total = useMemo(() => {
    return subtotal + taxAmount + chargesTotal;
  }, [chargesTotal, subtotal, taxAmount]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to continue.");
      setIsAuthReady(true);
      router.replace("/");
      return;
    }
    let isMounted = true;

    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (!data?.user) {
        setUserId(null);
        setIsAuthReady(true);
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      setIsAuthReady(true);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (!session?.user) {
          setUserId(null);
          setIsAuthReady(true);
          router.replace("/login");
          return;
        }
        setUserId(session.user.id);
        setIsAuthReady(true);
      },
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    const loadDefaults = async () => {
      if (!isSupabaseConfigured || hasLoadedDefaults || !isAuthReady) return;
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;
      const defaults =
        (user.user_metadata?.invoice_defaults as Record<string, string>) ?? {};
      const legacyPrefix =
        defaults.invoice_number?.split(/[^A-Za-z]+/)[0] ?? "";
      const invoicePrefix = defaults.invoice_prefix ?? legacyPrefix ?? "MI";

      let nextInvoiceNumber = buildNextInvoiceNumber(invoicePrefix);

      try {
        const { data: lastInvoice } = await supabase
          .from("invoices")
          .select("invoice_number")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        nextInvoiceNumber = buildNextInvoiceNumber(
          invoicePrefix,
          lastInvoice?.invoice_number ?? null,
        );
      } catch (error) {
        nextInvoiceNumber = buildNextInvoiceNumber(invoicePrefix);
      }
      setInvoice((prev) => ({
        ...prev,
        invoiceNumber: nextInvoiceNumber,
        currency: defaults.currency ?? prev.currency,
        from: {
          ...prev.from,
          name: defaults.from_name ?? prev.from.name,
          company: defaults.from_company ?? prev.from.company,
          email: defaults.from_email ?? prev.from.email,
          addressLine1: defaults.from_address_line1 ?? prev.from.addressLine1,
          addressLine2: defaults.from_address_line2 ?? prev.from.addressLine2,
          city: defaults.from_city ?? prev.from.city,
          state: defaults.from_state ?? prev.from.state,
          postalCode: defaults.from_postal_code ?? prev.from.postalCode,
          country: defaults.from_country ?? prev.from.country,
        },
      }));
      setHasLoadedDefaults(true);
    };
    loadDefaults();
  }, [hasLoadedDefaults, isAuthReady]);

  useEffect(() => {
    const loadClients = async () => {
      if (!isSupabaseConfigured || !isAuthReady || !userId) return;
      setIsLoadingClients(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, name, company, email")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        setClients((data ?? []) as SavedClient[]);
      } catch (error) {
        setClientStatus("Unable to load clients.");
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();
  }, [isAuthReady, userId]);

  const handleParse = async () => {
    setIsParsing(true);
    setStatus(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setStatus("Log in to use AI parsing.");
        return;
      }
      const activeClient = clients.find(
        (client) => client.id === selectedClientId,
      );
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: activeClient
            ? `${prompt}\nClient name: ${activeClient.name}\nClient company: ${
                activeClient.company ?? ""
              }\nClient email: ${activeClient.email ?? ""}`
            : prompt,
          defaults: {
            invoiceNumber: invoice.invoiceNumber,
            dueDate: invoice.dueDate,
            currency: invoice.currency,
            notes: invoice.notes,
            from: invoice.from,
            taxRate: invoice.taxRate,
            customCharges: invoice.customCharges,
          },
        }),
      });
      const data = (await response.json()) as {
        invoice?: InvoiceData;
        error?: string;
        warning?: string;
      };
      if (!response.ok) {
        setStatus(data?.error || "Unable to parse. Please try again.");
        return;
      }
      if (data?.invoice) {
        const activeClient = clients.find(
          (client) => client.id === selectedClientId,
        );
        setInvoice(() => {
          if (!activeClient) {
            return {
              ...(data.invoice as InvoiceData),
              paid: invoice.paid ?? false,
              taxRate: invoice.taxRate ?? 0,
              customCharges: invoice.customCharges ?? [],
            };
          }
          return {
            ...(data.invoice as InvoiceData),
            paid: invoice.paid ?? false,
            taxRate: invoice.taxRate ?? 0,
            customCharges: invoice.customCharges ?? [],
            to: {
              ...(data.invoice as InvoiceData).to,
              name: activeClient.name ?? "",
              company: activeClient.company ?? "",
              email: activeClient.email ?? "",
            },
          };
        });
        setStatus(data.warning ?? "Invoice updated with AI parsing.");
      }
    } catch (error) {
      setStatus("Unable to parse. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const applySelectedClient = (client: SavedClient | undefined) => {
    if (!client) return;
    setInvoice((prev) => ({
      ...prev,
      to: {
        ...prev.to,
        name: client.name ?? "",
        company: client.company ?? "",
        email: client.email ?? "",
      },
    }));
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((item) => item.id === clientId);
    applySelectedClient(client);
  };

  const handleSaveClient = async () => {
    if (!isSupabaseConfigured) {
      setClientStatus("Connect your workspace to save clients.");
      return;
    }
    if (!invoice.to.name.trim()) {
      setClientStatus("Add a client name before saving.");
      return;
    }
    setIsSavingClient(true);
    setClientStatus(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setClientStatus("Log in to save clients.");
        return;
      }
      const { data, error } = await supabase
        .from("clients")
        .insert({
          user_id: userId,
          name: invoice.to.name,
          company: invoice.to.company || null,
          email: invoice.to.email || null,
        })
        .select("id, name, company, email")
        .single();
      if (error) throw error;
      setClients((prev) => [...prev, data as SavedClient]);
      setSelectedClientId(data.id);
      setClientStatus("Client saved.");
    } catch (error) {
      setClientStatus("Unable to save client.");
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleSave = async () => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to save invoices.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setStatus("Log in to save invoices.");
        return;
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: userId,
          invoice_number: invoice.invoiceNumber,
          issued_on: invoice.issuedOn,
          due_date: invoice.dueDate,
          paid: invoice.paid,
          currency: invoice.currency,
          notes: invoice.notes,
          from_name: invoice.from.name,
          from_company: invoice.from.company,
          from_email: invoice.from.email,
          from_address_line1: invoice.from.addressLine1,
          from_address_line2: invoice.from.addressLine2,
          from_city: invoice.from.city,
          from_state: invoice.from.state,
          from_postal_code: invoice.from.postalCode,
          from_country: invoice.from.country,
          to_name: invoice.to.name,
          to_company: invoice.to.company,
          to_email: invoice.to.email,
          to_address_line1: invoice.to.addressLine1,
          to_address_line2: invoice.to.addressLine2,
          to_city: invoice.to.city,
          to_state: invoice.to.state,
          to_postal_code: invoice.to.postalCode,
          to_country: invoice.to.country,
          tax_rate: invoice.taxRate ?? 0,
          custom_charges: invoice.customCharges ?? [],
        })
        .select("id")
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceId = invoiceData?.id;
      if (invoiceId) {
        const { error: linesError } = await supabase
          .from("invoice_lines")
          .insert(
            invoice.lines.map((line) => ({
              invoice_id: invoiceId,
              description: line.description,
              quantity: line.quantity,
              rate: line.rate,
            })),
          );
        if (linesError) throw linesError;
      }

      setStatus("Saved to database.");
    } catch (error) {
      setStatus("Save failed. Check database permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const updateInvoiceField = (field: keyof InvoiceData, value: string) => {
    setInvoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePartyField = (
    party: "from" | "to",
    field:
      | "name"
      | "company"
      | "email"
      | "addressLine1"
      | "addressLine2"
      | "city"
      | "state"
      | "postalCode"
      | "country",
    value: string,
  ) => {
    setInvoice((prev) => ({
      ...prev,
      [party]: {
        ...prev[party],
        [field]: value,
      },
    }));
  };

  const updateLine = (
    lineId: string,
    field: "description" | "quantity" | "rate",
    value: string,
  ) => {
    setInvoice((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              [field]: field === "description" ? value : Number(value || 0),
            }
          : line,
      ),
    }));
  };

  const addLine = () => {
    setInvoice((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: `${prev.lines.length + 1}`,
          description: "New item",
          quantity: 1,
          rate: 0,
        },
      ],
    }));
  };

  const removeLine = (lineId: string) => {
    setInvoice((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.id !== lineId),
    }));
  };

  const addCharge = () => {
    setInvoice((prev) => ({
      ...prev,
      customCharges: [
        ...prev.customCharges,
        {
          id: `${Date.now()}-${prev.customCharges.length}`,
          label: "Custom charge",
          amount: 0,
        },
      ],
    }));
  };

  const updateCharge = (
    chargeId: string,
    field: "label" | "amount",
    value: string,
  ) => {
    setInvoice((prev) => ({
      ...prev,
      customCharges: prev.customCharges.map((charge) =>
        charge.id === chargeId
          ? {
              ...charge,
              [field]: field === "label" ? value : Number(value || 0),
            }
          : charge,
      ),
    }));
  };

  const removeCharge = (chargeId: string) => {
    setInvoice((prev) => ({
      ...prev,
      customCharges: prev.customCharges.filter(
        (charge) => charge.id !== chargeId,
      ),
    }));
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <TopNav />
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pb-16 pt-10">
          <p className="text-sm text-slate-300">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="no-print">
        <TopNav />
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
        <div className="flex min-w-0 flex-col gap-6 no-print">
          <motion.div
            className="glass rounded-3xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  AI Composer
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Describe the invoice in one line
                </h2>
              </div>
              <div className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                Draft
              </div>
            </div>
            <textarea
              className="mt-4 h-32 w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white outline-none focus:border-emerald-300"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                <span className="text-xs text-slate-300">Client</span>
                <select
                  className="mt-2 w-full bg-transparent text-white outline-none"
                  value={selectedClientId}
                  onChange={(event) => handleSelectClient(event.target.value)}
                >
                  <option value="">Select a saved client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                      {client.company ? ` — ${client.company}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={handleSaveClient}
                disabled={isSavingClient}
                className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/50 disabled:opacity-60 md:self-end"
              >
                {isSavingClient ? "Saving client..." : "Save client"}
              </button>
            </div>
            {isLoadingClients ? (
              <p className="mt-2 text-xs text-slate-400">Loading clients...</p>
            ) : null}
            {clientStatus ? (
              <p className="mt-2 text-xs text-emerald-200">{clientStatus}</p>
            ) : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={handleParse}
                disabled={isParsing}
                className="flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
              >
                <Wand2 className="h-4 w-4" />
                {isParsing ? "Parsing..." : "Generate invoice"}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/50 disabled:opacity-60"
              >
                <CloudUpload className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save invoice"}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/50"
              >
                <FileText className="h-4 w-4" />
                Print invoice
              </button>
              {status ? (
                <span className="text-xs text-emerald-200">{status}</span>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  Invoice editor
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Fine-tune every field
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: "details", label: "Details" },
                  { key: "parties", label: "From / To" },
                  { key: "charges", label: "Charges" },
                  { key: "lines", label: "Line items" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() =>
                      setEditorTab(
                        tab.key as "details" | "parties" | "charges" | "lines",
                      )
                    }
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      editorTab === tab.key
                        ? "bg-emerald-400 text-slate-900"
                        : "border border-white/20 text-slate-200 hover:border-white/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {editorTab === "lines" ? (
                  <button
                    onClick={addLine}
                    className="flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
                  >
                    <Plus className="h-3 w-3" />
                    Add line
                  </button>
                ) : null}
              </div>
            </div>

            {editorTab === "details" ? (
              <>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                    <span className="text-xs text-slate-300">
                      Invoice number
                    </span>
                    <input
                      className="mt-2 w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                      value={invoice.invoiceNumber}
                      onChange={(event) =>
                        updateInvoiceField("invoiceNumber", event.target.value)
                      }
                    />
                  </label>
                  <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                    <span className="text-xs text-slate-300">Issued on</span>
                    <input
                      type="date"
                      className="mt-2 w-full bg-transparent text-white outline-none"
                      value={invoice.issuedOn}
                      onChange={(event) =>
                        updateInvoiceField("issuedOn", event.target.value)
                      }
                    />
                  </label>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                    <span className="text-xs text-slate-300">Status</span>
                    <div className="mt-3 flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-white">
                        <input
                          type="radio"
                          name="invoice-status"
                          checked={!invoice.paid}
                          onChange={() =>
                            setInvoice((prev) => ({
                              ...prev,
                              paid: false,
                            }))
                          }
                          className="h-4 w-4 accent-emerald-300"
                        />
                        Unpaid
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white">
                        <input
                          type="radio"
                          name="invoice-status"
                          checked={invoice.paid}
                          onChange={() =>
                            setInvoice((prev) => ({
                              ...prev,
                              paid: true,
                            }))
                          }
                          className="h-4 w-4 accent-emerald-300"
                        />
                        Paid
                      </label>
                    </div>
                  </div>
                  <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                    <span className="text-xs text-slate-300">Due date</span>
                    <input
                      type="date"
                      className="mt-2 w-full bg-transparent text-white outline-none"
                      value={invoice.dueDate}
                      onChange={(event) =>
                        updateInvoiceField("dueDate", event.target.value)
                      }
                    />
                  </label>
                  <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                    <span className="text-xs text-slate-300">Currency</span>
                    <input
                      className="mt-2 w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                      value={invoice.currency}
                      onChange={(event) =>
                        updateInvoiceField("currency", event.target.value)
                      }
                    />
                  </label>
                </div>

                <label className="mt-6 block rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">Notes</span>
                  <textarea
                    className="mt-2 w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                    rows={3}
                    value={invoice.notes}
                    onChange={(event) =>
                      updateInvoiceField("notes", event.target.value)
                    }
                  />
                </label>
              </>
            ) : null}

            {editorTab === "parties" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    From
                  </p>
                </div>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">From name</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.name}
                    onChange={(event) =>
                      updatePartyField("from", "name", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">From company</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.company}
                    onChange={(event) =>
                      updatePartyField("from", "company", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">From email</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.email}
                    onChange={(event) =>
                      updatePartyField("from", "email", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">
                    From address line 1
                  </span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.addressLine1}
                    onChange={(event) =>
                      updatePartyField(
                        "from",
                        "addressLine1",
                        event.target.value,
                      )
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">
                    From address line 2
                  </span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.addressLine2}
                    onChange={(event) =>
                      updatePartyField(
                        "from",
                        "addressLine2",
                        event.target.value,
                      )
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">From city</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.city}
                    onChange={(event) =>
                      updatePartyField("from", "city", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">
                    From state / region
                  </span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.state}
                    onChange={(event) =>
                      updatePartyField("from", "state", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">
                    From postal code
                  </span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.postalCode}
                    onChange={(event) =>
                      updatePartyField("from", "postalCode", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">From country</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.from.country}
                    onChange={(event) =>
                      updatePartyField("from", "country", event.target.value)
                    }
                  />
                </label>
                <div className="md:col-span-2 mt-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    To
                  </p>
                </div>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">To name</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.name}
                    onChange={(event) =>
                      updatePartyField("to", "name", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">To company</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.company}
                    onChange={(event) =>
                      updatePartyField("to", "company", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">To email</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.email}
                    onChange={(event) =>
                      updatePartyField("to", "email", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">
                    To address line 1
                  </span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.addressLine1}
                    onChange={(event) =>
                      updatePartyField("to", "addressLine1", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">
                    To address line 2
                  </span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.addressLine2}
                    onChange={(event) =>
                      updatePartyField("to", "addressLine2", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">To city</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.city}
                    onChange={(event) =>
                      updatePartyField("to", "city", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">
                    To state / region
                  </span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.state}
                    onChange={(event) =>
                      updatePartyField("to", "state", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">To postal code</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.postalCode}
                    onChange={(event) =>
                      updatePartyField("to", "postalCode", event.target.value)
                    }
                  />
                </label>
                <label className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm transition focus-within:border-emerald-300/50 focus-within:bg-slate-900/70">
                  <span className="text-xs text-slate-300">To country</span>
                  <input
                    className="mt-2 w-full bg-transparent text-white outline-none"
                    value={invoice.to.country}
                    onChange={(event) =>
                      updatePartyField("to", "country", event.target.value)
                    }
                  />
                </label>
              </div>
            ) : null}

            {editorTab === "charges" ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Charges & tax
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Add tax and extra fees like travel or platform charges.
                    </p>
                  </div>
                  <button
                    onClick={addCharge}
                    className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/50"
                  >
                    <Plus className="h-3 w-3" />
                    Add charge
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm transition focus-within:border-emerald-300/50">
                    <span className="text-xs text-slate-300">Tax rate (%)</span>
                    <input
                      type="number"
                      className="mt-2 w-full bg-transparent text-white outline-none"
                      value={invoice.taxRate}
                      onChange={(event) =>
                        setInvoice((prev) => ({
                          ...prev,
                          taxRate: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </label>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm">
                    <span className="text-xs text-slate-300">Tax amount</span>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatCurrency(taxAmount, invoice.currency)}
                    </p>
                  </div>
                </div>

                {invoice.customCharges.length ? (
                  <div className="mt-4 space-y-3">
                    {invoice.customCharges.map((charge) => (
                      <div
                        key={charge.id}
                        className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]"
                      >
                        <input
                          className="min-w-0 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/60"
                          value={charge.label}
                          onChange={(event) =>
                            updateCharge(charge.id, "label", event.target.value)
                          }
                        />
                        <input
                          type="number"
                          className="min-w-0 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/60"
                          value={charge.amount}
                          onChange={(event) =>
                            updateCharge(
                              charge.id,
                              "amount",
                              event.target.value,
                            )
                          }
                        />
                        <button
                          onClick={() => removeCharge(charge.id)}
                          className="flex h-10 w-10 items-center justify-center justify-self-end rounded-xl border border-white/10 text-slate-200 transition hover:border-white/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-400">
                    No custom charges added yet.
                  </p>
                )}
              </div>
            ) : null}

            {editorTab === "lines" ? (
              <div className="mt-6 space-y-3">
                {invoice.lines.map((line) => (
                  <div
                    key={line.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/50 p-4"
                  >
                    <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_90px_110px_auto]">
                      <input
                        className="min-w-0 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/60"
                        value={line.description}
                        onChange={(event) =>
                          updateLine(line.id, "description", event.target.value)
                        }
                      />
                      <input
                        type="number"
                        className="min-w-0 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/60"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(line.id, "quantity", event.target.value)
                        }
                      />
                      <input
                        type="number"
                        className="min-w-0 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/60"
                        value={line.rate}
                        onChange={(event) =>
                          updateLine(line.id, "rate", event.target.value)
                        }
                      />
                      <button
                        onClick={() => removeLine(line.id)}
                        className="flex h-10 w-10 items-center justify-center justify-self-end rounded-xl border border-white/10 text-slate-200 transition hover:border-white/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Total value",
                value: formatCurrency(total, invoice.currency),
                icon: TrendingUp,
              },
              {
                label: "Invoice status",
                value: "Draft",
                icon: Sparkles,
              },
              {
                label: "Delivery",
                value: "Send today",
                icon: ArrowUpRight,
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass rounded-2xl p-4 text-sm">
                  <div className="flex items-center justify-between text-slate-200">
                    <span>{stat.label}</span>
                    <Icon className="h-4 w-4 text-emerald-200" />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-6 text-sm text-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Tip
            </p>
            <p className="mt-3">
              Use clear quantities and rates (e.g. “2 x strategy sessions at
              $850”) for the best AI results.
            </p>
          </div>
        </div>

        <div className="print-container min-w-0 w-full lg:sticky lg:top-24 self-start">
          <div className="print-area">
            <InvoicePreview invoice={invoice} />
          </div>
        </div>
      </div>
    </div>
  );
}
