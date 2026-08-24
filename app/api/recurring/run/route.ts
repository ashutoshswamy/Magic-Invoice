import { NextResponse } from "next/server";
import { requireAuth } from "../../../lib/requireAuth";
import { adminDb } from "../../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

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
// Processes only the signed-in user's own due templates.
export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const templatesSnap = await adminDb
    .collection("recurring_invoices")
    .where("user_id", "==", userId)
    .where("active", "==", true)
    .where("next_run_date", "<=", today)
    .get();

  if (templatesSnap.empty) {
    return NextResponse.json({ generated: 0 });
  }

  const generated: string[] = [];

  for (const templateDoc of templatesSnap.docs) {
    const t = templateDoc.data();
    const issuedOn = today;
    const dueDate = addDays(new Date(today), t.due_date_days ?? 14);

    const invoiceRef = adminDb.collection("invoices").doc();
    const batch = adminDb.batch();
    batch.set(invoiceRef, {
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
      deleted_at: null,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    type LineRecord = { description: string; quantity: number; rate: number; hsnSacCode?: string };
    const lines: LineRecord[] = Array.isArray(t.lines) ? t.lines as LineRecord[] : [];
    lines.forEach((l, idx) => {
      const lineRef = invoiceRef.collection("lines").doc();
      batch.set(lineRef, {
        invoice_id: invoiceRef.id,
        user_id: userId,
        description: l.description || "Service",
        quantity: Number(l.quantity) || 1,
        rate: Number(l.rate) || 0,
        hsn_sac_code: l.hsnSacCode || "",
        sort_order: idx,
      });
    });

    const newNextRun = nextRunDate(new Date(t.next_run_date), t.frequency);
    batch.update(templateDoc.ref, {
      next_run_date: newNextRun,
      last_run_date: today,
    });

    await batch.commit();
    generated.push(invoiceRef.id);
  }

  return NextResponse.json({ generated: generated.length, ids: generated });
}
