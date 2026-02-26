import { seedUsers, seedUserRelationships } from "./users.seeder";
import { seedContinents, seedCountries, seedStates } from "./locations.seeder";
import { db } from "$/db";
import { sql } from "drizzle-orm";
import {
    usersTable,
    userRelationshipsTable,
    userPregnanciesTable,
    statesTable,
    countriesTable,
    continentsTable,
} from "$/schema";

export const seed = async () => {
    await seedUsers();
    await seedUserRelationships();
    await seedContinents();
    await seedCountries();
    await seedStates();
};

export const clear = async () => {
    // Delete in order respecting foreign key constraints
    // 1. Delete relationships first (references users)
    await db.delete(userRelationshipsTable);

    // 2. Set birthPregnancyId to null in users (to break circular reference)
    await db.update(usersTable).set({ birthPregnancyId: null });

    // 3. Delete pregnancies (references users)
    await db.delete(userPregnanciesTable);

    // 4. Finally delete users
    await db.delete(usersTable);

    // 5. Delete states (references countries)
    await db.delete(statesTable);

    // 6. Delete countries (references continents)
    await db.delete(countriesTable);

    // 7. Delete continents
    await db.delete(continentsTable);

    // 8. Reset sequences to start from 1
    await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE user_relationships_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE user_pregnancies_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE states_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE countries_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE continents_id_seq RESTART WITH 1`);

    console.log("Database cleared successfully");
};