/**
 * Branded HTML email templates for Hairland.
 * All styles inline for email client compatibility.
 */

// --- Shared template wrapper ---

function hairlandEmailTemplate(
  content: string,
  opts?: { unsubscribeUrl?: string; unsubscribeLabel?: string },
): string {
  const unsubLine = opts?.unsubscribeUrl
    ? `<p style="margin:8px 0 0;"><a href="${opts.unsubscribeUrl}" style="color:#b8a09b;font-size:11px;text-decoration:underline;">${opts.unsubscribeLabel ?? "Odhlásit se"}</a></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <!-- Logo -->
    <div style="text-align:center;padding:24px 20px;background-color:#3a2c2a;border-radius:16px 16px 0 0;">
      <a href="https://www.hairland.cz" style="text-decoration:none;">
        <img src="https://www.hairland.cz/logo-email-dark.png" alt="Hairland" width="120" height="120" style="display:inline-block;max-width:120px;" />
      </a>
    </div>
    <!-- Card -->
    <div style="background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <div style="padding:32px 28px;">
        ${content}
      </div>
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 16px;">
      <p style="margin:0;color:#b8a09b;font-size:12px;letter-spacing:0.3px;">
        &copy; ${new Date().getFullYear()} Hairland.cz &mdash; Prémiové vlasy k prodloužení
      </p>
      <p style="margin:8px 0 0;color:#b8a09b;font-size:12px;">
        <a href="tel:+420608553103" style="color:#a96d6c;text-decoration:none;">+420 608 553 103</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:info@hairland.cz" style="color:#a96d6c;text-decoration:none;">info@hairland.cz</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.hairland.cz" style="color:#a96d6c;text-decoration:none;">hairland.cz</a>
      </p>
      ${unsubLine}
    </div>
  </div>
</body>
</html>`;
}

// --- Translations ---

type Lang = "cs" | "uk" | "ru";

const registrationT: Record<Lang, {
  subject: string;
  greeting: (name: string) => string;
  body1: string;
  body2: string;
  body3: string;
  detailsLabel: string;
  typeLabel: string;
  nameLabel: string;
  emailLabel: string;
}> = {
  cs: {
    subject: "Vaše registrace byla přijata — Hairland",
    greeting: (name) => `Dobrý den, ${name},`,
    body1: "Děkujeme za vaši registraci na Hairland.cz.",
    body2: "Vaše žádost o B2B přístup byla přijata a čeká na schválení.",
    body3: "Jakmile bude váš účet schválen, budeme vás informovat emailem.",
    detailsLabel: "Údaje registrace:",
    typeLabel: "Typ",
    nameLabel: "Název",
    emailLabel: "Email",
  },
  uk: {
    subject: "Вашу реєстрацію прийнято — Hairland",
    greeting: (name) => `Вітаємо, ${name},`,
    body1: "Дякуємо за реєстрацію на Hairland.cz.",
    body2: "Ваш запит на B2B доступ прийнято та очікує схвалення.",
    body3: "Щойно ваш обліковий запис буде схвалено, ми повідомимо вас електронною поштою.",
    detailsLabel: "Дані реєстрації:",
    typeLabel: "Тип",
    nameLabel: "Назва",
    emailLabel: "Email",
  },
  ru: {
    subject: "Ваша регистрация принята — Hairland",
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: "Благодарим за регистрацию на Hairland.cz.",
    body2: "Ваш запрос на B2B доступ принят и ожидает одобрения.",
    body3: "Как только ваш аккаунт будет одобрен, мы уведомим вас по электронной почте.",
    detailsLabel: "Данные регистрации:",
    typeLabel: "Тип",
    nameLabel: "Название",
    emailLabel: "Email",
  },
};

const approvalT: Record<Lang, {
  subject: string;
  greeting: string;
  body1: string;
  body2: string;
  cta: string;
  footer: string;
}> = {
  cs: {
    subject: "Váš B2B účet byl schválen — Hairland",
    greeting: "Dobrý den,",
    body1: "S radostí vám oznamujeme, že váš B2B účet na Hairland.cz byl schválen.",
    body2: "Nyní se můžete přihlásit a začít objednávat prémiové vlasy za velkoobchodní ceny.",
    cta: "Přihlásit se",
    footer: "Pokud máte jakékoliv dotazy, kontaktujte nás na info@hairland.cz.",
  },
  uk: {
    subject: "Ваш B2B обліковий запис схвалено — Hairland",
    greeting: "Вітаємо,",
    body1: "З радістю повідомляємо, що ваш B2B обліковий запис на Hairland.cz схвалено.",
    body2: "Тепер ви можете увійти та почати замовляти преміальне волосся за оптовими цінами.",
    cta: "Увійти",
    footer: "Якщо маєте запитання, зверніться до нас на info@hairland.cz.",
  },
  ru: {
    subject: "Ваш B2B аккаунт одобрен — Hairland",
    greeting: "Здравствуйте,",
    body1: "С радостью сообщаем, что ваш B2B аккаунт на Hairland.cz одобрен.",
    body2: "Теперь вы можете войти и начать заказывать премиальные волосы по оптовым ценам.",
    cta: "Войти",
    footer: "Если у вас есть вопросы, свяжитесь с нами по адресу info@hairland.cz.",
  },
};

const inquiryT: Record<Lang, {
  subject: string;
  consultSubject: string;
  greeting: (name: string) => string;
  body1: string;
  consultBody1: string;
  body2: string;
  itemsHeader: string;
  promoLabel: string;
  responseTime: string;
  productHeader: string;
  detailsHeader: string;
}> = {
  cs: {
    subject: "Vaše objednávka byla přijata — Hairland",
    consultSubject: "Váš dotaz byl přijat — Hairland",
    greeting: (name) => `Dobrý den, ${name},`,
    body1: "Děkujeme za vaši objednávku na Hairland.cz.",
    consultBody1: "Děkujeme za váš dotaz na Hairland.cz.",
    body2: "Přijali jsme ji a brzy se vám ozveme.",
    itemsHeader: "Objednané položky:",
    promoLabel: "Slevový kód:",
    responseTime: "Obvykle odpovídáme do 24 hodin.",
    productHeader: "Produkt",
    detailsHeader: "Detaily",
  },
  uk: {
    subject: "Ваше замовлення прийнято — Hairland",
    consultSubject: "Ваше запитання прийнято — Hairland",
    greeting: (name) => `Вітаємо, ${name},`,
    body1: "Дякуємо за ваше замовлення на Hairland.cz.",
    consultBody1: "Дякуємо за ваше запитання на Hairland.cz.",
    body2: "Ми його прийняли і незабаром зв'яжемося з вами.",
    itemsHeader: "Замовлені товари:",
    promoLabel: "Промокод:",
    responseTime: "Зазвичай відповідаємо протягом 24 годин.",
    productHeader: "Продукт",
    detailsHeader: "Деталі",
  },
  ru: {
    subject: "Ваш заказ принят — Hairland",
    consultSubject: "Ваш вопрос принят — Hairland",
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: "Благодарим за ваш заказ на Hairland.cz.",
    consultBody1: "Благодарим за ваш вопрос на Hairland.cz.",
    body2: "Мы его приняли и скоро свяжемся с вами.",
    itemsHeader: "Заказанные товары:",
    promoLabel: "Промокод:",
    responseTime: "Обычно отвечаем в течение 24 часов.",
    productHeader: "Продукт",
    detailsHeader: "Детали",
  },
};

function resolveLang(lang: string): Lang {
  if (lang === "uk" || lang === "ru") return lang;
  return "cs";
}

// --- Escape HTML ---

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Email generators ---

export function getRegistrationConfirmationEmail(
  lang: string,
  data: { contactPerson: string; salonName: string; email: string; type: string }
): { subject: string; text: string; html: string } {
  const t = registrationT[resolveLang(lang)];

  const text = [
    t.greeting(data.contactPerson),
    "",
    t.body1,
    t.body2,
    "",
    `${t.detailsLabel}`,
    `${t.typeLabel}: ${data.type}`,
    `${t.nameLabel}: ${data.salonName}`,
    `${t.emailLabel}: ${data.email}`,
    "",
    t.body3,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.contactPerson))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(t.body1)}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
      <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 8px;">${esc(t.detailsLabel)}</p>
      <p style="color:#3a2c2a;font-size:14px;line-height:1.8;margin:0;">
        ${esc(t.typeLabel)}: ${esc(data.type)}<br>
        ${esc(t.nameLabel)}: ${esc(data.salonName)}<br>
        ${esc(t.emailLabel)}: ${esc(data.email)}
      </p>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.body3)}</p>
  `;

  return { subject: t.subject, text, html: hairlandEmailTemplate(content) };
}

export function getApprovalConfirmationEmail(
  lang: string,
  data: { name?: string; salonName: string }
): { subject: string; text: string; html: string } {
  const t = approvalT[resolveLang(lang)];

  const text = [
    t.greeting,
    "",
    t.body1,
    t.body2,
    "",
    `${t.cta}: https://www.hairland.cz/login`,
    "",
    t.footer,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting)}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(t.body1)}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://www.hairland.cz/login"
         style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
        ${esc(t.cta)}
      </a>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject, text, html: hairlandEmailTemplate(content) };
}

