import { z } from "zod";

/** ISO date YYYY-MM-DD */
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const createUserSchema = z.object({
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    ageOverride: z.number().int().min(0).optional(),
    gender: z.enum(["male", "female", "non-binary"]),
    location: z.number().int().positive(), // state id
    birthPregnancyId: z.number().int().positive().optional(),
    isDeceased: z.boolean().default(false).optional(),
    createdAt: dateStringSchema.optional(),
    updatedAt: dateStringSchema.optional(),
});

export const updateUserSchema = z.object({
    firstName: z.string().min(1).max(255).optional(),
    lastName: z.string().min(1).max(255).optional(),
    ageOverride: z.number().int().min(0).optional(),
    gender: z.enum(["male", "female", "non-binary"]).optional(),
    location: z.number().int().positive().optional(), // state id
    birthPregnancyId: z.number().int().positive().optional().nullable(),
    isDeceased: z.boolean().optional(),
    updatedAt: dateStringSchema.optional(),
});

export const getUserSchema = z.object({
    id: z.number().int().positive(),
});

export const createUserRelationshipSchema = z.object({
    subjectUserId: z.number().int().positive(),
    objectUserId: z.number().int().positive(),
    type: z.enum(["parent", "spouse", "guardian"]),
    isBiological: z.boolean().default(true),
    createdAt: dateStringSchema,
});

export const createUserPregnancySchema = z.object({
    userId: z.number().int().positive(),
    gestationPeriod: z.number().int().min(0),
    isCompleted: z.boolean().default(false),
    createdAt: dateStringSchema,
    updatedAt: dateStringSchema.optional(),
});

export const updateUserPregnancySchema = z.object({
    userId: z.number().int().positive().optional(),
    gestationPeriod: z.number().int().min(0).optional(),
    isCompleted: z.boolean().optional(),
    updatedAt: dateStringSchema.optional(),
});

export const getUserPregnancySchema = z.object({
    id: z.number().int().positive(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type GetUserSchema = z.infer<typeof getUserSchema>;
export type CreateUserRelationshipSchema = z.infer<typeof createUserRelationshipSchema>;
export type CreateUserPregnancySchema = z.infer<typeof createUserPregnancySchema>;
export type UpdateUserPregnancySchema = z.infer<typeof updateUserPregnancySchema>;
export type GetUserPregnancySchema = z.infer<typeof getUserPregnancySchema>;