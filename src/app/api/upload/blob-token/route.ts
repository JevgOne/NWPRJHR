import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as HandleUploadBody;

  const response = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [
        "image/webp",
        "image/jpeg",
        "image/png",
        "image/heic",
        "image/heif",
        "video/mp4",
        "video/quicktime",
        "video/x-quicktime",
        "video/webm",
      ],
      maximumSizeInBytes: 50 * 1024 * 1024,
    }),
    onUploadCompleted: async () => {},
  });

  return NextResponse.json(response);
}
