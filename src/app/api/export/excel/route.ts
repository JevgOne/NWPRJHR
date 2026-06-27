import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportQuerySchema } from "@/lib/validations/export";
import { generateAccountingExport } from "@/lib/export-excel";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const parsed = exportQuerySchema.safeParse({
    from: sp.get("from"),
    to: sp.get("to"),
    format: sp.get("format") ?? "xlsx",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { from, to, format } = parsed.data;
  const buffer = await generateAccountingExport({
    from: new Date(from),
    to: new Date(to),
    format,
  });

  const fromDate = from.slice(0, 10);
  const toDate = to.slice(0, 10);

  const body = new Uint8Array(buffer);

  if (format === "csv") {
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hairland-export-${fromDate}-${toDate}.csv"`,
      },
    });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="hairland-export-${fromDate}-${toDate}.xlsx"`,
    },
  });
}