export function getInquiryConfirmationEmail(
  lang: string,
  data: {
    name: string;
    items: Array<{ productName: string; lengthCm: number; color: string; quantity: number; unit: string; sku?: string }>;
    promoCode?: string;
    inquiryId: string;
  }
): { subject: string; text: string; html: string } {
  const t = inquiryT[resolveLang(lang)];
  const hasItems = data.items.length > 0;

  const itemLines = hasItems
    ? data.items
        .map((i) => `  - ${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.quantity}${i.unit}${i.sku ? ` (${i.sku})` : ""}`)
        .join("\n")
    : "";

  const text = [
    t.greeting(data.name),
    "",
    hasItems ? t.body1 : t.consultBody1,
    t.body2,
    "",
    hasItems ? t.itemsHeader : null,
    hasItems ? itemLines : null,
    data.promoCode ? `\n${t.promoLabel} ${data.promoCode}` : null,
    "",
    t.responseTime,
  ].filter(Boolean).join("\n");

  const itemRows = hasItems
    ? data.items
        .map(
          (i) => `<tr style="border-bottom:1px solid #ead9cf;">
        <td style="padding:8px 0;color:#3a2c2a;font-size:14px;">${esc(i.productName)}${i.sku ? ` <span style="color:#9c8682;font-family:monospace;font-size:12px;">(${esc(i.sku)})</span>` : ""}</td>
        <td style="padding:8px 0;color:#9c8682;font-size:14px;text-align:right;">${i.lengthCm} cm, ${esc(i.color)}, ${i.quantity}${esc(i.unit)}</td>
      </tr>`
        )
        .join("")
    : "";

  const promoHtml = data.promoCode
    ? `<p style="color:#3a2c2a;font-size:14px;margin:12px 0 0;"><strong>${esc(t.promoLabel)}</strong> ${esc(data.promoCode)}</p>`
    : "";

  const itemsSection = hasItems
    ? `<div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
      <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 8px;">${esc(t.itemsHeader)}</p>
      <table style="width:100%;border-collapse:collapse;margin:4px 0;">
        <tr style="border-bottom:2px solid #ead9cf;">
          <th style="padding:6px 0;color:#9c8682;font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:0.5px;">${esc(t.productHeader)}</th>
          <th style="padding:6px 0;color:#9c8682;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">${esc(t.detailsHeader)}</th>
        </tr>
        ${itemRows}
      </table>
      ${promoHtml}
    </div>`
    : "";

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.name))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(hasItems ? t.body1 : t.consultBody1)}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    ${itemsSection}
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.responseTime)}</p>
  `;

  return { subject: hasItems ? t.subject : t.consultSubject, text, html: hairlandEmailTemplate(content) };
}

// --- Order Confirmed Email (admin confirms an order) ---

const orderConfirmedT: Record<Lang, {
  subject: (orderNumber: string) => string;
  greeting: (name: string) => string;
  body1: (orderNumber: string) => string;
  body2: string;
  itemsHeader: string;
  productHeader: string;
  detailsHeader: string;
  totalLabel: string;
  promoLabel: string;
  discountLabel: string;
  cta: string;
  footer: string;
}> = {
  cs: {
    subject: (n) => `Objednávka #${n} potvrzena — Hairland`,
    greeting: (name) => `Dobrý den, ${name},`,
    body1: (n) => `Vaše objednávka #${n} byla potvrzena.`,
    body2: "Objednávku připravíme a budeme vás informovat o odeslání.",
    itemsHeader: "Položky objednávky:",
    productHeader: "Produkt",
    detailsHeader: "Detaily",
    totalLabel: "Celkem",
    promoLabel: "Slevový kód:",
    discountLabel: "Sleva:",
    cta: "Sledovat objednávku",
    footer: "Máte dotaz? Odpovězte na tento email.",
  },
  uk: {
    subject: (n) => `Замовлення #${n} підтверджено — Hairland`,
    greeting: (name) => `Вітаємо, ${name},`,
    body1: (n) => `Ваше замовлення #${n} підтверджено.`,
    body2: "Ми підготуємо замовлення та повідомимо вас про відправку.",
    itemsHeader: "Товари замовлення:",
    productHeader: "Продукт",
    detailsHeader: "Деталі",
    totalLabel: "Всього",
    promoLabel: "Промокод:",
    discountLabel: "Знижка:",
    cta: "Відстежити замовлення",
    footer: "Маєте запитання? Відповідайте на цей лист.",
  },
  ru: {
    subject: (n) => `Заказ #${n} подтверждён — Hairland`,
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: (n) => `Ваш заказ #${n} подтверждён.`,
    body2: "Мы подготовим заказ и сообщим вам об отправке.",
    itemsHeader: "Товары заказа:",
    productHeader: "Продукт",
    detailsHeader: "Детали",
    totalLabel: "Итого",
    promoLabel: "Промокод:",
    discountLabel: "Скидка:",
    cta: "Отследить заказ",
    footer: "Есть вопрос? Ответьте на это письмо.",
  },
};

export function getOrderConfirmedEmail(
  lang: string,
  data: {
    salonName: string;
    orderNumber: string;
    items: Array<{ productName: string; lengthCm: number; color: string; grams: number; pieces: number }>;
    estimatedTotal: number;
    promoCode?: string;
    promoDiscount?: number;
  }
): { subject: string; text: string; html: string } {
  const t = orderConfirmedT[resolveLang(lang)];

  const itemLines = data.items
    .map((i) => `  - ${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.grams > 0 ? `${i.grams}g` : `${i.pieces} ks`}`)
    .join("\n");

  const totalCzk = (data.estimatedTotal / 100).toLocaleString("cs-CZ");

  const text = [
    t.greeting(data.salonName),
    "",
    t.body1(data.orderNumber),
    "",
    t.itemsHeader,
    itemLines,
    data.promoCode ? `\n${t.promoLabel} ${data.promoCode}` : null,
    data.promoDiscount ? `${t.discountLabel} -${(data.promoDiscount / 100).toLocaleString("cs-CZ")} Kč` : null,
    "",
    `${t.totalLabel}: ${totalCzk} Kč`,
    "",
    t.body2,
    "",
    t.footer,
  ].filter(Boolean).join("\n");

  const itemRows = data.items
    .map(
      (i) => `<tr style="border-bottom:1px solid #ead9cf;">
        <td style="padding:8px 0;color:#3a2c2a;font-size:14px;">${esc(i.productName)}</td>
        <td style="padding:8px 0;color:#9c8682;font-size:14px;text-align:right;">${i.lengthCm} cm, ${esc(i.color)}, ${i.grams > 0 ? `${i.grams}g` : `${i.pieces} ks`}</td>
      </tr>`
    )
    .join("");

  const promoHtml = data.promoCode
    ? `<p style="color:#3a2c2a;font-size:14px;margin:12px 0 0;"><strong>${esc(t.promoLabel)}</strong> ${esc(data.promoCode)}</p>`
    : "";
  const discountHtml = data.promoDiscount
    ? `<p style="color:#c98b88;font-size:14px;margin:4px 0 0;">${esc(t.discountLabel)} -${(data.promoDiscount / 100).toLocaleString("cs-CZ")} Kč</p>`
    : "";

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.salonName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body1(data.orderNumber))}</p>
    <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
      <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 8px;">${esc(t.itemsHeader)}</p>
      <table style="width:100%;border-collapse:collapse;margin:4px 0;">
        <tr style="border-bottom:2px solid #ead9cf;">
          <th style="padding:6px 0;color:#9c8682;font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:0.5px;">${esc(t.productHeader)}</th>
          <th style="padding:6px 0;color:#9c8682;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">${esc(t.detailsHeader)}</th>
        </tr>
        ${itemRows}
      </table>
      ${promoHtml}
      ${discountHtml}
      <p style="color:#3a2c2a;font-size:16px;font-weight:700;margin:16px 0 0;text-align:right;">${esc(t.totalLabel)}: ${totalCzk} Kč</p>
    </div>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://www.hairland.cz/salon/orders"
         style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
        ${esc(t.cta)}
      </a>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject(data.orderNumber), text, html: hairlandEmailTemplate(content) };
}

// --- Order Shipped Email ---

const b2bOrderShippedT: Record<Lang, {
  subject: (orderNumber: string) => string;
  greeting: (name: string) => string;
  body1: (orderNumber: string) => string;
  body2: string;
  cta: string;
  footer: string;
}> = {
  cs: {
    subject: (n) => `Objednávka #${n} je na cestě — Hairland`,
    greeting: (name) => `Dobrý den, ${name},`,
    body1: (n) => `Vaše objednávka #${n} byla odeslána.`,
    body2: "Osobní odběr Praha — doručíme do 24 hodin.",
    cta: "Přihlásit se do portálu",
    footer: "Máte dotaz? Odpovězte na tento email.",
  },
  uk: {
    subject: (n) => `Замовлення #${n} в дорозі — Hairland`,
    greeting: (name) => `Вітаємо, ${name},`,
    body1: (n) => `Ваше замовлення #${n} відправлено.`,
    body2: "Особистий забір Прага — доставимо протягом 24 годин.",
    cta: "Увійти до порталу",
    footer: "Маєте запитання? Відповідайте на цей лист.",
  },
  ru: {
    subject: (n) => `Заказ #${n} в пути — Hairland`,
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: (n) => `Ваш заказ #${n} отправлен.`,
    body2: "Самовывоз Прага — доставим в течение 24 часов.",
    cta: "Войти в портал",
    footer: "Есть вопрос? Ответьте на это письмо.",
  },
};

export function getB2BOrderShippedEmail(
  lang: string,
  data: {
    salonName: string;
    orderNumber: string;
    estimatedTotal: number;
  }
): { subject: string; text: string; html: string } {
  const t = b2bOrderShippedT[resolveLang(lang)];

  const totalCzk = (data.estimatedTotal / 100).toLocaleString("cs-CZ");

  const text = [
    t.greeting(data.salonName),
    "",
    t.body1(data.orderNumber),
    t.body2,
    "",
    `${totalCzk} Kč`,
    "",
    `${t.cta}: https://www.hairland.cz/salon/orders`,
    "",
    t.footer,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.salonName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(t.body1(data.orderNumber))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;text-align:center;">
      <p style="color:#3a2c2a;font-size:20px;font-weight:700;margin:0;">${totalCzk} Kč</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://www.hairland.cz/salon/orders"
         style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
        ${esc(t.cta)}
      </a>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject(data.orderNumber), text, html: hairlandEmailTemplate(content) };
}

