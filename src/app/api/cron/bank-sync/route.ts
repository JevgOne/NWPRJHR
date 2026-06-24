import { NextRequest, NextResponse } from "next/server";
import { getBankProvider } from "@/lib/bank-api";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = getBankProvider();
  const connected = await provider.isConnected();

  if (!connected) {
    return NextResponse.json({
      status: "skipped",
      reason: "Bank API not connected (manual mode)",
      timestamp: new Date().toISOString(),
    });
  }

  // Future: fetch + auto-match transactions
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
