import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
    });
    return NextResponse.json({
      ok: true,
      userCount,
      users,
      env: {
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "set" : "not set",
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "set" : "not set",
        DATABASE_URL: process.env.DATABASE_URL ? "set" : "not set",
        AUTH_SECRET: process.env.AUTH_SECRET ? "set" : "not set",
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ ok: false, error: message, stack }, { status: 500 });
  }
}