// --- Order Follow-up Email (3 days after completion) ---

const orderFollowUpT: Record<Lang, {
  subject: (orderNumber: string) => string;
  greeting: (name: string) => string;
  body1: (orderNumber: string) => string;
  body2: string;
  cta: string;
  footer: string;
}> = {
  cs: {
    subject: (n) => `Jak jste spokojeni s objednávkou #${n}? — Hairland`,
    greeting: (name) => `Dobrý den, ${name},`,
    body1: (n) => `Vaše objednávka #${n} byla dokončena před několika dny.`,
    body2: "Budeme rádi za vaši zpětnou vazbu.",
    cta: "Napsat recenzi",
    footer: "Máte dotaz? Odpovězte na tento email.",
  },
  uk: {
    subject: (n) => `Як вам замовлення #${n}? — Hairland`,
    greeting: (name) => `Вітаємо, ${name},`,
    body1: (n) => `Ваше замовлення #${n} було виконано кілька днів тому.`,
    body2: "Ми будемо раді вашому відгуку.",
    cta: "Написати відгук",
    footer: "Маєте запитання? Відповідайте на цей лист.",
  },
  ru: {
    subject: (n) => `Как вам заказ #${n}? — Hairland`,
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: (n) => `Ваш заказ #${n} был выполнен несколько дней назад.`,
    body2: "Будем рады вашему отзыву.",
    cta: "Написать отзыв",
    footer: "Есть вопрос? Ответьте на это письмо.",
  },
};

export function getOrderFollowUpEmail(
  lang: string,
  data: {
    salonName: string;
    orderNumber: string;
  }
): { subject: string; text: string; html: string } {
  const t = orderFollowUpT[resolveLang(lang)];

  const text = [
    t.greeting(data.salonName),
    "",
    t.body1(data.orderNumber),
    t.body2,
    "",
    `${t.cta}: https://www.hairland.cz/recenze`,
    "",
    t.footer,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.salonName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(t.body1(data.orderNumber))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://www.hairland.cz/recenze"
         style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
        ${esc(t.cta)}
      </a>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject(data.orderNumber), text, html: hairlandEmailTemplate(content) };
}

// --- Inquiry Follow-up Email (3 days after inquiry completion) ---

const inquiryFollowUpT: Record<Lang, {
  subject: string;
  greeting: (name: string) => string;
  body1: string;
  body2: string;
  cta: string;
  footer: string;
}> = {
  cs: {
    subject: "Děkujeme za váš zájem — Hairland",
    greeting: (name) => `Dobrý den, ${name},`,
    body1: "Děkujeme za váš zájem o naše prémiové vlasy.",
    body2: "Chcete se na něco zeptat? Jsme tu pro vás.",
    cta: "Kontaktovat nás",
    footer: "Odpovězte na tento email nebo nás navštivte na hairland.cz.",
  },
  uk: {
    subject: "Дякуємо за ваш інтерес — Hairland",
    greeting: (name) => `Вітаємо, ${name},`,
    body1: "Дякуємо за ваш інтерес до нашого преміального волосся.",
    body2: "Хочете щось запитати? Ми тут для вас.",
    cta: "Зв'язатися з нами",
    footer: "Відповідайте на цей лист або відвідайте hairland.cz.",
  },
  ru: {
    subject: "Благодарим за ваш интерес — Hairland",
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: "Благодарим за ваш интерес к нашим премиальным волосам.",
    body2: "Хотите что-то спросить? Мы здесь для вас.",
    cta: "Связаться с нами",
    footer: "Ответьте на это письмо или посетите hairland.cz.",
  },
};

export function getInquiryFollowUpEmail(
  lang: string,
  data: {
    name: string;
    inquiryItems: string;
  }
): { subject: string; text: string; html: string } {
  const t = inquiryFollowUpT[resolveLang(lang)];

  const text = [
    t.greeting(data.name),
    "",
    t.body1,
    "",
    data.inquiryItems,
    "",
    t.body2,
    "",
    `${t.cta}: https://www.hairland.cz/contact`,
    "",
    t.footer,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.name))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body1)}</p>
    ${data.inquiryItems ? `
    <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
      <p style="color:#3a2c2a;font-size:14px;line-height:1.6;margin:0;">${esc(data.inquiryItems)}</p>
    </div>` : ""}
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://www.hairland.cz/kontakt"
         style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
        ${esc(t.cta)}
      </a>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject, text, html: hairlandEmailTemplate(content) };
}

// --- Order Confirmation Email (Email 1 — legally required) ---
// Replaces getRetailOrderConfirmationEmail with legal blocks, B2B variant, PDF attachments
// Source: 5-Emailove-sablony.md

