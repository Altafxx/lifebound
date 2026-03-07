import type { InferSelectModel } from "drizzle-orm";
import { stateStatsTable, userStatsTable } from "$/schema";

export type StateStatsRow = InferSelectModel<typeof stateStatsTable>;
export type UserStatsRow = InferSelectModel<typeof userStatsTable>;

export type GatherResult = {
  success: boolean;
  foodGained?: number;
  stateStats: StateStatsRow | null;
  userStats: UserStatsRow | null;
};

export type ScavengeWaterResult = {
  success: boolean;
  waterGained?: number;
  stateStats: StateStatsRow | null;
  userStats: UserStatsRow | null;
};

export type EatResult = { userStats: UserStatsRow };

export type DrinkResult = { userStats: UserStatsRow };

export type TickResult = { userStats: UserStatsRow };
