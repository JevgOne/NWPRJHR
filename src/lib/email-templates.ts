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
      <a href="https://hairland.cz" style="text-decoration:none;">
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
        <a href="https://hairland.cz" style="color:#a96d6c;text-decoration:none;">hairland.cz</a>
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
    subject: "Vaše poptávka byla přijata — Hairland",
    consultSubject: "Váš dotaz byl přijat — Hairland",
    greeting: (name) => `Dobrý den, ${name},`,
    body1: "Děkujeme za vaši poptávku na Hairland.cz.",
    consultBody1: "Děkujeme za váš dotaz na Hairland.cz.",
    body2: "Přijali jsme ji a brzy se vám ozveme.",
    itemsHeader: "Poptávané položky:",
    promoLabel: "Slevový kód:",
    responseTime: "Obvykle odpovídáme do 24 hodin.",
    productHeader: "Produkt",
    detailsHeader: "Detaily",
  },
  uk: {
    subject: "Ваш запит прийнято — Hairland",
    consultSubject: "Ваше запитання прийнято — Hairland",
    greeting: (name) => `Вітаємо, ${name},`,
    body1: "Дякуємо за ваш запит на Hairland.cz.",
    consultBody1: "Дякуємо за ваше запитання на Hairland.cz.",
    body2: "Ми його прийняли і незабаром зв'яжемося з вами.",
    itemsHeader: "Запитувані товари:",
    promoLabel: "Промокод:",
    responseTime: "Зазвичай відповідаємо протягом 24 годин.",
    productHeader: "Продукт",
    detailsHeader: "Деталі",
  },
  ru: {
    subject: "Ваш запрос принят — Hairland",
    consultSubject: "Ваш вопрос принят — Hairland",
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: "Благодарим за ваш запрос на Hairland.cz.",
    consultBody1: "Благодарим за ваш вопрос на Hairland.cz.",
    body2: "Мы его приняли и скоро свяжемся с вами.",
    itemsHeader: "Запрашиваемые товары:",
    promoLabel: "Промокод:",
    responseTime: "Обычно отвечаем в течение 24 часов.",
    productHeader: "Продукт",
    detailsHeader: "Детали",
  },
};

const spinT: Record<Lang, {
  subject: (discount: number) => string;
  congrats: string;
  body: (discount: number) => string;
  codeLabel: string;
  validUntil: string;
  usage: string;
}> = {
  cs: {
    subject: (d) => `Vaše výhra z Kolečka štěstí — ${d}% sleva!`,
    congrats: "Gratulujeme!",
    body: (d) => `Vyhráli jste ${d}% slevu na nákup vlasů.`,
    codeLabel: "Váš slevový kód",
    validUntil: "Platný do:",
    usage: "Použijte kód při objednávce nebo poptávce na",
  },
  uk: {
    subject: (d) => `Ваш виграш у Колесі фортуни — ${d}% знижка!`,
    congrats: "Вітаємо!",
    body: (d) => `Ви виграли ${d}% знижку на купівлю волосся.`,
    codeLabel: "Ваш промокод",
    validUntil: "Дійсний до:",
    usage: "Використайте код при замовленні або запиті на",
  },
  ru: {
    subject: (d) => `Ваш выигрыш в Колесе фортуны — ${d}% скидка!`,
    congrats: "Поздравляем!",
    body: (d) => `Вы выиграли ${d}% скидку на покупку волос.`,
    codeLabel: "Ваш промокод",
    validUntil: "Действителен до:",
    usage: "Используйте код при заказе или запросе на",
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
    `${t.cta}: https://hairland.cz/login`,
    "",
    t.footer,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting)}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(t.body1)}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://hairland.cz/login"
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

