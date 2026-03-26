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
      include: {
        employee: true,
      },
    });

    if (!user?.employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: user.employee.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let status = "NOT_CLOCKED";

    if (todayAttendance?.clockIn && !todayAttendance?.clockOut) {
      status = "CLOCKED_IN";
    }

    if (todayAttendance?.clockIn && todayAttendance?.clockOut) {
      status = "CLOCKED_OUT";
    }

    return NextResponse.json({
      status,
      todayAttendance,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load current status" },
      { status: 500 }
    );
  }
}