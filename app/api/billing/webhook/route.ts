import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await request.text();
  return NextResponse.json({ received: true, disabled: true });
}