const orderConfirmT: Record<Lang, {
  subject: (orderNumber: string) => string;
  subjectTransfer: (orderNumber: string) => string;
  greeting: (name: string) => string;
  intro: string;
  bodyTransfer: string;
  bodyCard: string;
  bodyCash: string;
  itemsHeader: string;
  shippingLabel: string;
  discountLabel: string;
  totalLabel: string;
  bankAccountLabel: string;
  vsLabel: string;
  amountLabel: string;
  // Legal blocks
  importantTitle: string;
  importantText: string;
  importantPhotoTip: string;
  hygieneTitle: string;
  hygieneTextRetail: string;
  hygieneTextB2B: string;
  withdrawalTitle: string;
  withdrawalText1: string;
  withdrawalText2: string;
  withdrawalText3: string;
  careTitle: string;
  careText1: string;
  careLinkLabel: string;
  careTip1: string;
  careTip2: string;
  careTip3: string;
  attachmentsTitle: string;
  attachment1: string;
  attachment2: string;
  attachment3: string;
  closing: string;
  signature: string;
}> = {
  cs: {
    subject: (n) => `Potvrzení objednávky ${n} — Hairland`,
    subjectTransfer: (n) => `Objednávka ${n} — čeká na platbu — Hairland`,
    greeting: (name) => `Dobrý den, ${name},`,
    intro: "děkujeme za objednávku. Níže najdete její shrnutí a všechny dokumenty, které k ní patří.",
    bodyTransfer: "Čekáme na Vaši platbu",
    bodyCard: "Vaše platba byla přijata. Připravíme objednávku a dáme Vám vědět.",
    bodyCash: "Děkujeme za nákup.",
    itemsHeader: "Položky objednávky:",
    shippingLabel: "Doprava",
    discountLabel: "Sleva",
    totalLabel: "Celkem",
    bankAccountLabel: "Bankovní účet",
    vsLabel: "Variabilní symbol",
    amountLabel: "Částka k úhradě",
    importantTitle: "DŮLEŽITÉ PŘED PŘEVZETÍM",
    importantText: "Vlasy jsou přírodní produkt. Než je necháte nasadit, prohlédněte si je a zkontrolujte odstín, délku, gramáž a strukturu. Cokoli vám nesedí, řešte prosím před aplikací — po nasazení už odstín ani délku reklamovat nelze.",
    importantPhotoTip: "Doporučujeme si rozbalené vlasy vyfotit na denním světle. Trvá to deset vteřin a v případném sporu je to nejlepší důkaz.",
    hygieneTitle: "HYGIENICKÉ UZAVŘENÍ OBALU",
    hygieneTextRetail: "Vlasy dodáváme v uzavřeném obalu s hygienickou pečetí. Jde o zboží, které z hygienických důvodů nelze vrátit po porušení obalu. Porušením pečeti zaniká právo odstoupit od smlouvy do 14 dnů (§ 1837 písm. g občanského zákoníku). Chcete-li si vlasy prohlédnout bez ztráty tohoto práva, prohlížejte je přes neporušený průhledný obal nebo na vzorku.",
    hygieneTextB2B: "Vlasy dodáváme v uzavřeném obalu s hygienickou pečetí. Zboží prosím zkontrolujte co nejdříve po převzetí — zjevné vady je nutné vytknout do 3 pracovních dnů od převzetí a vždy před aplikací.",
    withdrawalTitle: "PRÁVO ODSTOUPIT OD SMLOUVY DO 14 DNŮ",
    withdrawalText1: "Máte právo odstoupit od této smlouvy bez udání důvodu do 14 dnů ode dne převzetí zboží. Pro odstoupení nám napište na info@hairland.cz nebo použijte přiložený vzorový formulář.",
    withdrawalText2: "Odstoupíte-li, vrátíme vám kupní cenu do 14 dnů od vrácení zboží, stejným způsobem, jakým jste platili. Náklady na vrácení zboží nesete vy.",
    withdrawalText3: "Vrátit lze pouze vlasy nepoužité, neaplikované a neupravené, s neporušenou hygienickou pečetí.",
    careTitle: "PÉČE O VLASY",
    careText1: "Prodloužené vlasy nerostou z vaší hlavy, a proto nedostávají kožní maz, který chrání vaše vlastní vlasy. Bez výživy zvenčí nevyhnutelně vyschnou a začnou se lámat — a to během několika týdnů. Přiložený návod na péči si prosím přečtěte ještě před aplikací.",
    careLinkLabel: "Je také na",
    careTip1: "maska nebo olej po celé délce, ne na spoje",
    careTip2: "žehlička maximálně na 180 °C a vždy s termoochranou",
    careTip3: "rozčesávat dvakrát denně speciálním kartáčem",
    attachmentsTitle: "PŘÍLOHY",
    attachment1: "Reklamační řád",
    attachment2: "Návod na péči o prodloužené vlasy",
    attachment3: "Vzorový formulář pro odstoupení od smlouvy",
    closing: "Kdyby cokoli, ozvěte se.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103\nAltro servis group s.r.o., IČO 23673389",
  },
  uk: {
    subject: (n) => `Підтвердження замовлення ${n} — Hairland`,
    subjectTransfer: (n) => `Замовлення ${n} — очікуємо оплату — Hairland`,
    greeting: (name) => `Вітаємо, ${name},`,
    intro: "дякуємо за замовлення. Нижче ви знайдете його підсумок та всі документи, які до нього належать.",
    bodyTransfer: "Очікуємо Вашу оплату",
    bodyCard: "Вашу оплату прийнято. Ми підготуємо замовлення та повідомимо Вас.",
    bodyCash: "Дякуємо за покупку.",
    itemsHeader: "Товари замовлення:",
    shippingLabel: "Доставка",
    discountLabel: "Знижка",
    totalLabel: "Всього",
    bankAccountLabel: "Банківський рахунок",
    vsLabel: "Варіабельний символ",
    amountLabel: "Сума до оплати",
    importantTitle: "ВАЖЛИВО ПЕРЕД ОТРИМАННЯМ",
    importantText: "Волосся — натуральний продукт. Перш ніж його наносити, огляньте його та перевірте відтінок, довжину, вагу та структуру. Якщо щось не підходить, вирішуйте до застосування — після нанесення відтінок і довжину рекламувати не можна.",
    importantPhotoTip: "Рекомендуємо сфотографувати розпаковане волосся при денному світлі. Це займе десять секунд і є найкращим доказом у разі спору.",
    hygieneTitle: "ГІГІЄНІЧНЕ ЗАКРИТТЯ УПАКОВКИ",
    hygieneTextRetail: "Волосся постачається в закритій упаковці з гігієнічною пломбою. Це товар, який з гігієнічних причин не можна повернути після порушення упаковки. Порушення пломби позбавляє права на відмову від договору протягом 14 днів (§ 1837 písm. g občanského zákoníku). Якщо хочете оглянути волосся без втрати цього права, робіть це через непорушену прозору упаковку або на зразку.",
    hygieneTextB2B: "Волосся постачається в закритій упаковці з гігієнічною пломбою. Будь ласка, перевірте товар якомога швидше після отримання — явні дефекти необхідно повідомити протягом 3 робочих днів від отримання та завжди до застосування.",
    withdrawalTitle: "ПРАВО ВІДМОВИТИСЯ ВІД ДОГОВОРУ ПРОТЯГОМ 14 ДНІВ",
    withdrawalText1: "Ви маєте право відмовитися від цього договору без пояснення причин протягом 14 днів від дня отримання товару. Для відмови напишіть нам на info@hairland.cz або скористайтеся доданим зразком формуляра.",
    withdrawalText2: "Якщо ви відмовитеся, ми повернемо вам ціну покупки протягом 14 днів від повернення товару, тим же способом, яким ви платили. Витрати на повернення товару несете ви.",
    withdrawalText3: "Повернути можна тільки невикористане, ненанесене та необроблене волосся з непорушеною гігієнічною пломбою.",
    careTitle: "ДОГЛЯД ЗА ВОЛОССЯМ",
    careText1: "Подовжене волосся не росте з вашої голови, тому не отримує шкірний жир, який захищає ваше власне волосся. Без зовнішнього живлення воно неминуче висохне і почне ламатися — протягом кількох тижнів. Будь ласка, прочитайте доданий посібник з догляду ще до застосування.",
    careLinkLabel: "Також на",
    careTip1: "маска або олія по всій довжині, не на з'єднання",
    careTip2: "праска максимально 180 °C і завжди з термозахистом",
    careTip3: "розчісувати двічі на день спеціальною щіткою",
    attachmentsTitle: "ДОДАТКИ",
    attachment1: "Правила рекламації",
    attachment2: "Посібник з догляду за подовженим волоссям",
    attachment3: "Зразок формуляра для відмови від договору",
    closing: "Якщо виникнуть питання, напишіть нам.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103\nAltro servis group s.r.o., IČO 23673389",
  },
  ru: {
    subject: (n) => `Подтверждение заказа ${n} — Hairland`,
    subjectTransfer: (n) => `Заказ ${n} — ожидаем оплату — Hairland`,
    greeting: (name) => `Здравствуйте, ${name},`,
    intro: "благодарим за заказ. Ниже вы найдёте его резюме и все документы, которые к нему относятся.",
    bodyTransfer: "Ожидаем Вашу оплату",
    bodyCard: "Ваша оплата принята. Мы подготовим заказ и сообщим Вам.",
    bodyCash: "Благодарим за покупку.",
    itemsHeader: "Товары заказа:",
    shippingLabel: "Доставка",
    discountLabel: "Скидка",
    totalLabel: "Итого",
    bankAccountLabel: "Банковский счёт",
    vsLabel: "Вариабельный символ",
    amountLabel: "Сумма к оплате",
    importantTitle: "ВАЖНО ПЕРЕД ПОЛУЧЕНИЕМ",
    importantText: "Волосы — натуральный продукт. Прежде чем их наносить, осмотрите их и проверьте оттенок, длину, вес и структуру. Если что-то не подходит, решайте до применения — после нанесения оттенок и длину рекламировать нельзя.",
    importantPhotoTip: "Рекомендуем сфотографировать распакованные волосы при дневном свете. Это займёт десять секунд и станет лучшим доказательством в случае спора.",
    hygieneTitle: "ГИГИЕНИЧЕСКАЯ ЗАПЕЧАТКА УПАКОВКИ",
    hygieneTextRetail: "Волосы поставляются в закрытой упаковке с гигиенической пломбой. Это товар, который по гигиеническим причинам нельзя вернуть после вскрытия упаковки. Вскрытие пломбы лишает права на отказ от договора в течение 14 дней (§ 1837 písm. g občanského zákoníku). Если хотите осмотреть волосы без потери этого права, делайте это через ненарушенную прозрачную упаковку или на образце.",
    hygieneTextB2B: "Волосы поставляются в закрытой упаковке с гигиенической пломбой. Пожалуйста, проверьте товар как можно скорее после получения — явные дефекты необходимо сообщить в течение 3 рабочих дней с момента получения и всегда до применения.",
    withdrawalTitle: "ПРАВО ОТКАЗАТЬСЯ ОТ ДОГОВОРА В ТЕЧЕНИЕ 14 ДНЕЙ",
    withdrawalText1: "Вы имеете право отказаться от этого договора без объяснения причин в течение 14 дней со дня получения товара. Для отказа напишите нам на info@hairland.cz или воспользуйтесь приложённым образцом формуляра.",
    withdrawalText2: "Если вы откажетесь, мы вернём вам покупную цену в течение 14 дней с момента возврата товара, тем же способом, которым вы платили. Расходы по возврату товара несёте вы.",
    withdrawalText3: "Вернуть можно только неиспользованные, ненанесённые и необработанные волосы с ненарушенной гигиенической пломбой.",
    careTitle: "УХОД ЗА ВОЛОСАМИ",
    careText1: "Наращённые волосы не растут из вашей головы, поэтому не получают кожный жир, который защищает ваши собственные волосы. Без внешнего питания они неизбежно высохнут и начнут ломаться — в течение нескольких недель. Пожалуйста, прочитайте приложённую инструкцию по уходу ещё до применения.",
    careLinkLabel: "Также на",
    careTip1: "маска или масло по всей длине, не на соединения",
    careTip2: "утюжок максимум 180 °C и всегда с термозащитой",
    careTip3: "расчёсывать дважды в день специальной щёткой",
    attachmentsTitle: "ПРИЛОЖЕНИЯ",
    attachment1: "Правила рекламации",
    attachment2: "Инструкция по уходу за наращёнными волосами",
    attachment3: "Образец формуляра для отказа от договора",
    closing: "Если возникнут вопросы, напишите нам.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103\nAltro servis group s.r.o., IČO 23673389",
  },
};

