import type { InferSelectModel } from "drizzle-orm";
import { knowledgesTable, countriesTable } from "$/schema";

export type Knowledge = InferSelectModel<typeof knowledgesTable>;
export type Country = InferSelectModel<typeof countriesTable>;

export type CountryWithUnlockedAt = Country & { unlockedAt: string };

export type KnowledgeWithUnlockedAt = Knowledge & { unlockedAt: string };
