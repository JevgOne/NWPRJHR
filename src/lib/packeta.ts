const PACKETA_API_PASSWORD = process.env.PACKETA_API_KEY;
const PACKETA_API_URL = "https://www.zasilkovna.cz/api/rest";
const PACKETA_ESHOP = "hairland.cz";

// === CREATE PACKET ===

interface CreatePacketParams {
  number: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  addressId: number;
  weight: number;
  value: number;
  cod?: number;
}

interface CreatePacketResult {
  success: boolean;
  packetId?: string;
  barcode?: string;
  error?: string;
}

export async function createPacket(params: CreatePacketParams): Promise<CreatePacketResult> {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<createPacket>
  <apiPassword>${PACKETA_API_PASSWORD}</apiPassword>
  <packetAttributes>
    <number>${escapeXml(params.number)}</number>
    <name>${escapeXml(params.name)}</name>
    <surname>${escapeXml(params.surname)}</surname>
    <email>${escapeXml(params.email)}</email>
    ${params.phone ? `<phone>${escapeXml(params.phone)}</phone>` : ""}
    <addressId>${params.addressId}</addressId>
    <weight>${params.weight}</weight>
    <value>${params.value}</value>
    <currency>CZK</currency>
    ${params.cod ? `<cod>${params.cod}</cod>` : ""}
    <eshop>${PACKETA_ESHOP}</eshop>
  </packetAttributes>
</createPacket>`;

  const response = await fetch(PACKETA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  });

  const text = await response.text();

  const idMatch = text.match(/<id>(\d+)<\/id>/);
  const barcodeMatch = text.match(/<barcode>(Z\d+)<\/barcode>/);
  const errorMatch = text.match(/<fault>([\s\S]+?)<\/fault>/);

  if (idMatch && barcodeMatch) {
    return {
      success: true,
      packetId: idMatch[1],
      barcode: barcodeMatch[1],
    };
  }

  return {
    success: false,
    error: errorMatch?.[1]?.replace(/<[^>]*>/g, " ").trim() || "Unknown error",
  };
}

// === PACKET LABEL PDF ===

export async function getPacketLabel(packetId: string, format: "A7 on A4" | "A7 on A7" = "A7 on A4"): Promise<Buffer | null> {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<packetLabelPdf>
  <apiPassword>${PACKETA_API_PASSWORD}</apiPassword>
  <packetId>${escapeXml(packetId)}</packetId>
  <format>${format}</format>
</packetLabelPdf>`;

  const response = await fetch(PACKETA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  });

  if (response.headers.get("content-type")?.includes("pdf")) {
    return Buffer.from(await response.arrayBuffer());
  }

  console.error("Packeta label error:", await response.text());
  return null;
}

// === PACKET TRACKING ===

export interface PacketTrackingEntry {
  dateTime: string;
  statusCode: number;
  statusText: string;
}

export async function getPacketTracking(packetId: string): Promise<PacketTrackingEntry[]> {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<packetTracking>
  <apiPassword>${PACKETA_API_PASSWORD}</apiPassword>
  <packetId>${escapeXml(packetId)}</packetId>
</packetTracking>`;

  const response = await fetch(PACKETA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  });

  const text = await response.text();

  const records: PacketTrackingEntry[] = [];
  const recordRegex = /<record>[\s\S]*?<dateTime>(.+?)<\/dateTime>[\s\S]*?<statusCode>(\d+)<\/statusCode>[\s\S]*?<codeText>(.+?)<\/codeText>[\s\S]*?<\/record>/g;

  let match;
  while ((match = recordRegex.exec(text)) !== null) {
    records.push({
      dateTime: match[1],
      statusCode: parseInt(match[2]),
      statusText: match[3],
    });
  }

  return records;
}

// === PACKET STATUS ===

export async function getPacketStatus(packetId: string): Promise<{ code: number; text: string } | null> {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<packetStatus>
  <apiPassword>${PACKETA_API_PASSWORD}</apiPassword>
  <packetId>${escapeXml(packetId)}</packetId>
</packetStatus>`;

  const response = await fetch(PACKETA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  });

  const text = await response.text();
  const codeMatch = text.match(/<code>(\d+)<\/code>/);
  const textMatch = text.match(/<text>(.+?)<\/text>/);

  if (codeMatch && textMatch) {
    return { code: parseInt(codeMatch[1]), text: textMatch[1] };
  }

  return null;
}

// === HELPER ===

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
