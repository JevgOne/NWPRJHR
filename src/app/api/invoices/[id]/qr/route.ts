import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSpayd } from "@/lib/spayd";
import { generateQRCodeBuffer } from "@/lib/qr-code";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { company: true },
  });

  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") &&
    invoice.salonId !== session.user.salonId
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!invoice.company.bankIban)
    return NextResponse.json(
      { error: "Company has no IBAN configured" },
      { status: 400 }
    );

  const spayd = generateSpayd({
    iban: invoice.company.bankIban,
    amount: invoice.total / 100,
    variableSymbol: invoice.variableSymbol,
    message: `Faktura ${invoice.number}`,
  });

  const qrBuffer = await generateQRCodeBuffer(spayd);

  return new NextResponse(new Uint8Array(qrBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
