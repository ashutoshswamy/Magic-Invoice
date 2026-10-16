import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MARKER } from "@/app/lib/sessionCookie";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(SESSION_MARKER, "", { path: "/", maxAge: 0 });
  return response;
}
