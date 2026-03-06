import { pgTable, integer, bigint, smallint, varchar, boolean, pgEnum, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { statesTable } from "./locations";

export const genderEnum = pgEnum("gender", ["male", "female", "non-binary"]);
export const relationTypeEnum = pgEnum("relation_type", ["parent", "spouse", "guardian"]);

// @ts-expect-error - Circular reference: userPregnanciesTable is defined below
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // @ts-expect-error - Circular reference: userPregnanciesTable is defined below
  birthPregnancyId: integer().references(() => userPregnanciesTable.id),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  ageOverride: integer(), // optional; days to prepend to createdAt for age calculation
  gender: genderEnum("gender").notNull(), // "male", "female", "non-binary"
  location: bigint({ mode: "number" })
    .references(() => statesTable.id, { onDelete: "restrict" })
    .notNull(),
  isDeceased: boolean().notNull().default(false),
  createdAt: date().notNull().default("0001-01-01"), // simulator date YYYY-MM-DD
  updatedAt: date().notNull().default("0001-01-01"), // simulator date YYYY-MM-DD
});

// @ts-expect-error - Circular reference: usersTable is defined above
export const userPregnanciesTable = pgTable("user_pregnancies", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // @ts-expect-error - Circular reference: usersTable is defined above
  userId: integer().references(() => usersTable.id).notNull(),
  gestationPeriod: integer().notNull(),
  isCompleted: boolean().notNull().default(false),
  createdAt: date().notNull().default("0001-01-01"),
  updatedAt: date().notNull().default("0001-01-01"),
});

export const userRelationshipsTable = pgTable("user_relationships", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // The person who "is" the relative (e.g., The Parent)
  subjectUserId: integer().references(() => usersTable.id).notNull(),
  // The person they are related to (e.g., The Child)
  objectUserId: integer().references(() => usersTable.id).notNull(),
  // Use the enum for consistency
  type: relationTypeEnum().notNull(),
  // Distinguish between Biological vs Step/Adoptive
  isBiological: boolean().default(true).notNull(),
  createdAt: date().notNull().default("0001-01-01"),
});

export const userStatsTable = pgTable("user_stats", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  hunger: smallint().notNull().default(100), // 0-100
  hydration: smallint().notNull().default(100), // 0-100
  health: smallint().notNull().default(100), // 0-100
  holding: bigint({ mode: "number" }).notNull().default(0),
});

export const usersRelations = relations(usersTable, ({ many, one }) => ({
  // People who are related TO this user (e.g., "Give me this user's parents")
  relatedTo: many(userRelationshipsTable, { relationName: "object_user" }),
  // People this user is related TO (e.g., "Give me this user's children")
  relatedAs: many(userRelationshipsTable, { relationName: "subject_user" }),
  stats: one(userStatsTable),
}));

export const userStatsRelations = relations(userStatsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userStatsTable.userId],
    references: [usersTable.id],
  }),
}));

export const userRelationshipsRelations = relations(userRelationshipsTable, ({ one }) => ({
  subject: one(usersTable, {
    fields: [userRelationshipsTable.subjectUserId],
    references: [usersTable.id],
    relationName: "subject_user",
  }),
  object: one(usersTable, {
    fields: [userRelationshipsTable.objectUserId],
    references: [usersTable.id],
    relationName: "object_user",
  }),
}));

