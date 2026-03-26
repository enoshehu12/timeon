import { requireRole } from "@/lib/auth";
import AttendanceClientPage from "./attendance-client";

export default async function AttendancePage() {
  await requireRole(["ADMIN", "HR", "MANAGER", "TEAM_LEADER"]);

  return <AttendanceClientPage />;
}