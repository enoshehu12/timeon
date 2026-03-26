import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      employee: true,
    },
  });

  if (!user?.employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: user.employee.id,
    },
  });

  return NextResponse.json(attendances);
}