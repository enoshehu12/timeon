"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type Attendance = {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
};

type Vacation = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
};

type Schedule = {
  id: string;
  employeeId: string;
  scheduleDate: string;
  plannedStart: string;
  plannedEnd: string;
  breakMinutes?: number | null;
  shiftType?: string | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    teamId?: string | null;
  };
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teamId?: string | null;
};

type AttendanceRequest = {
  id: string;
  type: string;
  requestedTime: string;
  status: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type ShiftType =
  | "REGULAR"
  | "OFF"
  | "UNPAID_LEAVE"
  | "SICKNESS"
  | "BANK_HOLIDAY"
  | "MATERNITY_LEAVE"
  | "MARRIAGE_LEAVE"
  | "BEREAVEMENT_LEAVE"
  | "UNPAID_LATENESS";

const SHIFT_OPTIONS: ShiftType[] = [
  "REGULAR",
  "OFF",
  "UNPAID_LEAVE",
  "SICKNESS",
  "BANK_HOLIDAY",
  "MATERNITY_LEAVE",
  "MARRIAGE_LEAVE",
  "BEREAVEMENT_LEAVE",
  "UNPAID_LATENESS",
];

const QUICK_SHIFTS = [
  { label: "09:00 - 17:00", start: "09:00", end: "17:00", breakMinutes: 30 },
  { label: "14:00 - 22:00", start: "14:00", end: "22:00", breakMinutes: 30 },
  { label: "22:00 - 06:00", start: "22:00", end: "06:00", breakMinutes: 45 },
  { label: "OFF", start: "", end: "", breakMinutes: 0, shiftType: "OFF" as ShiftType },
];

export default function CalendarPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const [days, setDays] = useState<Date[]>([]);
  const [view, setView] = useState<"MY" | "TEAM">("MY");

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [teamSchedules, setTeamSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);

  const [weekStart, setWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: string;
    employeeName: string;
    date: string;
  } | null>(null);

  const [shiftEditor, setShiftEditor] = useState({
    plannedStartTime: "",
    plannedEndTime: "",
    breakMinutes: 30,
    shiftType: "REGULAR" as ShiftType,
  });

  const canSeeTeamView = ["TEAM_LEADER", "MANAGER", "HR", "ADMIN"].includes(
    role || ""
  );

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    const daysArray: Date[] = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      daysArray.push(new Date(year, month, i));
    }

    setDays(daysArray);
  }, []);

  const loadMyData = async () => {
    const [attendanceRes, vacationRes, schedulesRes, requestsRes] =
      await Promise.all([
        fetch("/api/calendar"),
        fetch("/api/vacation"),
        fetch("/api/schedules"),
        fetch("/api/attendance/requests"),
      ]);

    setAttendance(await attendanceRes.json());
    setVacations(await vacationRes.json());
    setMySchedules(await schedulesRes.json());
    setRequests(await requestsRes.json());
  };

  const loadTeamData = async () => {
    if (!canSeeTeamView) return;

    const [employeesRes, schedulesRes, requestsRes] = await Promise.all([
      fetch("/api/employees"),
      fetch("/api/schedules"),
      fetch("/api/attendance/requests"),
    ]);

    const employeesData = await employeesRes.json();
    const schedulesData = await schedulesRes.json();
    const requestsData = await requestsRes.json();

    setEmployees(employeesData);
    setTeamSchedules(schedulesData);
    setRequests(requestsData);
  };

  useEffect(() => {
    loadMyData();
    loadTeamData();
  }, [role]);

  function getAttendanceForDay(day: Date) {
    return attendance.find((a) => {
      const d = new Date(a.date);
      return d.toDateString() === day.toDateString();
    });
  }

  function getScheduleForDay(day: Date) {
    return mySchedules.find((s) => {
      const d = new Date(s.scheduleDate);
      return d.toDateString() === day.toDateString();
    });
  }

  function getRequestsForDay(day: Date) {
    return requests.filter((r) => {
      const d = new Date(r.requestedTime);
      return d.toDateString() === day.toDateString() && r.status === "PENDING";
    });
  }

  function isVacationDay(day: Date) {
    return vacations.find((v) => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const current = new Date(day);
      current.setHours(12, 0, 0, 0);

      return current >= start && current <= end;
    });
  }

  function calculateHours(clockIn: string, clockOut: string) {
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    return (end - start) / (1000 * 60 * 60);
  }

  function formatTime(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatShift(schedule?: Schedule) {
    if (!schedule) return null;

    if (schedule.shiftType && schedule.shiftType !== "REGULAR") {
      return schedule.shiftType.replaceAll("_", " ");
    }

    return `${formatTime(schedule.plannedStart)} - ${formatTime(
      schedule.plannedEnd
    )}`;
  }

  function formatDateForInput(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getWeekDays(start: Date) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function shiftWeek(direction: "prev" | "next") {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + (direction === "next" ? 7 : -7));
    setWeekStart(next);
  }

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const teamMembers = useMemo(() => {
    if (!canSeeTeamView) return [];
    return employees.filter((emp) => emp.role !== "ADMIN");
  }, [employees, canSeeTeamView]);

  function getTeamSchedule(employeeId: string, day: Date) {
    return teamSchedules.find((s) => {
      const d = new Date(s.scheduleDate);
      return s.employeeId === employeeId && d.toDateString() === day.toDateString();
    });
  }

  function getTeamRequestCountForDay(employeeId: string, day: Date) {
    return requests.filter((r) => {
      const d = new Date(r.requestedTime);
      const reqEmployeeId = (r.employee as { id?: string } | undefined)?.id || "";
      return (
        reqEmployeeId === employeeId &&
        d.toDateString() === day.toDateString() &&
        r.status === "PENDING"
      );
    }).length;
  }

  function openShiftEditor(employee: Employee, day: Date) {
    const existing = getTeamSchedule(employee.id, day);

    setSelectedCell({
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: formatDateForInput(day),
    });

    if (existing) {
      const start = existing.plannedStart
        ? new Date(existing.plannedStart).toTimeString().slice(0, 5)
        : "";
      const end = existing.plannedEnd
        ? new Date(existing.plannedEnd).toTimeString().slice(0, 5)
        : "";

      setShiftEditor({
        plannedStartTime: start,
        plannedEndTime: end,
        breakMinutes: existing.breakMinutes ?? 0,
        shiftType: (existing.shiftType as ShiftType) || "REGULAR",
      });
    } else {
      setShiftEditor({
        plannedStartTime: "",
        plannedEndTime: "",
        breakMinutes: 30,
        shiftType: "REGULAR",
      });
    }
  }

  function applyQuickShift(shift: {
    start: string;
    end: string;
    breakMinutes: number;
    shiftType?: ShiftType;
  }) {
    setShiftEditor((prev) => ({
      ...prev,
      plannedStartTime: shift.start,
      plannedEndTime: shift.end,
      breakMinutes: shift.breakMinutes,
      shiftType: shift.shiftType || "REGULAR",
    }));
  }

  const shiftNeedsTime =
    shiftEditor.shiftType === "REGULAR" || shiftEditor.shiftType === "UNPAID_LATENESS";

  async function saveShift() {
    if (!selectedCell) return;

    const { employeeId, date } = selectedCell;

    if (shiftNeedsTime && (!shiftEditor.plannedStartTime || !shiftEditor.plannedEndTime)) {
      return;
    }

    const plannedStart = shiftNeedsTime
      ? `${date}T${shiftEditor.plannedStartTime}`
      : `${date}T00:00`;

    const plannedEnd = shiftNeedsTime
      ? `${date}T${shiftEditor.plannedEndTime}`
      : `${date}T00:00`;

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId,
        scheduleDate: date,
        plannedStart,
        plannedEnd,
        breakMinutes: shiftNeedsTime ? shiftEditor.breakMinutes : 0,
        shiftType: shiftEditor.shiftType,
      }),
    });

    if (res.ok) {
      setSelectedCell(null);
      await loadMyData();
      await loadTeamData();
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="mt-2 text-gray-600">
            {view === "MY"
              ? "Shih turnin, attendance dhe kërkesat e tua."
              : "Shih team-in dhe menaxho turnet javore."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView("MY")}
            className={`rounded-lg px-4 py-2 ${
              view === "MY"
                ? "bg-black text-white"
                : "bg-white text-gray-700 shadow-sm"
            }`}
          >
            My View
          </button>

          {canSeeTeamView && (
            <button
              onClick={() => setView("TEAM")}
              className={`rounded-lg px-4 py-2 ${
                view === "TEAM"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 shadow-sm"
              }`}
            >
              Team View
            </button>
          )}
        </div>
      </div>

      {view === "MY" && (
        <div className="grid grid-cols-7 gap-3">
          {days.map((day, index) => {
            const record = getAttendanceForDay(day);
            const vacation = isVacationDay(day);
            const schedule = getScheduleForDay(day);
            const pendingRequests = getRequestsForDay(day);

            let content = <span className="text-gray-400">No data</span>;

            if (vacation) {
              content = (
                <div className="space-y-1 text-xs">
                  <p className="text-green-600">🌴 Vacation</p>
                  <p className="text-yellow-500">
                    {vacation.status === "PENDING" ? "Pending" : "Approved"}
                  </p>
                </div>
              );
            } else if (record?.clockIn && record?.clockOut) {
              const hours = calculateHours(record.clockIn, record.clockOut);

              content = (
                <div className="space-y-1 text-xs">
                  {schedule && (
                    <p className="text-blue-600">
                      Shift: {formatShift(schedule)}
                    </p>
                  )}

                  <p>
                    Actual: {formatTime(record.clockIn)} -{" "}
                    {formatTime(record.clockOut)}
                  </p>

                  <p className="text-green-600">{hours.toFixed(1)}h worked</p>

                  {hours < 8 && (
                    <p className="text-red-500">
                      -{(8 - hours).toFixed(1)}h unpaid
                    </p>
                  )}

                  {pendingRequests.length > 0 && (
                    <p className="text-yellow-600">
                      {pendingRequests.length} pending request
                    </p>
                  )}
                </div>
              );
            } else if (record?.clockIn && !record.clockOut) {
              content = (
                <div className="space-y-1 text-xs">
                  {schedule && (
                    <p className="text-blue-600">
                      Shift: {formatShift(schedule)}
                    </p>
                  )}
                  <p className="text-yellow-600">Clocked in only</p>
                  {pendingRequests.length > 0 && (
                    <p className="text-yellow-600">
                      {pendingRequests.length} pending request
                    </p>
                  )}
                </div>
              );
            } else if (schedule) {
              content = (
                <div className="space-y-1 text-xs">
                  <p className="text-blue-600">
                    Shift: {formatShift(schedule)}
                  </p>
                  {schedule.breakMinutes ? (
                    <p className="text-gray-500">Break: {schedule.breakMinutes}m</p>
                  ) : null}
                  {pendingRequests.length > 0 ? (
                    <p className="text-yellow-600">
                      {pendingRequests.length} pending request
                    </p>
                  ) : (
                    <p className="text-gray-400">No attendance yet</p>
                  )}
                </div>
              );
            }

            return (
              <div
                key={index}
                className="rounded-xl border bg-white p-3 shadow-sm"
              >
                <p className="text-sm font-semibold">{day.getDate()}</p>
                <div className="mt-2">{content}</div>
              </div>
            );
          })}
        </div>
      )}

      {view === "TEAM" && canSeeTeamView && (
        <>
          <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <button
              onClick={() => shiftWeek("prev")}
              className="rounded-lg border px-4 py-2"
            >
              ← Previous Week
            </button>

            <div className="font-medium">
              {weekDays[0].toLocaleDateString()} -{" "}
              {weekDays[6].toLocaleDateString()}
            </div>

            <button
              onClick={() => shiftWeek("next")}
              className="rounded-lg border px-4 py-2"
            >
              Next Week →
            </button>
          </div>

          {selectedCell && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Edit Shift</h2>
                  <p className="text-sm text-gray-500">
                    {selectedCell.employeeName} • {selectedCell.date}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCell(null)}
                  className="rounded-lg border px-4 py-2"
                >
                  Close
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {QUICK_SHIFTS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => applyQuickShift(q)}
                    className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Reason / Status</label>
                  <select
                    value={shiftEditor.shiftType}
                    onChange={(e) =>
                      setShiftEditor((prev) => ({
                        ...prev,
                        shiftType: e.target.value as ShiftType,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3"
                  >
                    {SHIFT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Start Time</label>
                  <input
                    type="time"
                    value={shiftEditor.plannedStartTime}
                    disabled={!shiftNeedsTime}
                    onChange={(e) =>
                      setShiftEditor((prev) => ({
                        ...prev,
                        plannedStartTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">End Time</label>
                  <input
                    type="time"
                    value={shiftEditor.plannedEndTime}
                    disabled={!shiftNeedsTime}
                    onChange={(e) =>
                      setShiftEditor((prev) => ({
                        ...prev,
                        plannedEndTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Break (minutes)</label>
                  <input
                    type="number"
                    min={0}
                    disabled={!shiftNeedsTime}
                    value={shiftEditor.breakMinutes}
                    onChange={(e) =>
                      setShiftEditor((prev) => ({
                        ...prev,
                        breakMinutes: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="mt-5">
                <button
                  onClick={saveShift}
                  className="rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800"
                >
                  Save Shift
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-sm">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="px-4 py-3">Employee</th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="px-4 py-3">
                      <div className="font-medium">
                        {day.toLocaleDateString([], {
                          weekday: "short",
                        })}
                      </div>
                      <div>{day.getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((employee) => (
                  <tr key={employee.id} className="border-b align-top">
                    <td className="px-4 py-3 font-medium">
                      {employee.firstName} {employee.lastName}
                    </td>

                    {weekDays.map((day) => {
                      const schedule = getTeamSchedule(employee.id, day);
                      const pendingCount = getTeamRequestCountForDay(employee.id, day);

                      return (
                        <td key={day.toISOString()} className="px-3 py-3">
                          <button
                            onClick={() => openShiftEditor(employee, day)}
                            className="min-w-[140px] rounded-xl border bg-gray-50 p-3 text-left hover:bg-gray-100"
                          >
                            {schedule ? (
                              <>
                                <p className="text-sm font-medium text-blue-600">
                                  {formatShift(schedule)}
                                </p>
                                {schedule.breakMinutes ? (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Break {schedule.breakMinutes}m
                                  </p>
                                ) : null}
                              </>
                            ) : (
                              <p className="text-sm text-gray-400">Set shift</p>
                            )}

                            {pendingCount > 0 && (
                              <p className="mt-2 text-xs text-yellow-600">
                                {pendingCount} pending
                              </p>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}