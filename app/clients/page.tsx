"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  FileText,
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
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
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
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ClientDraft>>({});

  useEffect(() => {
    const loadClients = async () => {
      if (!isSupabaseConfigured) {
        setStatus("Connect your workspace to view clients.");
        return;
      }
      setIsLoading(true);
      setStatus(null);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          setStatus("Log in to view clients.");
          return;
        }
        const { data, error } = await supabase
          .from("clients")
          .select(
            "id, name, company, email, phone, address_line1, address_line2, city, state, postal_code, country, created_at",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setClients((data ?? []) as Client[]);

        const { data: invoiceRows, error: invoiceError } = await supabase
          .from("invoices")
          .select(
            "id, invoice_number, issued_on, due_date, paid, to_name, to_company, to_email",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (invoiceError) throw invoiceError;
        setInvoices((invoiceRows ?? []) as InvoiceSummary[]);
      } catch (error) {
        setStatus("Unable to load clients.");
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, []);

  const handleDelete = async (clientId: string) => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to delete clients.");
      return;
    }
    const confirmed = window.confirm(
      "Delete this client? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(clientId);
    setStatus(null);
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);
      if (error) throw error;
      setClients((prev) => prev.filter((client) => client.id !== clientId));
      setStatus("Client deleted.");
    } catch (error) {
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
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to update clients.");
      return;
    }
    const draft = drafts[clientId];
    if (!draft?.name?.trim()) {
      setStatus("Client name is required.");
      return;
    }
    setStatus(null);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
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
        })
        .eq("id", clientId);
      if (error) throw error;
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
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Clients
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Client directory
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Review the clients you have saved for quick invoicing.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
            <Users className="h-4 w-4 text-emerald-200" />
            {clients.length} saved
          </div>
        </div>

        {isLoading ? (
          <div className="glass rounded-3xl p-6 text-sm text-slate-300">
            Loading clients...
          </div>
        ) : clients.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {clients.map((client, index) => {
              const matchedInvoices = invoiceMatches(client);
              return (
                <motion.div
                  key={client.id}
                  className="glass rounded-2xl p-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-white truncate">
                        {client.name}
                      </p>
                      <div className="mt-2 space-y-2 text-sm text-slate-300">
                        <p className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-200" />
                          {client.company || "No company"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-emerald-200" />
                          {client.email || "No email"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-emerald-200" />
                          {client.phone || "No phone"}
                        </p>
                        <div className="flex items-start gap-2 text-slate-300">
                          <MapPin className="mt-0.5 h-4 w-4 text-emerald-200" />
                          <div className="text-sm">
                            {[
                              client.address_line1,
                              client.address_line2,
                              [client.city, client.state, client.postal_code]
                                .filter(Boolean)
                                .join(", "),
                              client.country,
                            ]
                              .filter(Boolean)
                              .map((line, idx) => (
                                <p key={`${client.id}-addr-${idx}`}>{line}</p>
                              ))}
                            {!client.address_line1 &&
                            !client.address_line2 &&
                            !client.city &&
                            !client.state &&
                            !client.postal_code &&
                            !client.country ? (
                              <p>No address</p>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          Added{" "}
                          {client.created_at
                            ? formatDisplayDate(client.created_at)
                            : "recently"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      {editingId === client.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(client.id)}
                            className="flex items-center gap-2 rounded-full border border-emerald-300/40 px-3 py-2 text-xs text-emerald-100 transition hover:border-emerald-300"
                          >
                            <Save className="h-3 w-3" />
                            Save
                          </button>
                          <button
                            onClick={() => cancelEdit(client.id)}
                            className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs text-slate-200 transition hover:border-white/40"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(client)}
                            className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs text-slate-200 transition hover:border-white/40"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingId === client.id}
                            className="flex items-center gap-2 rounded-full border border-rose-400/40 px-3 py-2 text-xs text-rose-100 transition hover:border-rose-300 disabled:opacity-60"
                          >
                            <Trash2 className="h-3 w-3" />
                            {deletingId === client.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingId === client.id ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                        <span className="text-xs text-slate-300">Name</span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.name ?? ""}
                          onChange={(event) =>
                            updateDraft(client.id, "name", event.target.value)
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                        <span className="text-xs text-slate-300">Company</span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.company ?? ""}
                          onChange={(event) =>
                            updateDraft(
                              client.id,
                              "company",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                        <span className="text-xs text-slate-300">Email</span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.email ?? ""}
                          onChange={(event) =>
                            updateDraft(client.id, "email", event.target.value)
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                        <span className="text-xs text-slate-300">Phone</span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.phone ?? ""}
                          onChange={(event) =>
                            updateDraft(client.id, "phone", event.target.value)
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm md:col-span-2">
                        <span className="text-xs text-slate-300">
                          Address line 1
                        </span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.address_line1 ?? ""}
                          onChange={(event) =>
                            updateDraft(
                              client.id,
                              "address_line1",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm md:col-span-2">
                        <span className="text-xs text-slate-300">
                          Address line 2
                        </span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.address_line2 ?? ""}
                          onChange={(event) =>
                            updateDraft(
                              client.id,
                              "address_line2",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                        <span className="text-xs text-slate-300">City</span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.city ?? ""}
                          onChange={(event) =>
                            updateDraft(client.id, "city", event.target.value)
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                        <span className="text-xs text-slate-300">State</span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.state ?? ""}
                          onChange={(event) =>
                            updateDraft(client.id, "state", event.target.value)
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                        <span className="text-xs text-slate-300">
                          Postal code
                        </span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.postal_code ?? ""}
                          onChange={(event) =>
                            updateDraft(
                              client.id,
                              "postal_code",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                        <span className="text-xs text-slate-300">Country</span>
                        <input
                          className="mt-2 w-full bg-transparent text-white outline-none"
                          value={drafts[client.id]?.country ?? ""}
                          onChange={(event) =>
                            updateDraft(
                              client.id,
                              "country",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                      <FileText className="h-4 w-4" />
                      Invoices
                    </div>
                    {matchedInvoices.length ? (
                      <div className="mt-3 space-y-2 text-sm text-slate-300">
                        {matchedInvoices.slice(0, 3).map((invoice) => (
                          <Link
                            key={invoice.id}
                            href={`/invoices/${invoice.id}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 transition hover:border-white/30"
                          >
                            <span className="min-w-0 truncate">
                              {invoice.invoice_number || "Untitled invoice"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {invoice.issued_on
                                ? formatDisplayDate(invoice.issued_on)
                                : ""}
                            </span>
                          </Link>
                        ))}
                        {matchedInvoices.length > 3 ? (
                          <p className="text-xs text-slate-400">
                            {matchedInvoices.length - 3} more invoices
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">
                        No invoices yet for this client.
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="glass rounded-3xl p-6 text-sm text-slate-300">
            No clients saved yet. Save a client from the dashboard to see them
            here.
          </div>
        )}

        {status ? <p className="text-xs text-emerald-200">{status}</p> : null}
      </div>
    </div>
  );
}
