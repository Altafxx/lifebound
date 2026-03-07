import { db } from "$/db";
import { usersTable, userStatsTable, stateStatsTable } from "$/schema";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { usersService } from "@/users/users.service";
import {
  rollSuccess,
  GATHER_SUCCESS_RATE,
  SCAVENGE_WATER_SUCCESS_RATE,
  GATHER_FOOD_AMOUNT,
  SCAVENGE_WATER_AMOUNT,
  HUNGER_PER_FOOD_UNIT,
  HYDRATION_PER_WATER_UNIT,
  GATHER_HUNGER_COST,
  GATHER_HYDRATION_COST,
  SCAVENGE_HUNGER_COST,
  SCAVENGE_HYDRATION_COST,
  MATE_HUNGER_COST,
  MATE_HYDRATION_COST,
  computeNextUserStatsAfterTick,
} from "@/lib/survival";

type StateStatsRow = InferSelectModel<typeof stateStatsTable>;
type UserStatsRow = InferSelectModel<typeof userStatsTable>;

async function getUserWithStateAndStats(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return undefined;
  const stateId = Number(user.location);
  const [stateStats] = await db
    .select()
    .from(stateStatsTable)
    .where(eq(stateStatsTable.stateId, stateId))
    .limit(1);
  const [userStats] = await db
    .select()
    .from(userStatsTable)
    .where(eq(userStatsTable.userId, userId))
    .limit(1);
  return { user, stateStats: stateStats ?? undefined, userStats: userStats ?? undefined };
}

export type GatherResult = {
  success: boolean;
  foodGained?: number;
  stateStats: StateStatsRow | null;
  userStats: UserStatsRow | null;
};

export async function gather(userId: number): Promise<GatherResult> {
  const ctx = await getUserWithStateAndStats(userId);
  if (!ctx || !ctx.stateStats || !ctx.userStats) {
    throw new Error("User or state stats not found");
  }
  const amount = GATHER_FOOD_AMOUNT;
  const foodReserve = Number(ctx.stateStats.foodReserve);
  if (foodReserve < amount) {
    return {
      success: false,
      stateStats: ctx.stateStats,
      userStats: ctx.userStats,
    };
  }
  if (!rollSuccess(GATHER_SUCCESS_RATE)) {
    return {
      success: false,
      stateStats: ctx.stateStats,
      userStats: ctx.userStats,
    };
  }
  const stateId = Number(ctx.user.location);
  const [updatedState] = await db
    .update(stateStatsTable)
    .set({ foodReserve: foodReserve - amount })
    .where(eq(stateStatsTable.stateId, stateId))
    .returning();
  const newHunger = Math.max(0, ctx.userStats.hunger - GATHER_HUNGER_COST);
  const newHydration = Math.max(0, ctx.userStats.hydration - GATHER_HYDRATION_COST);
  const [updatedUserStats] = await db
    .update(userStatsTable)
    .set({
      food: Number(ctx.userStats.food) + amount,
      hunger: newHunger,
      hydration: newHydration,
    })
    .where(eq(userStatsTable.userId, userId))
    .returning();
  return {
    success: true,
    foodGained: amount,
    stateStats: updatedState ?? null,
    userStats: updatedUserStats ?? null,
  };
}

export type ScavengeWaterResult = {
  success: boolean;
  waterGained?: number;
  stateStats: StateStatsRow | null;
  userStats: UserStatsRow | null;
};

export async function scavengeWater(userId: number): Promise<ScavengeWaterResult> {
  const ctx = await getUserWithStateAndStats(userId);
  if (!ctx || !ctx.stateStats || !ctx.userStats) {
    throw new Error("User or state stats not found");
  }
  const amount = SCAVENGE_WATER_AMOUNT;
  const waterReserve = Number(ctx.stateStats.waterReserve);
  if (waterReserve < amount) {
    return {
      success: false,
      stateStats: ctx.stateStats,
      userStats: ctx.userStats,
    };
  }
  if (!rollSuccess(SCAVENGE_WATER_SUCCESS_RATE)) {
    return {
      success: false,
      stateStats: ctx.stateStats,
      userStats: ctx.userStats,
    };
  }
  const stateId = Number(ctx.user.location);
  const [updatedState] = await db
    .update(stateStatsTable)
    .set({ waterReserve: waterReserve - amount })
    .where(eq(stateStatsTable.stateId, stateId))
    .returning();
  const newHunger = Math.max(0, ctx.userStats.hunger - SCAVENGE_HUNGER_COST);
  const newHydration = Math.max(0, ctx.userStats.hydration - SCAVENGE_HYDRATION_COST);
  const [updatedUserStats] = await db
    .update(userStatsTable)
    .set({
      water: Number(ctx.userStats.water) + amount,
      hunger: newHunger,
      hydration: newHydration,
    })
    .where(eq(userStatsTable.userId, userId))
    .returning();
  return {
    success: true,
    waterGained: amount,
    stateStats: updatedState ?? null,
    userStats: updatedUserStats ?? null,
  };
}

