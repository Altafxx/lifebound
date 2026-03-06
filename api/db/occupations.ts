import { pgTable, bigint, integer, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable, genderEnum } from "./users";

export const occupationsTable = pgTable("occupations", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
  genderSpecific: genderEnum("gender_specific"),
});

export const userOccupationsTable = pgTable("user_occupations", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  occupationId: bigint({ mode: "number" })
    .references(() => occupationsTable.id, { onDelete: "cascade" })
    .notNull(),
});

export const occupationsRelations = relations(occupationsTable, ({ many }) => ({
  userOccupations: many(userOccupationsTable),
}));

export const userOccupationsRelations = relations(
  userOccupationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userOccupationsTable.userId],
      references: [usersTable.id],
    }),
    occupation: one(occupationsTable, {
      fields: [userOccupationsTable.occupationId],
      references: [occupationsTable.id],
    }),
  })
);
