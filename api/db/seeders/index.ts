import {
    seedUsers,
    seedUserRelationships,
    seedUserStats,
} from "./users.seeder";
import {
    seedContinents,
    seedCountries,
    seedStates,
    seedStateStats,
} from "./locations.seeder";
import { db } from "$/db";
import { sql } from "drizzle-orm";
import {
    usersTable,
    userRelationshipsTable,
    userPregnanciesTable,
    userStatsTable,
    userOccupationsTable,
    statesTable,
    countriesTable,
    continentsTable,
    stateStatsTable,
    occupationsTable,
} from "$/schema";

export const seed = async () => {
    // 1. Locations first (users need state id for location)
    await seedContinents();
    await seedCountries();
    await seedStates();
    await seedStateStats();

    // 2. Users (Adam & Eve at Selangor)
    await seedUsers();
    await seedUserStats();

    // 3. Relationships
    await seedUserRelationships();
};

export const clear = async () => {
    // Delete in order respecting foreign key constraints
    // 1. User-dependent tables
    await db.delete(userOccupationsTable);
    await db.delete(userStatsTable);
    await db.delete(userRelationshipsTable);

    // 2. Set birthPregnancyId to null in users (to break circular reference)
    await db.update(usersTable).set({ birthPregnancyId: null });

    // 3. Delete pregnancies (references users)
    await db.delete(userPregnanciesTable);

    // 4. Delete users
    await db.delete(usersTable);

    // 5. State-dependent tables
    await db.delete(stateStatsTable);

    // 6. Delete states (references countries)
    await db.delete(statesTable);

    // 7. Delete countries (references continents)
    await db.delete(countriesTable);

    // 8. Delete continents
    await db.delete(continentsTable);

    // 9. Delete occupations (no FKs from others)
    await db.delete(occupationsTable);

    // 10. Reset sequences to start from 1
    await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE user_relationships_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE user_pregnancies_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE user_stats_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE state_stats_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE states_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE countries_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE continents_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE occupations_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE user_occupations_id_seq RESTART WITH 1`);

    console.log("Database cleared successfully");
};