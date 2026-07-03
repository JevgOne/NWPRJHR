import { NextRequest, NextResponse } from "next/server";
import { handleTelegramCallback } from "@/lib/telegram";

/**
 * Telegram webhook — handles callback queries from inline buttons.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Telegram webhook] Received:", JSON.stringify(body).slice(0, 500));

    if (body.callback_query) {
      console.log("[Telegram webhook] Processing callback_query, data:", body.callback_query.data);
      await handleTelegramCallback(body.callback_query);
      console.log("[Telegram webhook] Callback processed OK");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram webhook] Error:", err);
    return NextResponse.json({ ok: true });
  }
}
