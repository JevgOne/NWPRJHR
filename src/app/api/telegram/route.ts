import { NextRequest, NextResponse } from "next/server";
import { handleTelegramCallback } from "@/lib/telegram";

/**
 * Telegram webhook — handles callback queries from inline buttons.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.callback_query) {
      await handleTelegramCallback(body.callback_query);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram webhook] Error:", err);
    return NextResponse.json({ ok: true });
  }
}
