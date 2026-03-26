import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}