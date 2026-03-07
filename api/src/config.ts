import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	PORT: z
		.string()
		.optional()
		.transform((v) => (v ? Number(v) : 3000)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	const msg = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
	throw new Error(`Invalid env: ${msg}`);
}

export const config = {
	databaseUrl: parsed.data.DATABASE_URL,
	port: parsed.data.PORT ?? 5000,
} as const;
