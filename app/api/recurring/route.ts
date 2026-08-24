import { NextResponse } from "next/server";
import { requireAuth } from "../../lib/requireAuth";
import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import {
  recurringInvoiceDraftSchema,
  recurringInvoicePatchSchema,
} from "../../schemas";

export async function GET(request: Request) {
  const userId = await requireAuth(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb
    .collection("recurring_invoices")
    .where("user_id", "==", userId)
    .orderBy("created_at", "desc")
    .get();

  return NextResponse.json({
    data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
}

export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsedBody = recurringInvoiceDraftSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const doc = {
    ...parsedBody.data,
    user_id: userId,
    created_at: FieldValue.serverTimestamp(),
  };
  const ref = await adminDb.collection("recurring_invoices").add(doc);
  const saved = await ref.get();
  return NextResponse.json({ data: { id: ref.id, ...saved.data() } });
}

export async function PATCH(request: Request) {
  const userId = await requireAuth(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsedBody = recurringInvoicePatchSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const { id, ...updates } = parsedBody.data;
  const ref = adminDb.collection("recurring_invoices").doc(id);
  const existing = await ref.get();
  if (!existing.exists || existing.data()?.user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await ref.update(updates);
  const updated = await ref.get();
  return NextResponse.json({ data: { id: ref.id, ...updated.data() } });
}

export async function DELETE(request: Request) {
  const userId = await requireAuth(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const ref = adminDb.collection("recurring_invoices").doc(id);
  const existing = await ref.get();
  if (!existing.exists || existing.data()?.user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
