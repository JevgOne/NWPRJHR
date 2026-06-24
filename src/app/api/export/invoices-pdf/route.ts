import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportQuerySchema } from "@/lib/validations/export";
import { generatePdfBundle } from "@/lib/export-pdf-bundle";

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
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { from, to } = parsed.data;
  const { buffer } = await generatePdfBundle({
    from: new Date(from),
    to: new Date(to),
  });

  const fromDate = from.slice(0, 10);
  const toDate = to.slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="faktury-${fromDate}-${toDate}.zip"`,
    },
  });
}
