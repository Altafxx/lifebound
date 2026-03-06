import { pgTable, bigint, integer, text, date, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countriesTable } from "./locations";

export const achievementsTable = pgTable("achievements", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  description: text(),
});

export const countryAchievementsTable = pgTable(
  "country_achievements",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    countryId: integer()
      .references(() => countriesTable.id, { onDelete: "cascade" })
      .notNull(),
    achievementId: bigint({ mode: "number" })
      .references(() => achievementsTable.id, { onDelete: "cascade" })
      .notNull(),
    achievedAt: date().notNull(),
  },
  (t) => ({
    countryAchievementUnique: unique().on(t.countryId, t.achievementId),
  })
);

export const achievementsRelations = relations(achievementsTable, ({ many }) => ({
  countryAchievements: many(countryAchievementsTable),
}));

export const countryAchievementsRelations = relations(
  countryAchievementsTable,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countryAchievementsTable.countryId],
      references: [countriesTable.id],
    }),
    achievement: one(achievementsTable, {
      fields: [countryAchievementsTable.achievementId],
      references: [achievementsTable.id],
    }),
  })
);
