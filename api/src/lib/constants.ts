/**
 * Centralized numeric and string constants used across lib and services.
 * Grouped by domain for clarity.
 */

// ——— Survival (gather, scavenge, health/hunger/hydration) ———

/** Success rate 0–100 for gathering food from state. */
export const GATHER_SUCCESS_RATE = 70;

/** Success rate 0–100 for scavenging water from state. */
export const SCAVENGE_WATER_SUCCESS_RATE = 60;

/** Amount of food transferred from state to user on successful gather. */
export const GATHER_FOOD_AMOUNT = 5;

/** Amount of water transferred from state to user on successful scavenge. */
export const SCAVENGE_WATER_AMOUNT = 5;

/** Hunger increase per unit of food consumed (eat). Capped at 100. */
export const HUNGER_PER_FOOD_UNIT = 10;

/** Hydration increase per unit of water consumed (drink). Capped at 100. */
export const HYDRATION_PER_WATER_UNIT = 10;

/** Health decrease per tick when hunger or hydration is below threshold. */
export const HEALTH_DECAY_PER_TICK = 2;

/** Health increase per tick when both hunger and hydration above high threshold. */
export const HEALTH_REGEN_PER_TICK = 2;

/** Below this (0–100), health decays each tick. */
export const HUNGER_HYDRATION_LOW_THRESHOLD = 30;

/** Above this (0–100) for both, health regens each tick. */
export const HUNGER_HYDRATION_HIGH_THRESHOLD = 90;

/** Hunger/hydration decay per tick (optional). */
export const HUNGER_DECAY_PER_TICK = 1;
export const HYDRATION_DECAY_PER_TICK = 1;

/** Hunger cost when performing gather (on success). */
export const GATHER_HUNGER_COST = 2;
/** Hydration cost when performing gather (on success). */
export const GATHER_HYDRATION_COST = 2;

/** Hunger cost when performing scavenge water (on success). */
export const SCAVENGE_HUNGER_COST = 1;
/** Hydration cost when performing scavenge water (on success). */
export const SCAVENGE_HYDRATION_COST = 2;

/** Hunger cost when performing mate (both partners). */
export const MATE_HUNGER_COST = 3;
/** Hydration cost when performing mate (both partners). */
export const MATE_HYDRATION_COST = 3;

// ——— Simulator / date ———

/** Simulator start date (YYYY-MM-DD). Used as epoch for age calculations. */
export const SIMULATOR_START_DATE = "0001-01-01";

/** Days per year for age-in-years conversion (accounts for leap years). */
export const DAYS_PER_YEAR = 365.25;

/** HTTP header name for current simulator day (value must be YYYY-MM-DD). */
export const SIMULATOR_DAY_HEADER = "x-simulator-day";

// ——— Era ———

/** Default multiplier for era boost (e.g. 1.1 = 10% increase to regeneration). */
export const ERA_BOOST_MULTIPLIER = 1.1;

// ——— Skill ———

/** Max additional boost from country adoption (never exceed 30%). */
export const MAX_ADOPTION_BOOST = 30;

/** Boost tiers: adoption rate threshold → additional success %. Higher adoption = more boost, capped at MAX_ADOPTION_BOOST. */
export const ADOPTION_BOOST_TIERS: { threshold: number; boost: number }[] = [
  { threshold: 98, boost: 30 },
  { threshold: 95, boost: 25 },
  { threshold: 85, boost: 20 },
  { threshold: 75, boost: 15 },
  { threshold: 50, boost: 10 },
  { threshold: 30, boost: 5 },
];
