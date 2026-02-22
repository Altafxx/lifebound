import { config } from "@/config";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(config.databaseUrl);
