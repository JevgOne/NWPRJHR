import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "receipts");
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cost = await prisma.operatingCost.findUnique({ where: { id } });
  if (!cost)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PDF, JPG, PNG, WebP" },
      { status: 400 }
    );

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = `${id}-${Date.now()}.${ext}`;
  const filePath = join(UPLOAD_DIR, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const url = `/uploads/receipts/${safeName}`;
  await prisma.operatingCost.update({
    where: { id },
    data: { receiptFile: url, receiptName: file.name },
  });

  return NextResponse.json({ url, name: file.name }, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cost = await prisma.operatingCost.findUnique({ where: { id } });
  if (!cost || !cost.receiptFile)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = join(process.cwd(), "public", cost.receiptFile);
  try {
    const data = await readFile(filePath);
    const ext = cost.receiptFile.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${cost.receiptName ?? "receipt"}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cost = await prisma.operatingCost.findUnique({ where: { id } });
  if (!cost || !cost.receiptFile)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = join(process.cwd(), "public", cost.receiptFile);
  try {
    await unlink(filePath);
  } catch {
    // File may already be gone
  }

  await prisma.operatingCost.update({
    where: { id },
    data: { receiptFile: null, receiptName: null },
  });

  return NextResponse.json({ success: true });
}
