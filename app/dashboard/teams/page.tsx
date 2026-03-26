import { requireRole } from "@/lib/auth";
import TeamsClientPage from "./teams-client";

export default async function TeamsPage() {
  await requireRole(["ADMIN", "HR", "MANAGER", "TEAM_LEADER"]);

  return <TeamsClientPage />;
}