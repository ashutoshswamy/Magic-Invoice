"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { Plus, Trash2 } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useSupabase } from "../lib/useSupabase";

type Item = {
  id: string;
  name: string;
  hsn_sac_code: string;
  type: "service" | "goods";
  default_rate: number;
  gst_rate: number;
  unit: string;
  description: string;
};

type DraftItem = Omit<Item, "id">;

const emptyDraft = (): DraftItem => ({
  name: "",
  hsn_sac_code: "",
  type: "service",
  default_rate: 0,
  gst_rate: 18,
  unit: "hr",
  description: "",
});

const GST_RATES = [0, 5, 12, 18, 28];

export default function ItemsPage() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftItem>(emptyDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isHsnLooking, setIsHsnLooking] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !isLoaded || !userId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("items")
        .select("id, name, hsn_sac_code, type, default_rate, gst_rate, unit, description")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setIsLoading(false);
      if (error) { setStatus("Unable to load items."); return; }
      setItems((data ?? []) as Item[]);
    };
    load();
  }, [isLoaded, userId, supabase]);

  const handleSave = async () => {
    if (!isSupabaseConfigured || !userId) { setStatus("Connect Supabase to save items."); return; }
    if (!draft.name.trim()) { setStatus("Item name is required."); return; }
    setIsSaving(true);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from("items")
        .insert({ ...draft, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      setItems((prev) => [data as Item, ...prev]);
      setDraft(emptyDraft());
      setStatus("Item saved.");
    } catch {
      setStatus("Unable to save item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured) return;
    if (!window.confirm("Delete this item?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("items").delete().eq("id", id);
    setDeletingId(null);
    if (error) { setStatus("Unable to delete item."); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setStatus("Item deleted.");
  };

  const lookupHsn = async () => {
    if (!draft.name.trim()) { setStatus("Enter item name first."); return; }
    if (!process.env.NEXT_PUBLIC_GEMINI_KEY && !window.localStorage.getItem("_gemini_ok")) {
      // Just call the AI insights API indirectly via parse
    }
    setIsHsnLooking(true);
    setStatus(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Single line item: "${draft.name}" — 1 unit at ₹${draft.default_rate || 1000}. Suggest HSN/SAC code and GST rate.`,
          defaults: { currency: "INR" },
        }),
      });
      const data = await res.json() as { invoice?: { lines?: Array<{ hsnSacCode?: string }>; taxRate?: number } };
      const hsnCode = data?.invoice?.lines?.[0]?.hsnSacCode ?? "";
      const gstRate = data?.invoice?.taxRate ?? draft.gst_rate;
      if (hsnCode) setDraft((prev) => ({ ...prev, hsn_sac_code: hsnCode, gst_rate: gstRate }));
      setStatus(hsnCode ? `AI suggested HSN/SAC: ${hsnCode} @ ${gstRate}% GST` : "No suggestion found — enter manually.");
    } catch {
      setStatus("AI lookup failed.");
    } finally {
      setIsHsnLooking(false);
    }
  };

  const fieldBox = { background: "var(--ink-soft)", border: "1px solid var(--border)", borderRadius: 2, padding: "12px 16px", display: "flex", flexDirection: "column" as const, gap: 6 };
  const fieldLabel = { fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
  const fieldInput = { background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-dm-sans), sans-serif", width: "100%", padding: 0 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>Item catalogue</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", margin: "0 0 8px" }}>
            Services &amp; goods
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Save frequently used services and goods with HSN/SAC codes for quick invoice line insertion.
          </p>
        </div>

        {/* Add form */}
        <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Add new item</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            <div style={{ ...fieldBox, gridColumn: "1 / -1" }}>
              <span style={fieldLabel}>Item name</span>
              <input style={fieldInput} placeholder="e.g. Brand logo design" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>Type</span>
              <select style={{ ...fieldInput, cursor: "pointer" }} value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value as "service" | "goods" }))}>
                <option value="service">Service (SAC)</option>
                <option value="goods">Goods (HSN)</option>
              </select>
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>HSN / SAC code</span>
              <input style={fieldInput} placeholder="998392" value={draft.hsn_sac_code} onChange={(e) => setDraft((p) => ({ ...p, hsn_sac_code: e.target.value }))} />
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>GST rate (%)</span>
              <select style={{ ...fieldInput, cursor: "pointer" }} value={draft.gst_rate} onChange={(e) => setDraft((p) => ({ ...p, gst_rate: Number(e.target.value) }))}>
                {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>Default rate (₹)</span>
              <input type="number" style={fieldInput} value={draft.default_rate} onChange={(e) => setDraft((p) => ({ ...p, default_rate: Number(e.target.value || 0) }))} />
            </div>
            <div style={fieldBox}>
              <span style={fieldLabel}>Unit</span>
              <input style={fieldInput} placeholder="hr / pcs / project" value={draft.unit} onChange={(e) => setDraft((p) => ({ ...p, unit: e.target.value }))} />
            </div>
            <div style={{ ...fieldBox, gridColumn: "1 / -1" }}>
              <span style={fieldLabel}>Description (optional)</span>
              <input style={fieldInput} placeholder="Brief description for invoice line" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={handleSave} disabled={isSaving} className="btn-gold">
              <Plus size={13} /> {isSaving ? "Saving..." : "Add item"}
            </button>
            <button onClick={lookupHsn} disabled={isHsnLooking} className="btn-ghost">
              {isHsnLooking ? "Looking up..." : "AI: Suggest HSN/SAC"}
            </button>
            {status && <span style={{ fontSize: 11, color: "var(--gold)", fontFamily: "var(--font-mono), monospace" }}>{status}</span>}
          </div>
        </motion.div>

        {/* Items list */}
        {isLoading ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-mono), monospace" }}>Loading items...</p>
        ) : items.length === 0 ? (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>No items yet</p>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Add your first service or product above. AI will suggest HSN/SAC codes.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 90px 80px 36px", gap: 12, padding: "8px 20px" }}>
              {["Item", "HSN/SAC", "Type", "Rate", "GST", ""].map((h) => (
                <span key={h} style={{ ...fieldLabel }}>{h}</span>
              ))}
            </div>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                className="card"
                style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 90px 80px 36px", gap: 12, padding: "16px 20px", alignItems: "center" }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, margin: "0 0 2px" }}>{item.name}</p>
                  {item.description && <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.description}</p>}
                </div>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--gold)" }}>{item.hsn_sac_code || "—"}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>{item.type}</span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--text-primary)" }}>₹{Number(item.default_rate).toLocaleString("en-IN")}/{item.unit}</span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--text-secondary)" }}>{item.gst_rate}%</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  style={{ background: "none", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 2, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FCA5A5", opacity: deletingId === item.id ? 0.4 : 1 }}
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
