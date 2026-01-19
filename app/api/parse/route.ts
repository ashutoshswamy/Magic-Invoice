import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
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

const buildPrompt = (prompt: string) => `
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
  "to": { "name": "string", "company": "string", "email": "string" },
  "currency": "USD",
  "notes": "string",
  "lines": [
    { "description": "string", "quantity": number, "rate": number }
  ]
}
If missing, infer sensible defaults. Use USD if currency is unknown.

User input: ${prompt}
`;

const normalizeInvoice = (parsed: any, prompt: string) => {
  const issuedOn = parsed?.issuedOn || new Date().toISOString().slice(0, 10);
  const lines =
    Array.isArray(parsed?.lines) && parsed.lines.length
      ? parsed.lines
      : parseLines(prompt);

  return {
    invoiceNumber: parsed?.invoiceNumber || buildInvoiceNumber(),
    issuedOn,
    dueDate: parsed?.dueDate || extractDueDate(prompt),
    from: {
      name: parsed?.from?.name || "You",
      company: parsed?.from?.company || "Magic Invoice Studio",
      email: parsed?.from?.email || "hello@magicinvoice.ai",
      addressLine1: parsed?.from?.addressLine1 || "",
      addressLine2: parsed?.from?.addressLine2 || "",
      city: parsed?.from?.city || "",
      state: parsed?.from?.state || "",
      postalCode: parsed?.from?.postalCode || "",
      country: parsed?.from?.country || "",
    },
    to: {
      name: parsed?.to?.name || extractClient(prompt),
      company: parsed?.to?.company || "",
      email: parsed?.to?.email || "",
    },
    currency: parsed?.currency || "USD",
    notes:
      parsed?.notes ||
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
  const ip = getClientIp(request);
  const rate = checkRateLimit(`parse:${ip}`, {
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

  let body: { prompt?: string } | null = null;
  try {
    body = (await request.json()) as { prompt?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const prompt = body?.prompt?.trim() ?? "";
  if (prompt.length > 2000) {
    return NextResponse.json({ error: "Prompt is too long." }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ invoice: normalizeInvoice({}, prompt) });
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
          parts: [{ text: buildPrompt(prompt) }],
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
        invoice: normalizeInvoice({}, prompt),
        warning:
          "Gemini returned an empty response. We generated a draft using defaults.",
      });
    }

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({ invoice: normalizeInvoice(parsed, prompt) });
    } catch {
      return NextResponse.json({
        invoice: normalizeInvoice({}, prompt),
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
