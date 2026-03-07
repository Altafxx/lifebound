import { skillsTable, knowledgesTable } from "$/schema";
import { db } from "$/db";
import { eq } from "drizzle-orm";

/** Skill types users can learn. Order: prerequisites must appear before skills that depend on them. */
const SKILLS: {
  name: string;
  description: string | null;
  knowledgeName: string;
  order: number;
  category: string;
  baseSuccessRate: number;
  prerequisiteName: string | null;
}[] = [
  { name: "Fishing", description: "Fishing and handling catch", knowledgeName: "Fishing", order: 1, category: "survival", baseSuccessRate: 60, prerequisiteName: null },
  { name: "Hiking", description: "Long-distance travel on foot", knowledgeName: "Gathering", order: 2, category: "survival", baseSuccessRate: 55, prerequisiteName: null },
  { name: "Cooking", description: "Preparing food with fire", knowledgeName: "Fire", order: 3, category: "survival", baseSuccessRate: 50, prerequisiteName: null },
  { name: "Hunting", description: "Tracking and hunting game", knowledgeName: "Hunting", order: 4, category: "survival", baseSuccessRate: 45, prerequisiteName: null },
  { name: "Shelter Making", description: "Building basic shelters", knowledgeName: "Shelter Building", order: 5, category: "survival", baseSuccessRate: 50, prerequisiteName: null },
  { name: "Pottery", description: "Shaping and firing clay", knowledgeName: "Pottery", order: 10, category: "craft", baseSuccessRate: 45, prerequisiteName: null },
  { name: "Weaving", description: "Making textiles and baskets", knowledgeName: "Weaving", order: 11, category: "craft", baseSuccessRate: 45, prerequisiteName: null },
  { name: "Carpentry", description: "Working wood for structures and tools", knowledgeName: "Weaving", order: 12, category: "craft", baseSuccessRate: 40, prerequisiteName: "Weaving" },
  { name: "Mining", description: "Extracting ore and stone", knowledgeName: "Mining", order: 20, category: "industry", baseSuccessRate: 40, prerequisiteName: null },
  { name: "Smelting", description: "Melting and casting metal", knowledgeName: "Smelting", order: 21, category: "industry", baseSuccessRate: 35, prerequisiteName: "Mining" },
  { name: "Metalworking", description: "Forging tools and weapons", knowledgeName: "Metalworking", order: 22, category: "industry", baseSuccessRate: 35, prerequisiteName: "Smelting" },
  { name: "Farming", description: "Growing crops", knowledgeName: "Agriculture", order: 30, category: "agriculture", baseSuccessRate: 50, prerequisiteName: null },
  { name: "Irrigation", description: "Managing water for crops", knowledgeName: "Irrigation", order: 31, category: "agriculture", baseSuccessRate: 40, prerequisiteName: "Farming" },
  { name: "Animal Husbandry", description: "Raising and tending animals", knowledgeName: "Animal Husbandry", order: 32, category: "agriculture", baseSuccessRate: 40, prerequisiteName: "Farming" },
  { name: "Sailing", description: "Sailing and navigating boats", knowledgeName: "Sailing", order: 40, category: "technology", baseSuccessRate: 40, prerequisiteName: null },
  { name: "Writing", description: "Reading and writing", knowledgeName: "Writing", order: 50, category: "culture", baseSuccessRate: 35, prerequisiteName: null },
  { name: "Mathematics", description: "Arithmetic and basic geometry", knowledgeName: "Mathematics", order: 51, category: "culture", baseSuccessRate: 40, prerequisiteName: null },
];

export const seedSkills = async () => {
  const knowledgeRows = await db.select().from(knowledgesTable);
  const knowledgeByName = new Map(knowledgeRows.map((k) => [k.name, k.id]));

  const skillByName = new Map<string, number>();
  const existingSkills = await db.select().from(skillsTable);
  for (const sk of existingSkills) skillByName.set(sk.name, sk.id);

  let created = 0;
  for (const s of SKILLS) {
    const knowledgeId = knowledgeByName.get(s.knowledgeName);
    if (knowledgeId == null) {
      console.warn(`Skill "${s.name}" skipped: knowledge "${s.knowledgeName}" not found`);
      continue;
    }

    const existing = await db
      .select()
      .from(skillsTable)
      .where(eq(skillsTable.name, s.name))
      .limit(1);

    if (existing.length === 0) {
      const prerequisiteSkillId =
        s.prerequisiteName != null ? skillByName.get(s.prerequisiteName) ?? null : null;
      if (s.prerequisiteName != null && prerequisiteSkillId == null) {
        console.warn(`Skill "${s.name}" skipped: prerequisite "${s.prerequisiteName}" not found`);
        continue;
      }

      const [inserted] = await db
        .insert(skillsTable)
        .values({
          name: s.name,
          description: s.description,
          knowledgeId,
          order: s.order,
          category: s.category,
          baseSuccessRate: s.baseSuccessRate,
          prerequisiteSkillId: prerequisiteSkillId ?? undefined,
        })
        .returning({ id: skillsTable.id });
      if (inserted) skillByName.set(s.name, inserted.id);
      created++;
    }
  }
  console.log(`Skills seeded: ${created} created (${SKILLS.length} definitions)`);
};
