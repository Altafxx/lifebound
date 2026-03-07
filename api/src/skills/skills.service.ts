import { db } from "$/db";
import {
  skillsTable,
  userSkillsTable,
  countrySkillsTable,
  usersTable,
  knowledgesTable,
} from "$/schema";
import { eq, asc } from "drizzle-orm";
import type {
  Skill,
  User,
  SkillWithLearnedAt,
  UserWithLearnedAt,
  CountrySkillRow,
} from "./skills.types";

export const skillsService = {
  getSkills: async (opts?: { category?: string }): Promise<Skill[]> => {
    if (opts?.category != null && opts.category !== "") {
      return db
        .select()
        .from(skillsTable)
        .where(eq(skillsTable.category, opts.category))
        .orderBy(asc(skillsTable.order), asc(skillsTable.id));
    }
    return db
      .select()
      .from(skillsTable)
      .orderBy(asc(skillsTable.order), asc(skillsTable.id));
  },

  getSkillById: async (id: number): Promise<Skill | undefined> => {
    const rows = await db
      .select()
      .from(skillsTable)
      .where(eq(skillsTable.id, id))
      .limit(1);
    return rows[0];
  },

  getSkillWithKnowledge: async (id: number) => {
    const rows = await db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        description: skillsTable.description,
        knowledgeId: skillsTable.knowledgeId,
        prerequisiteSkillId: skillsTable.prerequisiteSkillId,
        baseSuccessRate: skillsTable.baseSuccessRate,
        order: skillsTable.order,
        category: skillsTable.category,
        knowledgeName: knowledgesTable.name,
      })
      .from(skillsTable)
      .innerJoin(knowledgesTable, eq(skillsTable.knowledgeId, knowledgesTable.id))
      .where(eq(skillsTable.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return undefined;
    let prerequisiteSkillName: string | null = null;
    if (row.prerequisiteSkillId != null) {
      const [prereq] = await db
        .select({ name: skillsTable.name })
        .from(skillsTable)
        .where(eq(skillsTable.id, row.prerequisiteSkillId))
        .limit(1);
      prerequisiteSkillName = prereq?.name ?? null;
    }
    return { ...row, prerequisiteSkillName };
  },

  getUsersBySkillId: async (
    skillId: number
  ): Promise<UserWithLearnedAt[]> => {
    const rows = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        gender: usersTable.gender,
        location: usersTable.location,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        learnedAt: userSkillsTable.learnedAt,
      })
      .from(userSkillsTable)
      .innerJoin(usersTable, eq(userSkillsTable.userId, usersTable.id))
      .where(eq(userSkillsTable.skillId, skillId));
    return rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      gender: r.gender,
      location: r.location,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      learnedAt: r.learnedAt,
    }));
  },

  getSkillsByUserId: async (
    userId: number
  ): Promise<SkillWithLearnedAt[]> => {
    const rows = await db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        description: skillsTable.description,
        knowledgeId: skillsTable.knowledgeId,
        prerequisiteSkillId: skillsTable.prerequisiteSkillId,
        baseSuccessRate: skillsTable.baseSuccessRate,
        order: skillsTable.order,
        category: skillsTable.category,
        learnedAt: userSkillsTable.learnedAt,
      })
      .from(userSkillsTable)
      .innerJoin(skillsTable, eq(userSkillsTable.skillId, skillsTable.id))
      .where(eq(userSkillsTable.userId, userId));
    return rows.map((r) => ({
      ...r,
      learnedAt: r.learnedAt,
    }));
  },

  getCountrySkills: async (
    countryId: number
  ): Promise<CountrySkillRow[]> => {
    const rows = await db
      .select({
        skillId: countrySkillsTable.skillId,
        skillName: skillsTable.name,
        knowledgeId: skillsTable.knowledgeId,
        knowledgeName: knowledgesTable.name,
        peopleCount: countrySkillsTable.peopleCount,
      })
      .from(countrySkillsTable)
      .innerJoin(skillsTable, eq(countrySkillsTable.skillId, skillsTable.id))
      .innerJoin(knowledgesTable, eq(skillsTable.knowledgeId, knowledgesTable.id))
      .where(eq(countrySkillsTable.countryId, countryId));
    return rows.map((r) => ({
      skillId: r.skillId,
      skillName: r.skillName,
      knowledgeId: r.knowledgeId,
      knowledgeName: r.knowledgeName,
      peopleCount: r.peopleCount,
    }));
  },
};
