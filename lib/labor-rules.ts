export const laborRules = {
  standardDailyHours: 8,
  standardWeeklyHours: 40,
  maximumAverageWeeklyHours: 48,
  eveningStartHour: 19,
  eveningEndHour: 22,
  nightStartHour: 22,
  nightEndHour: 6,
  eveningPremiumPct: 20,
  nightPremiumPct: 50,
  weeklyRestPremiumPct: 25,
  monthlyReferenceHours: 174,
  annualVacationDays: 22,
} as const;

export type WorkCategory =
  | "REGULAR"
  | "OVERTIME"
  | "EVENING"
  | "NIGHT"
  | "WEEKLY_REST"
  | "BANK_HOLIDAY"
  | "UNPAID_HOURS"
  | "VACATION"
  | "SICKNESS"
  | "UNPAID_LEAVE"
  | "MATERNITY_LEAVE"
  | "MARRIAGE_LEAVE"
  | "BEREAVEMENT_LEAVE"
  | "UNPAID_LATENESS";