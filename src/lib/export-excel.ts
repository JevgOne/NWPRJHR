import ExcelJS from "exceljs";
import { prisma } from "./db";

interface ExportParams {
  from: Date;
  to: Date;
  format: "xlsx" | "csv";
}

function halereToCZK(halere: number): number {
  return halere / 100;
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export async function generateAccountingExport(
  params: ExportParams
): Promise<Buffer> {
  const [invoices, deliveries, operatingCosts] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        issueDate: { gte: params.from, lte: params.to },
        status: { not: "CANCELLED" },
      },
      include: {
        company: true,
        salon: true,
        customer: true,
        items: true,
        payments: true,
      },
      orderBy: { number: "asc" },
    }),
    prisma.delivery.findMany({
      where: {
        stockedAt: { gte: params.from, lte: params.to },
        receivedInvoiceFile: { not: null },
      },
      include: {
        supplier: true,
        variant: { include: { product: true } },
      },
      orderBy: { stockedAt: "asc" },
    }),
    prisma.operatingCost.findMany({
      where: {
        date: { gte: params.from, lte: params.to },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hairland";
  workbook.created = new Date();

  // Sheet 1: Vydane faktury (Issued Invoices)
  const sheet1 = workbook.addWorksheet("Vydane faktury");
  sheet1.columns = [
    { header: "Cislo faktury", key: "number", width: 18 },
    { header: "Typ", key: "type", width: 14 },
    { header: "Datum vystaveni", key: "issueDate", width: 14 },
    { header: "DUZP", key: "taxDate", width: 14 },
    { header: "Datum splatnosti", key: "dueDate", width: 14 },
    { header: "Odberatel", key: "buyerName", width: 30 },
    { header: "ICO", key: "buyerICO", width: 12 },
    { header: "DIC", key: "buyerDIC", width: 14 },
    { header: "Zaklad (CZK)", key: "subtotal", width: 14 },
    { header: "Sazba DPH (%)", key: "vatRate", width: 12 },
    { header: "DPH (CZK)", key: "vatAmount", width: 12 },
    { header: "Celkem (CZK)", key: "totalAmount", width: 14 },
    { header: "Stav", key: "status", width: 12 },
    { header: "Uhrazeno", key: "paidDate", width: 14 },
    { header: "VS", key: "variableSymbol", width: 14 },
    { header: "Fakturujici firma", key: "companyName", width: 25 },
  ];

  for (const inv of invoices) {
    const paidPayment = inv.payments.find(() => inv.status === "PAID");
    sheet1.addRow({
      number: inv.number,
      type: inv.type,
      issueDate: formatDate(inv.issueDate),
      taxDate: formatDate(inv.taxDate),
      dueDate: formatDate(inv.dueDate),
      buyerName: inv.buyerName,
      buyerICO: inv.buyerIco ?? "",
      buyerDIC: inv.buyerDic ?? "",
      subtotal: halereToCZK(inv.subtotal),
      vatRate: inv.vatRate / 100,
      vatAmount: halereToCZK(inv.vatAmount),
      totalAmount: halereToCZK(inv.total),
      status: inv.status,
      paidDate: paidPayment ? formatDate(inv.payments[0]?.date) : "",
      variableSymbol: inv.variableSymbol,
      companyName: inv.company.name,
    });
  }

  // Sheet 2: Prijate faktury (Received Invoices from suppliers)
  const sheet2 = workbook.addWorksheet("Prijate faktury");
  sheet2.columns = [
    { header: "Dodavatel", key: "supplierName", width: 25 },
    { header: "Datum prijeti", key: "receivedDate", width: 14 },
    { header: "Castka (orig.)", key: "originalAmount", width: 14 },
    { header: "Mena", key: "currency", width: 8 },
    { header: "Kurz", key: "exchangeRate", width: 10 },
    { header: "Castka (CZK)", key: "amountCZK", width: 14 },
    { header: "Soubor", key: "invoiceFile", width: 30 },
    { header: "Dodavka", key: "deliveryBarcode", width: 18 },
  ];

  for (const del of deliveries) {
    const totalGrams = del.initialGrams;
    const rawTotal = del.purchasePricePerGramRaw * totalGrams;
    const czkTotal = del.purchasePricePerGramCZK * totalGrams;

    sheet2.addRow({
      supplierName: del.supplier.name,
      receivedDate: formatDate(del.stockedAt),
      originalAmount: halereToCZK(rawTotal),
      currency: del.currency,
      exchangeRate: del.exchangeRate / 100,
      amountCZK: halereToCZK(czkTotal),
      invoiceFile: del.receivedInvoiceFile ?? "",
      deliveryBarcode: del.barcode ?? "",
    });
  }

  // Sheet 3: Provozni naklady (Operating Costs)
  const sheet3 = workbook.addWorksheet("Provozni naklady");
  sheet3.columns = [
    { header: "Datum", key: "date", width: 14 },
    { header: "Kategorie", key: "category", width: 18 },
    { header: "Castka (CZK)", key: "amount", width: 14 },
    { header: "Popis", key: "description", width: 40 },
    { header: "Doklad", key: "receiptFile", width: 30 },
  ];

  for (const cost of operatingCosts) {
    sheet3.addRow({
      date: formatDate(cost.date),
      category: cost.category,
      amount: halereToCZK(cost.amountHalere),
      description: cost.description ?? "",
      receiptFile: cost.receiptFile ?? "",
    });
  }

  // Sheet 4: Prehled DPH (VAT Overview)
  const sheet4 = workbook.addWorksheet("Prehled DPH");
  sheet4.columns = [
    { header: "Polozka", key: "item", width: 40 },
    { header: "Castka (CZK)", key: "amount", width: 18 },
  ];

  const issuedInvoices = invoices.filter((i) => i.type === "INVOICE");
  const creditNotes = invoices.filter((i) => i.type === "CREDIT_NOTE");

  const outputBase = issuedInvoices.reduce((s, i) => s + i.subtotal, 0);
  const outputVat = issuedInvoices.reduce((s, i) => s + i.vatAmount, 0);
  const creditBase = creditNotes.reduce((s, i) => s + i.subtotal, 0);
  const creditVat = creditNotes.reduce((s, i) => s + i.vatAmount, 0);
  const inputDeliveries = deliveries.reduce(
    (s, d) => s + d.purchasePricePerGramCZK * d.initialGrams,
    0
  );
  const inputCosts = operatingCosts.reduce((s, c) => s + c.amountHalere, 0);

  sheet4.addRow({ item: "VYSTUPY", amount: "" });
  sheet4.addRow({
    item: "Zaklad DPH z vydanych faktur",
    amount: halereToCZK(outputBase),
  });
  sheet4.addRow({
    item: "DPH z vydanych faktur",
    amount: halereToCZK(outputVat),
  });
  sheet4.addRow({
    item: "Zaklad DPH z dobropisů (-)  ",
    amount: halereToCZK(creditBase),
  });
  sheet4.addRow({
    item: "DPH z dobropisů (-)",
    amount: halereToCZK(creditVat),
  });
  sheet4.addRow({ item: "", amount: "" });
  sheet4.addRow({ item: "VSTUPY", amount: "" });
  sheet4.addRow({
    item: "Prijate faktury (dodavatele)",
    amount: halereToCZK(inputDeliveries),
  });
  sheet4.addRow({
    item: "Provozni naklady",
    amount: halereToCZK(inputCosts),
  });

  // Sheet 5: Dobropisy (Credit Notes)
  const sheet5 = workbook.addWorksheet("Dobropisy");
  sheet5.columns = sheet1.columns.map((c) => ({
    header: c.header as string,
    key: c.key as string,
    width: c.width,
  }));

  for (const inv of creditNotes) {
    sheet5.addRow({
      number: inv.number,
      type: inv.type,
      issueDate: formatDate(inv.issueDate),
      taxDate: formatDate(inv.taxDate),
      dueDate: formatDate(inv.dueDate),
      buyerName: inv.buyerName,
      buyerICO: inv.buyerIco ?? "",
      buyerDIC: inv.buyerDic ?? "",
      subtotal: halereToCZK(inv.subtotal),
      vatRate: inv.vatRate / 100,
      vatAmount: halereToCZK(inv.vatAmount),
      totalAmount: halereToCZK(inv.total),
      status: inv.status,
      paidDate: "",
      variableSymbol: inv.variableSymbol,
      companyName: inv.company.name,
    });
  }

  if (params.format === "csv") {
    const csvBuffer = await workbook.csv.writeBuffer();
    return Buffer.from(csvBuffer);
  }

  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(xlsxBuffer);
}
