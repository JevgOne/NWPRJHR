import { prisma } from "./db";
import { sendNotificationEmail } from "./email";

const SUBJECTS: Record<string, string> = {
  cs: "Zboží je opět skladem",
  uk: "Товар знову в наявності",
  ru: "Товар снова в наличии",
};

function getEmailContent(
  locale: string,
  productName: string,
  variantLabel: string,
  productUrl: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.hairland.cz";
  const fullUrl = `${baseUrl}${productUrl}`;

  if (locale === "uk") {
    return {
      subject: SUBJECTS.uk,
      body: `Вітаємо!\n\n${productName} (${variantLabel}) знову в наявності.\n\nПереглянути: ${fullUrl}\n\nHairland`,
      html: `<p>Вітаємо!</p><p><strong>${productName}</strong> (${variantLabel}) знову в наявності.</p><p><a href="${fullUrl}">Переглянути продукт</a></p><p>Hairland</p>`,
    };
  }
  if (locale === "ru") {
    return {
      subject: SUBJECTS.ru,
      body: `Здравствуйте!\n\n${productName} (${variantLabel}) снова в наличии.\n\nПосмотреть: ${fullUrl}\n\nHairland`,
      html: `<p>Здравствуйте!</p><p><strong>${productName}</strong> (${variantLabel}) снова в наличии.</p><p><a href="${fullUrl}">Посмотреть продукт</a></p><p>Hairland</p>`,
    };
  }
  // cs default
  return {
    subject: SUBJECTS.cs,
    body: `Dobrý den,\n\n${productName} (${variantLabel}) je opět skladem.\n\nZobrazit: ${fullUrl}\n\nHairland`,
    html: `<p>Dobrý den,</p><p><strong>${productName}</strong> (${variantLabel}) je opět skladem.</p><p><a href="${fullUrl}">Zobrazit produkt</a></p><p>Hairland</p>`,
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
    const { subject, body, html } = getEmailContent(
      sub.locale,
      variant.product.name,
      variantLabel,
      productUrl
    );
    await sendNotificationEmail({ to: sub.email, subject, body, html }).catch(
      () => {}
    );
  }

  await prisma.stockSubscription.updateMany({
    where: { variantId, notified: false },
    data: { notified: true, notifiedAt: new Date() },
  });
}
