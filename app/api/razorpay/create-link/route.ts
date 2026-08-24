import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { requireAuth } from "../../../lib/requireAuth";
import { adminDb } from "../../../lib/firebaseAdmin";
import { createRazorpayLinkRequestSchema } from "../../../schemas";

export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret)
    return NextResponse.json(
      {
        error:
          "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      },
      { status: 400 },
    );

  let body: { invoiceId?: string } = {};
  try {
    const parsedBody = createRazorpayLinkRequestSchema.safeParse(
      await request.json(),
    );
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }
    body = parsedBody.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { invoiceId } = body;
  if (!invoiceId)
    return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

  const invoiceRef = adminDb.collection("invoices").doc(invoiceId);
  const invoiceSnap = await invoiceRef.get();
  const inv = invoiceSnap.data();
  if (!invoiceSnap.exists || !inv || inv.user_id !== userId)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const linesSnap = await invoiceRef.collection("lines").get();
  const subtotal = linesSnap.docs.reduce(
    (s, d) => s + Number(d.data().quantity) * Number(d.data().rate),
    0,
  );
  const taxRate = Number(inv.tax_rate ?? 18);
  const customTotal = (inv.custom_charges ?? []).reduce(
    (s: number, c: { amount?: number }) => s + Number(c.amount ?? 0),
    0,
  );
  const total = subtotal + (subtotal * taxRate) / 100 + customTotal;
  const amountPaise = Math.round(total * 100);

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const link = await razorpay.paymentLink.create({
    amount: amountPaise,
    currency: inv.currency === "INR" ? "INR" : "INR",
    description: `Invoice ${inv.invoice_number}`,
    customer: {
      name: inv.to_name || "Client",
      ...(inv.to_email ? { email: inv.to_email } : {}),
    },
    notify: { sms: false, email: Boolean(inv.to_email) },
    reminder_enable: true,
    notes: { invoice_id: invoiceId, invoice_number: inv.invoice_number },
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invoices/${invoiceId}`,
    callback_method: "get",
  });

  await invoiceRef.update({
    razorpay_payment_link_id: link.id,
    razorpay_payment_link_url: link.short_url,
  });

  return NextResponse.json({
    paymentLinkUrl: link.short_url,
    paymentLinkId: link.id,
  });
}
