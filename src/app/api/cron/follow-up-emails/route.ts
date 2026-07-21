import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { getOrderFollowUpEmail, getInquiryFollowUpEmail } from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

  let ordersSent = 0;
  let inquiriesSent = 0;

  // 1. B2B order follow-ups (completed 3-4 days ago, not yet sent)
  const completedOrders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: fourDaysAgo, lte: threeDaysAgo },
      followUpSent: false,
      noSurvey: false,
    },
    include: {
      salon: { select: { email: true, name: true, language: true } },
    },
  });

  for (const order of completedOrders) {
    if (!order.salon?.email) continue;

    const lang = order.salon.language || "cs";
    const emailData = getOrderFollowUpEmail(lang, {
      salonName: order.salon.name,
      orderNumber: order.orderNumber ?? order.id.slice(0, 8),
    });

    try {
      await sendNotificationEmail({ to: order.salon.email, subject: emailData.subject, body: emailData.text, html: emailData.html });
      await prisma.order.update({
        where: { id: order.id },
        data: { followUpSent: true, followUpSentAt: new Date() },
      });
      ordersSent++;
    } catch {
      // Skip failed sends, will retry next day
    }
  }

  // 2. Retail inquiry follow-ups (completed 3-4 days ago, not yet sent)
  const completedInquiries = await prisma.inquiry.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: fourDaysAgo, lte: threeDaysAgo },
      followUpSent: false,
    },
    include: {
      items: { select: { productName: true, lengthCm: true, color: true, quantity: true, unit: true } },
    },
  });

  for (const inquiry of completedInquiries) {
    if (!inquiry.email) continue;

    const lang = inquiry.locale || "cs";
    const itemsSummary = inquiry.items
      .map((i) => `${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.quantity}${i.unit}`)
      .join("; ");

    const emailData = getInquiryFollowUpEmail(lang, {
      name: inquiry.name,
      inquiryItems: itemsSummary,
    });

    try {
      await sendNotificationEmail({ to: inquiry.email, subject: emailData.subject, body: emailData.text, html: emailData.html });
      await prisma.inquiry.update({
        where: { id: inquiry.id },
        data: { followUpSent: true, followUpSentAt: new Date() },
      });
      inquiriesSent++;
    } catch {
      // Skip failed sends, will retry next day
    }
  }

  return NextResponse.json({
    ok: true,
    ordersSent,
    inquiriesSent,
    ordersChecked: completedOrders.length,
    inquiriesChecked: completedInquiries.length,
  });
}
