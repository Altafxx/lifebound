/**
 * Era progression and surrounding-country boost logic.
 * Not wired into API or seeders yet.
 */

import { db } from "$/db";
import {
  countryErasTable,
  countryNeighborsTable,
  countryEraBoostsTable,
  erasTable,
} from "$/schema";
import { and, eq, desc } from "drizzle-orm";

/** Default multiplier for era boost (e.g. 1.1 = 10% increase to regeneration). */
export const ERA_BOOST_MULTIPLIER = 1.1;

/**
 * Get the current era for a country (highest order era they have entered).
 */
export async function getCountryCurrentEra(countryId: number) {
  const entries = await db
    .select({
      eraId: countryErasTable.eraId,
      enteredAt: countryErasTable.enteredAt,
      eraOrder: erasTable.order,
      eraName: erasTable.name,
    })
    .from(countryErasTable)
    .innerJoin(erasTable, eq(countryErasTable.eraId, erasTable.id))
    .where(eq(countryErasTable.countryId, countryId))
    .orderBy(desc(erasTable.order))
    .limit(1);

  return entries[0] ?? null;
}

/**
 * Get neighboring country IDs for a given country.
 * Uses country_neighbors (both directions: A-B and B-A).
 */
export async function getNeighborCountryIds(countryId: number): Promise<number[]> {
  const rows = await db
    .select({
      neighborId: countryNeighborsTable.neighborCountryId,
    })
    .from(countryNeighborsTable)
    .where(eq(countryNeighborsTable.countryId, countryId));

  const fromOther = await db
    .select({
      neighborId: countryNeighborsTable.countryId,
    })
    .from(countryNeighborsTable)
    .where(eq(countryNeighborsTable.neighborCountryId, countryId));

  const ids = new Set<number>();
  for (const r of rows) ids.add(r.neighborId);
  for (const r of fromOther) ids.add(r.neighborId);
  return Array.from(ids);
}

/**
 * Advance a country to a new era and apply era boost to surrounding countries.
 *
 * 1. Records the country's entry into the new era (country_eras).
 * 2. Finds all neighboring countries.
 * 3. For each neighbor, creates a country_era_boosts record.
 *
 * Caller is responsible for applying the boost to state_stats or other systems.
 */
export async function advanceCountryToEra(
  countryId: number,
  eraId: number,
  simulatorDate: string
): Promise<{ neighborIds: number[] }> {
  // 1. Record era entry
  await db.insert(countryErasTable).values({
    countryId,
    eraId,
    enteredAt: simulatorDate,
  });

  // 2. Get neighbors
  const neighborIds = await getNeighborCountryIds(countryId);

  // 3. Create era boost records for each neighbor
  for (const neighborId of neighborIds) {
    await db.insert(countryEraBoostsTable).values({
      countryId: neighborId,
      sourceCountryId: countryId,
      eraId,
      createdAt: simulatorDate,
    });
  }

  return { neighborIds };
}

/**
 * Compute the effective boost multiplier for a country based on recent era boosts.
 * Sums contributions from neighboring countries that advanced (e.g. each +0.1 = 10%).
 * Not used anywhere yet.
 */
export function computeEraBoostMultiplier(boostCount: number): number {
  if (boostCount <= 0) return 1;
  const perBoost = (ERA_BOOST_MULTIPLIER - 1) * 0.5; // e.g. 0.05 per neighbor
  return 1 + Math.min(boostCount * perBoost, 0.5); // cap at 50% total
}
