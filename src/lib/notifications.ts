import type { Notification, NotificationType, Role, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { sendNotificationEmail } from "./email";

/**
 * Create an in-app notification and optionally send email.
 */
export async function createNotification(input: {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  sendEmail?: boolean;
}): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: (input.data ?? {}) as Prisma.InputJsonValue,
    },
  });

  if (input.sendEmail) {
    const recipient = await prisma.user.findUniqueOrThrow({
      where: { id: input.recipientId },
      select: { email: true, name: true },
    });

    if (recipient.email) {
      try {
        await sendNotificationEmail({
          to: recipient.email,
          toName: recipient.name ?? undefined,
          subject: input.title,
          body: input.message,
        });

        await prisma.notification.update({
          where: { id: notification.id },
          data: { emailSent: true, emailSentAt: new Date() },
        });
      } catch {
        // Email send failure should not block notification creation
      }
    }
  }

  return notification;
}

/**
 * Send notification to all users with a specific role.
 */
export async function createNotificationForRole(input: {
  role: Role;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  sendEmail?: boolean;
}): Promise<Notification[]> {
  const users = await prisma.user.findMany({
    where: { role: input.role },
  });

  const notifications: Notification[] = [];
  for (const user of users) {
    const n = await createNotification({
      recipientId: user.id,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      sendEmail: input.sendEmail,
    });
    notifications.push(n);
  }

  return notifications;
}

/**
 * Send notification to all users linked to a salon.
 * Content is translated to salon's language.
 */
export async function createSalonNotification(input: {
  salonId: string;
  type: NotificationType;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
  sendEmail?: boolean;
}): Promise<Notification | null> {
  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id: input.salonId },
  });

  const salonUsers = await prisma.user.findMany({
    where: { role: "SALON", salonId: input.salonId },
  });

  if (salonUsers.length === 0) return null;

  const lang = salon.language ?? "cs";
  const translated = translateNotification(input.type, lang, input.data);

  const title = input.title ?? translated.title;
  const message = input.message ?? translated.message;

  const notifications: Notification[] = [];
  for (const user of salonUsers) {
    const n = await createNotification({
      recipientId: user.id,
      type: input.type,
      title,
      message,
      data: input.data,
      sendEmail: input.sendEmail,
    });
    notifications.push(n);
  }

  return notifications[0] ?? null;
}

/**
 * Translate notification content based on type and language.
 */
