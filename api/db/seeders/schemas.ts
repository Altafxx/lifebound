import { z } from "zod";

/**
 * Schema for seeding relationships by user names (instead of IDs).
 * Used in database seeders to define relationships between users.
 */
export const relationshipSeedSchema = z.object({
    subjectFirstName: z.string().min(1),
    subjectLastName: z.string().min(1),
    objectFirstName: z.string().min(1),
    objectLastName: z.string().min(1),
    type: z.enum(["parent", "spouse", "guardian"]),
    isBiological: z.boolean().optional(),
    requireDifferentGender: z.boolean().optional(), // For spouse relationships, require different genders
});

export type RelationshipSeedSchema = z.infer<typeof relationshipSeedSchema>;