export function getSpinWinEmail(
  lang: string,
  data: { discount: number; code: string; validTo: string }
): { subject: string; text: string; html: string } {
  const t = spinT[resolveLang(lang)];

  const text = [
    t.congrats,
    "",
    t.body(data.discount),
    "",
    `${t.codeLabel}: ${data.code}`,
    `${t.validUntil} ${data.validTo}`,
    "",
    `${t.usage} hairland.cz.`,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:22px;font-weight:600;text-align:center;margin:0 0 16px;">${esc(t.congrats)}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;text-align:center;margin:0 0 24px;">${esc(t.body(data.discount))}</p>
    <div style="background:linear-gradient(135deg,#f7efe8,#fdfaf7);border-radius:12px;padding:24px 20px;margin:20px 0;border:2px dashed #c2a36b;text-align:center;">
      <p style="color:#9c8682;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">${esc(t.codeLabel)}</p>
      <p style="color:#c2a36b;font-size:28px;font-weight:700;letter-spacing:3px;margin:0;">${esc(data.code)}</p>
    </div>
    <p style="color:#3a2c2a;font-size:14px;text-align:center;margin:16px 0 4px;"><strong>${esc(t.validUntil)}</strong> ${esc(data.validTo)}</p>
    <p style="color:#9c8682;font-size:13px;text-align:center;line-height:1.5;margin:4px 0 0;">
      ${esc(t.usage)} <a href="https://hairland.cz" style="color:#a96d6c;text-decoration:none;">hairland.cz</a>.
    </p>
  `;

  return { subject: t.subject(data.discount), text, html: hairlandEmailTemplate(content) };
}

// --- Order Confirmation Email ---

const orderConfirmT: Record<Lang, {
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

export function getOrderConfirmationEmail(
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
  const t = orderConfirmT[resolveLang(lang)];

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
      <a href="https://hairland.cz/app/orders"
         style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
        ${esc(t.cta)}
      </a>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject(data.orderNumber), text, html: hairlandEmailTemplate(content) };
}

// --- Order Shipped Email ---

const orderShippedT: Record<Lang, {
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

export function getOrderShippedEmail(
  lang: string,
  data: {
    salonName: string;
    orderNumber: string;
    estimatedTotal: number;
  }
): { subject: string; text: string; html: string } {
  const t = orderShippedT[resolveLang(lang)];

  const totalCzk = (data.estimatedTotal / 100).toLocaleString("cs-CZ");

  const text = [
    t.greeting(data.salonName),
    "",
    t.body1(data.orderNumber),
    t.body2,
    "",
    `${totalCzk} Kč`,
    "",
    `${t.cta}: https://hairland.cz/app/orders`,
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
      <a href="https://hairland.cz/app/orders"
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
    `${t.cta}: https://hairland.cz/recenze`,
    "",
    t.footer,
  ].join("\n");

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.salonName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(t.body1(data.orderNumber))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(t.body2)}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://hairland.cz/recenze"
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
    `${t.cta}: https://hairland.cz/kontakt`,
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
      <a href="https://hairland.cz/kontakt"
         style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
        ${esc(t.cta)}
      </a>
    </div>
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject, text, html: hairlandEmailTemplate(content) };
}

// --- Retail Order Confirmation Email ---

