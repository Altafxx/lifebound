/**
 * Survival logic: success rates for gather/scavenge, health/hunger/hydration tick rules.
 * Used by actions service and stats tick endpoint.
 */

import {
  HEALTH_DECAY_PER_TICK,
  HEALTH_REGEN_PER_TICK,
  HUNGER_DECAY_PER_TICK,
  HUNGER_HYDRATION_HIGH_THRESHOLD,
  HUNGER_HYDRATION_LOW_THRESHOLD,
  HYDRATION_DECAY_PER_TICK,
} from "./constants";

export {
  GATHER_FOOD_AMOUNT,
  GATHER_HUNGER_COST,
  GATHER_HYDRATION_COST,
  GATHER_SUCCESS_RATE,
  HEALTH_DECAY_PER_TICK,
  HEALTH_REGEN_PER_TICK,
  HUNGER_DECAY_PER_TICK,
  HUNGER_HYDRATION_HIGH_THRESHOLD,
  HUNGER_HYDRATION_LOW_THRESHOLD,
  HUNGER_PER_FOOD_UNIT,
  HYDRATION_DECAY_PER_TICK,
  HYDRATION_PER_WATER_UNIT,
  MATE_HUNGER_COST,
  MATE_HYDRATION_COST,
  SCAVENGE_HUNGER_COST,
  SCAVENGE_HYDRATION_COST,
  SCAVENGE_WATER_AMOUNT,
  SCAVENGE_WATER_SUCCESS_RATE,
} from "./constants";

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
