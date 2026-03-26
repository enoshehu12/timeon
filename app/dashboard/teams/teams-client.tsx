"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teamId?: string | null;
};

type Team = {
  id: string;
  name: string;
  leaderId?: string | null;
  leader?: Employee | null;
  employees: Employee[];
};

export default function TeamsClientPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const fetchTeams = async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(data);
  };

  const fetchEmployees = async () => {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data);
  };

  useEffect(() => {
    fetchTeams();
    fetchEmployees();
  }, []);

  const createTeam = async () => {
    if (!name.trim()) return;

    setMessage("");

    const res = await fetch("/api/teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      setMessage("Failed to create team");
      return;
    }

    setName("");
    setMessage("Team created successfully ✅");
    fetchTeams();
  };

  const assignLeader = async (teamId: string, leaderId: string) => {
    await fetch("/api/teams/assign", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamId,
        leaderId,
        action: "assignLeader",
      }),
    });

    fetchTeams();
    fetchEmployees();
  };

  const assignEmployee = async (teamId: string, employeeId: string) => {
    await fetch("/api/teams/assign", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamId,
        employeeId,
        action: "assignEmployee",
      }),
    });

    fetchTeams();
    fetchEmployees();
  };

  const teamLeaders = employees.filter((emp) => emp.role === "TEAM_LEADER");
  const unassignedEmployees = employees.filter((emp) => !emp.teamId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <p className="mt-2 text-gray-600">
          Krijo team-e dhe cakto Team Leaders dhe punonjësit.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team name"
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black md:max-w-sm"
          />
          <button
            onClick={createTeam}
            className="rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800"
          >
            Create
          </button>
        </div>

        {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
      </div>

      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{team.name}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Employees: {team.employees.length}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Leader:{" "}
                  {team.leader
                    ? `${team.leader.firstName} ${team.leader.lastName}`
                    : "Not assigned"}
                </p>
              </div>

              <div className="grid gap-3 md:min-w-[280px]">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Assign Team Leader
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) assignLeader(team.id, e.target.value);
                    }}
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
                  >
                    <option value="">Select leader</option>
                    {teamLeaders.map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.firstName} {leader.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Assign Employee
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) assignEmployee(team.id, e.target.value);
                    }}
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
                  >
                    <option value="">Select employee</option>
                    {unassignedEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} - {employee.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {team.employees.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  Team Members
                </h3>
                <div className="flex flex-wrap gap-2">
                  {team.employees.map((employee) => (
                    <span
                      key={employee.id}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {employee.firstName} {employee.lastName} · {employee.role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}