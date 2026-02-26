import { continentsTable, countriesTable, statesTable } from "$/schema";
import { db } from "$/db";
import { and, eq } from "drizzle-orm";
import countriesData from "./data/countries.json";
import continentsData from "./data/continents.json";
import countryContinentMap from "./data/country-continent.json";

const MALAYSIA_COUNTRY_CODE = "MY";

type ContinentRow = { name: string; code: string };
const continents = continentsData as ContinentRow[];

// Country (isoA2) -> continent code (AF, AN, AS, EU, NA, OC, SA).
// Data sources and references: see README.md "Data sources (locations seed)".
const countryToContinent = countryContinentMap as Record<string, string>;

// 13 states + 3 federal territories (Malaysia)
const MALAYSIA_STATES: { name: string }[] = [
  { name: "Johor" },
  { name: "Kedah" },
  { name: "Kelantan" },
  { name: "Melaka" },
  { name: "Negeri Sembilan" },
  { name: "Pahang" },
  { name: "Pulau Pinang" },
  { name: "Perak" },
  { name: "Perlis" },
  { name: "Sabah" },
  { name: "Sarawak" },
  { name: "Selangor" },
  { name: "Terengganu" },
  { name: "Kuala Lumpur" },
  { name: "Labuan" },
  { name: "Putrajaya" },
];

type CountriesDataRow = {
  name: string;
  isoA2: string;
  isoA3: string;
  isoNumber: number;
  tld?: string | null;
  dialCodes?: string[] | null;
  emoji?: string | null;
  image?: string | null;
  timezones?: string[] | null;
};

const normalizeDialCode = (dialCode: string) =>
  dialCode.replace(/\s+/g, "").replace(/-/g, "");

const countries = countriesData as CountriesDataRow[];

export const seedContinents = async () => {
  let created = 0;
  for (const row of continents) {
    const existing = await db
      .select()
      .from(continentsTable)
      .where(eq(continentsTable.code, row.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(continentsTable).values({
        name: row.name,
        code: row.code,
      });
      created++;
    }
  }
  console.log(`Continents seeded: ${created} created, ${continents.length} total`);
};

export const seedCountries = async () => {
  // Build code -> id map for continents
  const continentRows = await db.select().from(continentsTable);
  const continentIdByCode = new Map(
    continentRows.map((r) => [r.code, r.id])
  );

  let created = 0;
  for (const c of countries) {
    const existing = await db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.isoA2, c.isoA2))
      .limit(1);

    if (existing.length === 0) {
      const rawDialCodes = (c.dialCodes ?? []).filter(
        (d): d is string => typeof d === "string" && d.length > 0,
      );
      const phoneCodes =
        rawDialCodes.length > 0
          ? rawDialCodes.map((d) => normalizeDialCode(d))
          : null;

      const continentCode = countryToContinent[c.isoA2];
      const continentId =
        continentCode != null ? continentIdByCode.get(continentCode) ?? null : null;

      await db.insert(countriesTable).values({
        name: c.name,
        isoA2: c.isoA2,
        isoA3: c.isoA3,
        isoNumber: c.isoNumber,
        tld: c.tld ?? null,
        phoneCode: phoneCodes,
        emoji: c.emoji ?? null,
        image: c.image ?? null,
        timezones: (c.timezones?.length ?? 0) > 0 ? c.timezones! : null,
        continentId,
      });
      created++;
    }
  }
  console.log(`Countries seeded: ${created} created, ${countries.length} total`);
};

export const seedStates = async () => {
  const [malaysia] = await db
    .select()
    .from(countriesTable)
    .where(eq(countriesTable.isoA2, MALAYSIA_COUNTRY_CODE))
    .limit(1);

  if (!malaysia) {
    console.log("Malaysia not found; run seedCountries first. Skipping states.");
    return;
  }

  for (const s of MALAYSIA_STATES) {
    const existing = await db
      .select()
      .from(statesTable)
      .where(
        and(
          eq(statesTable.countryId, malaysia.id),
          eq(statesTable.name, s.name)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(statesTable).values({
        countryId: malaysia.id,
        name: s.name,
      });
      console.log(`Created state: ${s.name} - Malaysia`);
    }
  }
  console.log(`States seeded: ${MALAYSIA_STATES.length} (Malaysia only)`);
};
