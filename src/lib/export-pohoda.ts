import { create } from "xmlbuilder2";
import iconv from "iconv-lite";
import { prisma } from "./db";

interface PohodaExportParams {
  from: Date;
  to: Date;
  ico: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function halereToCZK(halere: number): number {
  return halere / 100;
}

export async function generatePohodaXml(
  params: PohodaExportParams
): Promise<Buffer> {
  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: { gte: params.from, lte: params.to },
      status: { not: "CANCELLED" },
    },
    include: {
      company: true,
      salon: true,
      customer: true,
      items: true,
    },
    orderBy: { number: "asc" },
  });

  const doc = create({ version: "1.0", encoding: "Windows-1250" });
  const dataPack = doc
    .ele("dat:dataPack", {
      "xmlns:dat": "http://www.stormware.cz/schema/version_2/data.xsd",
      "xmlns:inv": "http://www.stormware.cz/schema/version_2/invoice.xsd",
      "xmlns:typ": "http://www.stormware.cz/schema/version_2/type.xsd",
      version: "2.0",
      id: `hairora-${formatDate(params.from)}-${formatDate(params.to)}`,
      ico: params.ico,
      application: "Hairora",
      note: "Export faktur z Hairora",
    });

  for (let idx = 0; idx < invoices.length; idx++) {
    const inv = invoices[idx];
    const isCredit = inv.type === "CREDIT_NOTE";

    const dataPackItem = dataPack.ele("dat:dataPackItem", {
      version: "2.0",
      id: `inv-${inv.id}`,
    });

    const invoice = dataPackItem.ele("inv:invoice", { version: "2.0" });

    // Header
    const header = invoice.ele("inv:invoiceHeader");
    header
      .ele("inv:invoiceType")
      .txt(isCredit ? "issuedCreditNote" : "issuedInvoice");
    header
      .ele("inv:number")
      .ele("typ:numberRequested")
      .txt(inv.number);
    header.ele("inv:symVar").txt(inv.variableSymbol);
    header.ele("inv:date").txt(formatDate(inv.issueDate));
    if (inv.taxDate) {
      header.ele("inv:dateTax").txt(formatDate(inv.taxDate));
    }
    header.ele("inv:dateDue").txt(formatDate(inv.dueDate));

    if (inv.note) {
      header.ele("inv:text").txt(inv.note);
    }

    // Partner identity (buyer)
    const partner = header.ele("inv:partnerIdentity");
    const addr = partner.ele("typ:address");
    addr.ele("typ:company").txt(inv.buyerName);
    if (inv.buyerIco) addr.ele("typ:ico").txt(inv.buyerIco);
    if (inv.buyerDic) addr.ele("typ:dic").txt(inv.buyerDic);
    if (inv.buyerAddress) addr.ele("typ:street").txt(inv.buyerAddress);

    // Detail (items)
    const detail = invoice.ele("inv:invoiceDetail");
    for (const item of inv.items) {
      const invItem = detail.ele("inv:invoiceItem");
      invItem.ele("inv:text").txt(item.description);
      invItem.ele("inv:quantity").txt(String(item.quantity));
      invItem.ele("inv:unit").txt(item.unit);

      const vatPercent = item.vatRate / 100;
      if (vatPercent >= 21) {
        invItem.ele("inv:rateVAT").txt("high");
      } else if (vatPercent >= 12) {
        invItem.ele("inv:rateVAT").txt("low");
      } else {
        invItem.ele("inv:rateVAT").txt("none");
      }

      invItem
        .ele("inv:homeCurrency")
        .ele("typ:unitPrice")
        .txt(String(halereToCZK(item.pricePerUnit)));
    }

    // Summary
    const summary = invoice.ele("inv:invoiceSummary");
    summary
      .ele("inv:roundingDocument")
      .txt(inv.roundingAmount === 0 ? "none" : "math2one");
  }

  const xmlString = doc.end({ prettyPrint: true });
  return iconv.encode(xmlString, "win1250");
}
