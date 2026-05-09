import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { createRazorpayLinkRequestSchema } from "../../../schemas";

export async function POST(request: Request) {
  const { userId } = await auth();
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

  const db = supabaseAdmin();
  const { data: inv, error: fetchError } = await db
    .from("invoices")
    .select("invoice_number, currency, to_name, to_email, notes")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single<{
      invoice_number: string;
      currency: string;
      to_name: string;
      to_email: string;
      notes: string;
    }>();

  if (fetchError || !inv)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: lines } = await db
    .from("invoice_lines")
    .select("quantity, rate")
    .eq("invoice_id", invoiceId);

  const { data: invoiceRow } = await db
    .from("invoices")
    .select("tax_rate, custom_charges")
    .eq("id", invoiceId)
    .single<{ tax_rate: number; custom_charges: Array<{ amount: number }> }>();

  const subtotal = (lines ?? []).reduce(
    (s, l) => s + Number(l.quantity) * Number(l.rate),
    0,
  );
  const taxRate = Number(invoiceRow?.tax_rate ?? 18);
  const customTotal = (invoiceRow?.custom_charges ?? []).reduce(
    (s, c) => s + Number(c.amount ?? 0),
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

  await db
    .from("invoices")
    .update({
      razorpay_payment_link_id: link.id,
      razorpay_payment_link_url: link.short_url,
    })
    .eq("id", invoiceId)
    .eq("user_id", userId);

  return NextResponse.json({
    paymentLinkUrl: link.short_url,
    paymentLinkId: link.id,
  });
}
