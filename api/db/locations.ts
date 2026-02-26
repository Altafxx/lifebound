import { pgTable, bigint, integer, text, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const continentsTable = pgTable("continents", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  code: varchar({ length: 2 }).notNull().unique(),
});

export const countriesTable = pgTable("countries", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  isoA2: varchar({ length: 2 }).notNull(),
  isoA3: varchar({ length: 3 }).notNull(),
  isoNumber: bigint({ mode: "number" }).notNull(),
  tld: text(),
  phoneCode: text().array(),
  emoji: text(),
  image: text(),
  timezones: text().array(),
  continentId: integer().references(() => continentsTable.id, {
    onDelete: "set null",
  }),
});

export const statesTable = pgTable("states", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  countryId: integer()
    .references(() => countriesTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text().notNull(),
});

export const continentsRelations = relations(continentsTable, ({ many }) => ({
  countries: many(countriesTable),
}));

export const countriesRelations = relations(countriesTable, ({ many, one }) => ({
  continent: one(continentsTable, {
    fields: [countriesTable.continentId],
    references: [continentsTable.id],
  }),
  states: many(statesTable),
}));

export const statesRelations = relations(statesTable, ({ one }) => ({
  country: one(countriesTable, {
    fields: [statesTable.countryId],
    references: [countriesTable.id],
  }),
}));
