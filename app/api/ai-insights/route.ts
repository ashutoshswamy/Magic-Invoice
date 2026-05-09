import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "../../lib/supabaseServer";
import { checkRateLimit, getClientIp } from "../../lib/rateLimit";
import { aiInsightsRequestSchema } from "../../schemas";

const geminiKey = process.env.GEMINI_API_KEY ?? "";
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const rate = await checkRateLimit(`insights:${userId}:${ip}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!rate.allowed)
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429 },
    );

  let body: { type?: string; question?: string } = {};
  try {
    const parsedBody = aiInsightsRequestSchema.safeParse(await request.json());
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

  const { type = "cash_flow", question } = body;
  if (!geminiKey)
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 400 },
    );

  const db = supabaseAdmin();

  const { data: invoices } = await db
    .from("invoices")
    .select(
      "id, invoice_number, issued_on, due_date, paid, status, currency, to_name, to_company, created_at",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: lines } = await db
    .from("invoice_lines")
    .select("invoice_id, quantity, rate")
    .in(
      "invoice_id",
      (invoices ?? []).map((i) => i.id),
    );

  const invoiceSummaries = (invoices ?? []).map((inv) => {
    const invLines = (lines ?? []).filter((l) => l.invoice_id === inv.id);
    const total = invLines.reduce(
      (s, l) => s + Number(l.quantity) * Number(l.rate),
      0,
    );
    return { ...inv, total };
  });

  const now = new Date();
  const overdueInvoices = invoiceSummaries.filter((i) => {
    if (i.paid || i.status === "paid" || i.status === "cancelled") return false;
    if (!i.due_date) return false;
    const due = new Date(i.due_date);
    return !isNaN(due.getTime()) && due < now;
  });

  const paidInvoices = invoiceSummaries.filter(
    (i) => i.paid || i.status === "paid",
  );
  const pendingInvoices = invoiceSummaries.filter(
    (i) => !i.paid && i.status !== "paid" && i.status !== "cancelled",
  );
  const totalRevenue = paidInvoices.reduce((s, i) => s + i.total, 0);
  const totalPending = pendingInvoices.reduce((s, i) => s + i.total, 0);
  const totalOverdue = overdueInvoices.reduce((s, i) => s + i.total, 0);

  const contextSummary = `
You are a financial AI assistant for an Indian freelancer/SME using Magic Invoice.

Current date: ${now.toISOString().slice(0, 10)}
Total invoices: ${invoiceSummaries.length}
Paid invoices: ${paidInvoices.length} (₹${totalRevenue.toLocaleString("en-IN")})
Pending invoices: ${pendingInvoices.length} (₹${totalPending.toLocaleString("en-IN")})
Overdue invoices: ${overdueInvoices.length} (₹${totalOverdue.toLocaleString("en-IN")})

Recent invoices (last 10):
${invoiceSummaries
  .slice(0, 10)
  .map(
    (i) =>
      `- ${i.invoice_number}: ${i.to_name || i.to_company || "Client"} · ₹${i.total.toLocaleString("en-IN")} · ${i.status} · due ${i.due_date || "N/A"}`,
  )
  .join("\n")}

Overdue invoices:
${overdueInvoices.map((i) => `- ${i.invoice_number}: ${i.to_name || "Client"} · ₹${i.total.toLocaleString("en-IN")} · due ${i.due_date}`).join("\n") || "None"}
`;

  let prompt = "";
  if (type === "cash_flow") {
    prompt = `${contextSummary}

Based on this data, provide a concise cash flow insight in 2-3 sentences. Focus on: current cash position, largest pending amounts, and one actionable recommendation. Respond in plain English, as if talking to the business owner directly. No markdown, no headers.`;
  } else if (type === "payment_prediction") {
    prompt = `${contextSummary}

Based on the invoice payment patterns, predict which invoices are at risk of being paid late and suggest when each overdue invoice is likely to be paid. Also identify clients who tend to pay quickly vs slowly based on the data. Be specific with invoice numbers. Keep it under 100 words.`;
  } else if (type === "question" && question) {
    if (question.length > 500)
      return NextResponse.json({ error: "Question too long" }, { status: 400 });
    prompt = `${contextSummary}

User question: ${question}

Answer the question concisely based on the invoice data above. Plain English, no markdown.`;
  } else {
    return NextResponse.json(
      { error: "Invalid insight type" },
      { status: 400 },
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
    });
    const insight = result.response.text()?.trim() ?? "";
    return NextResponse.json({
      insight,
      type,
      stats: {
        totalRevenue,
        totalPending,
        totalOverdue,
        overdueCount: overdueInvoices.length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Gemini could not generate insights." },
      { status: 502 },
    );
  }
}
