/**
 * PDF-specific translations for invoices.
 * Used by invoice-pdf.ts to generate trilingual PDFs.
 */

interface InvoiceTranslations {
  title: string;
  creditNoteTitle: string;
  number: string;
  issueDate: string;
  dueDate: string;
  taxDate: string;
  vs: string;
  supplier: string;
  buyer: string;
  ico: string;
  dic: string;
  item: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  lineTotal: string;
  subtotal: string;
  vat: string;
  notVatPayer: string;
  total: string;
  rounding: string;
  qrPayment: string;
  gram: string;
  piece: string;
  bankAccount: string;
  iban: string;
  bankName: string;
  page: string;
  referencesInvoice: string;
}

const translations: Record<string, InvoiceTranslations> = {
  cs: {
    title: "Faktura",
    creditNoteTitle: "Dobropis",
    number: "Číslo",
    issueDate: "Datum vystavení",
    dueDate: "Datum splatnosti",
    taxDate: "DÚZP",
    vs: "Variabilní symbol",
    supplier: "Dodavatel",
    buyer: "Odběratel",
    ico: "IČO",
    dic: "DIČ",
    item: "Položka",
    quantity: "Množství",
    unit: "Jednotka",
    unitPrice: "Cena za jednotku",
    lineTotal: "Celkem",
    subtotal: "Celkem",
    vat: "",
    notVatPayer: "Nejsme plátci DPH",
    total: "Celkem uhrazeno",
    rounding: "Zaokrouhlení",
    qrPayment: "QR Platba",
    gram: "g",
    piece: "ks",
    bankAccount: "Bankovní účet",
    iban: "IBAN",
    bankName: "Banka",
    page: "Strana",
    referencesInvoice: "Opravný doklad k faktuře",
  },
  uk: {
    title: "Рахунок-фактура",
    creditNoteTitle: "Коригувальний документ",
    number: "Номер",
    issueDate: "Дата виставлення",
    dueDate: "Термін оплати",
    taxDate: "Дата податкового зобов'язання",
    vs: "Варіабільний символ (VS)",
    supplier: "Постачальник",
    buyer: "Покупець",
    ico: "ICO",
    dic: "DIC",
    item: "Товар",
    quantity: "Кількість",
    unit: "Одиниця",
    unitPrice: "Ціна за одиницю",
    lineTotal: "Разом",
    subtotal: "Разом",
    vat: "",
    notVatPayer: "Ми не є платниками ПДВ",
    total: "Разом до сплати",
    rounding: "Округлення",
    qrPayment: "QR-оплата",
    gram: "г",
    piece: "шт",
    bankAccount: "Банківський рахунок",
    iban: "IBAN",
    bankName: "Банк",
    page: "Сторінка",
    referencesInvoice: "Коригування до рахунку",
  },
  ru: {
    title: "Счёт-фактура",
    creditNoteTitle: "Корректировочный документ",
    number: "Номер",
    issueDate: "Дата выставления",
    dueDate: "Срок оплаты",
    taxDate: "Дата налогового обязательства",
    vs: "Вариабельный символ (VS)",
    supplier: "Поставщик",
    buyer: "Покупатель",
    ico: "ICO",
    dic: "DIC",
    item: "Товар",
    quantity: "Количество",
    unit: "Единица",
    unitPrice: "Цена за единицу",
    lineTotal: "Итого",
    subtotal: "Итого",
    vat: "",
    notVatPayer: "Мы не являемся плательщиками НДС",
    total: "Итого к оплате",
    rounding: "Округление",
    qrPayment: "QR-оплата",
    gram: "г",
    piece: "шт",
    bankAccount: "Банковский счёт",
    iban: "IBAN",
    bankName: "Банк",
    page: "Страница",
    referencesInvoice: "Корректировка к счёту",
  },
};

export function getInvoiceTranslations(lang: string): InvoiceTranslations {
  return translations[lang] ?? translations.cs;
}