export function getOrderConfirmationEmail(
  lang: string,
  data: {
    customerName: string;
    orderNumber: string;
    items: Array<{ productName: string; lengthCm: number; color: string; grams: number; pieces: number; lineTotal: number }>;
    subtotal: number;
    shippingCost: number;
    promoCode?: string;
    promoDiscount?: number;
    totalAmount: number;
    paymentMethod: string;
    bankAccount?: string;
    variableSymbol?: string;
    isB2B: boolean;
    isPersonalSale?: boolean;
    careGuideUrl: string;
  }
): { subject: string; text: string; html: string } {
  const t = orderConfirmT[resolveLang(lang)];
  const isTransfer = data.paymentMethod === "TRANSFER";
  const isCash = data.paymentMethod === "CASH";
  const showHygiene = !data.isPersonalSale;
  const fmtCzk = (h: number) => (h / 100).toLocaleString("cs-CZ");

  const paymentLine = isTransfer ? t.bodyTransfer : isCash ? t.bodyCash : t.bodyCard;

  const itemLines = data.items
    .map((i) => `  - ${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.grams > 0 ? `${i.grams}g` : `${i.pieces} ks`} — ${fmtCzk(i.lineTotal)} Kč`)
    .join("\n");

  // Plain text version
  const textParts: (string | null)[] = [
    t.greeting(data.customerName),
    "",
    t.intro,
    "",
    `${t.itemsHeader}`,
    itemLines,
    data.promoCode ? `${t.discountLabel}: ${data.promoCode} -${fmtCzk(data.promoDiscount ?? 0)} Kč` : null,
    data.shippingCost > 0 ? `${t.shippingLabel}: ${fmtCzk(data.shippingCost)} Kč` : null,
    `${t.totalLabel}: ${fmtCzk(data.totalAmount)} Kč`,
    "",
    isTransfer && data.bankAccount ? `${t.bankAccountLabel}: ${data.bankAccount}` : null,
    isTransfer && data.variableSymbol ? `${t.vsLabel}: ${data.variableSymbol}` : null,
    isTransfer ? "" : null,
    !isTransfer ? paymentLine : null,
    "",
    "──────────────────────────────",
    "",
    t.importantTitle,
    "",
    t.importantText,
    "",
    t.importantPhotoTip,
    "",
    ...(showHygiene ? [
    "──────────────────────────────",
    "",
    t.hygieneTitle,
    "",
    data.isB2B ? t.hygieneTextB2B : t.hygieneTextRetail,
    ] : []),
  ];

  if (!data.isB2B) {
    textParts.push(
      "",
      "──────────────────────────────",
      "",
      t.withdrawalTitle,
      "",
      t.withdrawalText1,
      "",
      t.withdrawalText2,
      "",
      t.withdrawalText3,
    );
  }

  textParts.push(
    "",
    "──────────────────────────────",
    "",
    t.careTitle,
    "",
    t.careText1,
    `${t.careLinkLabel} ${data.careGuideUrl}`,
    "",
    `• ${t.careTip1}`,
    `• ${t.careTip2}`,
    `• ${t.careTip3}`,
    "",
    "──────────────────────────────",
    "",
    t.attachmentsTitle,
    `• ${t.attachment1}`,
    `• ${t.attachment2}`,
    ...(!data.isB2B ? [`• ${t.attachment3}`] : []),
    "",
    t.closing,
    "",
    t.signature,
  );

  const text = textParts.filter((s) => s !== null).join("\n");

  // HTML version
  const itemRows = data.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;color:#3a2c2a;font-size:14px;border-bottom:1px solid #f0e8e3;">${esc(i.productName)}<br><span style="color:#9c8682;font-size:12px;">${i.lengthCm} cm · ${esc(i.color)} · ${i.grams > 0 ? `${i.grams}g` : `${i.pieces} ks`}</span></td>
        <td style="padding:10px 0;color:#3a2c2a;font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid #f0e8e3;white-space:nowrap;">${fmtCzk(i.lineTotal)} Kč</td>
      </tr>`
    )
    .join("");

  const discountRow = data.promoCode && data.promoDiscount
    ? `<tr><td style="padding:4px 0;color:#c98b88;font-size:13px;">${esc(t.discountLabel)} (${esc(data.promoCode)})</td><td style="text-align:right;color:#c98b88;font-size:13px;padding:4px 0;">-${fmtCzk(data.promoDiscount)} Kč</td></tr>`
    : "";

  const transferHtml = isTransfer && data.bankAccount
    ? `<div style="background:#fff8f0;border:2px solid #e8c97a;border-radius:12px;padding:20px;margin:24px 0 0;text-align:center;">
        <p style="color:#b8860b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">${esc(t.bodyTransfer)}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#9c8682;font-size:13px;text-align:left;">${esc(t.bankAccountLabel)}</td><td style="padding:6px 0;color:#3a2c2a;font-size:15px;text-align:right;font-weight:700;font-family:monospace;">${esc(data.bankAccount)}</td></tr>
          <tr><td style="padding:6px 0;color:#9c8682;font-size:13px;text-align:left;">${esc(t.vsLabel)}</td><td style="padding:6px 0;color:#3a2c2a;font-size:15px;text-align:right;font-weight:700;font-family:monospace;">${esc(data.variableSymbol ?? "")}</td></tr>
          <tr><td colspan="2" style="padding:12px 0 0;"><div style="border-top:1px solid #e8c97a;padding-top:12px;text-align:center;"><span style="color:#9c8682;font-size:12px;">${esc(t.amountLabel)}</span><br><span style="color:#3a2c2a;font-size:24px;font-weight:800;">${fmtCzk(data.totalAmount)} Kč</span></div></td></tr>
        </table>
      </div>`
    : "";

  const sectionDivider = '<div style="border-top:2px solid #ead9cf;margin:28px 0 24px;"></div>';
  const sectionTitle = (title: string) => `<p style="color:#3a2c2a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">${esc(title)}</p>`;
  const sectionText = (txt: string) => `<p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0 0 8px;">${esc(txt)}</p>`;

  const withdrawalHtml = data.isB2B ? "" : `
    ${sectionDivider}
    ${sectionTitle(t.withdrawalTitle)}
    ${sectionText(t.withdrawalText1)}
    ${sectionText(t.withdrawalText2)}
    <p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0;font-weight:600;">${esc(t.withdrawalText3)}</p>`;

  const attachWithdrawalHtml = data.isB2B ? "" : `<li style="margin-bottom:2px;">${esc(t.attachment3)}</li>`;

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 4px;">${esc(t.greeting(data.customerName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 24px;">${esc(t.intro)}</p>

    <!-- Items -->
    <table style="width:100%;border-collapse:collapse;">
      ${itemRows}
    </table>

    <!-- Totals -->
    <div style="margin-top:12px;padding-top:12px;border-top:2px solid #3a2c2a;">
      <table style="width:100%;">
        ${discountRow}
        ${data.shippingCost > 0 ? `<tr><td style="color:#9c8682;font-size:13px;padding:4px 0;">${esc(t.shippingLabel)}</td><td style="text-align:right;color:#3a2c2a;font-size:13px;padding:4px 0;">${fmtCzk(data.shippingCost)} Kč</td></tr>` : ""}
        <tr><td style="color:#3a2c2a;font-size:16px;font-weight:800;padding:8px 0 0;">${esc(t.totalLabel)}</td><td style="text-align:right;color:#3a2c2a;font-size:16px;font-weight:800;padding:8px 0 0;">${fmtCzk(data.totalAmount)} Kč</td></tr>
      </table>
    </div>

    ${transferHtml}
    ${!isTransfer ? `<p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:20px 0 0;">${esc(paymentLine)}</p>` : ""}

    <!-- Legal blocks -->
    ${sectionDivider}
    ${sectionTitle(t.importantTitle)}
    ${sectionText(t.importantText)}
    ${sectionText(t.importantPhotoTip)}

    ${showHygiene ? `${sectionDivider}
    ${sectionTitle(t.hygieneTitle)}
    ${sectionText(data.isB2B ? t.hygieneTextB2B : t.hygieneTextRetail)}` : ""}

    ${withdrawalHtml}

    ${sectionDivider}
    ${sectionTitle(t.careTitle)}
    ${sectionText(t.careText1)}
    <p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0 0 8px;">${esc(t.careLinkLabel)} <a href="${data.careGuideUrl}" style="color:#a96d6c;text-decoration:underline;">${esc(data.careGuideUrl)}</a></p>
    <ul style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:8px 0 0;padding-left:20px;">
      <li style="margin-bottom:4px;">${esc(t.careTip1)}</li>
      <li style="margin-bottom:4px;">${esc(t.careTip2)}</li>
      <li style="margin-bottom:4px;">${esc(t.careTip3)}</li>
    </ul>

    ${sectionDivider}
    <p style="color:#9c8682;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">${esc(t.attachmentsTitle)}</p>
    <ul style="color:#9c8682;font-size:13px;line-height:1.8;margin:0;padding-left:20px;">
      <li style="margin-bottom:2px;">${esc(t.attachment1)}</li>
      <li style="margin-bottom:2px;">${esc(t.attachment2)}</li>
      ${attachWithdrawalHtml}
    </ul>

    <p style="color:#3a2c2a;font-size:14px;line-height:1.6;margin:24px 0 4px;">${esc(t.closing)}</p>
    <p style="color:#9c8682;font-size:13px;line-height:1.6;margin:0;white-space:pre-line;">${esc(t.signature)}</p>
  `;

  const subject = isTransfer ? t.subjectTransfer(data.orderNumber) : t.subject(data.orderNumber);
  return { subject, text, html: hairlandEmailTemplate(content) };
}

// --- Retail Order Shipped Email ---

// --- Email 2: Order Shipped (enhanced with care blocks) ---

const shippedT: Record<Lang, {
  subject: (orderNumber: string) => string;
  greeting: (name: string) => string;
  body1: (orderNumber: string) => string;
  bodyPacketa: (pointName: string) => string;
  bodyPersonal: string;
  bodyPost: string;
  trackingLabel: string;
  photoNote: string;
  receiveTitle: string;
  receive1: string;
  receive2: string;
  receive3: string;
  mistakesTitle: string;
  mistakesIntro: string;
  mistakesLabel: string;
  mistake1: string;
  mistake2: string;
  mistake3: string;
  mistake4: string;
  mistake5: string;
  careLink: string;
  closing: string;
  signature: string;
}> = {
  cs: {
    subject: (n) => `Vlasy jsou na cestě — objednávka ${n}`,
    greeting: (name) => `Dobrý den, ${name},`,
    body1: (n) => `vaše vlasy jsou na cestě. ${n}`,
    bodyPacketa: (p) => `Zásilku si vyzvednete na pobočce Zásilkovny: ${p}.`,
    bodyPersonal: "Doručíme Vám objednávku osobně v Praze do 24 hodin.",
    bodyPost: "Zásilka byla odeslána.",
    trackingLabel: "Sledování zásilky",
    photoNote: "V příloze posíláme fotografii zakázky, jak vypadala před zabalením — uschovejte si ji, je to doklad o stavu zboží při expedici.",
    receiveTitle: "AŽ ZÁSILKU PŘEVEZMETE",
    receive1: "Zkontrolujte obal a hygienickou pečeť. Je-li obal poškozený, napište nám do 2 pracovních dnů s fotografií.",
    receive2: "Prohlédněte si vlasy přes neporušený obal. Odstín, délka, gramáž, struktura. Pokud něco nesedí, ozvěte se PŘED tím, než pečeť porušíte a vlasy necháte nasadit.",
    receive3: "Před aplikací vlasy umyjte jemným šamponem a nechte uschnout volně na vzduchu.",
    mistakesTitle: "NEŽ SI JE NECHÁTE NASADIT",
    mistakesIntro: "Přečtěte si prosím přiložený návod na péči. Tohle je ta část, kterou většina lidí přeskočí — a pak se po dvou měsících diví, proč se vlasy kroutí a lámou.",
    mistakesLabel: "Nejčastější chyby, které vlasy zničí:",
    mistake1: "žehlení bez termoochrany nebo nad 180 °C",
    mistake2: "žádná maska ani olej — vlasy vyschnou během několika týdnů",
    mistake3: "odbarvování a melírování — nevratné poškození během jediné návštěvy",
    mistake4: "spaní s rozpuštěnými nebo mokrými vlasy",
    mistake5: "nanášení masky a oleje přímo na spoje",
    careLink: "Kompletní návod:",
    closing: "",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
  uk: {
    subject: (n) => `Волосся в дорозі — замовлення ${n}`,
    greeting: (name) => `Вітаємо, ${name},`,
    body1: (n) => `Ваше волосся вже в дорозі. ${n}`,
    bodyPacketa: (p) => `Забрати посилку можна у відділенні Zásilkovna: ${p}.`,
    bodyPersonal: "Ми доставимо замовлення особисто в Празі протягом 24 годин.",
    bodyPost: "Посилку відправлено.",
    trackingLabel: "Відстеження",
    photoNote: "У додатку надсилаємо фотографію замовлення, як воно виглядало перед пакуванням — збережіть її, це підтвердження стану товару при відправленні.",
    receiveTitle: "КОЛИ ОТРИМАЄТЕ ПОСИЛКУ",
    receive1: "Перевірте упаковку та гігієнічну пломбу. Якщо упаковка пошкоджена, напишіть нам протягом 2 робочих днів з фотографією.",
    receive2: "Огляньте волосся через непошкоджену упаковку. Відтінок, довжина, грамаж, структура. Якщо щось не збігається, зверніться ДО того, як порушите пломбу і волосся нанесуть.",
    receive3: "Перед нанесенням помийте волосся мʼяким шампунем і дайте висохнути вільно на повітрі.",
    mistakesTitle: "ПЕРШ НІЖ ЇХ НАНЕСУТЬ",
    mistakesIntro: "Прочитайте, будь ласка, доданий посібник з догляду. Це та частина, яку більшість людей пропускає — а потім через два місяці дивується, чому волосся крутиться і ламається.",
    mistakesLabel: "Найпоширеніші помилки, які знищують волосся:",
    mistake1: "прасування без термозахисту або вище 180 °C",
    mistake2: "жодної маски чи олії — волосся висохне за кілька тижнів",
    mistake3: "знебарвлення та мелірування — незворотне пошкодження за один візит",
    mistake4: "сон з розпущеним або мокрим волоссям",
    mistake5: "нанесення маски та олії безпосередньо на зʼєднання",
    careLink: "Повний посібник:",
    closing: "",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
  ru: {
    subject: (n) => `Волосы в пути — заказ ${n}`,
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: (n) => `Ваши волосы уже в пути. ${n}`,
    bodyPacketa: (p) => `Забрать посылку можно в отделении Zásilkovna: ${p}.`,
    bodyPersonal: "Мы доставим заказ лично в Праге в течение 24 часов.",
    bodyPost: "Посылка отправлена.",
    trackingLabel: "Отслеживание",
    photoNote: "В приложении отправляем фотографию заказа, как он выглядел перед упаковкой — сохраните её, это подтверждение состояния товара при отправке.",
    receiveTitle: "КОГДА ПОЛУЧИТЕ ПОСЫЛКУ",
    receive1: "Проверьте упаковку и гигиеническую пломбу. Если упаковка повреждена, напишите нам в течение 2 рабочих дней с фотографией.",
    receive2: "Осмотрите волосы через неповреждённую упаковку. Оттенок, длина, граммаж, структура. Если что-то не совпадает, свяжитесь ДО того, как нарушите пломбу и волосы нанесут.",
    receive3: "Перед нанесением вымойте волосы мягким шампунем и дайте высохнуть свободно на воздухе.",
    mistakesTitle: "ПРЕЖДЕ ЧЕМ ИХ НАНЕСУТ",
    mistakesIntro: "Прочитайте, пожалуйста, приложенную инструкцию по уходу. Это та часть, которую большинство людей пропускает — а потом через два месяца удивляется, почему волосы крутятся и ломаются.",
    mistakesLabel: "Самые частые ошибки, которые уничтожают волосы:",
    mistake1: "выпрямление без термозащиты или выше 180 °C",
    mistake2: "никакой маски или масла — волосы высохнут за несколько недель",
    mistake3: "осветление и мелирование — необратимое повреждение за один визит",
    mistake4: "сон с распущенными или мокрыми волосами",
    mistake5: "нанесение маски и масла прямо на соединения",
    careLink: "Полная инструкция:",
    closing: "",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
};

export function getOrderShippedEmail(
  lang: string,
  data: {
    customerName: string;
    orderNumber: string;
    shippingMethod: string;
    trackingId?: string;
    packetaPointName?: string;
    careGuideUrl: string;
  }
): { subject: string; text: string; html: string } {
  const t = shippedT[resolveLang(lang)];

  const shippingDetail =
    data.shippingMethod === "PACKETA" ? t.bodyPacketa(data.packetaPointName || "Zásilkovna") :
    data.shippingMethod === "PERSONAL_DELIVERY" || data.shippingMethod === "PICKUP" ? t.bodyPersonal :
    t.bodyPost;

  const trackingUrl = data.shippingMethod === "PACKETA" && data.trackingId
    ? `https://tracking.packeta.com/cs/?id=${data.trackingId}`
    : undefined;

  const text = [
    t.greeting(data.customerName),
    "",
    t.body1(data.trackingId || ""),
    shippingDetail,
    "",
    t.photoNote,
    "",
    "──────────────────────────────",
    "",
    t.receiveTitle,
    "",
    `1. ${t.receive1}`,
    "",
    `2. ${t.receive2}`,
    "",
    `3. ${t.receive3}`,
    "",
    "──────────────────────────────",
    "",
    t.mistakesTitle,
    "",
    t.mistakesIntro,
    "",
    `${t.mistakesLabel}`,
    `• ${t.mistake1}`,
    `• ${t.mistake2}`,
    `• ${t.mistake3}`,
    `• ${t.mistake4}`,
    `• ${t.mistake5}`,
    "",
    `${t.careLink} ${data.careGuideUrl}`,
    "",
    "──────────────────────────────",
    "",
    t.signature,
  ].join("\n");

  const trackingHtml = trackingUrl
    ? `<div style="text-align:center;margin:28px 0;">
        <a href="${trackingUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
          ${esc(t.trackingLabel)}
        </a>
      </div>`
    : data.trackingId
      ? `<div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;text-align:center;">
          <p style="color:#9c8682;font-size:12px;margin:0 0 4px;">${esc(t.trackingLabel)}</p>
          <p style="color:#3a2c2a;font-size:16px;font-weight:700;font-family:monospace;margin:0;">${esc(data.trackingId)}</p>
        </div>`
      : "";

  const sectionDivider = '<div style="border-top:2px solid #ead9cf;margin:28px 0 24px;"></div>';
  const sectionTitle = (title: string) => `<p style="color:#3a2c2a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">${esc(title)}</p>`;

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 4px;">${esc(t.greeting(data.customerName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body1(data.trackingId || ""))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(shippingDetail)}</p>
    ${trackingHtml}
    <p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0 0 8px;">${esc(t.photoNote)}</p>

    ${sectionDivider}
    ${sectionTitle(t.receiveTitle)}
    <ol style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0;padding-left:20px;">
      <li style="margin-bottom:12px;">${esc(t.receive1)}</li>
      <li style="margin-bottom:12px;">${esc(t.receive2)}</li>
      <li style="margin-bottom:12px;">${esc(t.receive3)}</li>
    </ol>

    ${sectionDivider}
    ${sectionTitle(t.mistakesTitle)}
    <p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0 0 12px;">${esc(t.mistakesIntro)}</p>
    <p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0 0 8px;font-weight:600;">${esc(t.mistakesLabel)}</p>
    <ul style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0;padding-left:20px;">
      <li style="margin-bottom:6px;">${esc(t.mistake1)}</li>
      <li style="margin-bottom:6px;">${esc(t.mistake2)}</li>
      <li style="margin-bottom:6px;">${esc(t.mistake3)}</li>
      <li style="margin-bottom:6px;">${esc(t.mistake4)}</li>
      <li style="margin-bottom:6px;">${esc(t.mistake5)}</li>
    </ul>
    <p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:12px 0 0;">${esc(t.careLink)} <a href="${data.careGuideUrl}" style="color:#a96d6c;text-decoration:underline;">${esc(data.careGuideUrl)}</a></p>

    <p style="color:#9c8682;font-size:13px;line-height:1.6;margin:24px 0 0;white-space:pre-line;">${esc(t.signature)}</p>
  `;

  return { subject: t.subject(data.orderNumber), text, html: hairlandEmailTemplate(content) };
}

// --- Email 3: Day 7 Care Email ---

const day7T: Record<Lang, {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  nutritionTitle: string;
  nutritionBody: string;
  nutritionVitamins: string;
  heatTitle: string;
  heatBody: string;
  brushTitle: string;
  brushBody: string;
  closing: string;
  signature: string;
}> = {
  cs: {
    subject: "Jak se vlasům daří?",
    greeting: (name) => `Dobrý den, ${name},`,
    intro: "je to týden. Jak jste s vlasy spokojená?\n\nPrvních pár týdnů rozhoduje o tom, jak dlouho vám vydrží, tak jen krátce připomeneme tři věci, na kterých to stojí:",
    nutritionTitle: "VÝŽIVA",
    nutritionBody: "Maska jednou až dvakrát týdně, olej na konečky denně před spaním. Vždy od poloviny délek dolů, nikdy ne na spoje — mastné složky je rozvolňují a vlasy pak padají.",
    nutritionVitamins: "Vitaminy v tabletách na prodloužené vlasy nepůsobí. Ty rostou z hlavy, tyhle ne. Funguje jen výživa nanášená přímo na vlasy — maska, olej, vlasová ampule.",
    heatTitle: "TEPLO",
    heatBody: "Maximálně 180 °C a vždy s termoochranou. Nad touhle hranicí se vlas nevratně poškodí a nedorůstá, takže to z něj už nikdy nezmizí. Jeden plynulý tah, ne přejíždění stejného místa.",
    brushTitle: "ČESÁNÍ",
    brushBody: "Dvakrát denně, speciálním kartáčem, odspodu nahoru. Nikdy na mokré vlasy. Před spaním spleťte do volného copu.",
    closing: "Něco vás trápí? Napište, rádi poradíme.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
  uk: {
    subject: "Як справи з волоссям?",
    greeting: (name) => `Вітаємо, ${name},`,
    intro: "минув тиждень. Як Вам з волоссям?\n\nПерші кілька тижнів визначають, як довго воно Вам прослужить, тож коротко нагадаємо три речі, на яких це тримається:",
    nutritionTitle: "ЖИВЛЕННЯ",
    nutritionBody: "Маска раз-два на тиждень, олія на кінчики щодня перед сном. Завжди від середини довжини донизу, ніколи на зʼєднання — жирні компоненти їх розхитують і волосся випадає.",
    nutritionVitamins: "Вітаміни в таблетках на нарощене волосся не діють. Воно росте з голови, а це ні. Працює тільки живлення, нанесене безпосередньо на волосся — маска, олія, ампула.",
    heatTitle: "ТЕПЛО",
    heatBody: "Максимум 180 °C і завжди з термозахистом. Вище цієї межі волос незворотно пошкоджується і не відростає, тож це вже ніколи не зникне. Один плавний рух, не проводити по одному місцю кілька разів.",
    brushTitle: "РОЗЧІСУВАННЯ",
    brushBody: "Двічі на день, спеціальною щіткою, знизу вгору. Ніколи мокре волосся. Перед сном заплетіть у вільну косу.",
    closing: "Щось турбує? Напишіть, залюбки порадимо.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
  ru: {
    subject: "Как дела с волосами?",
    greeting: (name) => `Здравствуйте, ${name},`,
    intro: "прошла неделя. Как Вам с волосами?\n\nПервые несколько недель решают, как долго они Вам прослужат, так что коротко напомним три вещи, на которых это держится:",
    nutritionTitle: "ПИТАНИЕ",
    nutritionBody: "Маска раз-два в неделю, масло на кончики ежедневно перед сном. Всегда от середины длины вниз, никогда на соединения — жирные компоненты их расшатывают и волосы выпадают.",
    nutritionVitamins: "Витамины в таблетках на наращённые волосы не действуют. Они растут из головы, а эти нет. Работает только питание, нанесённое непосредственно на волосы — маска, масло, ампула.",
    heatTitle: "ТЕПЛО",
    heatBody: "Максимум 180 °C и всегда с термозащитой. Выше этой границы волос необратимо повреждается и не отрастает, так что это уже никогда не исчезнет. Одно плавное движение, не проводить по одному месту несколько раз.",
    brushTitle: "РАСЧЁСЫВАНИЕ",
    brushBody: "Дважды в день, специальной щёткой, снизу вверх. Никогда мокрые волосы. Перед сном заплетите в свободную косу.",
    closing: "Что-то беспокоит? Напишите, с радостью подскажем.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
};

export function getDay7CareEmail(
  lang: string,
  data: { customerName: string }
): { subject: string; text: string; html: string } {
  const t = day7T[resolveLang(lang)];

  const text = [
    t.greeting(data.customerName),
    "",
    t.intro,
    "",
    t.nutritionTitle,
    t.nutritionBody,
    "",
    t.nutritionVitamins,
    "",
    t.heatTitle,
    t.heatBody,
    "",
    t.brushTitle,
    t.brushBody,
    "",
    t.closing,
    "",
    t.signature,
  ].join("\n");

  const sectionDivider = '<div style="border-top:2px solid #ead9cf;margin:28px 0 24px;"></div>';
  const sectionTitle = (title: string) => `<p style="color:#3a2c2a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">${esc(title)}</p>`;
  const sectionText = (txt: string) => `<p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0 0 8px;">${esc(txt)}</p>`;

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 4px;">${esc(t.greeting(data.customerName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 24px;white-space:pre-line;">${esc(t.intro)}</p>

    ${sectionDivider}
    ${sectionTitle(t.nutritionTitle)}
    ${sectionText(t.nutritionBody)}
    ${sectionText(t.nutritionVitamins)}

    ${sectionDivider}
    ${sectionTitle(t.heatTitle)}
    ${sectionText(t.heatBody)}

    ${sectionDivider}
    ${sectionTitle(t.brushTitle)}
    ${sectionText(t.brushBody)}

    <p style="color:#3a2c2a;font-size:14px;line-height:1.6;margin:24px 0 4px;">${esc(t.closing)}</p>
    <p style="color:#9c8682;font-size:13px;line-height:1.6;margin:0;white-space:pre-line;">${esc(t.signature)}</p>
  `;

  return { subject: t.subject, text, html: hairlandEmailTemplate(content) };
}

// --- Email 4: Day 30 Check Email ---

const day30T: Record<Lang, {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  hairdresserTitle: string;
  hairdresserBody: string;
  hairdresserUrgent: string;
  conditionTitle: string;
  conditionBody: string;
  conditionContact: string;
  signature: string;
}> = {
  cs: {
    subject: "Měsíc s prodlouženými vlasy — je všechno v pořádku?",
    greeting: (name) => `Dobrý den, ${name},`,
    intro: "uplynul měsíc. Ozýváme se s krátkou kontrolou.",
    hairdresserTitle: "JE ČAS NA PRVNÍ NÁVŠTĚVU KADEŘNICE",
    hairdresserBody: "Po čtyřech až šesti týdnech se hodí nechat zkontrolovat spoje. Vlastní vlasy rostou a spoje putují od hlavy pryč — čím níž jsou, tím spíš se v nich vlasy zamotají a začnou se trhat.",
    hairdresserUrgent: "Zajděte na kontrolu dřív, pokud cítíte tahání nebo píchání, nebo se u kořínků začaly tvořit uzlíky.",
    conditionTitle: "JAK SE VLASŮM DAŘÍ?",
    conditionBody: "Pokud něco není v pořádku — vlasy se kroutí, matní, zacuchávají — napište nám co nejdřív. Většina těchhle věcí jde ještě zachránit intenzivní regenerací, když se podchytí včas.",
    conditionContact: "Ozvěte se na info@hairland.cz, klidně i s fotkou.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
  uk: {
    subject: "Місяць з нарощеним волоссям — все гаразд?",
    greeting: (name) => `Вітаємо, ${name},`,
    intro: "минув місяць. Пишемо з короткою перевіркою.",
    hairdresserTitle: "ЧАС НА ПЕРШИЙ ВІЗИТ ДО ПЕРУКАРЯ",
    hairdresserBody: "Через чотири-шість тижнів варто перевірити зʼєднання. Власне волосся росте і зʼєднання рухаються від голови — чим нижче вони, тим більше волосся в них заплутується і починає рватися.",
    hairdresserUrgent: "Зверніться на перевірку раніше, якщо відчуваєте натяг або поколювання, або біля коренів почали утворюватися вузлики.",
    conditionTitle: "ЯК СПРАВИ З ВОЛОССЯМ?",
    conditionBody: "Якщо щось не так — волосся крутиться, тьмяніє, заплутується — напишіть нам якнайшвидше. Більшість цих речей ще можна врятувати інтенсивною регенерацією, якщо вчасно підхопити.",
    conditionContact: "Пишіть на info@hairland.cz, можна і з фоткою.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
  ru: {
    subject: "Месяц с наращёнными волосами — всё в порядке?",
    greeting: (name) => `Здравствуйте, ${name},`,
    intro: "прошёл месяц. Пишем с короткой проверкой.",
    hairdresserTitle: "ВРЕМЯ ПЕРВОГО ВИЗИТА К ПАРИКМАХЕРУ",
    hairdresserBody: "Через четыре-шесть недель стоит проверить соединения. Собственные волосы растут и соединения смещаются от головы — чем ниже они, тем больше волосы в них запутываются и начинают рваться.",
    hairdresserUrgent: "Обратитесь на проверку раньше, если чувствуете натяжение или покалывание, или у корней начали образовываться узелки.",
    conditionTitle: "КАК ДЕЛА С ВОЛОСАМИ?",
    conditionBody: "Если что-то не так — волосы крутятся, тускнеют, запутываются — напишите нам как можно скорее. Большинство этих вещей ещё можно спасти интенсивной регенерацией, если вовремя подхватить.",
    conditionContact: "Пишите на info@hairland.cz, можно и с фоткой.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
};

export function getDay30CheckEmail(
  lang: string,
  data: { customerName: string }
): { subject: string; text: string; html: string } {
  const t = day30T[resolveLang(lang)];

  const text = [
    t.greeting(data.customerName),
    "",
    t.intro,
    "",
    t.hairdresserTitle,
    "",
    t.hairdresserBody,
    "",
    t.hairdresserUrgent,
    "",
    t.conditionTitle,
    "",
    t.conditionBody,
    "",
    t.conditionContact,
    "",
    t.signature,
  ].join("\n");

  const sectionDivider = '<div style="border-top:2px solid #ead9cf;margin:28px 0 24px;"></div>';
  const sectionTitle = (title: string) => `<p style="color:#3a2c2a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">${esc(title)}</p>`;
  const sectionText = (txt: string) => `<p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0 0 8px;">${esc(txt)}</p>`;

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 4px;">${esc(t.greeting(data.customerName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 24px;">${esc(t.intro)}</p>

    ${sectionDivider}
    ${sectionTitle(t.hairdresserTitle)}
    ${sectionText(t.hairdresserBody)}
    ${sectionText(t.hairdresserUrgent)}

    ${sectionDivider}
    ${sectionTitle(t.conditionTitle)}
    ${sectionText(t.conditionBody)}
    <p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0;">${esc(t.conditionContact)}</p>

    <p style="color:#9c8682;font-size:13px;line-height:1.6;margin:24px 0 0;white-space:pre-line;">${esc(t.signature)}</p>
  `;

  return { subject: t.subject, text, html: hairlandEmailTemplate(content) };
}

// --- Email 5: Extension Reminder Email ---

const extensionReminderT: Record<Lang, {
  subject: string;
  greeting: (name: string) => string;
  introGeneral: string;
  keratinTitle: string;
  tapeTitle: string;
  microTitle: string;
  tresTitle: string;
  warningBody: string;
  removalTitle: string;
  removalBody: string;
  refillTitle: string;
  refillBody: string;
  signature: string;
}> = {
  cs: {
    subject: "Blíží se čas na přetažení",
    greeting: (name) => `Dobrý den, ${name},`,
    introGeneral: "podle metody, kterou máte, se blíží doba na přetažení.",
    keratinTitle: "KERATIN — přetažení po 3 až 4 měsících",
    tapeTitle: "TAPE-IN — přetažení po 6 až 8 týdnech",
    microTitle: "MICRO RING — přetažení po 2 až 3 měsících",
    tresTitle: "TRES — přetažení po 6 až 8 týdnech",
    warningBody: "Odkládání přetažení je jedna z nejčastějších příčin poškození. Spoje sjedou nízko, vlasy se kolem nich zamotají a při česání začnou trhat vlastní vlasy.",
    removalTitle: "SNÍMÁNÍ VŽDY U KADEŘNICE",
    removalBody: "Prameny nikdy nevytrhávejte ani neodstraňujte doma. Nesprávné sejmutí poškodí prodloužené i vlastní vlasy.",
    refillTitle: "POTŘEBUJETE DOPLNIT NEBO NOVOU SADU?",
    refillBody: "Ozvěte se, rádi pro vás vybereme vlasy, které sednou k těm stávajícím. Můžete si je opět osobně prohlédnout, než se rozhodnete.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
  uk: {
    subject: "Наближається час перетяжки",
    greeting: (name) => `Вітаємо, ${name},`,
    introGeneral: "залежно від методу, який у Вас, наближається час перетяжки.",
    keratinTitle: "КЕРАТИН — перетяжка через 3-4 місяці",
    tapeTitle: "TAPE-IN — перетяжка через 6-8 тижнів",
    microTitle: "MICRO RING — перетяжка через 2-3 місяці",
    tresTitle: "TRES — перетяжка через 6-8 тижнів",
    warningBody: "Відкладання перетяжки — одна з найчастіших причин пошкодження. Зʼєднання зʼїжджають низько, волосся навколо них заплутується і при розчісуванні починає рвати власне волосся.",
    removalTitle: "ЗНЯТТЯ ТІЛЬКИ У ПЕРУКАРЯ",
    removalBody: "Пасма ніколи не виривайте і не знімайте вдома. Неправильне зняття пошкодить нарощене і власне волосся.",
    refillTitle: "ПОТРІБНО ДОПОВНИТИ АБО НОВУ ПАРТІЮ?",
    refillBody: "Напишіть, залюбки підберемо волосся, яке пасуватиме до наявного. Можете знову особисто оглянути перед рішенням.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
  ru: {
    subject: "Приближается время перетяжки",
    greeting: (name) => `Здравствуйте, ${name},`,
    introGeneral: "в зависимости от метода, который у Вас, приближается время перетяжки.",
    keratinTitle: "КЕРАТИН — перетяжка через 3-4 месяца",
    tapeTitle: "TAPE-IN — перетяжка через 6-8 недель",
    microTitle: "MICRO RING — перетяжка через 2-3 месяца",
    tresTitle: "TRES — перетяжка через 6-8 недель",
    warningBody: "Откладывание перетяжки — одна из самых частых причин повреждения. Соединения сползают низко, волосы вокруг них запутываются и при расчёсывании начинают рвать собственные волосы.",
    removalTitle: "СНЯТИЕ ТОЛЬКО У ПАРИКМАХЕРА",
    removalBody: "Пряди никогда не вырывайте и не снимайте дома. Неправильное снятие повредит наращённые и собственные волосы.",
    refillTitle: "НУЖНО ДОПОЛНИТЬ ИЛИ НОВЫЙ КОМПЛЕКТ?",
    refillBody: "Напишите, с радостью подберём волосы, которые подойдут к имеющимся. Можете снова лично осмотреть перед решением.",
    signature: "Hairland\ninfo@hairland.cz | +420 608 553 103",
  },
};

export function getExtensionReminderEmail(
  lang: string,
  data: {
    customerName: string;
    method?: "keratin" | "tape" | "micro" | "tres";
  }
): { subject: string; text: string; html: string } {
  const t = extensionReminderT[resolveLang(lang)];

  const methodTitleMap: Record<string, string> = {
    keratin: t.keratinTitle,
    tape: t.tapeTitle,
    micro: t.microTitle,
    tres: t.tresTitle,
  };
  const methodTitle = data.method ? methodTitleMap[data.method] : undefined;

  const text = [
    t.greeting(data.customerName),
    "",
    t.introGeneral,
    "",
    ...(methodTitle ? [methodTitle, ""] : []),
    t.warningBody,
    "",
    t.removalTitle,
    "",
    t.removalBody,
    "",
    t.refillTitle,
    "",
    t.refillBody,
    "",
    t.signature,
  ].join("\n");

  const sectionDivider = '<div style="border-top:2px solid #ead9cf;margin:28px 0 24px;"></div>';
  const sectionTitle = (title: string) => `<p style="color:#3a2c2a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">${esc(title)}</p>`;
  const sectionText = (txt: string) => `<p style="color:#3a2c2a;font-size:14px;line-height:1.7;margin:0 0 8px;">${esc(txt)}</p>`;

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 4px;">${esc(t.greeting(data.customerName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 24px;">${esc(t.introGeneral)}</p>

    ${methodTitle ? `${sectionDivider}${sectionTitle(methodTitle)}` : ""}

    ${sectionDivider}
    ${sectionText(t.warningBody)}

    ${sectionDivider}
    ${sectionTitle(t.removalTitle)}
    ${sectionText(t.removalBody)}

    ${sectionDivider}
    ${sectionTitle(t.refillTitle)}
    ${sectionText(t.refillBody)}

    <p style="color:#9c8682;font-size:13px;line-height:1.6;margin:24px 0 0;white-space:pre-line;">${esc(t.signature)}</p>
  `;

  return { subject: t.subject, text, html: hairlandEmailTemplate(content) };
}

