// create a seeder for the users table, Adam and Eve
import { usersTable, userRelationshipsTable } from "$/schema";
import { db } from "$/db";
import { eq, and } from "drizzle-orm";
import type { CreateUserSchema } from "@/users/users.schema";
import type { RelationshipSeedSchema } from "./schemas";

const SIMULATOR_START = "0001-01-01";

const users: (CreateUserSchema & { createdAt?: string; updatedAt?: string })[] = [
    {
        firstName: "Adam",
        lastName: "Adam",
        ageOverride: 10957, // ~30 years in days (30 * 365.25)
        gender: "male",
        createdAt: SIMULATOR_START,
        updatedAt: SIMULATOR_START,
    },
    {
        firstName: "Eve",
        lastName: "Eve",
        ageOverride: 10227, // ~28 years in days (28 * 365.25)
        gender: "female",
        createdAt: SIMULATOR_START,
        updatedAt: SIMULATOR_START,
    }
];

const relationships: RelationshipSeedSchema[] = [
    {
        subjectFirstName: "Adam",
        subjectLastName: "Adam",
        objectFirstName: "Eve",
        objectLastName: "Eve",
        type: "spouse",
        isBiological: false,
        requireDifferentGender: true,
    },
    {
        subjectFirstName: "Eve",
        subjectLastName: "Eve",
        objectFirstName: "Adam",
        objectLastName: "Adam",
        type: "spouse",
        isBiological: false,
        requireDifferentGender: true,
    }
];

export const seedUsers = async () => {
    // Check if users already exist to avoid duplicates
    for (const user of users) {
        const existing = await db.select()
            .from(usersTable)
            .where(eq(usersTable.firstName, user.firstName))
            .limit(1);
        
        if (existing.length === 0) {
            await db.insert(usersTable).values({
                ...user,
                createdAt: SIMULATOR_START,
                updatedAt: SIMULATOR_START,
            }).returning();
            console.log(`Created user: ${user.firstName} ${user.lastName}`);
        } else {
            console.log(`User already exists: ${user.firstName} ${user.lastName}`);
        }
    }
};

export const seedUserRelationships = async () => {
    for (const relationship of relationships) {
        // Find subject user by firstName and lastName
        const [subjectUser] = await db.select()
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.firstName, relationship.subjectFirstName),
                    eq(usersTable.lastName, relationship.subjectLastName)
                )
            )
            .limit(1);
        
        // Find object user by firstName and lastName
        const [objectUser] = await db.select()
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.firstName, relationship.objectFirstName),
                    eq(usersTable.lastName, relationship.objectLastName)
                )
            )
            .limit(1);
        
        // Check if both users exist
        if (!subjectUser || !objectUser) {
            console.log(
                `Skipping relationship: ${relationship.subjectFirstName} ${relationship.subjectLastName} -> ${relationship.objectFirstName} ${relationship.objectLastName} (one or both users not found)`
            );
            continue;
        }
        
        // Check if genders are different (if required)
        if (relationship.requireDifferentGender && subjectUser.gender === objectUser.gender) {
            console.log(
                `Skipping relationship: ${relationship.subjectFirstName} ${relationship.subjectLastName} -> ${relationship.objectFirstName} ${relationship.objectLastName} (same gender, but different gender required)`
            );
            continue;
        }
        
        // Check if relationship already exists
        const existingRelationship = await db.select()
            .from(userRelationshipsTable)
            .where(
                and(
                    eq(userRelationshipsTable.subjectUserId, subjectUser.id),
                    eq(userRelationshipsTable.objectUserId, objectUser.id),
                    eq(userRelationshipsTable.type, relationship.type)
                )
            )
            .limit(1);
        
        if (existingRelationship.length === 0) {
            await db.insert(userRelationshipsTable).values({
                subjectUserId: subjectUser.id,
                objectUserId: objectUser.id,
                type: relationship.type,
                isBiological: relationship.isBiological ?? true,
                createdAt: SIMULATOR_START,
            });
            console.log(
                `Created ${relationship.type} relationship: ${relationship.subjectFirstName} ${relationship.subjectLastName} -> ${relationship.objectFirstName} ${relationship.objectLastName}`
            );
        } else {
            console.log(
                `${relationship.type} relationship already exists: ${relationship.subjectFirstName} ${relationship.subjectLastName} -> ${relationship.objectFirstName} ${relationship.objectLastName}`
            );
        }
    }
};