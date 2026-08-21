import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { customerSchema } from "@/lib/validations/sale";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    take: 200,
    include: {
      _count: { select: { inquiries: true, sales: true } },
    },
  });

  const search = request.nextUrl.searchParams.get("search")?.toLowerCase();
  const filtered = search
    ? customers.filter((c) => {
        const haystack = [c.name, c.email, c.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      })
    : customers;

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const name = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const customer = await prisma.customer.create({
    data: { ...parsed.data, name },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "CREATE",
    entity: "Customer",
    entityId: customer.id,
    detail: { name },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(customer, { status: 201 });
}