export type EatResult = { userStats: UserStatsRow };

export async function eat(userId: number, amount: number): Promise<EatResult> {
  const ctx = await getUserWithStateAndStats(userId);
  if (!ctx?.userStats) {
    throw new Error("User or user stats not found");
  }
  const currentFood = Number(ctx.userStats.food);
  if (currentFood < amount) {
    throw new Error(`Insufficient food: have ${currentFood}, need ${amount}`);
  }
  const hungerGain = Math.min(amount * HUNGER_PER_FOOD_UNIT, 100 - ctx.userStats.hunger);
  const newHunger = Math.min(100, ctx.userStats.hunger + hungerGain);
  const [updated] = await db
    .update(userStatsTable)
    .set({ food: currentFood - amount, hunger: newHunger })
    .where(eq(userStatsTable.userId, userId))
    .returning();
  return { userStats: updated! };
}

export type DrinkResult = { userStats: UserStatsRow };

export async function drink(userId: number, amount: number): Promise<DrinkResult> {
  const ctx = await getUserWithStateAndStats(userId);
  if (!ctx?.userStats) {
    throw new Error("User or user stats not found");
  }
  const currentWater = Number(ctx.userStats.water);
  if (currentWater < amount) {
    throw new Error(`Insufficient water: have ${currentWater}, need ${amount}`);
  }
  const hydrationGain = Math.min(amount * HYDRATION_PER_WATER_UNIT, 100 - ctx.userStats.hydration);
  const newHydration = Math.min(100, ctx.userStats.hydration + hydrationGain);
  const [updated] = await db
    .update(userStatsTable)
    .set({ water: currentWater - amount, hydration: newHydration })
    .where(eq(userStatsTable.userId, userId))
    .returning();
  return { userStats: updated! };
}

/** Mate (conceiving); spouse check is enforced in createUserConceivingPregnancy. Deducts hunger/hydration for both partners. */
export async function mate(
  userId: number,
  partnerId: number,
  simulatorDate: string
): Promise<unknown> {
  const pregnancy = await usersService.createUserConceivingPregnancy(userId, partnerId, simulatorDate);
  // Deduct hunger/hydration for both partners
  for (const id of [userId, partnerId]) {
    const [userStats] = await db
      .select()
      .from(userStatsTable)
      .where(eq(userStatsTable.userId, id))
      .limit(1);
    if (userStats) {
      const newHunger = Math.max(0, userStats.hunger - MATE_HUNGER_COST);
      const newHydration = Math.max(0, userStats.hydration - MATE_HYDRATION_COST);
      await db
        .update(userStatsTable)
        .set({ hunger: newHunger, hydration: newHydration })
        .where(eq(userStatsTable.userId, id));
    }
  }
  return pregnancy;
}

export type TickResult = { userStats: UserStatsRow };

export async function tickUserStats(
  userId: number,
  options?: { applyHungerHydrationDecay?: boolean }
): Promise<TickResult> {
  const [userStats] = await db
    .select()
    .from(userStatsTable)
    .where(eq(userStatsTable.userId, userId))
    .limit(1);
  if (!userStats) {
    throw new Error("User stats not found");
  }
  const next = computeNextUserStatsAfterTick(
    {
      hunger: userStats.hunger,
      hydration: userStats.hydration,
      health: userStats.health,
    },
    options
  );
  const [updated] = await db
    .update(userStatsTable)
    .set({
      hunger: next.hunger,
      hydration: next.hydration,
      health: next.health,
    })
    .where(eq(userStatsTable.userId, userId))
    .returning();
  return { userStats: updated! };
}

/** Tick multiple users; returns array of results. */
export async function tickUserStatsBatch(
  userIds: number[],
  options?: { applyHungerHydrationDecay?: boolean }
): Promise<TickResult[]> {
  const results: TickResult[] = [];
  for (const id of userIds) {
    const r = await tickUserStats(id, options);
    results.push(r);
  }
  return results;
}
