import { db } from "$/db";
import {
  erasTable,
  countryErasTable,
  countriesTable,
} from "$/schema";
import { eq, asc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { getCountryCurrentEra } from "@/lib/era";

export type Era = InferSelectModel<typeof erasTable>;
export type Country = InferSelectModel<typeof countriesTable>;

export type CountryWithEnteredAt = Country & { enteredAt: string };

export const erasService = {
  getEras: async (): Promise<Era[]> => {
    return db.select().from(erasTable).orderBy(asc(erasTable.order));
  },

  getEraById: async (id: number): Promise<Era | undefined> => {
    const rows = await db
      .select()
      .from(erasTable)
      .where(eq(erasTable.id, id))
      .limit(1);
    return rows[0];
  },

  getCountriesByEraId: async (
    eraId: number
  ): Promise<CountryWithEnteredAt[]> => {
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
        enteredAt: countryErasTable.enteredAt,
      })
      .from(countryErasTable)
      .innerJoin(
        countriesTable,
        eq(countryErasTable.countryId, countriesTable.id)
      )
      .where(eq(countryErasTable.eraId, eraId));
    return rows.map((r) => ({
      ...r,
      enteredAt: r.enteredAt,
    }));
  },

  getCountryCurrentEra: async (countryId: number) => {
    return getCountryCurrentEra(countryId);
  },
};
