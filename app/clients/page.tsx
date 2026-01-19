"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Mail, Trash2, Users } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { formatDisplayDate } from "../lib/formatDate";

type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  created_at: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          .select("id, name, company, email, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setClients((data ?? []) as Client[]);
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
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                className="glass rounded-2xl p-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
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
                      <p className="text-xs text-slate-400">
                        Added{" "}
                        {client.created_at
                          ? formatDisplayDate(client.created_at)
                          : "recently"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(client.id)}
                    disabled={deletingId === client.id}
                    className="flex items-center gap-2 rounded-full border border-rose-400/40 px-3 py-2 text-xs text-rose-100 transition hover:border-rose-300 disabled:opacity-60"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingId === client.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </motion.div>
            ))}
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
