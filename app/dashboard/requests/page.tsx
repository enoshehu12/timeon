import { requireRole } from "@/lib/auth";
import RequestsClientPage from "./requests-client";

export default async function RequestsPage() {
  await requireRole(["ADMIN", "HR", "MANAGER", "TEAM_LEADER"]);

  return <RequestsClientPage />;
}