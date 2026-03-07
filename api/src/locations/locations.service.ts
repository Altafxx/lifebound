import { db } from "$/db";
import {
  continentsTable,
  countriesTable,
  statesTable,
  stateStatsTable,
} from "$/schema";
import { eq } from "drizzle-orm";
import type { Continent, Country, State, StateWithStats } from "./locations.types";

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

  /** Regenerate state stats: add waterRegeneration/foodRegeneration to reserves, clamped to max. */
  regenStateStats: async (stateId: number) => {
    const [row] = await db
      .select()
      .from(stateStatsTable)
      .where(eq(stateStatsTable.stateId, stateId))
      .limit(1);
    if (!row) return undefined;
    const newWaterReserve = Math.min(
      Number(row.waterReserve) + Number(row.waterRegeneration),
      Number(row.waterMax)
    );
    const newFoodReserve = Math.min(
      Number(row.foodReserve) + Number(row.foodRegeneration),
      Number(row.foodMax)
    );
    const [updated] = await db
      .update(stateStatsTable)
      .set({
        waterReserve: newWaterReserve,
        foodReserve: newFoodReserve,
      })
      .where(eq(stateStatsTable.stateId, stateId))
      .returning();
    return updated;
  },
};
