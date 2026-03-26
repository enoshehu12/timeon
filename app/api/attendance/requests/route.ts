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

    let requests;

    if (user.role === "TEAM_LEADER") {
      requests = await prisma.attendanceRequest.findMany({
        where: {
          employee: {
            teamId: user.employee.teamId,
          },
        },
        include: {
          employee: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (["ADMIN", "HR", "MANAGER"].includes(user.role)) {
      requests = await prisma.attendanceRequest.findMany({
        include: {
          employee: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      requests = await prisma.attendanceRequest.findMany({
        where: {
          employeeId: user.employee.id,
        },
        include: {
          employee: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
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
    const { type, requestedTime } = body;

    if (!type || !requestedTime) {
      return NextResponse.json(
        { error: "Missing type or requestedTime" },
        { status: 400 }
      );
    }

    const request = await prisma.attendanceRequest.create({
      data: {
        employeeId: user.employee.id,
        type,
        requestedTime: new Date(requestedTime),
        status: "PENDING",
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}