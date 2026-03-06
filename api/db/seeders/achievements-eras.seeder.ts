import {
  achievementsTable,
  erasTable,
  countryErasTable,
  countryNeighborsTable,
  countriesTable,
} from "$/schema";
import { db } from "$/db";
import { and, eq } from "drizzle-orm";

const SIMULATOR_START = "0001-01-01";

/** Random achievements countries can earn. */
const ACHIEVEMENTS: { name: string; description: string | null }[] = [
  { name: "First Settlement", description: "Established the first human settlement" },
  { name: "Trade Hub", description: "Became a major trading center" },
  { name: "Cultural Center", description: "Developed a thriving cultural scene" },
  { name: "Agricultural Pioneer", description: "Led in agricultural innovation" },
  { name: "Maritime Power", description: "Built a dominant naval presence" },
  { name: "Industrial Revolution", description: "Completed industrialization" },
  { name: "Golden Age", description: "Entered a period of prosperity" },
  { name: "Diplomatic Master", description: "Formed alliances with all neighbors" },
  { name: "Population Milestone", description: "Reached 1 million inhabitants" },
  { name: "Natural Wonder", description: "Discovered a natural wonder" },
];

/** Human civilization eras in chronological order (oldest first). Starts from first humans on Earth. */
const ERAS: { name: string; description: string | null }[] = [
  { name: "Primal Age", description: "First humans on Earth, survival and migration" },
  { name: "Stone Age", description: "Hunter-gatherers, early tools" },
  { name: "Copper Age", description: "First metal use, transition to metallurgy" },
  { name: "Bronze Age", description: "Metalworking, first civilizations" },
  { name: "Iron Age", description: "Iron tools and weapons" },
  { name: "Classical Age", description: "Ancient empires and philosophy" },
  { name: "Medieval Age", description: "Feudalism, castles, kingdoms" },
  { name: "Renaissance", description: "Art, science, and exploration" },
  { name: "Age of Discovery", description: "Exploration, colonialism, new trade routes" },
  { name: "Enlightenment Age", description: "Reason, philosophy, scientific revolution" },
  { name: "Industrial Age", description: "Machines, factories, urbanization" },
  { name: "Modern Age", description: "Technology, global connectivity" },
  { name: "Information Age", description: "Computers, internet, digital revolution" },
  { name: "Space Age", description: "Space exploration, satellites, beyond Earth" },
  { name: "Digital Age", description: "AI, automation, virtual worlds" },
  { name: "Biotech Age", description: "Genetic engineering, longevity, synthetic life" },
  { name: "Interstellar Age", description: "Colonizing other star systems" },
  { name: "Fusion Age", description: "Clean energy, advanced propulsion, resource abundance" },
  { name: "Transcendence Age", description: "Post-human evolution, cosmic civilization" },
  { name: "Cosmic Age", description: "Galaxy-spanning civilization, mastery of stars" },
  { name: "Singularity Age", description: "Technological singularity, beyond human comprehension" },
  { name: "Eternal Age", description: "The ultimate end state, timeless civilization" },
];

/** Malaysia's neighbors (isoA2). Seeder looks up country ids by isoA2 and creates both directions. */
const MALAYSIA_NEIGHBORS = ["TH", "ID", "BN", "SG"] as const;

export const seedAchievements = async () => {
  let created = 0;
  for (const a of ACHIEVEMENTS) {
    const existing = await db
      .select()
      .from(achievementsTable)
      .where(eq(achievementsTable.name, a.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(achievementsTable).values({
        name: a.name,
        description: a.description,
      });
      created++;
    }
  }
  console.log(`Achievements seeded: ${created} created, ${ACHIEVEMENTS.length} total`);
};

export const seedEras = async () => {
  let created = 0;
  for (let i = 0; i < ERAS.length; i++) {
    const e = ERAS[i];
    const existing = await db
      .select()
      .from(erasTable)
      .where(eq(erasTable.name, e.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(erasTable).values({
        name: e.name,
        order: i + 1,
        description: e.description,
      });
      created++;
    }
  }
  console.log(`Eras seeded: ${created} created, ${ERAS.length} total`);
};

export const seedCountryEras = async () => {
  const [firstEra] = await db
    .select()
    .from(erasTable)
    .where(eq(erasTable.order, 1))
    .limit(1);

  if (!firstEra) {
    console.log("First era not found; run seedEras first. Skipping country_eras.");
    return;
  }

  const countries = await db.select().from(countriesTable);
  let created = 0;
  for (const c of countries) {
    const existing = await db
      .select()
      .from(countryErasTable)
      .where(and(eq(countryErasTable.countryId, c.id), eq(countryErasTable.eraId, firstEra.id)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(countryErasTable).values({
        countryId: c.id,
        eraId: firstEra.id,
        enteredAt: SIMULATOR_START,
      });
      created++;
    }
  }
  console.log(`Country eras seeded: ${created} countries started in ${firstEra.name}`);
};

export const seedCountryNeighbors = async () => {
  const countries = await db
    .select({ id: countriesTable.id, isoA2: countriesTable.isoA2 })
    .from(countriesTable);
  const byIso = new Map(countries.map((c) => [c.isoA2, c.id]));

  const malaysiaId = byIso.get("MY");
  if (!malaysiaId) {
    console.log("Malaysia not found; run seedCountries first. Skipping country_neighbors.");
    return;
  }

  let created = 0;
  for (const neighborIso of MALAYSIA_NEIGHBORS) {
    const neighborId = byIso.get(neighborIso);
    if (!neighborId) continue;

    const existing = await db
      .select()
      .from(countryNeighborsTable)
      .where(
        and(
          eq(countryNeighborsTable.countryId, malaysiaId),
          eq(countryNeighborsTable.neighborCountryId, neighborId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(countryNeighborsTable).values({
        countryId: malaysiaId,
        neighborCountryId: neighborId,
      });
      created++;
      // Also add reverse direction
      const rev = await db
        .select()
        .from(countryNeighborsTable)
        .where(
          and(
            eq(countryNeighborsTable.countryId, neighborId),
            eq(countryNeighborsTable.neighborCountryId, malaysiaId)
          )
        )
        .limit(1);
      if (rev.length === 0) {
        await db.insert(countryNeighborsTable).values({
          countryId: neighborId,
          neighborCountryId: malaysiaId,
        });
        created++;
      }
    }
  }
  console.log(`Country neighbors seeded: ${created} pairs (Malaysia ↔ TH, ID, BN, SG)`);
};
