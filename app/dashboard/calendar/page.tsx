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

  const [scheduleForm, setScheduleForm] = useState({
    employeeId: "",
    scheduleDate: "",
    plannedStartTime: "",
    plannedEndTime: "",
    shiftType: "REGULAR",
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

  const getAttendanceForDay = (day: Date) => {
    return attendance.find((a) => {
      const d = new Date(a.date);
      return d.toDateString() === day.toDateString();
    });
  };

  const getScheduleForDay = (day: Date) => {
    return mySchedules.find((s) => {
      const d = new Date(s.scheduleDate);
      return d.toDateString() === day.toDateString();
    });
  };

  const getRequestsForDay = (day: Date) => {
    return requests.filter((r) => {
      const d = new Date(r.requestedTime);
      return d.toDateString() === day.toDateString() && r.status === "PENDING";
    });
  };

  const isVacationDay = (day: Date) => {
    return vacations.find((v) => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const current = new Date(day);
      current.setHours(12, 0, 0, 0);

      return current >= start && current <= end;
    });
  };

  const calculateHours = (clockIn: string, clockOut: string) => {
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    return (end - start) / (1000 * 60 * 60);
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShift = (schedule?: Schedule) => {
    if (!schedule) return null;
    return `${formatTime(schedule.plannedStart)} - ${formatTime(
      schedule.plannedEnd
    )}`;
  };

  const sendSchedule = async () => {
    const { employeeId, scheduleDate, plannedStartTime, plannedEndTime, shiftType } =
      scheduleForm;

    if (!employeeId || !scheduleDate || !plannedStartTime || !plannedEndTime) {
      return;
    }

    const plannedStart = `${scheduleDate}T${plannedStartTime}`;
    const plannedEnd = `${scheduleDate}T${plannedEndTime}`;

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId,
        scheduleDate,
        plannedStart,
        plannedEnd,
        shiftType,
      }),
    });

    if (res.ok) {
      setScheduleForm({
        employeeId: "",
        scheduleDate: "",
        plannedStartTime: "",
        plannedEndTime: "",
        shiftType: "REGULAR",
      });

      loadMyData();
      loadTeamData();
    }
  };

  const teamMembers = useMemo(() => {
    if (!canSeeTeamView) return [];
    return employees.filter((emp) => emp.role !== "ADMIN");
  }, [employees, canSeeTeamView]);

  const getTeamSchedule = (employeeId: string, day: Date) => {
    return teamSchedules.find((s) => {
      const d = new Date(s.scheduleDate);
      return s.employeeId === employeeId && d.toDateString() === day.toDateString();
    });
  };

  const getTeamRequestCountForDay = (employeeId: string, day: Date) => {
    return requests.filter((r) => {
      const d = new Date(r.requestedTime);
      const reqEmployeeId =
        (r.employee as { id?: string } | undefined)?.id || "";
      return (
        reqEmployeeId === employeeId &&
        d.toDateString() === day.toDateString() &&
        r.status === "PENDING"
      );
    }).length;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="mt-2 text-gray-600">
            {view === "MY"
              ? "Shih turnin, attendance dhe kërkesat e tua."
              : "Shih team-in, turnet dhe kërkesat pending."}
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
        <>
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
        </>
      )}

      {view === "TEAM" && canSeeTeamView && (
        <>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Assign Shift</h2>

            <div className="grid gap-3 md:grid-cols-5">
              <select
                value={scheduleForm.employeeId}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    employeeId: e.target.value,
                  }))
                }
                className="rounded-lg border border-gray-300 p-3"
              >
                <option value="">Select employee</option>
                {teamMembers.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={scheduleForm.scheduleDate}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    scheduleDate: e.target.value,
                  }))
                }
                className="rounded-lg border border-gray-300 p-3"
              />

              <input
                type="time"
                value={scheduleForm.plannedStartTime}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    plannedStartTime: e.target.value,
                  }))
                }
                className="rounded-lg border border-gray-300 p-3"
              />

              <input
                type="time"
                value={scheduleForm.plannedEndTime}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    plannedEndTime: e.target.value,
                  }))
                }
                className="rounded-lg border border-gray-300 p-3"
              />

              <button
                onClick={sendSchedule}
                className="rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800"
              >
                Save Shift
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-sm">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="px-4 py-3">Employee</th>
                  {days.map((day) => (
                    <th key={day.toISOString()} className="px-4 py-3">
                      {day.getDate()}
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

                    {days.map((day) => {
                      const schedule = getTeamSchedule(employee.id, day);
                      const pendingCount = getTeamRequestCountForDay(
                        employee.id,
                        day
                      );

                      return (
                        <td key={day.toISOString()} className="px-3 py-3">
                          <div className="min-w-[100px] rounded-lg bg-gray-50 p-2 text-xs">
                            {schedule ? (
                              <p className="text-blue-600">
                                {formatShift(schedule)}
                              </p>
                            ) : (
                              <p className="text-gray-400">No shift</p>
                            )}

                            {pendingCount > 0 && (
                              <p className="mt-1 text-yellow-600">
                                {pendingCount} pending
                              </p>
                            )}
                          </div>
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