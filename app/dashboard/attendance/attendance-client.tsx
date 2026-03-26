"use client";

import { useEffect, useState } from "react";

type AttendanceRecord = {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function AttendanceClientPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const fetchRecords = async () => {
    const res = await fetch("/api/attendance");
    const data = await res.json();
    setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-2 text-gray-600">
          Këtu do menaxhohet attendance view për TL dhe Manager.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Attendance History</h2>

        {records.length === 0 ? (
          <p className="text-gray-500">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b text-sm">
                    <td className="px-4 py-3">
                      {record.employee.firstName} {record.employee.lastName}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {record.clockIn
                        ? new Date(record.clockIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {record.clockOut
                        ? new Date(record.clockOut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{record.status}</td>
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