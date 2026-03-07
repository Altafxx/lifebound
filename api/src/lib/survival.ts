/**
 * Survival logic: success rates for gather/scavenge, health/hunger/hydration tick rules.
 * Used by actions service and stats tick endpoint.
 */

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

/**
 * Roll for success with a given rate (0–100).
 * Returns true with probability rate/100.
 */
export function rollSuccess(rate: number): boolean {
  return Math.random() * 100 < Math.max(0, Math.min(100, rate));
}

export type UserStatsForTick = {
  hunger: number;
  hydration: number;
  health: number;
};

/**
 * Compute next user_stats values after one tick (e.g. one simulator day).
 * - If hunger < 30 or hydration < 30 → health decreases by HEALTH_DECAY_PER_TICK (min 0).
 * - If hunger > 90 and hydration > 90 → health increases by HEALTH_REGEN_PER_TICK (max 100).
 * - Optionally applies hunger and hydration decay.
 */
export function computeNextUserStatsAfterTick(
  current: UserStatsForTick,
  options: { applyHungerHydrationDecay?: boolean } = {}
): UserStatsForTick {
  const { applyHungerHydrationDecay = true } = options;
  let { hunger, hydration, health } = current;

  if (applyHungerHydrationDecay) {
    hunger = Math.max(0, hunger - HUNGER_DECAY_PER_TICK);
    hydration = Math.max(0, hydration - HYDRATION_DECAY_PER_TICK);
  }

  if (hunger < HUNGER_HYDRATION_LOW_THRESHOLD || hydration < HUNGER_HYDRATION_LOW_THRESHOLD) {
    health = Math.max(0, health - HEALTH_DECAY_PER_TICK);
  } else if (
    hunger > HUNGER_HYDRATION_HIGH_THRESHOLD &&
    hydration > HUNGER_HYDRATION_HIGH_THRESHOLD
  ) {
    health = Math.min(100, health + HEALTH_REGEN_PER_TICK);
  }

  return { hunger, hydration, health };
}
