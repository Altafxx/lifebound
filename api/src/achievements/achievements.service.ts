import { db } from "$/db";
import {
  achievementsTable,
  countryAchievementsTable,
  countriesTable,
} from "$/schema";
import { eq } from "drizzle-orm";
import type { Achievement, CountryWithAchievedAt } from "./achievements.types";

export const achievementsService = {
  getAchievements: async (): Promise<Achievement[]> => {
    return db.select().from(achievementsTable);
  },

  getAchievementById: async (
    id: number
  ): Promise<Achievement | undefined> => {
    const rows = await db
      .select()
      .from(achievementsTable)
      .where(eq(achievementsTable.id, id))
      .limit(1);
    return rows[0];
  },

  getCountriesByAchievementId: async (
    achievementId: number
  ): Promise<CountryWithAchievedAt[]> => {
    const rows = await db
      .select({
        id: countriesTable.id,
        name: countriesTable.name,
        isoA2: countriesTable.isoA2,
        isoA3: countriesTable.isoA3,
        isoNumber: countriesTable.isoNumber,
        tld: countriesTable.tld,
        phoneCode: countriesTable.phoneCode,
        emoji: countriesTable.emoji,
        image: countriesTable.image,
        timezones: countriesTable.timezones,
        continentId: countriesTable.continentId,
        achievedAt: countryAchievementsTable.achievedAt,
      })
      .from(countryAchievementsTable)
      .innerJoin(
        countriesTable,
        eq(countryAchievementsTable.countryId, countriesTable.id)
      )
      .where(eq(countryAchievementsTable.achievementId, achievementId));
    return rows.map((r) => ({
      ...r,
      achievedAt: r.achievedAt,
    }));
  },
};
