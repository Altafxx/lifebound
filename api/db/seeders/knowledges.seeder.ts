import { knowledgesTable, countryKnowledgesTable, countriesTable } from "$/schema";
import { db } from "$/db";
import { and, eq } from "drizzle-orm";
import { SIMULATOR_START_DATE } from "@/lib/age";

/** Knowledge/technology types countries can unlock. Ordered roughly by progression. */
const KNOWLEDGE_LIST: { name: string; description: string | null; category: string; order: number }[] = [
  // Survival / basics
  { name: "Fire", description: "Control and use of fire for warmth, cooking, and protection", category: "survival", order: 1 },
  { name: "Gathering", description: "Organized foraging for plants, nuts, and fruits", category: "survival", order: 2 },
  { name: "Hunting", description: "Hunting animals for food and materials", category: "survival", order: 3 },
  { name: "Fishing", description: "Fishing and basic water-based food gathering", category: "survival", order: 4 },
  { name: "Shelter Building", description: "Construction of basic shelters and dwellings", category: "survival", order: 5 },
  // Craft & industry
  { name: "Pottery", description: "Making clay vessels for storage and cooking", category: "craft", order: 10 },
  { name: "Weaving", description: "Textiles and woven materials from plant or animal fiber", category: "craft", order: 11 },
  { name: "Mining", description: "Extracting stone and ores from the earth", category: "industry", order: 12 },
  { name: "Smelting", description: "Melting ores to produce metal", category: "industry", order: 13 },
  { name: "Metalworking", description: "Forging tools and weapons from metal", category: "industry", order: 14 },
  // Agriculture & domestication
  { name: "Agriculture", description: "Cultivating crops and farming", category: "agriculture", order: 20 },
  { name: "Irrigation", description: "Channeling water to crops", category: "agriculture", order: 21 },
  { name: "Animal Husbandry", description: "Domestication and raising of animals", category: "agriculture", order: 22 },
  // Transport & trade
  { name: "Wheel", description: "Wheel and axle for transport and machinery", category: "technology", order: 30 },
  { name: "Sailing", description: "Boats and sailing for water travel and trade", category: "technology", order: 31 },
  { name: "Roads", description: "Built roads and paths for trade and movement", category: "technology", order: 32 },
  // Culture & governance
  { name: "Writing", description: "Recording language in written form", category: "culture", order: 40 },
  { name: "Mathematics", description: "Counting, arithmetic, and basic geometry", category: "culture", order: 41 },
  { name: "Currency", description: "Standardized money for trade", category: "culture", order: 42 },
];

export const seedKnowledges = async () => {
  let created = 0;
  for (const k of KNOWLEDGE_LIST) {
    const existing = await db
      .select()
      .from(knowledgesTable)
      .where(eq(knowledgesTable.name, k.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(knowledgesTable).values({
        name: k.name,
        description: k.description,
        category: k.category,
        order: k.order,
      });
      created++;
    }
  }
  console.log(`Knowledges seeded: ${created} created, ${KNOWLEDGE_LIST.length} total`);
};

/** Optionally give all countries a few starting knowledge (e.g. Fire, Gathering). Set to empty to leave all unlocks for gameplay. */
const STARTING_KNOWLEDGE_NAMES: string[] = ["Fire", "Gathering"];

export const seedCountryKnowledges = async () => {
  const knowledgeRows = await db.select().from(knowledgesTable);
  const knowledgeByName = new Map(knowledgeRows.map((k) => [k.name, k]));
  const countries = await db.select().from(countriesTable);

  let created = 0;
  for (const country of countries) {
    for (const name of STARTING_KNOWLEDGE_NAMES) {
      const knowledge = knowledgeByName.get(name);
      if (!knowledge) continue;

      const existing = await db
        .select()
        .from(countryKnowledgesTable)
        .where(
          and(
            eq(countryKnowledgesTable.countryId, country.id),
            eq(countryKnowledgesTable.knowledgeId, knowledge.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(countryKnowledgesTable).values({
          countryId: country.id,
          knowledgeId: knowledge.id,
          unlockedAt: SIMULATOR_START_DATE,
        });
        created++;
      }
    }
  }
  console.log(`Country knowledges seeded: ${created} starting unlocks (${STARTING_KNOWLEDGE_NAMES.join(", ")}) for all countries`);
};
