import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import {
  getOrderFollowUpEmail,
  getInquiryFollowUpEmail,
  getDay7CareEmail,
  getDay30CheckEmail,
  getExtensionReminderEmail,
} from "@/lib/email-templates";

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

  // 3. Day-7 care emails (shipped 7-8 days ago, retail only)
  let day7Sent = 0;
  const day7Start = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const day7End = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const day7Orders = await prisma.order.findMany({
    where: {
      shippedAt: { gte: day7Start, lte: day7End },
      day7Sent: false,
      salonId: null,
      contactEmail: { not: null },
    },
    select: { id: true, contactEmail: true, contactName: true, locale: true },
  });

  for (const order of day7Orders) {
    if (!order.contactEmail) continue;
    const emailData = getDay7CareEmail(order.locale ?? "cs", {
      customerName: order.contactName ?? "",
    });
    try {
      await sendNotificationEmail({
        to: order.contactEmail,
        subject: emailData.subject,
        body: emailData.text,
        html: emailData.html,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { day7Sent: true, day7SentAt: new Date() },
      });
      day7Sent++;
    } catch { /* retry next run */ }
  }

  // 4. Day-30 check emails (shipped 30-31 days ago, retail only)
  let day30Sent = 0;
  const day30Start = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  const day30End = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const day30Orders = await prisma.order.findMany({
    where: {
      shippedAt: { gte: day30Start, lte: day30End },
      day30Sent: false,
      salonId: null,
      contactEmail: { not: null },
    },
    select: { id: true, contactEmail: true, contactName: true, locale: true },
  });

  for (const order of day30Orders) {
    if (!order.contactEmail) continue;
    const emailData = getDay30CheckEmail(order.locale ?? "cs", {
      customerName: order.contactName ?? "",
    });
    try {
      await sendNotificationEmail({
        to: order.contactEmail,
        subject: emailData.subject,
        body: emailData.text,
        html: emailData.html,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { day30Sent: true, day30SentAt: new Date() },
      });
      day30Sent++;
    } catch { /* retry next run */ }
  }

  // 5. Extension reminder emails (shipped ~60 days ago, retail only)
  let extensionSent = 0;
  const DEFAULT_DAYS = 60;
  const reminderStart = new Date(Date.now() - (DEFAULT_DAYS + 1) * 24 * 60 * 60 * 1000);
  const reminderEnd = new Date(Date.now() - (DEFAULT_DAYS - 1) * 24 * 60 * 60 * 1000);

  const reminderOrders = await prisma.order.findMany({
    where: {
      shippedAt: { gte: reminderStart, lte: reminderEnd },
      extensionReminderSent: false,
      salonId: null,
      contactEmail: { not: null },
    },
    select: { id: true, contactEmail: true, contactName: true, locale: true, extensionMethod: true },
  });

  for (const order of reminderOrders) {
    if (!order.contactEmail) continue;
    const emailData = getExtensionReminderEmail(order.locale ?? "cs", {
      customerName: order.contactName ?? "",
      method: (order.extensionMethod as "keratin" | "tape" | "micro" | "tres") ?? undefined,
    });
    try {
      await sendNotificationEmail({
        to: order.contactEmail,
        subject: emailData.subject,
        body: emailData.text,
        html: emailData.html,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { extensionReminderSent: true, extensionReminderSentAt: new Date() },
      });
      extensionSent++;
    } catch { /* retry next run */ }
  }

  return NextResponse.json({
    ok: true,
    ordersSent,
    inquiriesSent,
    day7Sent,
    day30Sent,
    extensionSent,
    ordersChecked: completedOrders.length,
    inquiriesChecked: completedInquiries.length,
    day7Checked: day7Orders.length,
    day30Checked: day30Orders.length,
    extensionChecked: reminderOrders.length,
  });
}
