"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  salary: number | null;
  hourlyRate: number | null;
  isActive: boolean;
  createdAt: string;
  teamId?: string | null;
};

export default function EmployeesClientPage() {
  const [form, setForm] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    salary: "",
    hourlyRate: "",
  });

  const [message, setMessage] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Something went wrong");
      return;
    }

    setMessage("Employee created successfully ✅");

    setForm({
      employeeCode: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      salary: "",
      hourlyRate: "",
    });

    fetchEmployees();
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      case "HR":
        return "bg-blue-100 text-blue-700";
      case "MANAGER":
        return "bg-green-100 text-green-700";
      case "TEAM_LEADER":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <p className="mt-2 text-gray-600">
          Krijo dhe menaxho punonjësit e TimeOn.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Employee Code</label>
          <input
            name="employeeCode"
            value={form.employeeCode}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">First Name</label>
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Last Name</label>
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
          >
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="TEAM_LEADER">TEAM_LEADER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="HR">HR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Salary</label>
          <input
            name="salary"
            type="number"
            value={form.salary}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Hourly Rate</label>
          <input
            name="hourlyRate"
            type="number"
            value={form.hourlyRate}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800"
          >
            Create Employee
          </button>

          {message && <p className="text-sm text-gray-700">{message}</p>}
        </div>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Employee List</h2>
          <span className="text-sm text-gray-500">
            Total: {employees.length}
          </span>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="text-gray-500">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Salary</th>
                  <th className="px-4 py-3">Hourly Rate</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b text-sm">
                    <td className="px-4 py-3 font-medium">
                      {employee.employeeCode}
                    </td>
                    <td className="px-4 py-3">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="px-4 py-3">{employee.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeClass(
                          employee.role
                        )}`}
                      >
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          employee.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {employee.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{employee.salary ?? "-"}</td>
                    <td className="px-4 py-3">{employee.hourlyRate ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}