import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    // Employee sheh vetëm turnet e veta
    if (user.role === "EMPLOYEE") {
      const schedules = await prisma.schedule.findMany({
        where: { employeeId: user.employee.id },
        orderBy: { scheduleDate: "asc" },
      });

      return NextResponse.json(schedules);
    }

    // TL/Manager/HR/Admin mund të kërkojnë sipas employeeId
    const whereClause = employeeId
      ? { employeeId }
      : user.role === "TEAM_LEADER"
      ? {
          employee: {
            teamId: user.employee.teamId,
          },
        }
      : {};

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teamId: true,
          },
        },
      },
      orderBy: [{ scheduleDate: "asc" }, { plannedStart: "asc" }],
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
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

    if (!["TEAM_LEADER", "MANAGER", "HR", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, scheduleDate, plannedStart, plannedEnd, shiftType } = body;

    if (!employeeId || !scheduleDate || !plannedStart || !plannedEnd) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const targetEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!targetEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (
      user.role === "TEAM_LEADER" &&
      targetEmployee.teamId !== user.employee.teamId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const created = await prisma.schedule.create({
      data: {
        employeeId,
        scheduleDate: new Date(scheduleDate),
        plannedStart: new Date(plannedStart),
        plannedEnd: new Date(plannedEnd),
        shiftType: shiftType || "REGULAR",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}