/**
 * Skill learning logic: prerequisites (country knowledge + user skills), success rate,
 * and ease-of-learning boost (more people in country with skill = higher success).
 * Not wired into API yet — use from simulator or future endpoints.
 */

import { db } from "$/db";
import {
  usersTable,
  statesTable,
  countryKnowledgesTable,
  skillsTable,
  userSkillsTable,
  countrySkillsTable,
} from "$/schema";
import { eq, and, sql } from "drizzle-orm";
import { ADOPTION_BOOST_TIERS, MAX_ADOPTION_BOOST } from "./constants";

/**
 * Get the country id for a user (via user.location → state → country).
 */
export async function getCountryIdByUserId(userId: number): Promise<number | null> {
  const [user] = await db
    .select({ location: usersTable.location })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return null;

  const [state] = await db
    .select({ countryId: statesTable.countryId })
    .from(statesTable)
    .where(eq(statesTable.id, Number(user.location)))
    .limit(1);
  return state?.countryId ?? null;
}

/**
 * Check if a user can learn a skill.
 * Requires: (1) country has the skill's knowledge, (2) user has prerequisite skill if any, (3) user doesn't already have it.
 */
export async function canUserLearnSkill(
  userId: number,
  skillId: number
): Promise<{ ok: boolean; reason?: string }> {
  const countryId = await getCountryIdByUserId(userId);
  if (countryId == null) {
    return { ok: false, reason: "User or user location not found" };
  }

  const [skill] = await db
    .select({
      knowledgeId: skillsTable.knowledgeId,
      prerequisiteSkillId: skillsTable.prerequisiteSkillId,
    })
    .from(skillsTable)
    .where(eq(skillsTable.id, skillId))
    .limit(1);
  if (!skill) {
    return { ok: false, reason: "Skill not found" };
  }

  const [hasKnowledge] = await db
    .select()
    .from(countryKnowledgesTable)
    .where(
      and(
        eq(countryKnowledgesTable.countryId, countryId),
        eq(countryKnowledgesTable.knowledgeId, skill.knowledgeId)
      )
    )
    .limit(1);

  if (!hasKnowledge) {
    return { ok: false, reason: "Country does not have the required knowledge for this skill" };
  }

  if (skill.prerequisiteSkillId != null) {
    const [hasPrereq] = await db
      .select()
      .from(userSkillsTable)
      .where(
        and(
          eq(userSkillsTable.userId, userId),
          eq(userSkillsTable.skillId, skill.prerequisiteSkillId)
        )
      )
      .limit(1);
    if (!hasPrereq) {
      return { ok: false, reason: "User must learn the prerequisite skill first" };
    }
  }

  const [alreadyHas] = await db
    .select()
    .from(userSkillsTable)
    .where(
      and(eq(userSkillsTable.userId, userId), eq(userSkillsTable.skillId, skillId))
    )
    .limit(1);
  if (alreadyHas) {
    return { ok: false, reason: "User already has this skill" };
  }

  return { ok: true };
}

/**
 * Adoption rate: percentage of users in the country who have this skill (0–100).
 * Used to compute success-rate boost. Reads from country_skills table.
 */
export async function getAdoptionRate(countryId: number, skillId: number): Promise<number> {
  const [row] = await db
    .select({ peopleCount: countrySkillsTable.peopleCount })
    .from(countrySkillsTable)
    .where(
      and(
        eq(countrySkillsTable.countryId, countryId),
        eq(countrySkillsTable.skillId, skillId)
      )
    )
    .limit(1);

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .innerJoin(statesTable, eq(usersTable.location, statesTable.id))
    .where(eq(statesTable.countryId, countryId));
  const total = totalResult[0]?.count ?? 0;
  if (total === 0) return 0;

  const count = row?.peopleCount ?? 0;
  return Math.min(100, Math.round((count / total) * 100));
}

/**
 * Compute country skill stats from DB only (no country_skills table).
 * Use for reconciliation or when table is out of sync; normal reads use country_skills.
 */
export async function getCountrySkillStatsFromDb(
  countryId: number,
  skillId: number
): Promise<{ peopleCount: number; totalUsersInCountry: number; adoptionRate: number }> {
  const [withSkill] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userSkillsTable)
    .innerJoin(usersTable, eq(userSkillsTable.userId, usersTable.id))
    .innerJoin(statesTable, eq(usersTable.location, statesTable.id))
    .where(
      and(
        eq(statesTable.countryId, countryId),
        eq(userSkillsTable.skillId, skillId)
      ));

  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .innerJoin(statesTable, eq(usersTable.location, statesTable.id))
    .where(eq(statesTable.countryId, countryId));

  const peopleCount = withSkill?.count ?? 0;
  const totalUsersInCountry = total?.count ?? 0;
  const adoptionRate =
    totalUsersInCountry === 0
      ? 0
      : Math.min(100, Math.round((peopleCount / totalUsersInCountry) * 100));

  return { peopleCount, totalUsersInCountry, adoptionRate };
}

/**
 * Additional success-rate boost from adoption (0–30%).
 * Tiers: >30% → +5%, >50% → +10%, >75% → +15%, >85% → +20%, >95% → +25%, >98% → +30%.
 */
export function getSuccessRateBoost(adoptionRate: number): number {
  for (const { threshold, boost } of ADOPTION_BOOST_TIERS) {
    if (adoptionRate >= threshold) return Math.min(boost, MAX_ADOPTION_BOOST);
  }
  return 0;
}

