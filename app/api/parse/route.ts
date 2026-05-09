import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit, getClientIp } from "../../lib/rateLimit";
import { parseInvoiceRequestSchema } from "../../schemas";

const parseAmount = (value: string) =>
  Number.parseFloat(value.replace(/,/g, "")) || 0;

const toCurrency = (value: number) => Number(value.toFixed(2));

const buildInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = String(fyStart + 1).slice(-2);
  const seq = String(Math.floor(1 + Math.random() * 999)).padStart(3, "0");
  return `INV-${fyStart}-${fyEnd}-${seq}`;
};

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

const aiKey = process.env.GEMINI_API_KEY ?? "";
const aiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

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

interface ParsedCharge {
  label?: string;
  amount?: number | string;
}

interface ParsedLine {
  description?: string;
  quantity?: number | string;
  rate?: number | string;
}

interface ParsedInvoice {
  invoiceNumber?: string;
  dueDate?: string;
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
  to?: {
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
  currency?: string;
  taxRate?: number | string;
  customCharges?: ParsedCharge[];
  notes?: string;
  lines?: ParsedLine[];
}

const buildPrompt = (prompt: string, defaults?: InvoiceDefaults) => `
You are an expert Indian invoicing assistant specialised in GST compliance.
Convert the user sentence into a JSON invoice.
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
    "stateCode": "string",
    "postalCode": "string",
    "country": "string",
    "gstin": "string"
  },
  "to": {
    "name": "string",
    "company": "string",
    "email": "string",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "stateCode": "string",
    "postalCode": "string",
    "country": "string",
    "gstin": "string"
  },
  "currency": "INR",
  "taxRate": 18,
  "gstType": "CGST_SGST",
  "customCharges": [
    { "label": "string", "amount": number }
  ],
  "notes": "string",
  "lines": [
    { "description": "string", "quantity": number, "rate": number, "hsnSacCode": "string" }
  ]
}
Rules:
- Default currency is INR. Parse ₹ and amounts like "15k" as 15000.
- taxRate: common GST rates are 5, 12, 18, 28. Default 18 if not specified.
- gstType: "CGST_SGST" if from.stateCode === to.stateCode (intrastate), "IGST" if interstate, "B2C" if no client GSTIN.
- Leave gstin/stateCode as empty string if not mentioned.
- hsnSacCode: infer from description where obvious (e.g. software services = 998314).
- Invoice number format: INV-YYYY-YY-NNN (Indian Financial Year, April–March).
If missing, infer sensible defaults. Default country is India.
If available, use these user defaults when fields are missing:
${defaults ? JSON.stringify(defaults) : "{}"}

User input: ${prompt}
`;

const normalizeInvoice = (
  parsed: ParsedInvoice | Record<string, never>,
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
      stateCode: (parsed?.from as { stateCode?: string })?.stateCode || "",
      postalCode: parsed?.from?.postalCode || fallbackFrom.postalCode || "",
      country: parsed?.from?.country || fallbackFrom.country || "India",
      gstin: (parsed?.from as { gstin?: string })?.gstin || "",
    },
    to: {
      name: parsed?.to?.name || extractClient(prompt),
      company: parsed?.to?.company || "",
      email: parsed?.to?.email || "",
      addressLine1: parsed?.to?.addressLine1 || "",
      addressLine2: parsed?.to?.addressLine2 || "",
      city: parsed?.to?.city || "",
      state: parsed?.to?.state || "",
      stateCode: (parsed?.to as { stateCode?: string })?.stateCode || "",
      postalCode: parsed?.to?.postalCode || "",
      country: parsed?.to?.country || "India",
      gstin: (parsed?.to as { gstin?: string })?.gstin || "",
    },
    currency: parsed?.currency || defaults?.currency || "INR",
    taxRate: Number(parsed?.taxRate ?? defaults?.taxRate ?? 18),
    gstType: (parsed as { gstType?: string })?.gstType || inferGstType(parsed),
    customCharges: Array.isArray(parsed?.customCharges)
      ? parsed.customCharges.map((charge: ParsedCharge, index: number) => ({
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
    lines: lines.map((line: ParsedLine, index: number) => ({
      id: `${index + 1}`,
      description: line.description ?? "Services rendered",
      quantity: Number(line.quantity ?? 1),
      rate: toCurrency(Number(line.rate ?? 0)),
      hsnSacCode: (line as { hsnSacCode?: string })?.hsnSacCode || "",
    })),
  };
};

const inferGstType = (
  parsed: ParsedInvoice | Record<string, never>,
): string => {
  const fromCode = (parsed?.from as { stateCode?: string })?.stateCode || "";
  const toCode = (parsed?.to as { stateCode?: string })?.stateCode || "";
  const toGstin = (parsed?.to as { gstin?: string })?.gstin || "";
  if (!toGstin) return "B2C";
  if (fromCode && toCode && fromCode === toCode) return "CGST_SGST";
  if (fromCode && toCode && fromCode !== toCode) return "IGST";
  return "CGST_SGST";
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. Authentication required." },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  const rate = await checkRateLimit(`parse:${userId}:${ip}`, {
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
    const parsedBody = parseInvoiceRequestSchema.safeParse(
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

  if (!aiKey) {
    return NextResponse.json(
      { error: "AI API key is required to generate invoices." },
      { status: 400 },
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(aiKey);
    const model = genAI.getGenerativeModel({ model: aiModel });
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
          "AI returned an empty response. We generated a draft using defaults.",
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
          "AI returned an unreadable response. We generated a draft using defaults.",
      });
    }
  } catch {
    return NextResponse.json(
      { error: "AI could not generate the invoice." },
      { status: 502 },
    );
  }
}
