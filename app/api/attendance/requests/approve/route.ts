import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      employee: true,
    },
  });

  if (!currentUser?.employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const body = await req.json();
  const { requestId, action } = body;

  const request = await prisma.attendanceRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // 🔒 AUTH LOGIC
  if (currentUser.role === "TEAM_LEADER") {
    if (request.employee.teamId !== currentUser.employee.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (currentUser.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "APPROVE") {
    const today = new Date();

    if (request.type === "CLOCK_IN") {
      await prisma.attendance.create({
        data: {
          employeeId: request.employeeId,
          date: today,
          clockIn: request.requestedTime,
          status: "CLOCKED_IN",
        },
      });
    }

    if (request.type === "CLOCK_OUT") {
      const existing = await prisma.attendance.findFirst({
        where: {
          employeeId: request.employeeId,
        },
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            clockOut: request.requestedTime,
            status: "CLOCKED_OUT",
          },
        });
      }
    }

    const updated = await prisma.attendanceRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: currentUser.employee.id,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "REJECT") {
    const updated = await prisma.attendanceRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedById: currentUser.employee.id,
      },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}