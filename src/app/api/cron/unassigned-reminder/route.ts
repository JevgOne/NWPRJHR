import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMINDER_HOURS = 3;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - REMINDER_HOURS);

  // Find unassigned inquiries older than 3 hours
  const inquiries = await prisma.inquiry.findMany({
    where: {
      assignedTo: null,
      status: "NEW",
      createdAt: { lte: cutoff },
    },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // Find unassigned contact messages older than 3 hours
  const contacts = await prisma.contactMessage.findMany({
    where: {
      assignedTo: null,
      createdAt: { lte: cutoff },
    },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  if (inquiries.length === 0 && contacts.length === 0) {
    return NextResponse.json({ ok: true, message: "Nothing to remind" });
  }

  const lines = [
    `🔔 <b>NEVYŘÍZENÉ — čekají déle než ${REMINDER_HOURS}h</b>`,
    ``,
  ];

  if (inquiries.length > 0) {
    lines.push(`<b>Poptávky (${inquiries.length}):</b>`);
    for (const inq of inquiries) {
      const age = getAge(inq.createdAt);
      lines.push(`   ${inq.name} · ${inq.email} — ${age}`);
    }
    lines.push(``);
  }

  if (contacts.length > 0) {
    lines.push(`<b>Zprávy (${contacts.length}):</b>`);
    for (const msg of contacts) {
      const age = getAge(msg.createdAt);
      lines.push(`   ${msg.name} · ${msg.email} — ${age}`);
    }
  }

  await sendTelegramMessage(lines.join("\n"));

  return NextResponse.json({ ok: true, inquiries: inquiries.length, contacts: contacts.length });
}

function getAge(date: Date): string {
  const hours = Math.floor((Date.now() - date.getTime()) / 3600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
