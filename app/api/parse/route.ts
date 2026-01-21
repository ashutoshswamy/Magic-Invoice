import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "../../lib/rateLimit";

const parseAmount = (value: string) =>
  Number.parseFloat(value.replace(/,/g, "")) || 0;

const toCurrency = (value: number) => Number(value.toFixed(2));

const buildInvoiceNumber = () =>
  `MI-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
    100 + Math.random() * 900,
  )}`;

const extractDueDate = (prompt: string) => {
  const match = prompt.match(/due\s*(?:on|by)\s*([a-z0-9,\/-\s]+)/i);
  return match?.[1]?.trim() ?? "Net 14";
};

const extractClient = (prompt: string) => {
  const match = prompt.match(/to\s+([a-z\s.]+)(?:,|\s+for|\s+at|\s+by)/i);
  return match?.[1]?.trim() ?? "Client";
};

const parseLines = (prompt: string) => {
  const lines: Array<{ description: string; quantity: number; rate: number }> =
    [];
  const itemRegex = /(\d+)\s*(?:x|×)\s*([^@,;]+?)\s*(?:@|at)\s*\$?([\d,.]+)/gi;
  let match = itemRegex.exec(prompt);
  while (match) {
    lines.push({
      description: match[2].trim(),
      quantity: Number.parseInt(match[1], 10),
      rate: parseAmount(match[3]),
    });
    match = itemRegex.exec(prompt);
  }

  if (!lines.length) {
    const fallbackRateMatch = prompt.match(/\$([\d,.]+)/);
    lines.push({
      description: "Services rendered",
      quantity: 1,
      rate: parseAmount(fallbackRateMatch?.[1] ?? "1200"),
    });
  }

  return lines.map((line) => ({
    ...line,
    rate: toCurrency(line.rate),
  }));
};

const geminiKey = process.env.GEMINI_API_KEY ?? "";
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type InvoiceDefaults = {
  invoiceNumber?: string;
  dueDate?: string;
  currency?: string;
  notes?: string;
  taxRate?: number;
  customCharges?: Array<{ label?: string; amount?: number }>;
  from?: {
    name?: string;
    company?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

const buildPrompt = (prompt: string, defaults?: InvoiceDefaults) => `
You are an expert invoicing assistant. Convert the user sentence into a JSON invoice.
Return ONLY valid JSON with this shape:
{
  "invoiceNumber": "string",
  "issuedOn": "YYYY-MM-DD",
  "dueDate": "string",
  "from": {
    "name": "string",
    "company": "string",
    "email": "string",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string"
  },
  "to": {
    "name": "string",
    "company": "string",
    "email": "string",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string"
  },
  "currency": "USD",
  "taxRate": 0,
  "customCharges": [
    { "label": "string", "amount": number }
  ],
  "notes": "string",
  "lines": [
    { "description": "string", "quantity": number, "rate": number }
  ]
}
If missing, infer sensible defaults. Use USD if currency is unknown.
If available, use these user defaults when fields are missing:
${defaults ? JSON.stringify(defaults) : "{}"}

User input: ${prompt}
`;

const normalizeInvoice = (
  parsed: any,
  prompt: string,
  defaults?: InvoiceDefaults,
) => {
  const issuedOn = new Date().toISOString().slice(0, 10);
  const lines =
    Array.isArray(parsed?.lines) && parsed.lines.length
      ? parsed.lines
      : parseLines(prompt);
  const dueDate = defaults?.dueDate?.trim()
    ? defaults.dueDate
    : parsed?.dueDate || extractDueDate(prompt);

  const fallbackFrom = defaults?.from ?? {};

  return {
    invoiceNumber:
      parsed?.invoiceNumber || defaults?.invoiceNumber || buildInvoiceNumber(),
    issuedOn,
    dueDate,
    from: {
      name: parsed?.from?.name || fallbackFrom.name || "You",
      company:
        parsed?.from?.company || fallbackFrom.company || "Magic Invoice Studio",
      email:
        parsed?.from?.email || fallbackFrom.email || "hello@magicinvoice.ai",
      addressLine1:
        parsed?.from?.addressLine1 || fallbackFrom.addressLine1 || "",
      addressLine2:
        parsed?.from?.addressLine2 || fallbackFrom.addressLine2 || "",
      city: parsed?.from?.city || fallbackFrom.city || "",
      state: parsed?.from?.state || fallbackFrom.state || "",
      postalCode: parsed?.from?.postalCode || fallbackFrom.postalCode || "",
      country: parsed?.from?.country || fallbackFrom.country || "",
    },
    to: {
      name: parsed?.to?.name || extractClient(prompt),
      company: parsed?.to?.company || "",
      email: parsed?.to?.email || "",
      addressLine1: parsed?.to?.addressLine1 || "",
      addressLine2: parsed?.to?.addressLine2 || "",
      city: parsed?.to?.city || "",
      state: parsed?.to?.state || "",
      postalCode: parsed?.to?.postalCode || "",
      country: parsed?.to?.country || "",
    },
    currency: parsed?.currency || defaults?.currency || "USD",
    taxRate: Number(parsed?.taxRate ?? defaults?.taxRate ?? 0),
    customCharges: Array.isArray(parsed?.customCharges)
      ? parsed.customCharges.map((charge: any, index: number) => ({
          id: `${index + 1}`,
          label: charge?.label ?? "Custom charge",
          amount: Number(charge?.amount ?? 0),
        }))
      : Array.isArray(defaults?.customCharges)
        ? defaults.customCharges.map((charge, index) => ({
            id: `${index + 1}`,
            label: charge?.label ?? "Custom charge",
            amount: Number(charge?.amount ?? 0),
          }))
        : [],
    notes:
      parsed?.notes ||
      defaults?.notes ||
      "Payment is due within the agreed terms. Thank you for choosing Magic Invoice.",
    lines: lines.map((line: any, index: number) => ({
      id: `${index + 1}`,
      description: line.description ?? "Services rendered",
      quantity: Number(line.quantity ?? 1),
      rate: toCurrency(Number(line.rate ?? 0)),
    })),
  };
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized. Authentication required." },
      { status: 401 },
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired authentication token." },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  const rate = await checkRateLimit(`parse:${user.id}:${ip}`, {
    windowMs: 60_000,
    max: 20,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": rate.retryAfter.toString(),
        },
      },
    );
  }

  let body: { prompt?: string; defaults?: InvoiceDefaults } | null = null;
  try {
    body = (await request.json()) as {
      prompt?: string;
      defaults?: InvoiceDefaults;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const prompt = body?.prompt?.trim() ?? "";
  const defaults = body?.defaults;
  if (prompt.length > 2000) {
    return NextResponse.json({ error: "Prompt is too long." }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({
      invoice: normalizeInvoice({}, prompt, defaults),
    });
  }

  if (!geminiKey) {
    return NextResponse.json(
      { error: "Gemini API key is required to generate invoices." },
      { status: 400 },
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(prompt, defaults) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text()?.trim();
    if (!text) {
      return NextResponse.json({
        invoice: normalizeInvoice({}, prompt, defaults),
        warning:
          "Gemini returned an empty response. We generated a draft using defaults.",
      });
    }

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({
        invoice: normalizeInvoice(parsed, prompt, defaults),
      });
    } catch {
      return NextResponse.json({
        invoice: normalizeInvoice({}, prompt, defaults),
        warning:
          "Gemini returned an unreadable response. We generated a draft using defaults.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Gemini could not generate the invoice." },
      { status: 502 },
    );
  }
}
