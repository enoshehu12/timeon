import { laborRules } from "@/lib/labor-rules";

type AttendanceLike = {
  date: Date | string;
  clockIn: Date | string | null;
  clockOut: Date | string | null;
};

type ScheduleLike = {
  scheduleDate: Date | string;
  plannedStart: Date | string;
  plannedEnd: Date | string;
  breakMinutes?: number | null;
  shiftType?: string | null;
};

type VacationLike = {
  startDate: Date | string;
  endDate: Date | string;
  status: string;
};

type SummaryInput = {
  attendances: AttendanceLike[];
  schedules?: ScheduleLike[];
  vacations?: VacationLike[];
  holidays?: Date[];
};

export type MonthlySummary = {
  workedHours: number;
  regularHours: number;
  overtimeHours: number;
  eveningHours: number;
  nightHours: number;
  weeklyRestHours: number;
  holidayHours: number;
  unpaidHours: number;
  approvedVacationDays: number;
  incompleteDays: number;
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function round1(n: number) {
  return Number(n.toFixed(1));
}

function diffHours(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function isSunday(date: Date) {
  return date.getDay() === 0;
}

function isHoliday(date: Date, holidays: Date[]) {
  return holidays.some((h) => sameDay(h, date));
}

function approvedVacationForDay(day: Date, vacations: VacationLike[]) {
  return vacations.some((v) => {
    if (v.status !== "APPROVED") return false;

    const start = toDate(v.startDate);
    const end = toDate(v.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const current = new Date(day);
    current.setHours(12, 0, 0, 0);

    return current >= start && current <= end;
  });
}

function countApprovedVacationDays(vacations: VacationLike[]) {
  return vacations
    .filter((v) => v.status === "APPROVED")
    .reduce((acc, v) => {
      const start = toDate(v.startDate);
      const end = toDate(v.endDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      const diff =
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return acc + Math.max(diff, 0);
    }, 0);
}

function getScheduleForAttendance(
  attendanceDate: Date,
  schedules: ScheduleLike[]
): ScheduleLike | undefined {
  return schedules.find((s) => sameDay(toDate(s.scheduleDate), attendanceDate));
}

function getScheduledPaidHours(schedule?: ScheduleLike) {
  if (!schedule) return laborRules.standardDailyHours;

  const start = toDate(schedule.plannedStart);
  const end = toDate(schedule.plannedEnd);
  const breakMinutes = schedule.breakMinutes ?? 0;

  const gross = diffHours(start, end);
  const net = gross - breakMinutes / 60;

  return Math.max(net, 0);
}

function calculateEveningAndNightHours(start: Date, end: Date) {
  let eveningHours = 0;
  let nightHours = 0;

  let cursor = new Date(start);

  while (cursor < end) {
    const next = new Date(cursor.getTime() + 30 * 60 * 1000);
    const sliceEnd = next < end ? next : end;
    const sliceHours = diffHours(cursor, sliceEnd);
    const hour = cursor.getHours();

    if (
      hour >= laborRules.eveningStartHour &&
      hour < laborRules.eveningEndHour
    ) {
      eveningHours += sliceHours;
    } else if (
      hour >= laborRules.nightStartHour ||
      hour < laborRules.nightEndHour
    ) {
      nightHours += sliceHours;
    }

    cursor = next;
  }

  return { eveningHours, nightHours };
}

export function buildMonthlySummary({
  attendances,
  schedules = [],
  vacations = [],
  holidays = [],
}: SummaryInput): MonthlySummary {
  let workedHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let eveningHours = 0;
  let nightHours = 0;
  let weeklyRestHours = 0;
  let holidayHours = 0;
  let unpaidHours = 0;
  let incompleteDays = 0;

  for (const attendance of attendances) {
    const attendanceDate = toDate(attendance.date);
    const vacationApproved = approvedVacationForDay(attendanceDate, vacations);

    if (vacationApproved) continue;

    if (!attendance.clockIn || !attendance.clockOut) {
      incompleteDays += 1;
      continue;
    }

    const start = toDate(attendance.clockIn);
    const end = toDate(attendance.clockOut);

    const totalWorked = Math.max(diffHours(start, end), 0);
    const schedule = getScheduleForAttendance(attendanceDate, schedules);
    const scheduledPaidHours = getScheduledPaidHours(schedule);

    workedHours += totalWorked;

    if (totalWorked <= scheduledPaidHours) {
      regularHours += totalWorked;
    } else {
      regularHours += scheduledPaidHours;
      overtimeHours += totalWorked - scheduledPaidHours;
    }

    if (totalWorked < scheduledPaidHours) {
      unpaidHours += scheduledPaidHours - totalWorked;
    }

    const split = calculateEveningAndNightHours(start, end);
    eveningHours += split.eveningHours;
    nightHours += split.nightHours;

    if (isSunday(attendanceDate)) {
      weeklyRestHours += totalWorked;
    }

    if (isHoliday(attendanceDate, holidays)) {
      holidayHours += totalWorked;
    }
  }

  return {
    workedHours: round1(workedHours),
    regularHours: round1(regularHours),
    overtimeHours: round1(overtimeHours),
    eveningHours: round1(eveningHours),
    nightHours: round1(nightHours),
    weeklyRestHours: round1(weeklyRestHours),
    holidayHours: round1(holidayHours),
    unpaidHours: round1(unpaidHours),
    approvedVacationDays: countApprovedVacationDays(vacations),
    incompleteDays,
  };
}