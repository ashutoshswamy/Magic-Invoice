"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Save } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export default function SettingsPage() {
  const [invoiceCurrency, setInvoiceCurrency] = useState("USD");
  const [invoicePrefix, setInvoicePrefix] = useState("MI");
  const [fromName, setFromName] = useState("");
  const [fromCompany, setFromCompany] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromAddressLine1, setFromAddressLine1] = useState("");
  const [fromAddressLine2, setFromAddressLine2] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [fromState, setFromState] = useState("");
  const [fromPostalCode, setFromPostalCode] = useState("");
  const [fromCountry, setFromCountry] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isSupabaseConfigured) {
        setStatus("Connect your workspace to load profile.");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const defaults =
          (data.user.user_metadata?.invoice_defaults as Record<
            string,
            string
          >) ?? {};
        setInvoiceCurrency(defaults.currency ?? "USD");
        const legacyPrefix =
          defaults.invoice_number?.split(/[^A-Za-z]+/)[0] ?? "";
        setInvoicePrefix(defaults.invoice_prefix ?? legacyPrefix ?? "MI");
        setFromName(
          defaults.from_name ?? data.user.user_metadata?.full_name ?? "",
        );
        setFromCompany(defaults.from_company ?? "");
        setFromEmail(defaults.from_email ?? data.user.email ?? "");
        setFromAddressLine1(defaults.from_address_line1 ?? "");
        setFromAddressLine2(defaults.from_address_line2 ?? "");
        setFromCity(defaults.from_city ?? "");
        setFromState(defaults.from_state ?? "");
        setFromPostalCode(defaults.from_postal_code ?? "");
        setFromCountry(defaults.from_country ?? "");
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to save settings.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const nextData: Record<string, unknown> = {
        invoice_defaults: {
          currency: invoiceCurrency,
          invoice_prefix: invoicePrefix,
          from_name: fromName,
          from_company: fromCompany,
          from_email: fromEmail,
          from_address_line1: fromAddressLine1,
          from_address_line2: fromAddressLine2,
          from_city: fromCity,
          from_state: fromState,
          from_postal_code: fromPostalCode,
          from_country: fromCountry,
        },
      };
      const { error } = await supabase.auth.updateUser({
        data: nextData,
      });
      if (error) throw error;
      setStatus("Settings updated.");
    } catch (error) {
      setStatus("Unable to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-16 pt-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Invoice defaults
          </h1>
        </div>

        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 text-sm text-emerald-200">
            <FileText className="h-4 w-4" />
            Invoice defaults
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">Default currency</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={invoiceCurrency}
                onChange={(event) => setInvoiceCurrency(event.target.value)}
                placeholder="USD"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">Invoice prefix</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={invoicePrefix}
                onChange={(event) => setInvoicePrefix(event.target.value)}
                placeholder="MI"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">From name</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromName}
                onChange={(event) => setFromName(event.target.value)}
                placeholder="Your name"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">From company</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromCompany}
                onChange={(event) => setFromCompany(event.target.value)}
                placeholder="Company name"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">From email</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromEmail}
                onChange={(event) => setFromEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">
                From address line 1
              </span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromAddressLine1}
                onChange={(event) => setFromAddressLine1(event.target.value)}
                placeholder="Street address"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">
                From address line 2
              </span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromAddressLine2}
                onChange={(event) => setFromAddressLine2(event.target.value)}
                placeholder="Suite, floor, etc."
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">City</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromCity}
                onChange={(event) => setFromCity(event.target.value)}
                placeholder="City"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">State / region</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromState}
                onChange={(event) => setFromState(event.target.value)}
                placeholder="State"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">Postal code</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromPostalCode}
                onChange={(event) => setFromPostalCode(event.target.value)}
                placeholder="Postal code"
              />
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">Country</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none"
                value={fromCountry}
                onChange={(event) => setFromCountry(event.target.value)}
                placeholder="Country"
              />
            </label>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save defaults"}
            </button>
            {status ? (
              <span className="text-xs text-emerald-200">{status}</span>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
