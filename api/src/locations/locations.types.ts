import type { InferSelectModel } from "drizzle-orm";
import {
  continentsTable,
  countriesTable,
  statesTable,
  stateStatsTable,
} from "$/schema";

export type Continent = InferSelectModel<typeof continentsTable>;
export type Country = InferSelectModel<typeof countriesTable>;
export type State = InferSelectModel<typeof statesTable>;
export type StateWithStats = State & {
  stats: InferSelectModel<typeof stateStatsTable> | null;
};