// --- Retail Payment Received Email ---

const retailPaymentT: Record<Lang, {
  subject: (orderNumber: string) => string;
  greeting: (name: string) => string;
  body1: (orderNumber: string) => string;
  body2: string;
  totalLabel: string;
  footer: string;
}> = {
  cs: {
    subject: (n) => `Platba přijata — objednávka #${n} — Hairland`,
    greeting: (name) => `Dobrý den, ${name},`,
    body1: (n) => `Vaše platba za objednávku #${n} byla přijata.`,
    body2: "Objednávku nyní připravujeme a budeme Vás informovat o odeslání.",
    totalLabel: "Zaplaceno",
    footer: "Máte dotaz? Odpovězte na tento email.",
  },
  uk: {
    subject: (n) => `Оплату прийнято — замовлення #${n} — Hairland`,
    greeting: (name) => `Вітаємо, ${name},`,
    body1: (n) => `Вашу оплату за замовлення #${n} прийнято.`,
    body2: "Ми готуємо замовлення та повідомимо Вас про відправку.",
    totalLabel: "Сплачено",
    footer: "Маєте запитання? Відповідайте на цей лист.",
  },
  ru: {
    subject: (n) => `Оплата принята — заказ #${n} — Hairland`,
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: (n) => `Ваша оплата за заказ #${n} принята.`,
    body2: "Мы готовим заказ и сообщим Вам об отправке.",
    totalLabel: "Оплачено",
    footer: "Есть вопрос? Ответьте на это письмо.",
  },
};

export function getRetailPaymentReceivedEmail(
  lang: string,
  data: {
    customerName: string;
    orderNumber: string;
    totalAmount: number;
  }
): { subject: string; text: string; html: string } {
  const t = retailPaymentT[resolveLang(lang)];
  const fmtCzk = (h: number) => (h / 100).toLocaleString("cs-CZ");

  const text = [
    t.greeting(data.customerName),
    "",
    t.body1(data.orderNumber),
    t.body2,
    "",
    `${t.totalLabel}: ${fmtCzk(data.totalAmount)} Kč`,
    "",
    t.footer,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.customerName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(t.body1(data.orderNumber))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;text-align:center;">
      <p style="color:#9c8682;font-size:12px;margin:0 0 4px;">${esc(t.totalLabel)}</p>
      <p style="color:#3a2c2a;font-size:20px;font-weight:700;margin:0;">${fmtCzk(data.totalAmount)} Kč</p>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject(data.orderNumber), text, html: hairlandEmailTemplate(content) };
}
