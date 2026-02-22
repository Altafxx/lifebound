import { db } from "$/db";
import { usersTable, userRelationshipsTable, userPregnanciesTable } from "$/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { CreateUserRelationshipSchema, CreateUserSchema, GetUserPregnancySchema, GetUserSchema, UpdateUserPregnancySchema, UpdateUserSchema } from "./users.schema";
import {
    getFemalePregnancyProbability,
    getMalePregnancyProbability,
    getCombinedPregnancyProbability,
    checkPregnancyOccurrence,
    calculateGestationPeriod
} from "@/lib/pregnancy";
import { getAgeInYears } from "@/lib/age";

type User = InferInsertModel<typeof usersTable>;
type UserRow = InferSelectModel<typeof usersTable>;


export const usersService = {
    getUsers: async (): Promise<User[]> => {
        const users = await db.select().from(usersTable);
        return users;
    },
    getUserById: async (id: GetUserSchema["id"]): Promise<User | undefined> => {
        const users = await db.select().from(usersTable).where(eq(usersTable.id, id));
        return users[0];
    },
    createUser: async (user: CreateUserSchema): Promise<User> => {
        const result = await db.insert(usersTable).values(user).returning();
        if (!Array.isArray(result) || result.length === 0) {
            throw new Error("Failed to create user");
        }
        return result[0];
    },
    updateUser: async (id: GetUserSchema["id"], user: UpdateUserSchema): Promise<User> => {
        const result = await db.update(usersTable).set(user).where(eq(usersTable.id, id)).returning();
        const updatedUser = Array.isArray(result) && result.length > 0 ? result[0] : undefined;
        if (!updatedUser) {
            throw new Error(`User with id ${id} not found`);
        }
        return updatedUser;
    },
    deleteUser: async (id: GetUserSchema["id"]): Promise<User> => {
        const result = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
        const deletedUser = Array.isArray(result) && result.length > 0 ? result[0] : undefined;
        if (!deletedUser) {
            throw new Error(`User with id ${id} not found`);
        }
        return deletedUser;
    },
    getUserRelationships: async (id: GetUserSchema["id"]): Promise<{ father: UserRow | null; mother: UserRow | null; spouse: UserRow | null; children: UserRow[] }> => {
        // Only parent and spouse types; subject = "the relative" (e.g. parent), object = "related to" (e.g. child)
        const parentAndSpouseTypes = ["parent", "spouse"] as const;
        const [asSubject, asObject] = await Promise.all([
            db
                .select()
                .from(userRelationshipsTable)
                .where(
                    and(
                        eq(userRelationshipsTable.subjectUserId, id),
                        inArray(userRelationshipsTable.type, [...parentAndSpouseTypes])
                    )
                ),
            db
                .select()
                .from(userRelationshipsTable)
                .where(
                    and(
                        eq(userRelationshipsTable.objectUserId, id),
                        inArray(userRelationshipsTable.type, [...parentAndSpouseTypes])
                    )
                ),
        ]);
        const relationships = [...asSubject, ...asObject];

        if (relationships.length === 0) {
            return { father: null, mother: null, spouse: null, children: [] };
        }

        // From relationship rows: parent → subject is parent, object is child; spouse → other user is spouse
        const parentIds: number[] = [];
        const childIds: number[] = [];
        const spouseIds: number[] = [];
        for (const rel of relationships) {
            if (rel.type === "parent") {
                if (rel.objectUserId === id) parentIds.push(rel.subjectUserId); // user is child → subject is parent
                if (rel.subjectUserId === id) childIds.push(rel.objectUserId); // user is parent → object is child
            }
            if (rel.type === "spouse") {
                const otherId = rel.subjectUserId === id ? rel.objectUserId : rel.subjectUserId;
                spouseIds.push(otherId);
            }
        }

        const allIds = Array.from(new Set([...parentIds, ...childIds, ...spouseIds]));
        if (allIds.length === 0) {
            return { father: null, mother: null, spouse: null, children: [] };
        }

        const idsStr = allIds.map((uid) => String(uid)).join(",");
        const result = await db.execute(sql.raw(`SELECT * FROM users WHERE id IN (${idsStr})`));
        const users = (result.rows || result) as UserRow[];

        const father = users.find((u) => parentIds.includes(u.id) && u.gender === "male") ?? null;
        const mother = users.find((u) => parentIds.includes(u.id) && u.gender === "female") ?? null;
        const spouse = users.find((u) => spouseIds.includes(u.id)) ?? null;
        const children = users.filter((u) => childIds.includes(u.id));

        return { father, mother, spouse, children };
    },
    createUserRelationship: async (relationship: CreateUserRelationshipSchema): Promise<CreateUserRelationshipSchema> => {
        const [newRelationship] = await db.insert(userRelationshipsTable).values(relationship).returning();
        return newRelationship;
    },
    createUserConceivingPregnancy: async (userId: GetUserSchema["id"], userId2: GetUserSchema["id"], simulatorDate: string) => {
        const [userResult, user2Result] = await Promise.all([
            db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1).then(users => users[0]),
            db.select().from(usersTable).where(eq(usersTable.id, userId2)).limit(1).then(users => users[0]),
        ]);

        if (!userResult) {
            throw new Error(`User with id ${userId} not found`);
        }
        if (!user2Result) {
            throw new Error(`User with id ${userId2} not found`);
        }

        // Check that neither user is non-binary
        if (userResult.gender === "non-binary" || user2Result.gender === "non-binary") {
            throw new Error("Neither user can be non-binary to create a pregnancy");
        }

        // Check that both users have different genders
        if (userResult.gender === user2Result.gender) {
            throw new Error("Users must have different genders to create a pregnancy");
        }

        // Determine which user is male and which is female
        const maleUser = userResult.gender === "male" ? userResult : user2Result;
        const femaleUser = userResult.gender === "female" ? userResult : user2Result;
        const femaleUserId = userResult.gender === "female" ? userId : userId2;

        // Check if female user already has a pregnancy
        const existingPregnancy = await db
            .select()
            .from(userPregnanciesTable)
            .where(
                and(
                    eq(userPregnanciesTable.userId, femaleUserId),
                    eq(userPregnanciesTable.isCompleted, false)
                )
            )
            .limit(1);
        if (existingPregnancy.length > 0) {
            throw new Error("Female user already has a pregnancy");
        }

        // Age in years for probability (ageOverride prepends createdAt)
        const femaleAgeYears = getAgeInYears(femaleUser.createdAt, simulatorDate, femaleUser.ageOverride ?? undefined);
        const maleAgeYears = getAgeInYears(maleUser.createdAt, simulatorDate, maleUser.ageOverride ?? undefined);
        const femaleProbability = getFemalePregnancyProbability(femaleAgeYears);
        const maleProbability = getMalePregnancyProbability(maleAgeYears);
        const pregnancyProbability = getCombinedPregnancyProbability(femaleAgeYears, maleAgeYears);

        if (!checkPregnancyOccurrence(pregnancyProbability)) {
            throw new Error(`Pregnancy did not occur. Probability was ${pregnancyProbability.toFixed(1)}% (Female: ${femaleAgeYears}yo ${femaleProbability.toFixed(1)}%, Male: ${maleAgeYears}yo ${maleProbability.toFixed(1)}%)`);
        }

        const gestationPeriod = calculateGestationPeriod();

        const newPregnancy = await db.insert(userPregnanciesTable).values({
            userId: femaleUserId,
            gestationPeriod: gestationPeriod,
            isCompleted: false,
            createdAt: simulatorDate,
            updatedAt: simulatorDate,
        }).returning();

        return Array.isArray(newPregnancy) && newPregnancy.length > 0 ? newPregnancy[0] : newPregnancy;
    },
    getUserPregnancy: async (id: GetUserSchema["id"], simulatorDate: string) => {
        const pregnancy = await db
            .select()
            .from(userPregnanciesTable)
            .where(
                and(
                    eq(userPregnanciesTable.userId, id),
                    eq(userPregnanciesTable.isCompleted, false)
                )
            );
        return pregnancy;
    },
};
