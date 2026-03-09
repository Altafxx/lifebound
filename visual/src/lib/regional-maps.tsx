import type { ComponentType } from "react";
import { Malaysia } from "@/static/malaysia";

/**
 * Country IDs match the world map SVG element ids (e.g. "my" for Malaysia, "us" for USA).
 * Add a regional map component here to enable "click to view states/regions" for that country.
 */
export const REGIONAL_MAPS: Record<string, ComponentType> = {
  my: Malaysia,
  // Add more as you add map components, e.g.:
  // us: USA,
  // in: India,
};

export function hasRegionalMap(countryId: string | null): countryId is keyof typeof REGIONAL_MAPS {
  return typeof countryId === "string" && countryId in REGIONAL_MAPS;
}