/**
 * Effective success rate for a user attempting to learn a skill.
 * baseRate + boost (capped at 100).
 */
export async function getEffectiveSuccessRate(
  userId: number,
  skillId: number
): Promise<{ baseRate: number; boost: number; effectiveRate: number; adoptionRate: number } | null> {
  const countryId = await getCountryIdByUserId(userId);
  if (countryId == null) return null;

  const [skill] = await db
    .select({ baseSuccessRate: skillsTable.baseSuccessRate })
    .from(skillsTable)
    .where(eq(skillsTable.id, skillId))
    .limit(1);
  if (!skill) return null;

  const adoptionRate = await getAdoptionRate(countryId, skillId);
  const boost = getSuccessRateBoost(adoptionRate);
  const effectiveRate = Math.min(100, skill.baseSuccessRate + boost);

  return {
    baseRate: skill.baseSuccessRate,
    boost,
    effectiveRate,
    adoptionRate,
  };
}

/**
 * Attempt to learn a skill. Success is probabilistic based on effective success rate.
 * If successful, records the skill and updates country_skills.peopleCount.
 * Not wired to API yet.
 */
export async function attemptLearnSkill(
  userId: number,
  skillId: number,
  simulatorDate: string,
  rng: () => number = () => Math.random()
): Promise<{
  success: boolean;
  reason?: string;
  effectiveRate?: number;
  baseRate?: number;
  boost?: number;
  adoptionRate?: number;
}> {
  const can = await canUserLearnSkill(userId, skillId);
  if (!can.ok) return { success: false, reason: can.reason };

  const rates = await getEffectiveSuccessRate(userId, skillId);
  if (!rates) return { success: false, reason: "Could not compute success rate" };

  const roll = rng() * 100;
  if (roll >= rates.effectiveRate) {
    return {
      success: false,
      reason: "Learning attempt failed (random roll)",
      effectiveRate: rates.effectiveRate,
      baseRate: rates.baseRate,
      boost: rates.boost,
      adoptionRate: rates.adoptionRate,
    };
  }

  const learn = await learnSkill(userId, skillId, simulatorDate);
  if (!learn.ok) return { success: false, reason: learn.reason };

  return {
    success: true,
    effectiveRate: rates.effectiveRate,
    baseRate: rates.baseRate,
    boost: rates.boost,
    adoptionRate: rates.adoptionRate,
  };
}

/**
 * Ease of learning a skill in a country: number of people in that country who already have the skill.
 * Higher = easier to learn (more peers to learn from). Reads from country_skills table.
 */
export async function getEaseOfLearningSkill(
  countryId: number,
  skillId: number
): Promise<number> {
  const [row] = await db
    .select({ peopleCount: countrySkillsTable.peopleCount })
    .from(countrySkillsTable)
    .where(
      and(
        eq(countrySkillsTable.countryId, countryId),
        eq(countrySkillsTable.skillId, skillId)
      )
    )
    .limit(1);
  return row?.peopleCount ?? 0;
}

/**
 * Record that a user learned a skill and update country_skills.peopleCount.
 * Fails if canUserLearnSkill would return false.
 */
export async function learnSkill(
  userId: number,
  skillId: number,
  simulatorDate: string
): Promise<{ ok: boolean; reason?: string }> {
  const can = await canUserLearnSkill(userId, skillId);
  if (!can.ok) return can;

  const countryId = await getCountryIdByUserId(userId);
  if (countryId == null) return { ok: false, reason: "User country not found" };

  await db.insert(userSkillsTable).values({
    userId,
    skillId,
    learnedAt: simulatorDate,
  });

  const [existing] = await db
    .select()
    .from(countrySkillsTable)
    .where(
      and(
        eq(countrySkillsTable.countryId, countryId),
        eq(countrySkillsTable.skillId, skillId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(countrySkillsTable)
      .set({ peopleCount: existing.peopleCount + 1 })
      .where(eq(countrySkillsTable.id, existing.id));
  } else {
    await db.insert(countrySkillsTable).values({
      countryId,
      skillId,
      peopleCount: 1,
    });
  }

  return { ok: true };
}

/**
 * Remove a user's skill and decrement country_skills.peopleCount.
 * Not used anywhere yet.
 */
export async function unlearnSkill(
  userId: number,
  skillId: number
): Promise<{ ok: boolean; reason?: string }> {
  const [row] = await db
    .select()
    .from(userSkillsTable)
    .where(
      and(eq(userSkillsTable.userId, userId), eq(userSkillsTable.skillId, skillId))
    )
    .limit(1);
  if (!row) {
    return { ok: false, reason: "User does not have this skill" };
  }

  const countryId = await getCountryIdByUserId(userId);
  if (countryId != null) {
    const [countryRow] = await db
      .select()
      .from(countrySkillsTable)
      .where(
        and(
          eq(countrySkillsTable.countryId, countryId),
          eq(countrySkillsTable.skillId, skillId)
        )
      )
      .limit(1);
    if (countryRow) {
      const newCount = Math.max(0, countryRow.peopleCount - 1);
      if (newCount === 0) {
        await db.delete(countrySkillsTable).where(eq(countrySkillsTable.id, countryRow.id));
      } else {
        await db
          .update(countrySkillsTable)
          .set({ peopleCount: newCount })
          .where(eq(countrySkillsTable.id, countryRow.id));
      }
    }
  }

  await db.delete(userSkillsTable).where(eq(userSkillsTable.id, row.id));
  return { ok: true };
}
