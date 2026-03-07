import { pgTable, bigint, integer, text, date, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countriesTable } from "./locations";

/** Knowledge/technology types countries can unlock (e.g. fishing, mining, agriculture). */
export const knowledgesTable = pgTable("knowledges", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  description: text(),
  /** Optional category for grouping: survival, industry, culture, technology, etc. */
  category: text(),
  /** Display order (lower first). */
  order: integer().notNull().default(0),
});

/** Records when a country unlocked a knowledge. */
export const countryKnowledgesTable = pgTable(
  "country_knowledges",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    countryId: integer()
      .references(() => countriesTable.id, { onDelete: "cascade" })
      .notNull(),
    knowledgeId: bigint({ mode: "number" })
      .references(() => knowledgesTable.id, { onDelete: "cascade" })
      .notNull(),
    unlockedAt: date().notNull(),
  },
  (t) => ({
    countryKnowledgesUnique: unique().on(t.countryId, t.knowledgeId),
  })
);

export const knowledgesRelations = relations(knowledgesTable, ({ many }) => ({
  countryKnowledges: many(countryKnowledgesTable),
}));

export const countryKnowledgesRelations = relations(
  countryKnowledgesTable,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countryKnowledgesTable.countryId],
      references: [countriesTable.id],
    }),
    knowledge: one(knowledgesTable, {
      fields: [countryKnowledgesTable.knowledgeId],
      references: [knowledgesTable.id],
    }),
  })
);