export function translateNotification(
  type: NotificationType,
  lang: string,
  data?: Record<string, unknown>
): { title: string; message: string } {
  const templates: Record<
    string,
    Record<NotificationType, { title: string; message: string }>
  > = {
    cs: {
      NEW_ORDER: {
        title: "Nová objednávka",
        message: `Přišla nová objednávka od salonu ${data?.salonName ?? ""}`,
      },
      ORDER_CONFIRMED: {
        title: "Objednávka potvrzena",
        message: `Vaše objednávka ${data?.orderNumber ?? ""} byla potvrzena`,
      },
      ORDER_READY: {
        title: "Objednávka připravena",
        message: `Vaše objednávka ${data?.orderNumber ?? ""} je připravena`,
      },
      ORDER_IN_TRANSIT: {
        title: "Objednávka na cestě",
        message: `Vaše objednávka ${data?.orderNumber ?? ""} je na cestě`,
      },
      ORDER_REJECTED: {
        title: "Objednávka zamítnuta",
        message: `Vaše objednávka ${data?.orderNumber ?? ""} byla zamítnuta`,
      },
      INVOICE_ISSUED: {
        title: "Faktura vystavena",
        message: `Faktura ${data?.invoiceNumber ?? ""} byla vystavena`,
      },
      INVOICE_PAID: {
        title: "Faktura uhrazena",
        message: `Faktura ${data?.invoiceNumber ?? ""} byla uhrazena`,
      },
      SAMPLE_REQUEST: {
        title: "Žádost o vzorek",
        message: `Salon ${data?.salonName ?? ""} žádá o vzorek`,
      },
      INCOMING_PAYMENT: {
        title: "Platba přijata",
        message: `Přijata platba k faktuře ${data?.invoiceNumber ?? ""}`,
      },
      RETURN_REQUEST: {
        title: "Vratka ke schválení",
        message: `Nová vratka ke schválení od salonu ${data?.salonName ?? ""}`,
      },
      PAYMENT_REMINDER: {
        title: "Upomínka",
        message: `Faktura ${data?.invoiceNumber ?? ""} je po splatnosti`,
      },
      NEW_INQUIRY: {
        title: "Nová poptávka",
        message: `Přišla nová poptávka od ${data?.name ?? ""} (${data?.itemCount ?? 0} položek)`,
      },
      REGISTRATION: {
        title: "Nová registrace",
        message: `${data?.type ?? "Salon"} "${data?.name ?? ""}" žádá o schválení.`,
      },
      NEW_REVIEW: {
        title: "Nová recenze",
        message: `${data?.authorName ?? ""} přidal/a recenzi (${data?.rating ?? ""}★)`,
      },
      NEW_CONTACT: {
        title: "Nová zpráva z kontaktního formuláře",
        message: `${data?.name ?? ""} (${data?.email ?? ""}) poslal/a zprávu`,
      },
      NEW_COMPLAINT: {
        title: "Nová reklamace",
        message: `Nová reklamace${data?.salonName ? ` od salonu ${data.salonName}` : ""}`,
      },
    },
    uk: {
      NEW_ORDER: {
        title: "\u041d\u043e\u0432\u0435 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f",
        message: `\u041d\u0430\u0434\u0456\u0439\u0448\u043b\u043e \u043d\u043e\u0432\u0435 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0432\u0456\u0434 \u0441\u0430\u043b\u043e\u043d\u0443 ${data?.salonName ?? ""}`,
      },
      ORDER_CONFIRMED: {
        title: "\u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e",
        message: `\u0412\u0430\u0448\u0435 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f ${data?.orderNumber ?? ""} \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e`,
      },
      ORDER_READY: {
        title: "\u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0433\u043e\u0442\u043e\u0432\u0435",
        message: `\u0412\u0430\u0448\u0435 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f ${data?.orderNumber ?? ""} \u0433\u043e\u0442\u043e\u0432\u0435`,
      },
      ORDER_IN_TRANSIT: {
        title: "\u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0432 \u0434\u043e\u0440\u043e\u0437\u0456",
        message: `\u0412\u0430\u0448\u0435 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f ${data?.orderNumber ?? ""} \u0432 \u0434\u043e\u0440\u043e\u0437\u0456`,
      },
      ORDER_REJECTED: {
        title: "\u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0432\u0456\u0434\u0445\u0438\u043b\u0435\u043d\u043e",
        message: `\u0412\u0430\u0448\u0435 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f ${data?.orderNumber ?? ""} \u0431\u0443\u043b\u043e \u0432\u0456\u0434\u0445\u0438\u043b\u0435\u043d\u043e`,
      },
      INVOICE_ISSUED: {
        title: "\u0420\u0430\u0445\u0443\u043d\u043e\u043a \u0432\u0438\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u043e",
        message: `\u0420\u0430\u0445\u0443\u043d\u043e\u043a ${data?.invoiceNumber ?? ""} \u0432\u0438\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u043e`,
      },
      INVOICE_PAID: {
        title: "\u0420\u0430\u0445\u0443\u043d\u043e\u043a \u0441\u043f\u043b\u0430\u0447\u0435\u043d\u043e",
        message: `\u0420\u0430\u0445\u0443\u043d\u043e\u043a ${data?.invoiceNumber ?? ""} \u0441\u043f\u043b\u0430\u0447\u0435\u043d\u043e`,
      },
      SAMPLE_REQUEST: {
        title: "\u0417\u0430\u043f\u0438\u0442 \u043d\u0430 \u0437\u0440\u0430\u0437\u043e\u043a",
        message: `\u0421\u0430\u043b\u043e\u043d ${data?.salonName ?? ""} \u0437\u0430\u043f\u0438\u0442\u0443\u0454 \u0437\u0440\u0430\u0437\u043e\u043a`,
      },
      INCOMING_PAYMENT: {
        title: "\u041f\u043b\u0430\u0442\u0456\u0436 \u043e\u0442\u0440\u0438\u043c\u0430\u043d\u043e",
        message: `\u041e\u0442\u0440\u0438\u043c\u0430\u043d\u043e \u043f\u043b\u0430\u0442\u0456\u0436 \u0437\u0430 \u0440\u0430\u0445\u0443\u043d\u043a\u043e\u043c ${data?.invoiceNumber ?? ""}`,
      },
      RETURN_REQUEST: {
        title: "\u041f\u043e\u0432\u0435\u0440\u043d\u0435\u043d\u043d\u044f \u043d\u0430 \u0437\u0430\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043d\u044f",
        message: `\u041d\u043e\u0432\u0435 \u043f\u043e\u0432\u0435\u0440\u043d\u0435\u043d\u043d\u044f \u043d\u0430 \u0437\u0430\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043d\u044f \u0432\u0456\u0434 \u0441\u0430\u043b\u043e\u043d\u0443 ${data?.salonName ?? ""}`,
      },
      PAYMENT_REMINDER: {
        title: "\u041d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f",
        message: `\u0420\u0430\u0445\u0443\u043d\u043e\u043a ${data?.invoiceNumber ?? ""} \u043f\u0440\u043e\u0441\u0442\u0440\u043e\u0447\u0435\u043d\u0438\u0439`,
      },
      NEW_INQUIRY: {
        title: "\u041d\u043e\u0432\u0438\u0439 \u0437\u0430\u043f\u0438\u0442",
        message: `\u041d\u0430\u0434\u0456\u0439\u0448\u043e\u0432 \u043d\u043e\u0432\u0438\u0439 \u0437\u0430\u043f\u0438\u0442 \u0432\u0456\u0434 ${data?.name ?? ""} (${data?.itemCount ?? 0} \u043f\u043e\u0437\u0438\u0446\u0456\u0439)`,
      },
      REGISTRATION: {
        title: "\u041d\u043e\u0432\u0430 \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u044f",
        message: `${data?.type ?? "Salon"} "${data?.name ?? ""}" \u0437\u0430\u043f\u0438\u0442\u0443\u0454 \u0441\u0445\u0432\u0430\u043b\u0435\u043d\u043d\u044f.`,
      },
      NEW_REVIEW: {
        title: "\u041d\u043e\u0432\u0438\u0439 \u0432\u0456\u0434\u0433\u0443\u043a",
        message: `${data?.authorName ?? ""} \u0434\u043e\u0434\u0430\u0432 \u0432\u0456\u0434\u0433\u0443\u043a (${data?.rating ?? ""}\u2605)`,
      },
      NEW_CONTACT: {
        title: "\u041d\u043e\u0432\u0435 \u043f\u043e\u0432\u0456\u0434\u043e\u043c\u043b\u0435\u043d\u043d\u044f",
        message: `${data?.name ?? ""} (${data?.email ?? ""}) \u043d\u0430\u0434\u0456\u0441\u043b\u0430\u0432 \u043f\u043e\u0432\u0456\u0434\u043e\u043c\u043b\u0435\u043d\u043d\u044f`,
      },
      NEW_COMPLAINT: {
        title: "\u041d\u043e\u0432\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u0430\u0446\u0456\u044f",
        message: `\u041d\u043e\u0432\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u0430\u0446\u0456\u044f${data?.salonName ? ` \u0432\u0456\u0434 \u0441\u0430\u043b\u043e\u043d\u0443 ${data.salonName}` : ""}`,
      },
    },
    ru: {
      NEW_ORDER: {
        title: "\u041d\u043e\u0432\u044b\u0439 \u0437\u0430\u043a\u0430\u0437",
        message: `\u041f\u043e\u0441\u0442\u0443\u043f\u0438\u043b \u043d\u043e\u0432\u044b\u0439 \u0437\u0430\u043a\u0430\u0437 \u043e\u0442 \u0441\u0430\u043b\u043e\u043d\u0430 ${data?.salonName ?? ""}`,
      },
      ORDER_CONFIRMED: {
        title: "\u0417\u0430\u043a\u0430\u0437 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d",
        message: `\u0412\u0430\u0448 \u0437\u0430\u043a\u0430\u0437 ${data?.orderNumber ?? ""} \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d`,
      },
      ORDER_READY: {
        title: "\u0417\u0430\u043a\u0430\u0437 \u0433\u043e\u0442\u043e\u0432",
        message: `\u0412\u0430\u0448 \u0437\u0430\u043a\u0430\u0437 ${data?.orderNumber ?? ""} \u0433\u043e\u0442\u043e\u0432`,
      },
      ORDER_IN_TRANSIT: {
        title: "\u0417\u0430\u043a\u0430\u0437 \u0432 \u043f\u0443\u0442\u0438",
        message: `\u0412\u0430\u0448 \u0437\u0430\u043a\u0430\u0437 ${data?.orderNumber ?? ""} \u0432 \u043f\u0443\u0442\u0438`,
      },
      ORDER_REJECTED: {
        title: "\u0417\u0430\u043a\u0430\u0437 \u043e\u0442\u043a\u043b\u043e\u043d\u0451\u043d",
        message: `\u0412\u0430\u0448 \u0437\u0430\u043a\u0430\u0437 ${data?.orderNumber ?? ""} \u0431\u044b\u043b \u043e\u0442\u043a\u043b\u043e\u043d\u0451\u043d`,
      },
      INVOICE_ISSUED: {
        title: "\u0421\u0447\u0451\u0442 \u0432\u044b\u0441\u0442\u0430\u0432\u043b\u0435\u043d",
        message: `\u0421\u0447\u0451\u0442 ${data?.invoiceNumber ?? ""} \u0432\u044b\u0441\u0442\u0430\u0432\u043b\u0435\u043d`,
      },
      INVOICE_PAID: {
        title: "\u0421\u0447\u0451\u0442 \u043e\u043f\u043b\u0430\u0447\u0435\u043d",
        message: `\u0421\u0447\u0451\u0442 ${data?.invoiceNumber ?? ""} \u043e\u043f\u043b\u0430\u0447\u0435\u043d`,
      },
      SAMPLE_REQUEST: {
        title: "\u0417\u0430\u043f\u0440\u043e\u0441 \u043e\u0431\u0440\u0430\u0437\u0446\u0430",
        message: `\u0421\u0430\u043b\u043e\u043d ${data?.salonName ?? ""} \u0437\u0430\u043f\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u0442 \u043e\u0431\u0440\u0430\u0437\u0435\u0446`,
      },
      INCOMING_PAYMENT: {
        title: "\u041f\u043b\u0430\u0442\u0451\u0436 \u043f\u043e\u043b\u0443\u0447\u0435\u043d",
        message: `\u041f\u043e\u043b\u0443\u0447\u0435\u043d \u043f\u043b\u0430\u0442\u0451\u0436 \u043f\u043e \u0441\u0447\u0451\u0442\u0443 ${data?.invoiceNumber ?? ""}`,
      },
      RETURN_REQUEST: {
        title: "\u0412\u043e\u0437\u0432\u0440\u0430\u0442 \u043d\u0430 \u0443\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435",
        message: `\u041d\u043e\u0432\u044b\u0439 \u0432\u043e\u0437\u0432\u0440\u0430\u0442 \u043d\u0430 \u0443\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435 \u043e\u0442 \u0441\u0430\u043b\u043e\u043d\u0430 ${data?.salonName ?? ""}`,
      },
      PAYMENT_REMINDER: {
        title: "\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0435",
        message: `\u0421\u0447\u0451\u0442 ${data?.invoiceNumber ?? ""} \u043f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d`,
      },
      NEW_INQUIRY: {
        title: "\u041d\u043e\u0432\u044b\u0439 \u0437\u0430\u043f\u0440\u043e\u0441",
        message: `\u041f\u043e\u0441\u0442\u0443\u043f\u0438\u043b \u043d\u043e\u0432\u044b\u0439 \u0437\u0430\u043f\u0440\u043e\u0441 \u043e\u0442 ${data?.name ?? ""} (${data?.itemCount ?? 0} \u043f\u043e\u0437\u0438\u0446\u0438\u0439)`,
      },
      REGISTRATION: {
        title: "\u041d\u043e\u0432\u0430\u044f \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",
        message: `${data?.type ?? "Salon"} "${data?.name ?? ""}" \u0437\u0430\u043f\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u0442 \u043e\u0434\u043e\u0431\u0440\u0435\u043d\u0438\u0435.`,
      },
      NEW_REVIEW: {
        title: "\u041d\u043e\u0432\u044b\u0439 \u043e\u0442\u0437\u044b\u0432",
        message: `${data?.authorName ?? ""} \u0434\u043e\u0431\u0430\u0432\u0438\u043b \u043e\u0442\u0437\u044b\u0432 (${data?.rating ?? ""}\u2605)`,
      },
      NEW_CONTACT: {
        title: "\u041d\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435",
        message: `${data?.name ?? ""} (${data?.email ?? ""}) \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u043b \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435`,
      },
      NEW_COMPLAINT: {
        title: "\u041d\u043e\u0432\u0430\u044f \u0440\u0435\u043a\u043b\u0430\u043c\u0430\u0446\u0438\u044f",
        message: `\u041d\u043e\u0432\u0430\u044f \u0440\u0435\u043a\u043b\u0430\u043c\u0430\u0446\u0438\u044f${data?.salonName ? ` \u043e\u0442 \u0441\u0430\u043b\u043e\u043d\u0430 ${data.salonName}` : ""}`,
      },
    },
  };

  return templates[lang]?.[type] ?? templates.cs[type];
}
