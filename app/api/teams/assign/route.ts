import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { teamId, employeeId, leaderId, action } = body;

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    if (action === "assignLeader") {
      if (!leaderId) {
        return NextResponse.json({ error: "leaderId is required" }, { status: 400 });
      }

      const leader = await prisma.employee.findUnique({
        where: { id: leaderId },
      });

      if (!leader) {
        return NextResponse.json({ error: "Leader not found" }, { status: 404 });
      }

      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          leaderId,
        },
      });

      return NextResponse.json(updatedTeam);
    }

    if (action === "assignEmployee") {
      if (!employeeId) {
        return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
      }

      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          teamId,
        },
      });

      return NextResponse.json(updatedEmployee);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to assign team data" },
      { status: 500 }
    );
  }
}