import { requireRole } from "@/lib/auth";
import EmployeesClientPage from "./employees-client";

export default async function EmployeesPage() {
  await requireRole(["ADMIN", "HR", "MANAGER", "TEAM_LEADER"]);

  return <EmployeesClientPage />;
}