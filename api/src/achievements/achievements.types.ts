import type { InferSelectModel } from "drizzle-orm";
import {
  achievementsTable,
  countryAchievementsTable,
  countriesTable,
} from "$/schema";

export type Achievement = InferSelectModel<typeof achievementsTable>;
export type CountryAchievement = InferSelectModel<typeof countryAchievementsTable>;
export type Country = InferSelectModel<typeof countriesTable>;

export type CountryWithAchievedAt = Country & { achievedAt: string };
