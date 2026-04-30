/* eslint-disable @typescript-eslint/no-unused-vars */

export type Gender = "male" | "female";
export type Activity =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** age in full years from ISO date string (YYYY-MM-DD). */
export function ageFromBirthdate(birthdate: string, now: Date = new Date()): number {
  const b = new Date(birthdate);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function calcBmi(heightCm: number, weightKg: number): number {
  const h = heightCm / 100;
  return +(weightKg / (h * h)).toFixed(1);
}

/** WHO Asian-adjusted classification (used in Thailand). */
export function bmiCategory(bmi: number): "underweight" | "normal" | "overweight" | "obese" {
  if (bmi < 18.5) return "underweight";
  if (bmi < 23) return "normal";
  if (bmi < 25) return "overweight";
  return "obese";
}

/** Mifflin-St Jeor BMR, returns kcal/day. */
export function calcBmr(opts: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { gender, weightKg, heightCm, age } = opts;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

export function calcTdee(bmr: number, activity: Activity): number {
  return Math.round(bmr * ACTIVITY_FACTOR[activity]);
}

/** Daily kcal target with safety floors. */
export function calcDailyTarget(opts: {
  tdee: number;
  goal: Goal;
  gender: Gender;
}): number {
  const { tdee, goal, gender } = opts;
  let target = tdee;
  if (goal === "lose") target = tdee - 500;
  if (goal === "gain") target = tdee + 300;
  const floor = gender === "female" ? 1200 : 1500;
  return Math.max(floor, Math.round(target));
}

/** All-in-one helper used by onboarding & profile updates. */
export function computeTargets(input: {
  gender: Gender;
  birthdate: string;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}) {
  const age = ageFromBirthdate(input.birthdate);
  const bmi = calcBmi(input.heightCm, input.weightKg);
  const bmr = calcBmr({
    gender: input.gender,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age,
  });
  const tdee = calcTdee(bmr, input.activity);
  const dailyTarget = calcDailyTarget({
    tdee,
    goal: input.goal,
    gender: input.gender,
  });
  return { age, bmi, bmiCategory: bmiCategory(bmi), bmr, tdee, dailyTarget };
}

/** Format YYYY-MM-DD in given IANA timezone. */
export function localDate(tz: string = "Asia/Bangkok", at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}
