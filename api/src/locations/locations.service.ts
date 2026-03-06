import { db } from "$/db";
import {
  continentsTable,
  countriesTable,
  statesTable,
  stateStatsTable,
} from "$/schema";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type Continent = InferSelectModel<typeof continentsTable>;
export type Country = InferSelectModel<typeof countriesTable>;
export type State = InferSelectModel<typeof statesTable>;
export type StateWithStats = State & {
  stats: InferSelectModel<typeof stateStatsTable> | null;
};

export const locationsService = {
  getContinents: async (): Promise<Continent[]> => {
    return db.select().from(continentsTable);
  },

  getCountries: async (opts?: { continentId?: number }): Promise<Country[]> => {
    if (opts?.continentId != null) {
      return db
        .select()
        .from(countriesTable)
        .where(eq(countriesTable.continentId, opts.continentId));
    }
    return db.select().from(countriesTable);
  },

  getCountryById: async (id: number): Promise<Country | undefined> => {
    const rows = await db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.id, id))
      .limit(1);
    return rows[0];
  },

  getStates: async (opts?: { countryId?: number }): Promise<State[]> => {
    if (opts?.countryId != null) {
      return db
        .select()
        .from(statesTable)
        .where(eq(statesTable.countryId, opts.countryId));
    }
    return db.select().from(statesTable);
  },

  getStatesByCountryId: async (countryId: number): Promise<State[]> => {
    return db
      .select()
      .from(statesTable)
      .where(eq(statesTable.countryId, countryId));
  },

  getStateById: async (id: number): Promise<State | undefined> => {
    const rows = await db
      .select()
      .from(statesTable)
      .where(eq(statesTable.id, id))
      .limit(1);
    return rows[0];
  },

  getStateByIdWithStats: async (
    id: number
  ): Promise<StateWithStats | undefined> => {
    const stateRows = await db
      .select()
      .from(statesTable)
      .where(eq(statesTable.id, id))
      .limit(1);
    const state = stateRows[0];
    if (!state) return undefined;
    const statsRows = await db
      .select()
      .from(stateStatsTable)
      .where(eq(stateStatsTable.stateId, id))
      .limit(1);
    return {
      ...state,
      stats: statsRows[0] ?? null,
    };
  },
};
