import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true },
    });

    if (!user?.employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const records = await prisma.attendance.findMany({
      where: {
        employeeId: user.employee.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true },
    });

    if (!user?.employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    const employeeId = user.employee.id;

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (action === "CLOCK_IN") {
      if (existingRecord?.clockIn) {
        return NextResponse.json(
          { error: "Already clocked in today" },
          { status: 400 }
        );
      }

      const record = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          clockIn: today,
          status: "CLOCKED_IN",
        },
      });

      return NextResponse.json(record, { status: 201 });
    }

    if (action === "CLOCK_OUT") {
      if (!existingRecord) {
        return NextResponse.json(
          { error: "No clock in found for today" },
          { status: 400 }
        );
      }

      if (existingRecord.clockOut) {
        return NextResponse.json(
          { error: "Already clocked out today" },
          { status: 400 }
        );
      }

      const record = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          clockOut: today,
          status: "CLOCKED_OUT",
        },
      });

      return NextResponse.json(record);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process attendance" },
      { status: 500 }
    );
  }
}