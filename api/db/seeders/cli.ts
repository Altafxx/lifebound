#!/usr/bin/env bun
import { seed, clear } from "./index";

const command = process.argv[2];

async function main() {
    try {
        if (command === "seed") {
            console.log("Seeding database...");
            await seed();
            console.log("Database seeded successfully");
        } else if (command === "clear") {
            console.log("Clearing database...");
            await clear();
        } else if (command === "reset") {
            console.log("Resetting database (clear + seed)...");
            await clear();
            await seed();
            console.log("Database reset successfully");
        } else {
            console.log("Usage: bun run db:seed [seed|clear|reset]");
            console.log("  seed  - Seed the database");
            console.log("  clear - Clear all data from the database");
            console.log("  reset - Clear and seed the database");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main();
