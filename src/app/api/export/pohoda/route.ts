import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pohodaExportSchema } from "@/lib/validations/export";
import { generatePohodaXml } from "@/lib/export-pohoda";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const parsed = pohodaExportSchema.safeParse({
    from: sp.get("from"),
    to: sp.get("to"),
    ico: sp.get("ico"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { from, to, ico } = parsed.data;
  const buffer = await generatePohodaXml({
    from: new Date(from),
    to: new Date(to),
    ico,
  });

  const fromDate = from.slice(0, 10);
  const toDate = to.slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/xml; charset=windows-1250",
      "Content-Disposition": `attachment; filename="hairora-pohoda-${fromDate}-${toDate}.xml"`,
    },
  });
}
