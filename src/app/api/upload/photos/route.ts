import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "photos");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0)
    return NextResponse.json({ error: "No files provided" }, { status: 400 });

  if (files.length > 10)
    return NextResponse.json(
      { error: "Max 10 files per upload" },
      { status: 400 }
    );

  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_SIZE)
      return NextResponse.json(
        { error: `File ${file.name} too large (max 5MB)` },
        { status: 400 }
      );

    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json(
        { error: `Invalid file type: ${file.name}. Allowed: JPG, PNG, WebP` },
        { status: 400 }
      );

    const ext = file.name.split(".").pop() ?? "jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = join(UPLOAD_DIR, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    urls.push(`/uploads/photos/${safeName}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
