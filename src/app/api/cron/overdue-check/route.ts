import { NextRequest, NextResponse } from "next/server";
import { updateOverdueInvoices } from "@/lib/invoice-status";
import { prisma } from "@/lib/db";
import { sendPaymentReminder } from "@/lib/reminders";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdueCount = await updateOverdueInvoices();

  // Send reminders for overdue invoices that haven't been reminded today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "OVERDUE",
      type: "INVOICE",
      salonId: { not: null },
    },
    select: { id: true },
  });

  let remindersSent = 0;
  for (const inv of overdueInvoices) {
    // Check if reminder was already sent today
    const recentReminder = await prisma.paymentReminder.findFirst({
      where: {
        invoiceId: inv.id,
        sentAt: { gte: today },
      },
    });

    if (!recentReminder) {
      try {
        await sendPaymentReminder(inv.id);
        remindersSent++;
      } catch {
        // Skip individual failures
      }
    }
  }

  return NextResponse.json({
    overdueCount,
    remindersSent,
    timestamp: new Date().toISOString(),
  });
}