const retailOrderConfirmT: Record<Lang, {
  subject: (orderNumber: string) => string;
  subjectTransfer: (orderNumber: string) => string;
  greeting: (name: string) => string;
  body1: (orderNumber: string) => string;
  bodyTransfer: string;
  bodyCard: string;
  itemsHeader: string;
  productHeader: string;
  detailsHeader: string;
  shippingLabel: string;
  discountLabel: string;
  totalLabel: string;
  bankAccountLabel: string;
  vsLabel: string;
  amountLabel: string;
  footer: string;
}> = {
  cs: {
    subject: (n) => `Objednávka #${n} přijata — Hairland`,
    subjectTransfer: (n) => `Objednávka #${n} — čeká na platbu — Hairland`,
    greeting: (name) => `Dobrý den, ${name},`,
    body1: (n) => `děkujeme za Vaši objednávku #${n}.`,
    bodyTransfer: "Čekáme na Vaši platbu",
    bodyCard: "Vaše platba byla přijata. Objednávku připravíme a budeme Vás informovat o odeslání.",
    itemsHeader: "Položky objednávky:",
    productHeader: "Produkt",
    detailsHeader: "Detaily",
    shippingLabel: "Doprava",
    discountLabel: "Sleva",
    totalLabel: "Celkem k úhradě",
    bankAccountLabel: "Bankovní účet",
    vsLabel: "Variabilní symbol",
    amountLabel: "Částka k úhradě",
    footer: "Máte dotaz? Odpovězte na tento email nebo nás kontaktujte na info@hairland.cz.",
  },
  uk: {
    subject: (n) => `Замовлення #${n} прийнято — Hairland`,
    subjectTransfer: (n) => `Замовлення #${n} — очікуємо оплату — Hairland`,
    greeting: (name) => `Вітаємо, ${name},`,
    body1: (n) => `дякуємо за Ваше замовлення #${n}.`,
    bodyTransfer: "Очікуємо Вашу оплату",
    bodyCard: "Ваша оплата прийнята. Ми підготуємо замовлення та повідомимо Вас про відправку.",
    itemsHeader: "Товари замовлення:",
    productHeader: "Продукт",
    detailsHeader: "Деталі",
    shippingLabel: "Доставка",
    discountLabel: "Знижка",
    totalLabel: "Всього до оплати",
    bankAccountLabel: "Банківський рахунок",
    vsLabel: "Варіабельний символ",
    amountLabel: "Сума до оплати",
    footer: "Маєте запитання? Відповідайте на цей лист або зверніться до нас на info@hairland.cz.",
  },
  ru: {
    subject: (n) => `Заказ #${n} принят — Hairland`,
    subjectTransfer: (n) => `Заказ #${n} — ожидаем оплату — Hairland`,
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: (n) => `благодарим за Ваш заказ #${n}.`,
    bodyTransfer: "Ожидаем Вашу оплату",
    bodyCard: "Ваша оплата принята. Мы подготовим заказ и сообщим Вам об отправке.",
    itemsHeader: "Товары заказа:",
    productHeader: "Продукт",
    detailsHeader: "Детали",
    shippingLabel: "Доставка",
    discountLabel: "Скидка",
    totalLabel: "Итого к оплате",
    bankAccountLabel: "Банковский счёт",
    vsLabel: "Вариабельный символ",
    amountLabel: "Сумма к оплате",
    footer: "Есть вопрос? Ответьте на это письмо или свяжитесь с нами по адресу info@hairland.cz.",
  },
};

