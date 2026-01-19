import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "../../lib/rateLimit";

export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function POST(request: Request) {
  // Verify authentication
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized. Authentication required." },
      { status: 401 },
    );
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired authentication token." },
      { status: 401 },
    );
  }

  
  const ip = getClientIp(request);
  const rate = checkRateLimit(`welcome:${ip}`, {
    windowMs: 60 * 60 * 1000,
    max: 10,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": rate.retryAfter.toString(),
        },
      },
    );
  }

  if (!resendApiKey || !resendFrom) {
    return NextResponse.json(
      { error: "Email service not configured." },
      { status: 500 },
    );
  }

  let body: { email?: string; name?: string } | null = null;
  try {
    body = (await request.json()) as { email?: string; name?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const email = body?.email?.trim();
  const name = body?.name?.trim() || "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && email.length > 254) {
    return NextResponse.json({ error: "Email is too long." }, { status: 400 });
  }

  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const emailRate = checkRateLimit(`welcome-email:${email.toLowerCase()}`, {
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
  });
  if (!emailRate.allowed) {
    return NextResponse.json(
      { error: "Email already sent recently." },
      {
        status: 429,
        headers: {
          "Retry-After": emailRate.retryAfter.toString(),
        },
      },
    );
  }

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: resendFrom,
      to: email,
      subject: "Welcome to Magic Invoice",
      html: `
        <div style="background:#020617;padding:32px 16px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e2e8f0;">
          <div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:20px;padding:28px;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#a7f3d0;margin-bottom:10px;">Welcome to Magic Invoice</div>
            <h1 style="margin:0 0 12px;font-size:24px;color:#f8fafc;">Welcome${name ? `, ${name}` : ""}!</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#cbd5f5;">
              You&apos;re in. Magic Invoice turns text into polished invoices and keeps everything organized in one place.
            </p>
            <div style="background:rgba(148,163,184,0.12);border-radius:16px;padding:16px;margin:16px 0;">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#e2e8f0;">
                Start by creating your first invoice or setting your business defaults.
              </p>
              <a href="https://magicinvoice.in/dashboard" style="display:inline-block;background:#34d399;color:#0f172a;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:999px;">
                Go to dashboard
              </a>
            </div>
            <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
              Need help? Just reply to this email and we&apos;ll be happy to assist.
            </p>
            <p style="margin:16px 0 0;font-size:12px;color:#64748b;">The Magic Invoice Team</p>
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to send welcome email." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, messageId: data?.id });
  } catch {
    return NextResponse.json(
      { error: "Failed to send welcome email." },
      { status: 500 },
    );
  }
}

