/**
 * Simulator start date (YYYY-MM-DD). Used as epoch for age calculations.
 */

import { DAYS_PER_YEAR, SIMULATOR_START_DATE } from "./constants";

export { DAYS_PER_YEAR, SIMULATOR_START_DATE } from "./constants";

/**
 * Calendar-aware days between two dates (respects leap years).
 */
function daysBetween(dateLeft: Date | string, dateRight: Date | string): number {
  const a = new Date(dateLeft);
  const b = new Date(dateRight);
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Age in days. ageOverride = days the user already had before createdAt (prepends createdAt).
 * Formula: (currentSimulatorDate - createdAt) in days + (ageOverride ?? 0).
 */
export function getAgeInDays(
  createdAt: Date | string,
  currentSimulatorDate: Date | string,
  ageOverrideDays?: number | null
): number {
  const daysSinceCreation = daysBetween(createdAt, currentSimulatorDate);
  const override = ageOverrideDays ?? 0;
  return Math.max(0, daysSinceCreation + override);
}

/**
 * Age in years using DAYS_PER_YEAR (365.25). Returns full years (floor).
 */
export function getAgeInYears(
  createdAt: Date | string,
  currentSimulatorDate: Date | string,
  ageOverrideDays?: number | null
): number {
  const days = getAgeInDays(createdAt, currentSimulatorDate, ageOverrideDays);
  return Math.floor(days / DAYS_PER_YEAR);
}

/**
 * Age in both days and years.
 */
export function getAgeInDaysAndYears(
  createdAt: Date | string,
  currentSimulatorDate: Date | string,
  ageOverrideDays?: number | null
): { days: number; years: number } {
  const days = getAgeInDays(createdAt, currentSimulatorDate, ageOverrideDays);
  const years = Math.floor(days / DAYS_PER_YEAR);
  return { days, years };
}
