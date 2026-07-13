import { prisma } from "./db";
import { sendNotificationEmail } from "./email";
import { getUnsubscribeUrl } from "./unsubscribe";

const SUBJECTS: Record<string, string> = {
  cs: "Zboží je opět skladem",
  uk: "Товар знову в наявності",
  ru: "Товар снова в наличии",
};

const UNSUB_LABEL: Record<string, string> = {
  cs: "Odhlásit se z notifikací",
  uk: "Відписатися від сповіщень",
  ru: "Отписаться от уведомлений",
};

function getEmailContent(
  locale: string,
  productName: string,
  variantLabel: string,
  productUrl: string,
  unsubscribeUrl: string,
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.hairland.cz";
  const fullUrl = `${baseUrl}${productUrl}`;
  const unsubLabel = UNSUB_LABEL[locale] ?? UNSUB_LABEL.cs;
  const unsubText = `\n\n---\n${unsubLabel}: ${unsubscribeUrl}`;
  const unsubHtml = `<hr style="border:none;border-top:1px solid #ead9cf;margin:24px 0 12px;"><p style="font-size:11px;color:#9c8682;margin:0;"><a href="${unsubscribeUrl}" style="color:#9c8682;text-decoration:underline;">${unsubLabel}</a></p>`;

  if (locale === "uk") {
    return {
      subject: SUBJECTS.uk,
      body: `Вітаємо!\n\n${productName} (${variantLabel}) знову в наявності.\n\nПереглянути: ${fullUrl}\n\nHairland${unsubText}`,
      html: `<p>Вітаємо!</p><p><strong>${productName}</strong> (${variantLabel}) знову в наявності.</p><p><a href="${fullUrl}">Переглянути продукт</a></p><p>Hairland</p>${unsubHtml}`,
    };
  }
  if (locale === "ru") {
    return {
      subject: SUBJECTS.ru,
      body: `Здравствуйте!\n\n${productName} (${variantLabel}) снова в наличии.\n\nПосмотреть: ${fullUrl}\n\nHairland${unsubText}`,
      html: `<p>Здравствуйте!</p><p><strong>${productName}</strong> (${variantLabel}) снова в наличии.</p><p><a href="${fullUrl}">Посмотреть продукт</a></p><p>Hairland</p>${unsubHtml}`,
    };
  }
  // cs default
  return {
    subject: SUBJECTS.cs,
    body: `Dobrý den,\n\n${productName} (${variantLabel}) je opět skladem.\n\nZobrazit: ${fullUrl}\n\nHairland${unsubText}`,
    html: `<p>Dobrý den,</p><p><strong>${productName}</strong> (${variantLabel}) je opět skladem.</p><p><a href="${fullUrl}">Zobrazit produkt</a></p><p>Hairland</p>${unsubHtml}`,
  };
}

export async function notifyStockSubscribers(variantId: string): Promise<void> {
  const subscribers = await prisma.stockSubscription.findMany({
    where: { variantId, notified: false },
    include: {
      variant: {
        include: {
          product: { select: { name: true, slug: true, id: true } },
        },
      },
    },
  });

  if (subscribers.length === 0) return;

  const variant = subscribers[0].variant;
  const productSlug = variant.product.slug ?? variant.product.id;
  const productUrl = `/offer/${productSlug}`;
  const variantLabel = `${variant.lengthCm} cm, ${variant.color}`;

  for (const sub of subscribers) {
    const unsubscribeUrl = getUnsubscribeUrl(sub.email);
    const { subject, body, html } = getEmailContent(
      sub.locale,
      variant.product.name,
      variantLabel,
      productUrl,
      unsubscribeUrl,
    );
    await sendNotificationEmail({ to: sub.email, subject, body, html, unsubscribeUrl }).catch(
      () => {}
    );
  }

  await prisma.stockSubscription.updateMany({
    where: { variantId, notified: false },
    data: { notified: true, notifiedAt: new Date() },
  });
}
