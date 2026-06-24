import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPaymentReminder } from "@/lib/reminders";
import { sendReminderSchema } from "@/lib/validations/returns";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const salonId = sp.get("salonId");
  const invoiceId = sp.get("invoiceId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (salonId) where.salonId = salonId;
  if (invoiceId) where.invoiceId = invoiceId;

  const reminders = await prisma.paymentReminder.findMany({
    where,
    include: {
      invoice: { select: { number: true } },
      salon: { select: { name: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  return NextResponse.json(reminders);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = sendReminderSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const reminder = await sendPaymentReminder(parsed.data.invoiceId);
    return NextResponse.json(reminder, { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
