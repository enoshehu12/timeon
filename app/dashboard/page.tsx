"use client";

import { useEffect, useMemo, useState } from "react";

type SummaryResponse = {
  month: string;
  hourlyRate: number | null;
  totals: {
    workedHours: number;
    regularHours: number;
    overtimeHours: number;
    eveningHours: number;
    nightHours: number;
    weeklyRestHours: number;
    holidayHours: number;
    unpaidHours: number;
    approvedVacationDays: number;
    pendingAttendanceRequests: number;
    incompleteDays: number;
  };
};

type StatusResponse = {
  status: "NOT_CLOCKED" | "CLOCKED_IN" | "CLOCKED_OUT";
  todayAttendance: {
    clockIn: string | null;
    clockOut: string | null;
  } | null;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [message, setMessage] = useState("");
  const [requestType, setRequestType] = useState("CLOCK_IN");
  const [requestTime, setRequestTime] = useState("");
  const [isReady, setIsReady] = useState(false);

  const loadData = async () => {
    try {
      const [summaryRes, statusRes] = await Promise.all([
        fetch("/dashboard/summary"),
        fetch("/dashboard/status"),
      ]);

      const summaryData = await summaryRes.json();
      const statusData = await statusRes.json();

      setSummary(summaryData);
      setStatus(statusData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClockIn = async () => {
    setMessage("");

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "CLOCK_IN" }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Clock in failed");
      return;
    }

    setMessage("Clock in successful ✅");
    loadData();
  };

  const handleClockOut = async () => {
    setMessage("");

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "CLOCK_OUT" }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Clock out failed");
      return;
    }

    setMessage("Clock out successful ✅");
    loadData();
  };

  const handleMissedPunchRequest = async () => {
    if (!requestTime) return;

    setMessage("");

    const res = await fetch("/api/attendance/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: requestType,
        requestedTime: requestTime,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Request failed");
      return;
    }

    setMessage("Missed clock request sent ✅");
    setRequestTime("");
    loadData();
  };

  const currentStatusLabel = useMemo(() => {
    if (!isReady) return "—";
    if (!status) return "Unavailable";
    if (status.status === "NOT_CLOCKED") return "Not clocked today";
    if (status.status === "CLOCKED_IN") return "Clocked in";
    return "Clocked out";
  }, [status, isReady]);

  const cards = summary
    ? [
        { label: "Worked Hours", value: `${summary.totals.workedHours}h` },
        summary.totals.regularHours > 0
          ? { label: "Regular Hours", value: `${summary.totals.regularHours}h` }
          : null,
        summary.totals.overtimeHours > 0
          ? { label: "Overtime", value: `${summary.totals.overtimeHours}h` }
          : null,
        summary.totals.eveningHours > 0
          ? { label: "Evening Hours", value: `${summary.totals.eveningHours}h` }
          : null,
        summary.totals.nightHours > 0
          ? { label: "Night Hours", value: `${summary.totals.nightHours}h` }
          : null,
        summary.totals.weeklyRestHours > 0
          ? { label: "Weekly Rest Day", value: `${summary.totals.weeklyRestHours}h` }
          : null,
        summary.totals.holidayHours > 0
          ? { label: "Holiday Hours", value: `${summary.totals.holidayHours}h` }
          : null,
        summary.totals.unpaidHours > 0
          ? { label: "Unpaid Hours", value: `${summary.totals.unpaidHours}h` }
          : null,
        summary.totals.approvedVacationDays > 0
          ? {
              label: "Vacation Days",
              value: `${summary.totals.approvedVacationDays} days`,
            }
          : null,
        summary.totals.pendingAttendanceRequests > 0
          ? {
              label: "Pending Requests",
              value: `${summary.totals.pendingAttendanceRequests}`,
            }
          : null,
        summary.totals.incompleteDays > 0
          ? {
              label: "Incomplete Days",
              value: `${summary.totals.incompleteDays}`,
            }
          : null,
        summary.hourlyRate
          ? {
              label: "Hourly Rate",
              value: `${summary.hourlyRate}`,
            }
          : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Statusi i sotëm dhe përmbledhja e muajit aktual.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Today Status</h2>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {currentStatusLabel}
          </span>

          {status?.todayAttendance?.clockIn && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              In:{" "}
              {new Date(status.todayAttendance.clockIn).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {status?.todayAttendance?.clockOut && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
              Out:{" "}
              {new Date(status.todayAttendance.clockOut).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleClockIn}
            className="rounded-lg bg-green-600 px-5 py-3 text-white transition hover:bg-green-700"
          >
            Clock In
          </button>

          <button
            onClick={handleClockOut}
            className="rounded-lg bg-red-600 px-5 py-3 text-white transition hover:bg-red-700"
          >
            Clock Out
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Missed Clock Requests</h2>

        <div className="flex flex-col gap-3 md:flex-row">
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="rounded-lg border border-gray-300 p-3"
          >
            <option value="CLOCK_IN">Request Missed Clock In</option>
            <option value="CLOCK_OUT">Request Missed Clock Out</option>
          </select>

          <input
            type="datetime-local"
            value={requestTime}
            onChange={(e) => setRequestTime(e.target.value)}
            className="rounded-lg border border-gray-300 p-3"
          />

          <button
            onClick={handleMissedPunchRequest}
            className="rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800"
          >
            Send Request
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Current Month Summary</h2>

        {!isReady ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-500">
            Preparing summary...
          </div>
        ) : !summary ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm text-red-500">
            Summary unavailable.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => {
              const item = card as { label: string; value: string };

              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}