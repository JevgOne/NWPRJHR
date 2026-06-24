import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { creditNoteSchema } from "@/lib/validations/invoice";
import { createCreditNote } from "@/lib/invoicing";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = creditNoteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const creditNote = await createCreditNote(
    parsed.data.originalInvoiceId,
    parsed.data.items,
    parsed.data.reason
  );

  return NextResponse.json(creditNote, { status: 201 });
}
