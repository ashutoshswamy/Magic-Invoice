"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../lib/useAuth";
import {
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import TopNav from "../components/TopNav";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import { formatDisplayDate } from "../lib/formatDate";

type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string | null;
};

type ClientDraft = {
  name: string;
  company: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type InvoiceSummary = {
  id: string;
  invoice_number: string;
  issued_on: string;
  due_date: string;
  paid: boolean | null;
  to_name: string | null;
  to_company: string | null;
  to_email: string | null;
};

export default function ClientsPage() {
  const { userId, isLoaded } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ClientDraft>>({});

  useEffect(() => {
    const loadClients = async () => {
      if (!isLoaded || !userId) return;
      setIsLoading(true);
      setStatus(null);
      try {
        const clientsSnap = await getDocs(
          query(
            collection(db, "clients"),
            where("user_id", "==", userId),
            orderBy("created_at", "desc"),
          ),
        );
        setClients(
          clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client),
        );

        const invoicesSnap = await getDocs(
          query(
            collection(db, "invoices"),
            where("user_id", "==", userId),
            orderBy("created_at", "desc"),
          ),
        );
        setInvoices(
          invoicesSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as InvoiceSummary,
          ),
        );
      } catch {
        setStatus("Unable to load clients.");
      } finally {
        setIsLoading(false);
      }
    };
    loadClients();
  }, [isLoaded, userId]);

  const handleDelete = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const linkedInvoices = invoices.filter(
      (inv) =>
        inv.to_name === client.name &&
        (client.email ? inv.to_email === client.email : true),
    );
    const invoiceCount = linkedInvoices.length;

    const warningMessage =
      invoiceCount > 0
        ? `Delete "${client.name}"?\n\nThis will also permanently delete ${invoiceCount} invoice${invoiceCount === 1 ? "" : "s"} linked to this client.\n\nThis cannot be undone.`
        : `Delete "${client.name}"? This cannot be undone.`;

    const confirmed = window.confirm(warningMessage);
    if (!confirmed) return;

    setDeletingId(clientId);
    setStatus(null);
    try {
      if (invoiceCount > 0) {
        const invoiceIds = linkedInvoices.map((inv) => inv.id);
        const batch = writeBatch(db);
        for (const id of invoiceIds) {
          batch.update(doc(db, "invoices", id), { deleted_at: serverTimestamp() });
        }
        await batch.commit();
        setInvoices((prev) => prev.filter((inv) => !invoiceIds.includes(inv.id)));
      }

      await deleteDoc(doc(db, "clients", clientId));

      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setStatus(
        invoiceCount > 0
          ? `Client and ${invoiceCount} invoice${invoiceCount === 1 ? "" : "s"} deleted.`
          : "Client deleted.",
      );
    } catch {
      setStatus("Unable to delete client.");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setDrafts((prev) => ({
      ...prev,
      [client.id]: {
        name: client.name ?? "",
        company: client.company ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        address_line1: client.address_line1 ?? "",
        address_line2: client.address_line2 ?? "",
        city: client.city ?? "",
        state: client.state ?? "",
        postal_code: client.postal_code ?? "",
        country: client.country ?? "",
      },
    }));
  };

  const cancelEdit = (clientId: string) => {
    setEditingId(null);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  };

  const updateDraft = (
    clientId: string,
    field: keyof ClientDraft,
    value: string,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [field]: value,
      },
    }));
  };

  const saveEdit = async (clientId: string) => {
    const draft = drafts[clientId];
    if (!draft?.name?.trim()) {
      setStatus("Client name is required.");
      return;
    }
    setStatus(null);
    try {
      await updateDoc(doc(db, "clients", clientId), {
        name: draft.name,
        company: draft.company || null,
        email: draft.email || null,
        phone: draft.phone || null,
        address_line1: draft.address_line1 || null,
        address_line2: draft.address_line2 || null,
        city: draft.city || null,
        state: draft.state || null,
        postal_code: draft.postal_code || null,
        country: draft.country || null,
      });
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId
            ? {
                ...client,
                name: draft.name,
                company: draft.company || null,
                email: draft.email || null,
                phone: draft.phone || null,
                address_line1: draft.address_line1 || null,
                address_line2: draft.address_line2 || null,
                city: draft.city || null,
                state: draft.state || null,
                postal_code: draft.postal_code || null,
                country: draft.country || null,
              }
            : client,
        ),
      );
      setEditingId(null);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[clientId];
        return next;
      });
      setStatus("Client updated.");
    } catch {
      setStatus("Unable to update client.");
    }
  };

  const invoiceMatches = (client: Client) => {
    const clientEmail = client.email?.trim().toLowerCase() ?? "";
    const clientName = client.name?.trim().toLowerCase() ?? "";
    const clientCompany = client.company?.trim().toLowerCase() ?? "";

    return invoices.filter((invoice) => {
      const invoiceEmail = invoice.to_email?.trim().toLowerCase() ?? "";
      const invoiceName = invoice.to_name?.trim().toLowerCase() ?? "";
      const invoiceCompany = invoice.to_company?.trim().toLowerCase() ?? "";

      if (clientEmail && invoiceEmail) {
        return clientEmail === invoiceEmail;
      }

      if (clientName && invoiceName) {
        if (clientCompany && invoiceCompany) {
          return clientName === invoiceName && clientCompany === invoiceCompany;
        }
        return clientName === invoiceName;
      }

      return false;
    });
  };

  const fieldBox = { background: "var(--ink-soft)", border: "1px solid var(--border)", borderRadius: 2, padding: "10px 14px", display: "flex", flexDirection: "column" as const, gap: 5 };
  const fieldLabel = { fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
  const fieldInput = { background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, width: "100%", padding: 0 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>Clients</p>
            <h1 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", margin: "0 0 8px" }}>
              Client directory
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Saved clients for quick invoicing.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 2, padding: "8px 16px" }}>
            <Users size={13} style={{ color: "var(--gold)" }} />
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.08em" }}>{clients.length} saved</span>
          </div>
        </div>

        {isLoading ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-mono), monospace" }}>Loading clients...</p>
        ) : clients.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {clients.map((client, index) => {
              const matchedInvoices = invoiceMatches(client);
              return (
                <motion.div
                  key={client.id}
                  className="card"
                  style={{ padding: "24px" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 17, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {client.name}
                      </p>
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                        {[
                          { icon: Building2, val: client.company || "No company" },
                          { icon: Mail, val: client.email || "No email" },
                          { icon: Phone, val: client.phone || "No phone" },
                        ].map(({ icon: Icon, val }) => (
                          <p key={val} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                            <Icon size={12} style={{ color: "var(--gold)", flexShrink: 0 }} />
                            {val}
                          </p>
                        ))}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <MapPin size={12} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} />
                          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            {[client.address_line1, client.address_line2, [client.city, client.state, client.postal_code].filter(Boolean).join(", "), client.country].filter(Boolean).map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                            {!client.address_line1 && !client.city && <p>No address</p>}
                          </div>
                        </div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono), monospace" }}>
                          Added {client.created_at ? formatDisplayDate(client.created_at) : "recently"}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      {editingId === client.id ? (
                        <>
                          <button onClick={() => saveEdit(client.id)} className="btn-gold" style={{ fontSize: 10, padding: "6px 12px" }}>
                            <Save size={11} /> Save
                          </button>
                          <button onClick={() => cancelEdit(client.id)} className="btn-ghost" style={{ fontSize: 10, padding: "6px 12px" }}>
                            <X size={11} /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(client)} className="btn-ghost" style={{ fontSize: 10, padding: "6px 12px" }}>
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingId === client.id}
                            style={{ background: "none", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 2, padding: "6px 12px", fontSize: 10, fontFamily: "var(--font-mono), monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "#FCA5A5", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: deletingId === client.id ? 0.5 : 1 }}
                          >
                            <Trash2 size={11} />
                            {deletingId === client.id ? "..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === client.id && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                      {(["name", "company", "email", "phone", "address_line1", "address_line2", "city", "state", "postal_code", "country"] as const).map((f) => (
                        <div key={f} style={fieldBox}>
                          <span style={fieldLabel}>{f.replace(/_/g, " ")}</span>
                          <input style={fieldInput} value={drafts[client.id]?.[f] ?? ""} onChange={(e) => updateDraft(client.id, f, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                    <p className="section-label" style={{ marginBottom: 10, fontSize: 9 }}>Invoices</p>
                    {matchedInvoices.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {matchedInvoices.slice(0, 3).map((invoice) => (
                          <Link
                            key={invoice.id}
                            href={`/invoices/${invoice.id}`}
                            style={{ display: "flex", justifyContent: "space-between", gap: 12, background: "var(--ink)", border: "1px solid var(--border)", borderRadius: 2, padding: "8px 12px", textDecoration: "none" }}
                          >
                            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {invoice.invoice_number || "Untitled"}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                              {invoice.issued_on ? formatDisplayDate(invoice.issued_on) : ""}
                            </span>
                          </Link>
                        ))}
                        {matchedInvoices.length > 3 && (
                          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono), monospace" }}>+{matchedInvoices.length - 3} more</p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No invoices yet.</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ padding: 32 }}>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No clients saved yet. Save a client from the dashboard to see them here.</p>
          </div>
        )}

        {status && <p style={{ fontSize: 11, color: "var(--gold)", fontFamily: "var(--font-mono), monospace" }}>{status}</p>}
      </div>
    </div>
  );
}
