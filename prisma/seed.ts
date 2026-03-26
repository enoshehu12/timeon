import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("1234", 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@timeon.com" },
  });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        email: "admin@timeon.com",
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    await prisma.employee.create({
      data: {
        employeeCode: "ADM001",
        firstName: "System",
        lastName: "Admin",
        email: "admin@timeon.com",
        role: Role.ADMIN,
        userId: user.id,
        isActive: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });