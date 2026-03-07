import { db } from "$/db";
import {
  knowledgesTable,
  countryKnowledgesTable,
  countriesTable,
} from "$/schema";
import { eq, asc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type Knowledge = InferSelectModel<typeof knowledgesTable>;
export type Country = InferSelectModel<typeof countriesTable>;

export type CountryWithUnlockedAt = Country & { unlockedAt: string };

export type KnowledgeWithUnlockedAt = Knowledge & { unlockedAt: string };

export const knowledgesService = {
  getKnowledges: async (opts?: { category?: string }): Promise<Knowledge[]> => {
    if (opts?.category != null && opts.category !== "") {
      return db
        .select()
        .from(knowledgesTable)
        .where(eq(knowledgesTable.category, opts.category))
        .orderBy(asc(knowledgesTable.order), asc(knowledgesTable.id));
    }
    return db
      .select()
      .from(knowledgesTable)
      .orderBy(asc(knowledgesTable.order), asc(knowledgesTable.id));
  },

  getKnowledgeById: async (id: number): Promise<Knowledge | undefined> => {
    const rows = await db
      .select()
      .from(knowledgesTable)
      .where(eq(knowledgesTable.id, id))
      .limit(1);
    return rows[0];
  },

  getCountriesByKnowledgeId: async (
    knowledgeId: number
  ): Promise<CountryWithUnlockedAt[]> => {
    const rows = await db
      .select({
        id: countriesTable.id,
        name: countriesTable.name,
        isoA2: countriesTable.isoA2,
        isoA3: countriesTable.isoA3,
        isoNumber: countriesTable.isoNumber,
        tld: countriesTable.tld,
        phoneCode: countriesTable.phoneCode,
        emoji: countriesTable.emoji,
        image: countriesTable.image,
        timezones: countriesTable.timezones,
        continentId: countriesTable.continentId,
        unlockedAt: countryKnowledgesTable.unlockedAt,
      })
      .from(countryKnowledgesTable)
      .innerJoin(
        countriesTable,
        eq(countryKnowledgesTable.countryId, countriesTable.id)
      )
      .where(eq(countryKnowledgesTable.knowledgeId, knowledgeId));
    return rows.map((r) => ({
      ...r,
      unlockedAt: r.unlockedAt,
    }));
  },

  getKnowledgesByCountryId: async (
    countryId: number
  ): Promise<KnowledgeWithUnlockedAt[]> => {
    const rows = await db
      .select({
        id: knowledgesTable.id,
        name: knowledgesTable.name,
        description: knowledgesTable.description,
        category: knowledgesTable.category,
        order: knowledgesTable.order,
        unlockedAt: countryKnowledgesTable.unlockedAt,
      })
      .from(countryKnowledgesTable)
      .innerJoin(
        knowledgesTable,
        eq(countryKnowledgesTable.knowledgeId, knowledgesTable.id)
      )
      .where(eq(countryKnowledgesTable.countryId, countryId));
    return rows.map((r) => ({
      ...r,
      unlockedAt: r.unlockedAt,
    }));
  },
};
