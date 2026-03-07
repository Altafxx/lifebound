import { pgTable, bigint, integer, text, date, unique, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { knowledgesTable } from "./knowledges";
import { usersTable } from "./users";
import { countriesTable } from "./locations";
/**
 * Skill types that users can learn (e.g. fishing, carpentry, hiking).
 * Each skill requires the country to have a specific knowledge first (knowledgeId).
 * Learning is probabilistic: baseSuccessRate + boost from country adoption (max +30%).
 */
export const skillsTable = pgTable(
  "skills",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    description: text(),
    /** Country must have this knowledge before any user can learn this skill. */
    knowledgeId: bigint({ mode: "number" })
      .references(() => knowledgesTable.id, { onDelete: "restrict" })
      .notNull(),
    /** Another skill the user must have before learning this one. Null = no prerequisite. */
    prerequisiteSkillId: bigint({ mode: "number" }),
    /** Base success rate 0–100. Effective rate = base + adoption boost (boost capped at 30). */
    baseSuccessRate: integer().notNull().default(50),
    /** Display order (lower first). */
    order: integer().notNull().default(0),
    /** Optional category for grouping. */
    category: text(),
  },
  (t) => [
    foreignKey({
      columns: [t.prerequisiteSkillId],
      foreignColumns: [t.id],
    }).onDelete("restrict"),
  ]
);

/** Records when a user learned a skill (user-level skill). */
export const userSkillsTable = pgTable(
  "user_skills",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    skillId: bigint({ mode: "number" })
      .references(() => skillsTable.id, { onDelete: "cascade" })
      .notNull(),
    learnedAt: date().notNull(),
  },
  (t) => ({
    userSkillUnique: unique().on(t.userId, t.skillId),
  })
);

/**
 * Per-country count of users who have each skill.
 * Used for "ease of learning": more people in the country with the skill = higher success.
 * Maintained when user_skills are added/removed (see src/lib/skill.ts).
 */
export const countrySkillsTable = pgTable(
  "country_skills",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    countryId: integer()
      .references(() => countriesTable.id, { onDelete: "cascade" })
      .notNull(),
    skillId: bigint({ mode: "number" })
      .references(() => skillsTable.id, { onDelete: "cascade" })
      .notNull(),
    /** Number of users in this country who have this skill. */
    peopleCount: integer().notNull().default(0),
  },
  (t) => ({
    countrySkillUnique: unique().on(t.countryId, t.skillId),
  })
);

export const skillsRelations = relations(skillsTable, ({ one, many }) => ({
  knowledge: one(knowledgesTable, {
    fields: [skillsTable.knowledgeId],
    references: [knowledgesTable.id],
  }),
  userSkills: many(userSkillsTable),
  countrySkills: many(countrySkillsTable),
}));

export const countrySkillsRelations = relations(
  countrySkillsTable,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countrySkillsTable.countryId],
      references: [countriesTable.id],
    }),
    skill: one(skillsTable, {
      fields: [countrySkillsTable.skillId],
      references: [skillsTable.id],
    }),
  })
);

export const userSkillsRelations = relations(
  userSkillsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userSkillsTable.userId],
      references: [usersTable.id],
    }),
    skill: one(skillsTable, {
      fields: [userSkillsTable.skillId],
      references: [skillsTable.id],
    }),
  })
);
