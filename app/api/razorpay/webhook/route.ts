import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "../../../lib/firebaseAdmin";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const body = await request.text();

  if (secret) {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (expected !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; payload?: { payment_link?: { entity?: { notes?: { invoice_id?: string } } }; payment?: { entity?: { status?: string } } } };
  try { event = JSON.parse(body); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (event.event === "payment_link.paid") {
    const invoiceId = event.payload?.payment_link?.entity?.notes?.invoice_id;
    if (invoiceId) {
      await adminDb.collection("invoices").doc(invoiceId).update({ paid: true, status: "paid" });
    }
  }

  return NextResponse.json({ received: true });
}
