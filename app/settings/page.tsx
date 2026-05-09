"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { FileText, Save } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useSupabase } from "../lib/useSupabase";

export default function SettingsPage() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const [invoiceCurrency, setInvoiceCurrency] = useState("INR");
  const [fromName, setFromName] = useState("");
  const [fromCompany, setFromCompany] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromGstin, setFromGstin] = useState("");
  const [fromStateCode, setFromStateCode] = useState("");
  const [fromAddressLine1, setFromAddressLine1] = useState("");
  const [fromAddressLine2, setFromAddressLine2] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [fromState, setFromState] = useState("");
  const [fromPostalCode, setFromPostalCode] = useState("");
  const [fromCountry, setFromCountry] = useState("India");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!isSupabaseConfigured || !userId) return;
      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setInvoiceCurrency(data.currency ?? "INR");
        setFromName(data.from_name ?? "");
        setFromCompany(data.from_company ?? "");
        setFromEmail(data.from_email ?? "");
        setFromGstin(data.from_gstin ?? "");
        setFromStateCode(data.from_state_code ?? "");
        setFromAddressLine1(data.from_address_line1 ?? "");
        setFromAddressLine2(data.from_address_line2 ?? "");
        setFromCity(data.from_city ?? "");
        setFromState(data.from_state ?? "");
        setFromPostalCode(data.from_postal_code ?? "");
        setFromCountry(data.from_country ?? "India");
      }
    };
    if (isLoaded) loadSettings();
  }, [isLoaded, userId, supabase]);

  const handleSave = async () => {
    if (!isSupabaseConfigured || !userId) {
      setStatus("Log in to save settings.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: userId,
          currency: invoiceCurrency,
          from_name: fromName,
          from_company: fromCompany,
          from_email: fromEmail,
          from_gstin: fromGstin,
          from_state_code: fromStateCode,
          from_address_line1: fromAddressLine1,
          from_address_line2: fromAddressLine2,
          from_city: fromCity,
          from_state: fromState,
          from_postal_code: fromPostalCode,
          from_country: fromCountry,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      setStatus("Settings saved.");
    } catch {
      setStatus("Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const fieldBox = { background: "var(--ink-soft)", border: "1px solid var(--border)", borderRadius: 2, padding: "12px 16px", display: "flex", flexDirection: "column" as const, gap: 6 };
  const fieldLabel = { fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
  const fieldInput = { background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, width: "100%", padding: 0 };

  const fields = [
    { label: "Default currency", value: invoiceCurrency, setter: setInvoiceCurrency, placeholder: "INR" },
    { label: "GSTIN", value: fromGstin, setter: setFromGstin, placeholder: "22AAAAA0000A1Z5" },
    { label: "State code", value: fromStateCode, setter: setFromStateCode, placeholder: "MH" },
    { label: "From name", value: fromName, setter: setFromName, placeholder: "Your name" },
    { label: "From company", value: fromCompany, setter: setFromCompany, placeholder: "Company name" },
    { label: "From email", value: fromEmail, setter: setFromEmail, placeholder: "you@company.com" },
    { label: "Address line 1", value: fromAddressLine1, setter: setFromAddressLine1, placeholder: "Street address" },
    { label: "Address line 2", value: fromAddressLine2, setter: setFromAddressLine2, placeholder: "Suite, floor, etc." },
    { label: "City", value: fromCity, setter: setFromCity, placeholder: "Mumbai" },
    { label: "State", value: fromState, setter: setFromState, placeholder: "Maharashtra" },
    { label: "Postal code", value: fromPostalCode, setter: setFromPostalCode, placeholder: "400001" },
    { label: "Country", value: fromCountry, setter: setFromCountry, placeholder: "India" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>Settings</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", margin: 0 }}>
            Invoice defaults
          </h1>
        </div>

        <motion.div
          className="card"
          style={{ padding: 32 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <FileText size={13} style={{ color: "var(--gold)" }} />
            <p className="section-label" style={{ margin: 0 }}>Business &amp; invoice defaults</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {fields.map((f) => (
              <div key={f.label} style={fieldBox}>
                <span style={fieldLabel}>{f.label}</span>
                <input
                  style={fieldInput}
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24 }}>
            <button onClick={handleSave} disabled={isSaving} className="btn-gold">
              <Save size={13} />
              {isSaving ? "Saving..." : "Save defaults"}
            </button>
            {status && <span style={{ fontSize: 11, color: "var(--gold)", fontFamily: "var(--font-mono), monospace" }}>{status}</span>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
