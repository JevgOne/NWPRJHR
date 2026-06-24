import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { companySchema } from "@/lib/validations/invoice";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const companies = await prisma.company.findMany({
    where: { active: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(companies);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // If setting as default, unset previous default
  if (parsed.data.isDefault) {
    await prisma.company.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const company = await prisma.company.create({
    data: parsed.data,
  });

  return NextResponse.json(company, { status: 201 });
}
