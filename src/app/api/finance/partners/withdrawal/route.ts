import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordWithdrawal } from "@/lib/partner-settlement";
import { recordWithdrawalSchema } from "@/lib/validations/finance";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = recordWithdrawalSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const withdrawal = await recordWithdrawal(parsed.data, session.user.id);
  return NextResponse.json(withdrawal, { status: 201 });
}
