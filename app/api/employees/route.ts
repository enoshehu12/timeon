import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        salary: true,
        hourlyRate: true,
        isActive: true,
        createdAt: true,
        teamId: true,
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      employeeCode,
      firstName,
      lastName,
      email,
      password,
      role,
      salary,
      hourlyRate,
    } = body;

    if (!employeeCode || !firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const existingEmployeeCode = await prisma.employee.findUnique({
      where: { employeeCode },
    });

    if (existingEmployeeCode) {
      return NextResponse.json(
        { error: "Employee code already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as Role,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        email,
        role: role as Role,
        salary: salary ? Number(salary) : null,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        userId: user.id,
      },
    });

    return NextResponse.json({ user, employee }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}