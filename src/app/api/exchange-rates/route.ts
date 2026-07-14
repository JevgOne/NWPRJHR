import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getExchangeRate } from "@/lib/exchange-rates";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const currency = request.nextUrl.searchParams.get("currency");
  if (currency !== "USD" && currency !== "EUR") {
    return NextResponse.json(
      { error: "Invalid currency. Use USD or EUR." },
      { status: 400 }
    );
  }

  const rate = await getExchangeRate(currency);

  return NextResponse.json({
    rate: rate.rate,
    date: rate.date,
    source: rate.date === "fallback" ? "fallback" : "CNB",
  });
}
