# Lifebound API — Cursor usage guide

Documentation for working with the `api/` codebase in Cursor: structure, conventions, and how to run or extend the API.

---

## Overview

- **Runtime:** Bun
- **Framework:** Hono
- **DB:** PostgreSQL with Drizzle ORM
- **Validation:** Zod
- **Entry:** `api/src/index.ts` — Hono app, `Bun.serve` on `PORT` (default 3000)

---

## Project structure

```
api/
├── src/
│   ├── index.ts              # App entry, routes mount, Bun.serve
│   ├── config.ts             # Env validation (DATABASE_URL, PORT) → config
│   ├── errors.ts             # ERROR_MESSAGES, getErrorMessage, createErrorResponse
│   ├── users/
│   │   ├── users.controller.ts   # HTTP routes for /users
│   │   ├── users.service.ts      # Business logic, DB access
│   │   └── users.schema.ts       # Zod schemas + inferred types
│   └── lib/
│       ├── schemas.ts         # Shared Zod schemas (e.g. DaysSchema)
│       └── pregnancy.ts       # Pregnancy probability & gestation helpers
├── db/
│   ├── db.ts                 # Drizzle client (uses DATABASE_URL)
│   ├── schema.ts             # Re-exports from ./users
│   ├── users.ts              # Table defs: users, user_pregnancies, user_relationships
│   └── seeders/
│       ├── cli.ts            # CLI: seed | clear | reset
│       ├── index.ts          # seed(), clear()
│       ├── schemas.ts        # relationshipSeedSchema for seed data
│       └── users.seeder.ts   # seedUsers, seedUserRelationships
├── drizzle.config.ts        # Drizzle Kit config (schema: ./db/schema.ts, out: ./drizzle; uses config)
├── tsconfig.json             # Path aliases: @/* → src/*, $/* → db/*
└── .env                      # DATABASE_URL, optionally PORT (see config)
```

---

## Path aliases (tsconfig)

Use these when editing or adding files so Cursor and the compiler resolve imports correctly:

| Alias | Resolves to | Use for |
|-------|-------------|--------|
| `@/*` | `api/src/*` | Controllers, services, schemas, lib, errors |
| `$/*` | `api/db/*`   | DB client, schema (tables), seeders |

Examples:

- `import { getErrorMessage } from "@/errors";`
- `import { db } from "$/db";`
- `import { usersTable, userRelationshipsTable, userPregnanciesTable } from "$/schema";`

---

## Config and environment variables

All env-based settings are centralized in **`src/config.ts`**. It loads `.env` via `dotenv/config`, validates with Zod, and exports a typed `config` object. Use `import { config } from "@/config"` instead of `process.env` elsewhere.

| Variable        | Required | Description |
|----------------|----------|-------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/lifebound`) |
| `PORT`         | No       | Server port (default `3000`) |

**Exported config:** `config.databaseUrl`, `config.port`. Used by `db/db.ts`, `src/index.ts`, and `drizzle.config.ts`. Ensure `.env` exists in `api/` when running or seeding.

---

## Running the API

From repo root or from `api/`:

```bash
cd api
bun install
bun run dev          # Hot-reload server (default http://localhost:3000)
```

Database scripts (run from `api/` with `.env` / config set):

```bash
bun run db:seed      # seed
bun run db:clear     # clear all data
bun run db:reset     # clear + seed
```

---

## Conventions for Cursor

1. **Imports:** Prefer `@/` for `src/` and `$/` for `db/` so path aliases stay consistent.
2. **New routes:** Add route in the appropriate controller (e.g. `users.controller.ts`), keep logic in the corresponding service, validate with Zod and use types from `users.schema.ts` or `lib/schemas.ts`. Users create/update use **form data**; use `X-Simulator-Day` header where simulator day is needed (see [users.md](./users.md)).
3. **DB access:** Use the shared client from `$/db`; define tables in `db/users.ts` and re-export via `db/schema.ts`. Run migrations / Drizzle Kit from `api/` with env set (via `.env` / `config`).
4. **Pregnancy logic:** Probability and gestation are in `src/lib/pregnancy.ts`; use those helpers when adding or changing pregnancy-related behavior.
5. **Seeding:** Add seed data in `db/seeders/`, use `relationshipSeedSchema` (or similar) for relationship-by-name seeds; clear order in `clear()` respects FKs (relationships → set users.birthPregnancyId null → pregnancies → users, then sequence resets).

---

## Domain docs

| Doc | Contents |
|-----|----------|
| [users.md](./users.md) | Users API endpoints, request/response schemas; GET relationships returns father, mother, spouse, children |
| [locations-achievements-eras.md](./locations-achievements-eras.md) | Locations (continents, countries, states), achievements, and eras API |
| [db.md](./db.md) | Database schema (tables, relations), seeders, Drizzle config |
| [lib.md](./lib.md) | Shared libs: errors, `lib/schemas`, `lib/pregnancy` |

Config lives in `src/config.ts` (env validation → `config.databaseUrl`, `config.port`); see "Config and environment variables" above.

Use this overview together with the domain docs when asking Cursor to add endpoints, change schemas, fix bugs, or run/seed the API.