export function getRetailOrderConfirmationEmail(
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
  }
): { subject: string; text: string; html: string } {
  const t = retailOrderConfirmT[resolveLang(lang)];
  const isTransfer = data.paymentMethod === "TRANSFER";
  const fmtCzk = (h: number) => (h / 100).toLocaleString("cs-CZ");

  const itemLines = data.items
    .map((i) => `  - ${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.grams > 0 ? `${i.grams}g` : `${i.pieces} ks`} — ${fmtCzk(i.lineTotal)} Kč`)
    .join("\n");

  const text = [
    t.greeting(data.customerName),
    "",
    t.body1(data.orderNumber),
    isTransfer ? t.bodyTransfer : t.bodyCard,
    "",
    t.itemsHeader,
    itemLines,
    data.promoCode ? `\n${t.discountLabel}: ${data.promoCode} -${fmtCzk(data.promoDiscount ?? 0)} Kč` : null,
    data.shippingCost > 0 ? `${t.shippingLabel}: ${fmtCzk(data.shippingCost)} Kč` : null,
    `${t.totalLabel}: ${fmtCzk(data.totalAmount)} Kč`,
    "",
    isTransfer && data.bankAccount ? `${t.bankAccountLabel}: ${data.bankAccount}` : null,
    isTransfer && data.variableSymbol ? `${t.vsLabel}: ${data.variableSymbol}` : null,
    "",
    t.footer,
  ].filter(Boolean).join("\n");

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
    ? `<!-- Payment box -->
      <div style="background:#fff8f0;border:2px solid #e8c97a;border-radius:12px;padding:20px;margin:24px 0 0;text-align:center;">
        <p style="color:#b8860b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">⏳ ${esc(t.bodyTransfer)}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#9c8682;font-size:13px;text-align:left;">${esc(t.bankAccountLabel)}</td><td style="padding:6px 0;color:#3a2c2a;font-size:15px;text-align:right;font-weight:700;font-family:monospace;">${esc(data.bankAccount)}</td></tr>
          <tr><td style="padding:6px 0;color:#9c8682;font-size:13px;text-align:left;">${esc(t.vsLabel)}</td><td style="padding:6px 0;color:#3a2c2a;font-size:15px;text-align:right;font-weight:700;font-family:monospace;">${esc(data.variableSymbol ?? "")}</td></tr>
          <tr><td colspan="2" style="padding:12px 0 0;"><div style="border-top:1px solid #e8c97a;padding-top:12px;text-align:center;"><span style="color:#9c8682;font-size:12px;">${esc(t.amountLabel)}</span><br><span style="color:#3a2c2a;font-size:24px;font-weight:800;">${fmtCzk(data.totalAmount)} Kč</span></div></td></tr>
        </table>
      </div>`
    : "";

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 4px;">${esc(t.greeting(data.customerName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 24px;">${esc(t.body1(data.orderNumber))}</p>
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
    <p style="color:#b8a09b;font-size:12px;line-height:1.5;margin:24px 0 0;">${esc(t.footer)}</p>
  `;

  const subject = isTransfer ? t.subjectTransfer(data.orderNumber) : t.subject(data.orderNumber);
  return { subject, text, html: hairlandEmailTemplate(content) };
}

// --- Retail Order Shipped Email ---

const retailShippedT: Record<Lang, {
  subject: (orderNumber: string) => string;
  greeting: (name: string) => string;
  body1: (orderNumber: string) => string;
  bodyPacketa: (pointName: string) => string;
  bodyPersonal: string;
  bodyPost: string;
  trackingLabel: string;
  footer: string;
}> = {
  cs: {
    subject: (n) => `Objednávka #${n} odeslána — Hairland`,
    greeting: (name) => `Dobrý den, ${name},`,
    body1: (n) => `Vaše objednávka #${n} byla odeslána.`,
    bodyPacketa: (p) => `Zásilku si vyzvednete na pobočce Zásilkovny: ${p}.`,
    bodyPersonal: "Doručíme Vám objednávku osobně v Praze do 24 hodin.",
    bodyPost: "Zásilka je na cestě Českou poštou.",
    trackingLabel: "Sledování zásilky",
    footer: "Máte dotaz? Odpovězte na tento email.",
  },
  uk: {
    subject: (n) => `Замовлення #${n} відправлено — Hairland`,
    greeting: (name) => `Вітаємо, ${name},`,
    body1: (n) => `Ваше замовлення #${n} відправлено.`,
    bodyPacketa: (p) => `Забрати посилку можна у відділенні Zásilkovna: ${p}.`,
    bodyPersonal: "Ми доставимо замовлення особисто в Празі протягом 24 годин.",
    bodyPost: "Посилка в дорозі Чеською поштою.",
    trackingLabel: "Відстеження",
    footer: "Маєте запитання? Відповідайте на цей лист.",
  },
  ru: {
    subject: (n) => `Заказ #${n} отправлен — Hairland`,
    greeting: (name) => `Здравствуйте, ${name},`,
    body1: (n) => `Ваш заказ #${n} отправлен.`,
    bodyPacketa: (p) => `Забрать посылку можно в отделении Zásilkovna: ${p}.`,
    bodyPersonal: "Мы доставим заказ лично в Праге в течение 24 часов.",
    bodyPost: "Посылка в пути Чешской почтой.",
    trackingLabel: "Отслеживание",
    footer: "Есть вопрос? Ответьте на это письмо.",
  },
};

export function getRetailOrderShippedEmail(
  lang: string,
  data: {
    customerName: string;
    orderNumber: string;
    shippingMethod: string;
    trackingId?: string;
    packetaPointName?: string;
  }
): { subject: string; text: string; html: string } {
  const t = retailShippedT[resolveLang(lang)];

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
    t.body1(data.orderNumber),
    shippingDetail,
    data.trackingId ? `\n${t.trackingLabel}: ${trackingUrl || data.trackingId}` : null,
    "",
    t.footer,
  ].filter(Boolean).join("\n");

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

  const content = `
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${esc(t.greeting(data.customerName))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${esc(t.body1(data.orderNumber))}</p>
    <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${esc(shippingDetail)}</p>
    ${trackingHtml}
    <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${esc(t.footer)}</p>
  `;

  return { subject: t.subject(data.orderNumber), text, html: hairlandEmailTemplate(content) };
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
