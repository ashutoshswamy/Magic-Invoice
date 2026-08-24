"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../lib/useAuth";
import {
  ArrowUpRight,
  BookOpen,
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
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebaseClient";
import { usePlan } from "../lib/usePlan";

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
    stateCode: "",
    postalCode: "",
    country: "",
    gstin: "",
  },
  to: {
    name: "",
    company: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    stateCode: "",
    postalCode: "",
    country: "",
    gstin: "",
  },
  currency: "INR",
  notes: "",
  taxRate: 18,
  gstType: "CGST_SGST" as const,
  customCharges: [],
  lines: [
    {
      id: "1",
      description: "",
      quantity: 1,
      rate: 0,
      hsnSacCode: "",
    },
  ],
};

const formatCurrency = (amount: number, currency: string) => {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
};

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

const buildNextInvoiceNumber = (_prefix: string, lastValue?: string | null) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = String(fyStart + 1).slice(-2);
  const fyPrefix = `INV-${fyStart}-${fyEnd}`;
  const lastNumber = lastValue
    ? extractTrailingNumber(lastValue, fyPrefix)
    : null;
  const next = lastNumber && Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${fyPrefix}-${String(next).padStart(3, "0")}`;
};

type SavedClient = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { userId, isLoaded: isAuthReady } = useAuth();
  const planInfo = usePlan();
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
  const [editorTab, setEditorTab] = useState<
    "details" | "parties" | "charges" | "lines"
  >("details");
  const [catalogueItems, setCatalogueItems] = useState<
    Array<{
      id: string;
      name: string;
      default_rate: number;
      gst_rate: number;
      hsn_sac_code: string;
      unit: string;
    }>
  >([]);
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);

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
    if (isAuthReady && !userId) {
      router.replace("/login");
    }
  }, [isAuthReady, userId, router]);

  useEffect(() => {
    const loadDefaults = async () => {
      if (hasLoadedDefaults || !isAuthReady || !userId) return;
      let defaults: Record<string, string> = {};
      try {
        const settingsSnap = await getDoc(doc(db, "user_settings", userId));
        const settings = settingsSnap.data();
        if (settings) defaults = settings as Record<string, string>;
      } catch {
        // use empty defaults
      }

      let nextInvoiceNumber = buildNextInvoiceNumber("");
      try {
        const lastInvoiceSnap = await getDocs(
          query(
            collection(db, "invoices"),
            where("user_id", "==", userId),
            orderBy("created_at", "desc"),
            limit(1),
          ),
        );
        const lastInvoice = lastInvoiceSnap.docs[0]?.data();
        nextInvoiceNumber = buildNextInvoiceNumber(
          "",
          lastInvoice?.invoice_number ?? null,
        );
      } catch {
        nextInvoiceNumber = buildNextInvoiceNumber("");
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
          gstin: defaults.from_gstin ?? prev.from.gstin ?? "",
          stateCode: defaults.from_state_code ?? prev.from.stateCode ?? "",
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
  }, [hasLoadedDefaults, isAuthReady, userId]);

  useEffect(() => {
    const loadClients = async () => {
      if (!isAuthReady || !userId) return;
      setIsLoadingClients(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, "clients"),
            where("user_id", "==", userId),
            orderBy("created_at", "asc"),
          ),
        );
        setClients(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedClient),
        );
      } catch {
        setClientStatus("Unable to load clients.");
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();
  }, [isAuthReady, userId]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useGSAP(() => {
    if (!isClient || !userId) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      [".ai-composer-card", ".invoice-editor-card", ".dashboard-stat-card", ".dashboard-tip-card"],
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.7,
        delay: 0.15,
      }
    );
    tl.fromTo(
      ".invoice-preview-container",
      { opacity: 0, scale: 0.98, x: 15 },
      {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 0.9,
        ease: "back.out(1.05)",
      },
      "-=0.55"
    );
  }, [isClient, userId]);

  useEffect(() => {
    if (!isClient) return;
    gsap.fromTo(
      ".tab-content",
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
    );
  }, [editorTab, isClient]);

  const handleParse = async () => {
    setIsParsing(true);
    setStatus(null);
    try {
      const activeClient = clients.find(
        (client) => client.id === selectedClientId,
      );
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
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
    } catch {
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
    if (!invoice.to.name.trim()) {
      setClientStatus("Add a client name before saving.");
      return;
    }
    setIsSavingClient(true);
    setClientStatus(null);
    try {
      if (!userId) {
        setClientStatus("Log in to save clients.");
        return;
      }
      const newClient: SavedClient = {
        id: "",
        name: invoice.to.name,
        company: invoice.to.company || null,
        email: invoice.to.email || null,
      };
      const ref = await addDoc(collection(db, "clients"), {
        user_id: userId,
        name: newClient.name,
        company: newClient.company,
        email: newClient.email,
        created_at: serverTimestamp(),
      });
      newClient.id = ref.id;
      setClients((prev) => [...prev, newClient]);
      setSelectedClientId(ref.id);
      setClientStatus("Client saved.");
    } catch {
      setClientStatus("Unable to save client.");
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      setStatus("Log in to save invoices.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const invoiceRef = doc(collection(db, "invoices"));
      await setDoc(invoiceRef, {
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
        to_state_code: invoice.to.stateCode ?? "",
        to_postal_code: invoice.to.postalCode,
        to_country: invoice.to.country,
        to_gstin: invoice.to.gstin ?? "",
        from_state_code: invoice.from.stateCode ?? "",
        from_gstin: invoice.from.gstin ?? "",
        gst_type: invoice.gstType ?? "CGST_SGST",
        tax_rate: invoice.taxRate ?? 0,
        custom_charges: invoice.customCharges ?? [],
        deleted_at: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      const linesBatch = writeBatch(db);
      invoice.lines.forEach((line, index) => {
        const lineRef = doc(collection(db, "invoices", invoiceRef.id, "lines"));
        linesBatch.set(lineRef, {
          invoice_id: invoiceRef.id,
          user_id: userId,
          description: line.description,
          quantity: line.quantity,
          rate: line.rate,
          hsn_sac_code: line.hsnSacCode ?? "",
          sort_order: index,
        });
      });
      await linesBatch.commit();

      setStatus("Saved to database.");
    } catch {
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
      | "stateCode"
      | "postalCode"
      | "country"
      | "gstin",
    value: string,
  ) => {
    setInvoice((prev) => {
      const updated = { ...prev, [party]: { ...prev[party], [field]: value } };
      if (field === "stateCode") {
        const fromCode = party === "from" ? value : (prev.from.stateCode ?? "");
        const toCode = party === "to" ? value : (prev.to.stateCode ?? "");
        const toGstin = party === "to" ? prev.to.gstin : (prev.to.gstin ?? "");
        if (!toGstin) updated.gstType = "B2C";
        else if (fromCode && toCode)
          updated.gstType = fromCode === toCode ? "CGST_SGST" : "IGST";
      }
      if (field === "gstin" && party === "to") {
        if (!value) updated.gstType = "B2C";
        else {
          const fromCode = prev.from.stateCode ?? "";
          const toCode = prev.to.stateCode ?? "";
          if (fromCode && toCode)
            updated.gstType = fromCode === toCode ? "CGST_SGST" : "IGST";
          else updated.gstType = "CGST_SGST";
        }
      }
      return updated;
    });
  };

  const updateLine = (
    lineId: string,
    field: "description" | "quantity" | "rate" | "hsnSacCode",
    value: string,
  ) => {
    setInvoice((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              [field]:
                field === "description" || field === "hsnSacCode"
                  ? value
                  : Number(value || 0),
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
          hsnSacCode: "",
        },
      ],
    }));
  };

  const loadCatalogue = async () => {
    if (catalogueLoaded || !userId) return;
    const snap = await getDocs(
      query(
        collection(db, "items"),
        where("user_id", "==", userId),
        orderBy("name", "asc"),
      ),
    );
    setCatalogueItems(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          default_rate: data.default_rate,
          gst_rate: data.gst_rate,
          hsn_sac_code: data.hsn_sac_code,
          unit: data.unit,
        };
      }),
    );
    setCatalogueLoaded(true);
  };

  const addLineFromCatalogue = (itemId: string) => {
    const item = catalogueItems.find((i) => i.id === itemId);
    if (!item) return;
    setInvoice((prev) => ({
      ...prev,
      taxRate: item.gst_rate || prev.taxRate,
      lines: [
        ...prev.lines,
        {
          id: `${Date.now()}`,
          description: item.name,
          quantity: 1,
          rate: item.default_rate,
          hsnSacCode: item.hsn_sac_code || "",
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

  if (!isAuthReady) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
        <TopNav />
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div className="no-print">
        <TopNav />
      </div>
      <div
        className="dashboard-grid"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}
      >
        {/* Left: editor column */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
          className="no-print"
        >
          {/* AI Composer */}
          <div
            className="ai-composer-card glass-panel"
            style={{ padding: 28, opacity: 0 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <p className="section-label" style={{ marginBottom: 8 }}>
                  AI Composer
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Describe the invoice
                </h2>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  padding: "4px 10px",
                }}
              >
                Draft
              </span>
            </div>
            <textarea
              style={{
                width: "100%",
                height: 120,
                background: "var(--ink)",
                border: "1px solid var(--border-bright)",
                borderRadius: 2,
                padding: "14px 16px",
                fontSize: 14,
                color: "var(--text-primary)",
                fontFamily: "var(--font-dm-sans), sans-serif",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
              placeholder={`"Bill Rahul ₹15k for logo design with 18% GST, GSTIN 27AABCM1234R1Z5, due March 31"`}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />

            {/* Client row */}
            <div
              className="client-selection-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                marginTop: 14,
                alignItems: "end",
              }}
            >
              <div style={fieldBox}>
                <span style={fieldLabel}>Client</span>
                <select
                  style={{ ...fieldInput, cursor: "pointer" }}
                  value={selectedClientId}
                  onChange={(event) => handleSelectClient(event.target.value)}
                >
                  <option value="">Select saved client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                      {client.company ? ` — ${client.company}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveClient}
                disabled={isSavingClient}
                className="btn-ghost"
                style={{
                  fontSize: 10,
                  padding: "13px 14px",
                  whiteSpace: "nowrap",
                }}
              >
                {isSavingClient ? "Saving..." : "Save client"}
              </button>
            </div>
            {isLoadingClients && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                Loading clients...
              </p>
            )}
            {clientStatus && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "var(--gold)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {clientStatus}
              </p>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 20,
                alignItems: "center",
              }}
            >
              <button
                onClick={handleParse}
                disabled={isParsing}
                className="btn-gold"
              >
                <Wand2 size={13} />
                {isParsing ? "Parsing..." : "Generate invoice"}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-ghost"
              >
                <CloudUpload size={13} />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button onClick={handlePrint} className="btn-ghost">
                <FileText size={13} />
                Print
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
          </div>

          {/* Invoice editor */}
          <div
            className="invoice-editor-card glass-panel"
            style={{ padding: 28, opacity: 0 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div>
                <p className="section-label" style={{ marginBottom: 8 }}>
                  Invoice Editor
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Fine-tune every field
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {(["details", "parties", "charges", "lines"] as const).map(
                  (key) => (
                    <button
                      key={key}
                      onClick={() => setEditorTab(key)}
                      className={`tab${editorTab === key ? " active" : ""}`}
                      style={{
                        padding: "6px 14px",
                        borderBottom:
                          editorTab === key
                            ? "1px solid var(--gold)"
                            : "1px solid transparent",
                      }}
                    >
                      {key === "details"
                        ? "Details"
                        : key === "parties"
                          ? "From / To"
                          : key === "charges"
                            ? "Charges"
                            : "Lines"}
                    </button>
                  ),
                )}
                {editorTab === "lines" && (
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      onClick={addLine}
                      className="btn-gold"
                      style={{ fontSize: 10, padding: "6px 12px" }}
                    >
                      <Plus size={11} /> Add line
                    </button>
                    <button
                      onClick={() => {
                        setEditorTab("lines");
                        loadCatalogue();
                      }}
                      className="btn-ghost"
                      style={{ fontSize: 10, padding: "6px 12px" }}
                    >
                      <BookOpen size={11} /> Catalogue
                    </button>
                  </div>
                )}
              </div>
            </div>

            {editorTab === "details" && (
              <div className="tab-content">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div style={fieldBox}>
                    <span style={fieldLabel}>Invoice number</span>
                    <input
                      style={fieldInput}
                      value={invoice.invoiceNumber}
                      onChange={(e) =>
                        updateInvoiceField("invoiceNumber", e.target.value)
                      }
                    />
                  </div>
                  <div style={fieldBox}>
                    <span style={fieldLabel}>Issued on</span>
                    <input
                      type="date"
                      style={fieldInput}
                      value={invoice.issuedOn}
                      onChange={(e) =>
                        updateInvoiceField("issuedOn", e.target.value)
                      }
                    />
                  </div>
                  <div style={fieldBox}>
                    <span style={fieldLabel}>Due date</span>
                    <input
                      type="date"
                      style={fieldInput}
                      value={invoice.dueDate}
                      onChange={(e) =>
                        updateInvoiceField("dueDate", e.target.value)
                      }
                    />
                  </div>
                  <div style={fieldBox}>
                    <span style={fieldLabel}>Currency</span>
                    <input
                      style={fieldInput}
                      value={invoice.currency}
                      onChange={(e) =>
                        updateInvoiceField("currency", e.target.value)
                      }
                    />
                  </div>
                  <div style={fieldBox}>
                    <span style={fieldLabel}>Status</span>
                    <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                      {[false, true].map((paid) => (
                        <label
                          key={String(paid)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="invoice-status"
                            checked={invoice.paid === paid}
                            onChange={() =>
                              setInvoice((prev) => ({ ...prev, paid }))
                            }
                            style={{ accentColor: "var(--gold)" }}
                          />
                          <span
                            style={{
                              fontSize: 13,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {paid ? "Paid" : "Unpaid"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ ...fieldBox, marginTop: 12 }}>
                  <span style={fieldLabel}>Notes</span>
                  <textarea
                    style={{
                      ...fieldInput,
                      resize: "vertical",
                      minHeight: 64,
                      lineHeight: 1.6,
                    }}
                    rows={3}
                    value={invoice.notes}
                    onChange={(e) =>
                      updateInvoiceField("notes", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {editorTab === "parties" && (
              <div
                className="tab-content"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ ...fieldLabel, color: "var(--gold)" }}>From</p>
                </div>
                {(
                  [
                    "name",
                    "company",
                    "email",
                    "gstin",
                    "stateCode",
                    "addressLine1",
                    "addressLine2",
                    "city",
                    "state",
                    "postalCode",
                    "country",
                  ] as const
                ).map((f) => (
                  <div key={`from-${f}`} style={fieldBox}>
                    <span style={fieldLabel}>
                      {f === "gstin"
                        ? "GSTIN"
                        : f === "stateCode"
                          ? "State Code"
                          : f
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (s) => s.toUpperCase())}
                    </span>
                    <input
                      style={fieldInput}
                      value={(invoice.from as Record<string, string>)[f] ?? ""}
                      onChange={(e) =>
                        updatePartyField("from", f, e.target.value)
                      }
                      placeholder={
                        f === "gstin"
                          ? "22AAAAA0000A1Z5"
                          : f === "stateCode"
                            ? "e.g. 27"
                            : undefined
                      }
                    />
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  <p style={{ ...fieldLabel, color: "var(--gold)" }}>To</p>
                </div>
                {(
                  [
                    "name",
                    "company",
                    "email",
                    "gstin",
                    "stateCode",
                    "addressLine1",
                    "addressLine2",
                    "city",
                    "state",
                    "postalCode",
                    "country",
                  ] as const
                ).map((f) => (
                  <div key={`to-${f}`} style={fieldBox}>
                    <span style={fieldLabel}>
                      {f === "gstin"
                        ? "GSTIN"
                        : f === "stateCode"
                          ? "State Code"
                          : f
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (s) => s.toUpperCase())}
                    </span>
                    <input
                      style={fieldInput}
                      value={(invoice.to as Record<string, string>)[f] ?? ""}
                      onChange={(e) =>
                        updatePartyField("to", f, e.target.value)
                      }
                      placeholder={
                        f === "gstin"
                          ? "27AABCM1234R1Z5"
                          : f === "stateCode"
                            ? "e.g. 27"
                            : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {editorTab === "charges" && (
              <div className="tab-content">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <p style={{ ...fieldLabel, marginBottom: 4 }}>
                      Charges &amp; tax
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Tax and extra fees like travel or platform charges.
                    </p>
                  </div>
                  <button
                    onClick={addCharge}
                    className="btn-ghost"
                    style={{ fontSize: 10 }}
                  >
                    <Plus size={11} /> Add charge
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={fieldBox}>
                    <span style={fieldLabel}>Tax rate (%)</span>
                    <input
                      type="number"
                      style={fieldInput}
                      value={invoice.taxRate}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          taxRate: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>
                  <div style={fieldBox}>
                    <span style={fieldLabel}>Tax amount</span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-mono), monospace",
                      }}
                    >
                      {formatCurrency(taxAmount, invoice.currency)}
                    </span>
                  </div>
                  <div style={fieldBox}>
                    <span style={fieldLabel}>GST type</span>
                    <select
                      style={{ ...fieldInput, cursor: "pointer" }}
                      value={invoice.gstType ?? "CGST_SGST"}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          gstType: e.target.value as import("../types").GstType,
                        }))
                      }
                    >
                      <option value="CGST_SGST">
                        CGST + SGST (intrastate)
                      </option>
                      <option value="IGST">IGST (interstate)</option>
                      <option value="B2C">B2C (no GSTIN)</option>
                      <option value="exempt">Exempt</option>
                    </select>
                  </div>
                </div>
                {invoice.customCharges.length > 0 ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {invoice.customCharges.map((charge) => (
                      <div
                        key={charge.id}
                        className="custom-charge-row"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 140px 36px",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <input
                          style={{
                            ...fieldInput,
                            ...fieldBox,
                            padding: "8px 12px",
                          }}
                          value={charge.label}
                          onChange={(e) =>
                            updateCharge(charge.id, "label", e.target.value)
                          }
                        />
                        <input
                          type="number"
                          style={{
                            ...fieldInput,
                            ...fieldBox,
                            padding: "8px 12px",
                          }}
                          value={charge.amount}
                          onChange={(e) =>
                            updateCharge(charge.id, "amount", e.target.value)
                          }
                        />
                        <button
                          onClick={() => removeCharge(charge.id)}
                          style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            borderRadius: 2,
                            width: 36,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono), monospace",
                    }}
                  >
                    No custom charges yet.
                  </p>
                )}
              </div>
            )}

            {editorTab === "lines" && (
              <div
                className="tab-content"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {catalogueLoaded && catalogueItems.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "var(--ink-soft)",
                      borderRadius: 2,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 9,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      From catalogue
                    </span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addLineFromCatalogue(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        fontFamily: "var(--font-dm-sans), sans-serif",
                        cursor: "pointer",
                      }}
                    >
                      <option value="" disabled>
                        Pick a saved item…
                      </option>
                      {catalogueItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — ₹{item.default_rate}/{item.unit} @{" "}
                          {item.gst_rate}%
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div
                  className="lines-header"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 72px 100px 90px 36px",
                    gap: 8,
                  }}
                >
                  {["Description", "Qty", "Rate (₹)", "HSN/SAC", ""].map(
                    (h) => (
                      <span
                        key={h}
                        style={{ ...fieldLabel, paddingLeft: h ? 12 : 0 }}
                      >
                        {h}
                      </span>
                    ),
                  )}
                </div>
                {invoice.lines.map((line) => (
                  <div
                    key={line.id}
                    className="invoice-line-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 72px 100px 90px 36px",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <div className="line-desc">
                      <input
                        style={{
                          ...fieldInput,
                          ...fieldBox,
                          padding: "10px 12px",
                        }}
                        value={line.description}
                        onChange={(e) =>
                          updateLine(line.id, "description", e.target.value)
                        }
                        placeholder="Description"
                      />
                    </div>
                    <div className="line-qty">
                      <input
                        type="number"
                        style={{
                          ...fieldInput,
                          ...fieldBox,
                          padding: "10px 12px",
                        }}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, "quantity", e.target.value)
                        }
                      />
                    </div>
                    <div className="line-rate">
                      <input
                        type="number"
                        style={{
                          ...fieldInput,
                          ...fieldBox,
                          padding: "10px 12px",
                        }}
                        value={line.rate}
                        onChange={(e) =>
                          updateLine(line.id, "rate", e.target.value)
                        }
                      />
                    </div>
                    <div className="line-hsn">
                      <input
                        style={{
                          ...fieldInput,
                          ...fieldBox,
                          padding: "10px 12px",
                        }}
                        value={line.hsnSacCode ?? ""}
                        onChange={(e) =>
                          updateLine(line.id, "hsnSacCode", e.target.value)
                        }
                        placeholder="998314"
                      />
                    </div>
                    <button
                      onClick={() => removeLine(line.id)}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: 2,
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <style jsx>{`
            @media (max-width: 640px) {
              .client-selection-row {
                grid-template-columns: 1fr !important;
              }
              .custom-charge-row {
                grid-template-columns: 1fr 100px 36px !important;
              }
              .lines-header {
                display: none !important;
              }
              .invoice-line-row {
                grid-template-columns: 1fr 1fr 36px !important;
                grid-template-areas:
                  "desc desc delete"
                  "qty rate delete"
                  "hsn hsn delete";
                gap: 10px !important;
                border-bottom: 1px solid var(--border);
                padding-bottom: 16px;
              }
              .line-desc {
                grid-area: desc;
              }
              .line-qty {
                grid-area: qty;
              }
              .line-rate {
                grid-area: rate;
              }
              .line-hsn {
                grid-area: hsn;
              }
              .invoice-line-row button {
                grid-area: delete;
                align-self: center;
              }
            }
            @media (max-width: 480px) {
              .custom-charge-row {
                grid-template-columns: 1fr !important;
              }
              .custom-charge-row button {
                justify-self: end;
              }
            }
          `}</style>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 12,
            }}
          >
            {[
              {
                label: "Total value",
                value: formatCurrency(total, invoice.currency),
                icon: TrendingUp,
              },
              { label: "Invoice status", value: "Draft", icon: Sparkles },
              { label: "Delivery", value: "Send today", icon: ArrowUpRight },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="dashboard-stat-card glass-panel"
                  style={{ padding: "18px 20px", opacity: 0 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 9,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                      }}
                    >
                      {stat.label}
                    </span>
                    <Icon size={13} style={{ color: "var(--gold)" }} />
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono), monospace",
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tip */}
          <div
            className="dashboard-tip-card glass-panel"
            style={{
              padding: "20px 24px",
              borderLeft: "2px solid var(--gold)",
              opacity: 0,
            }}
          >
            <p className="section-label" style={{ marginBottom: 8 }}>
              Tip
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              Include quantities and rates clearly — e.g. &ldquo;2 x strategy
              sessions at ₹8,500 each&rdquo; — for best AI parsing.
            </p>
          </div>
        </div>

        {/* Right: preview column */}
        <div
          className="print-container preview-sticky invoice-preview-container"
          style={{ minWidth: 0, width: "100%", opacity: 0 }}
        >
          <div className="print-area">
            <InvoicePreview
              invoice={invoice}
              showBranding={planInfo.isLoaded && !planInfo.isPro}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
