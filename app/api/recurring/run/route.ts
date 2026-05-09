import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";

const buildInvoiceNumber = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd = String(fyStart + 1).slice(-2);
  const seq = String(Math.floor(1 + Math.random() * 999)).padStart(3, "0");
  return `INV-${fyStart}-${fyEnd}-${seq}`;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const nextRunDate = (current: Date, frequency: string): string => {
  const d = new Date(current);
  switch (frequency) {
    case "weekly":    d.setDate(d.getDate() + 7); break;
    case "monthly":   d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly":    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
};

// POST /api/recurring/run
// Called manually (per-user) or by a scheduled job.
// If called with userId param from a trusted cron token, processes that user.
// If called by a signed-in user, processes only their own due templates.
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  // Fetch due + active recurring templates for this user
  const { data: templates, error: fetchErr } = await db
    .from("recurring_invoices")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .lte("next_run_date", today);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!templates || templates.length === 0) {
    return NextResponse.json({ generated: 0 });
  }

  const generated: string[] = [];

  for (const t of templates) {
    const issuedOn = today;
    const dueDate = addDays(new Date(today), t.due_date_days ?? 14);

    const invoiceRow = {
      user_id: userId,
      invoice_number: buildInvoiceNumber(),
      issued_on: issuedOn,
      due_date: dueDate,
      from_name: t.from_name,
      from_company: t.from_company,
      from_email: t.from_email,
      from_address_line1: t.from_address_line1,
      from_address_line2: t.from_address_line2,
      from_city: t.from_city,
      from_state: t.from_state,
      from_state_code: t.from_state_code,
      from_postal_code: t.from_postal_code,
      from_country: t.from_country,
      from_gstin: t.from_gstin,
      to_name: t.to_name,
      to_company: t.to_company,
      to_email: t.to_email,
      to_address_line1: t.to_address_line1,
      to_city: t.to_city,
      to_state: t.to_state,
      to_state_code: t.to_state_code,
      to_country: t.to_country,
      to_gstin: t.to_gstin,
      currency: t.currency,
      tax_rate: t.tax_rate,
      gst_type: t.gst_type,
      notes: t.notes,
      custom_charges: t.custom_charges,
      status: "draft",
      paid: false,
    };

    const { data: inv, error: invErr } = await db
      .from("invoices")
      .insert(invoiceRow)
      .select("id")
      .single();

    if (invErr) continue;

    // Insert line items into invoice_lines
    type LineRecord = { description: string; quantity: number; rate: number; hsnSacCode?: string };
    const lines: LineRecord[] = Array.isArray(t.lines) ? t.lines as LineRecord[] : [];
    if (lines.length > 0) {
      const lineRows = lines.map((l: LineRecord, idx: number) => ({
        invoice_id: inv.id,
        description: l.description || "Service",
        quantity: Number(l.quantity) || 1,
        rate: Number(l.rate) || 0,
        hsn_sac_code: l.hsnSacCode || "",
        sort_order: idx,
      }));
      await db.from("invoice_lines").insert(lineRows);
    }

    // Advance next_run_date
    const newNextRun = nextRunDate(new Date(t.next_run_date), t.frequency);
    await db
      .from("recurring_invoices")
      .update({ next_run_date: newNextRun, last_run_date: today })
      .eq("id", t.id);

    generated.push(inv.id);
  }

  return NextResponse.json({ generated: generated.length, ids: generated });
}
