import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { buildMonthlySummary } from "@/lib/work-summary";
import { laborRules } from "@/lib/labor-rules";

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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const [attendances, schedules, vacations, attendanceRequests, holidays] =
      await Promise.all([
        prisma.attendance.findMany({
          where: {
            employeeId: user.employee.id,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          orderBy: { date: "asc" },
        }),
        prisma.schedule.findMany({
          where: {
            employeeId: user.employee.id,
            scheduleDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          orderBy: { scheduleDate: "asc" },
        }),
        prisma.vacationRequest.findMany({
          where: {
            employeeId: user.employee.id,
          },
        }),
        prisma.attendanceRequest.findMany({
          where: {
            employeeId: user.employee.id,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        prisma.holiday.findMany({
          where: {
            holidayDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
      ]);

    const summary = buildMonthlySummary({
      attendances,
      schedules,
      vacations,
      holidays: holidays.map((h) => h.holidayDate),
    });

    const pendingAttendanceRequests = attendanceRequests.filter(
      (r) => r.status === "PENDING"
    ).length;

    const hourlyRate =
      user.employee.salary && laborRules.monthlyReferenceHours > 0
        ? Number((user.employee.salary / laborRules.monthlyReferenceHours).toFixed(2))
        : null;

    return NextResponse.json({
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      hourlyRate,
      totals: {
        ...summary,
        pendingAttendanceRequests,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load dashboard summary" },
      { status: 500 }
    );
  }
}