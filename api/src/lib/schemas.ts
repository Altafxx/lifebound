import { z } from "zod";

export const daysSchema = z.object({
    days: z.number().int().min(0),
});

export type DaysSchema = z.infer<typeof daysSchema>;

/** ISO date string YYYY-MM-DD (e.g. 0001-01-01). */
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/** Parse simulator date from header (X-Simulator-Day). Value must be YYYY-MM-DD. */
export const simulatorDateHeaderSchema = z
    .string()
    .min(1)
    .regex(isoDateRegex, "Must be YYYY-MM-DD")
    .refine((s) => !Number.isNaN(new Date(s).getTime()), { message: "Invalid date" });
export type SimulatorDateHeader = z.infer<typeof simulatorDateHeaderSchema>;

export const SIMULATOR_DAY_HEADER = "x-simulator-day";
