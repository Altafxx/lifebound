# Database

Drizzle ORM, schema (tables/relations), and seeders. Client and config live in `api/db/`.

---

## Client and config

- **Client:** `db/db.ts` — `drizzle(config.databaseUrl)` using `config` from `@/config`, exported as `db`. Use `import { db } from "$/db";`.
- **Config:** `drizzle.config.ts` — schema `./db/schema.ts`, output `./drizzle`, dialect `postgresql`. Uses `config.databaseUrl` from `src/config.ts`.

---

## Schema (tables and relations)

Defined in `db/users.ts` and `db/locations.ts`; re-exported from `db/schema.ts` for Drizzle Kit and `$/schema` imports.

### Tables

- **`continents`**
  - `id` — identity PK
  - `name` — text, not null
  - `code` — varchar 2, not null, unique (AF, AN, AS, EU, NA, OC, SA)

- **`countries`**
  - `id` — identity PK
  - `name` — text, not null
  - `isoA2` — varchar 2, not null (ISO 3166-1 alpha-2)
  - `isoA3` — varchar 3, not null (ISO 3166-1 alpha-3)
  - `isoNumber` — bigint, not null (ISO 3166-1 numeric)
  - `tld` — text, nullable
  - `phoneCode` — text[], nullable (can contain multiple dial codes)
  - `continentId` — FK → `continents.id`, nullable, on delete set null

- **`states`**
  - `id` — bigint identity PK
  - `countryId` — FK → `countries.id`, not null, on delete cascade
  - `name` — text, not null. Seed data includes Malaysia only (13 states + 3 federal territories).

- **`users`**
  - `id` — identity PK
  - `birthPregnancyId` — FK → `user_pregnancies.id` (nullable)
  - `firstName`, `lastName` — varchar 255, not null
  - `ageOverride` — integer, nullable. Days to prepend to `createdAt` for age (e.g. timeline jump). Current age in days = (current simulator date − createdAt) in days + ageOverride.
  - `gender` — enum `gender`: `male` \| `female` \| `non-binary`
  - `isDeceased` — boolean, default false
  - `createdAt`, `updatedAt` — date (YYYY-MM-DD), default 0001-01-01. Simulator date, not real-world.

- **`user_pregnancies`**
  - `id` — identity PK
  - `userId` — FK → `users.id`, not null
  - `gestationPeriod` — integer, not null
  - `isCompleted` — boolean, default false
  - `createdAt`, `updatedAt` — date (YYYY-MM-DD), default 0001-01-01.

- **`user_relationships`**
  - `id` — identity PK
  - **`subjectUserId`** — FK → `users.id`, not null. The user who **is** the role (e.g. the parent, the spouse).
  - **`objectUserId`** — FK → `users.id`, not null. The user **they are related to** (e.g. the child, the other spouse).
  - `type` — enum `relation_type`: `parent` \| `spouse` \| `guardian`
  - `isBiological` — boolean, default true
  - `createdAt` — date (YYYY-MM-DD), default 0001-01-01.

  **Subject vs object (by type):**

  | type     | subjectUserId is… | objectUserId is… | Example row (subject → object) |
  |----------|-------------------|------------------|---------------------------------|
  | parent   | the parent        | the child       | Adam (parent) → Cain (child)    |
  | spouse   | one spouse        | the other spouse| Adam → Eve                      |
  | guardian | the guardian      | the ward        | Guardian → Ward                 |

  So: **subject** = “the one who has the role”, **object** = “the one they’re linked to”. For parent, subject is always the parent and object is the child.
  - **Note:** The GET `/users/:id/relationships` API only considers rows with `type` in `parent` and `spouse`; guardian is ignored for that endpoint.

### Relations (Drizzle relations)

- Continents ↔ countries: `continentId` (continent, countries).
- Countries ↔ states: `countryId` (country, states).
- Users ↔ user_relationships: `subjectUserId` / `objectUserId` (subject_user, object_user).
- Users ↔ user_pregnancies: `userId`, `birthPregnancyId`.

---

## Seeders

- **CLI:** `db/seeders/cli.ts` — `bun run db/seeders/cli.ts seed|clear|reset` (or via `bun run db:seed` etc.).
- **Logic:** `db/seeders/index.ts` — `seed()` (runs user, relationship, **continents**, countries, states seeders), `clear()` (delete order below).
- **Seed data:** `db/seeders/users.seeder.ts` — `seedUsers`, `seedUserRelationships` (e.g. Adam/Eve); uses `db/seeders/schemas.ts` for `relationshipSeedSchema` (by name: subjectFirstName/LastName, objectFirstName/LastName, type, isBiological, requireDifferentGender). `db/seeders/locations.seeder.ts` — **`seedContinents`** (7 continents from `db/seeders/data/continents.json`), **`seedCountries`** (ISO countries from `db/seeders/data/countries.json`, with `phoneCode` from dial codes, **`continentId`** from `db/seeders/data/country-continent.json`), `seedStates` (Malaysia only: 13 states + 3 federal territories).

### Clear order (respects FKs)

1. Delete `user_relationships`
2. Set `users.birthPregnancyId` to null
3. Delete `user_pregnancies`
4. Delete `users`
5. Delete `states`
6. Delete `countries`
7. Delete `continents`
8. Reset sequences: `users_id_seq`, `user_relationships_id_seq`, `user_pregnancies_id_seq`, `states_id_seq`, `countries_id_seq`, **`continents_id_seq`**

When adding new seed data or tables, keep this order in mind and update `clear()` and sequences if needed.
