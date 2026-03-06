import { pgTable, bigint, integer, text, date, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countriesTable } from "./locations";

export const erasTable = pgTable("eras", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  order: integer().notNull(), // 1 = first geological era, 2 = next, etc.
  description: text(),
});

export const countryErasTable = pgTable("country_eras", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  countryId: integer()
    .references(() => countriesTable.id, { onDelete: "cascade" })
    .notNull(),
  eraId: bigint({ mode: "number" })
    .references(() => erasTable.id, { onDelete: "cascade" })
    .notNull(),
  enteredAt: date().notNull(),
});

/** Adjacency: country A and country B are neighbors (e.g. share a border). */
export const countryNeighborsTable = pgTable(
  "country_neighbors",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    countryId: integer()
      .references(() => countriesTable.id, { onDelete: "cascade" })
      .notNull(),
    neighborCountryId: integer()
      .references(() => countriesTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => ({
    countryNeighborUnique: unique().on(t.countryId, t.neighborCountryId),
  })
);

/** Records when a country received an era boost from a neighboring country's era advancement. */
export const countryEraBoostsTable = pgTable("country_era_boosts", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  countryId: integer()
    .references(() => countriesTable.id, { onDelete: "cascade" })
    .notNull(),
  sourceCountryId: integer()
    .references(() => countriesTable.id, { onDelete: "cascade" })
    .notNull(),
  eraId: bigint({ mode: "number" })
    .references(() => erasTable.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: date().notNull(),
});

export const erasRelations = relations(erasTable, ({ many }) => ({
  countryEras: many(countryErasTable),
  countryEraBoosts: many(countryEraBoostsTable),
}));

export const countryErasRelations = relations(countryErasTable, ({ one }) => ({
  country: one(countriesTable, {
    fields: [countryErasTable.countryId],
    references: [countriesTable.id],
  }),
  era: one(erasTable, {
    fields: [countryErasTable.eraId],
    references: [erasTable.id],
  }),
}));

export const countryNeighborsRelations = relations(
  countryNeighborsTable,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countryNeighborsTable.countryId],
      references: [countriesTable.id],
    }),
    neighbor: one(countriesTable, {
      fields: [countryNeighborsTable.neighborCountryId],
      references: [countriesTable.id],
    }),
  })
);

export const countryEraBoostsRelations = relations(
  countryEraBoostsTable,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countryEraBoostsTable.countryId],
      references: [countriesTable.id],
    }),
    sourceCountry: one(countriesTable, {
      fields: [countryEraBoostsTable.sourceCountryId],
      references: [countriesTable.id],
    }),
    era: one(erasTable, {
      fields: [countryEraBoostsTable.eraId],
      references: [erasTable.id],
    }),
  })
);
