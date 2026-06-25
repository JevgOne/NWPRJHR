import { prisma } from "./db";
import { createSalonNotification } from "./notifications";

function formatDate(date: Date, lang: string): string {
  const localeMap: Record<string, string> = {
    cs: "cs-CZ",
    uk: "uk-UA",
    ru: "ru-RU",
  };
  return date.toLocaleDateString(localeMap[lang] ?? "cs-CZ");
}

/**
 * Generate and send a payment reminder in salon's language.
 */
export async function sendPaymentReminder(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      salon: true,
      payments: true,
    },
  });

  if (!invoice.salon) {
    throw new Error("Payment reminders only for salon invoices");
  }

  const lang = invoice.salon.language ?? "cs";
  const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = invoice.total - paidAmount;
  const remainingCZK = Math.ceil(remaining / 100);
  const daysOverdue = Math.max(
    0,
    Math.floor(
      (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const templates: Record<string, { subject: string; body: string }> = {
    cs: {
      subject: `Upominka: faktura ${invoice.number} po splatnosti`,
      body: `Dobry den,\n\nfaktura c. ${invoice.number} ze dne ${formatDate(invoice.issueDate, "cs")} se splatnosti ${formatDate(invoice.dueDate, "cs")} je ${daysOverdue} dni po splatnosti.\n\nZbyva uhradit: ${remainingCZK} Kc.\n\nProsime o uhradu na ucet uvedeny na fakture.\n\nDekujeme,\nHairland.cz`,
    },
    uk: {
      subject: `\u041d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f: \u0440\u0430\u0445\u0443\u043d\u043e\u043a ${invoice.number} \u043f\u0440\u043e\u0441\u0442\u0440\u043e\u0447\u0435\u043d\u0438\u0439`,
      body: `\u0414\u043e\u0431\u0440\u043e\u0433\u043e \u0434\u043d\u044f,\n\n\u0440\u0430\u0445\u0443\u043d\u043e\u043a \u2116 ${invoice.number} \u0432\u0456\u0434 ${formatDate(invoice.issueDate, "uk")} \u0437 \u0442\u0435\u0440\u043c\u0456\u043d\u043e\u043c \u043e\u043f\u043b\u0430\u0442\u0438 ${formatDate(invoice.dueDate, "uk")} \u043f\u0440\u043e\u0441\u0442\u0440\u043e\u0447\u0435\u043d\u0438\u0439 \u043d\u0430 ${daysOverdue} \u0434\u043d\u0456\u0432.\n\n\u0417\u0430\u043b\u0438\u0448\u043e\u043a \u0434\u043e \u0441\u043f\u043b\u0430\u0442\u0438: ${remainingCZK} K\u010d.\n\n\u041f\u0440\u043e\u0441\u0438\u043c\u043e \u0437\u0434\u0456\u0439\u0441\u043d\u0438\u0442\u0438 \u043e\u043f\u043b\u0430\u0442\u0443 \u043d\u0430 \u0440\u0430\u0445\u0443\u043d\u043e\u043a, \u0437\u0430\u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0439 \u0443 \u0440\u0430\u0445\u0443\u043d\u043a\u0443-\u0444\u0430\u043a\u0442\u0443\u0440\u0456.\n\n\u0414\u044f\u043a\u0443\u0454\u043c\u043e,\nHairland.cz`,
    },
    ru: {
      subject: `\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0435: \u0441\u0447\u0451\u0442 ${invoice.number} \u043f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d`,
      body: `\u0414\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c,\n\n\u0441\u0447\u0451\u0442 \u2116 ${invoice.number} \u043e\u0442 ${formatDate(invoice.issueDate, "ru")} \u0441\u043e \u0441\u0440\u043e\u043a\u043e\u043c \u043e\u043f\u043b\u0430\u0442\u044b ${formatDate(invoice.dueDate, "ru")} \u043f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d \u043d\u0430 ${daysOverdue} \u0434\u043d\u0435\u0439.\n\n\u041e\u0441\u0442\u0430\u0442\u043e\u043a \u043a \u043e\u043f\u043b\u0430\u0442\u0435: ${remainingCZK} K\u010d.\n\n\u041f\u0440\u043e\u0441\u0438\u043c \u043f\u0440\u043e\u0438\u0437\u0432\u0435\u0441\u0442\u0438 \u043e\u043f\u043b\u0430\u0442\u0443 \u043d\u0430 \u0441\u0447\u0451\u0442, \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u044b\u0439 \u0432 \u0441\u0447\u0451\u0442\u0435-\u0444\u0430\u043a\u0442\u0443\u0440\u0435.\n\n\u0421\u043f\u0430\u0441\u0438\u0431\u043e,\nHairland.cz`,
    },
  };

  const template = templates[lang] ?? templates.cs;

  const reminder = await prisma.paymentReminder.create({
    data: {
      invoiceId,
      salonId: invoice.salon.id,
      subject: template.subject,
      body: template.body,
    },
  });

  const notification = await createSalonNotification({
    salonId: invoice.salon.id,
    type: "PAYMENT_REMINDER",
    title: template.subject,
    message: template.body,
    data: {
      invoiceId,
      invoiceNumber: invoice.number,
      remainingHalere: remaining,
    },
    sendEmail: true,
  });

  if (notification) {
    await prisma.paymentReminder.update({
      where: { id: reminder.id },
      data: { notificationId: notification.id },
    });
  }

  return reminder;
}
