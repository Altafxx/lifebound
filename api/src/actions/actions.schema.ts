import { z } from "zod";

export const mateActionSchema = z.object({
  partnerId: z.coerce.number().int().positive(),
});

export type MateActionSchema = z.infer<typeof mateActionSchema>;

export const eatDrinkAmountSchema = z.object({
  amount: z.number().int().min(1).optional().default(1),
});

export type EatDrinkAmountSchema = z.infer<typeof eatDrinkAmountSchema>;

export const tickBatchSchema = z.object({
  userIds: z.array(z.number().int().positive()).optional(),
});

export type TickBatchSchema = z.infer<typeof tickBatchSchema>;
