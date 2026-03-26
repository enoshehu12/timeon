import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! },
    include: { employee: true },
  });

  if (!user?.employee) {
    return NextResponse.json([], { status: 200 });
  }

  const vacations = await prisma.vacationRequest.findMany({
    where: {
      employeeId: user.employee.id,
    },
  });

  return NextResponse.json(vacations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! },
    include: { employee: true },
  });

  const body = await req.json();
  const { startDate, endDate } = body;

  const request = await prisma.vacationRequest.create({
    data: {
      employeeId: user!.employee!.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return NextResponse.json(request);
}