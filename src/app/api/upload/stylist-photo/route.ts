import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (
    session.user.role !== "HAIRDRESSER" &&
    session.user.role !== "SALON" &&
    session.user.role !== "OWNER" &&
    session.user.role !== "EMPLOYEE"
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPG, PNG, WebP" },
      { status: 400 }
    );

  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = `stylists/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const blob = await put(safeName, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
