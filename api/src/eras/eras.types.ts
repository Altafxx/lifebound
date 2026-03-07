import type { InferSelectModel } from "drizzle-orm";
import { erasTable, countriesTable } from "$/schema";

export type Era = InferSelectModel<typeof erasTable>;
export type Country = InferSelectModel<typeof countriesTable>;

export type CountryWithEnteredAt = Country & { enteredAt: string };
