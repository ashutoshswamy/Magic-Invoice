import { NextResponse } from "next/server";
import { requireAuth } from "../../../lib/requireAuth";

export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    { error: "Billing is disabled. Magic Invoice is free only." },
    { status: 410 },
  );
}
