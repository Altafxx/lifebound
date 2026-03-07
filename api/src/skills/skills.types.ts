import type { InferSelectModel } from "drizzle-orm";
import { skillsTable, usersTable } from "$/schema";

export type Skill = InferSelectModel<typeof skillsTable>;
export type User = InferSelectModel<typeof usersTable>;

export type SkillWithLearnedAt = Skill & { learnedAt: string };

export type UserWithLearnedAt = Pick<
  User,
  "id" | "firstName" | "lastName" | "gender" | "location" | "createdAt" | "updatedAt"
> & { learnedAt: string };

export type CountrySkillRow = {
  skillId: number;
  skillName: string;
  knowledgeId: number;
  knowledgeName: string;
  peopleCount: number;
};
