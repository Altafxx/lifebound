# Locations, achievements, eras, knowledge, and skills API

Reference endpoints for continents, countries, states, achievements, eras, knowledge/technology progress, and user skills. Used by the simulator and admin tools.

---

## Base URL

`http://localhost:{PORT}` (default 3000).

---

## Locations (continents, countries, states)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/continents` | List all continents |
| `GET` | `/countries` | List all countries. Optional query: `continentId` (number) to filter by continent |
| `GET` | `/countries/:id` | Get one country by id |
| `GET` | `/countries/:id/states` | List states for a country |
| `GET` | `/states` | List all states. Optional query: `countryId` (number) to filter by country |
| `GET` | `/states/:id` | Get one state by id. Optional query: `withStats=true` to include `state_stats` (reserves, regeneration) |

**Responses:** JSON array or object. 404 when resource not found; 400 for invalid id or query param.

---

## Achievements

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/achievements` | List all achievements |
| `GET` | `/achievements/:id` | Get one achievement by id |
| `GET` | `/achievements/:id/countries` | List countries that have this achievement (each row includes `achievedAt` date) |

**Responses:** JSON. 404 when achievement not found; 400 for invalid id.

---

## Eras

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/eras` | List all eras (ordered by `order` ascending) |
| `GET` | `/eras/:id` | Get one era by id |
| `GET` | `/eras/:id/countries` | List countries that have entered this era (each row includes `enteredAt` date) |
| `GET` | `/countries/:id/era` | Get the current era for a country (highest `order` entered). Response: `{ currentEra: { eraId, enteredAt, eraOrder, eraName } \| null }` |

**Responses:** JSON. 404 when era or country not found; 400 for invalid id.

---

## Knowledge (technology progress)

Knowledge represents technologies/skills countries can unlock (e.g. fishing, mining, agriculture, writing). Distinct from **eras** (age progression) and **achievements** (one-off milestones).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/knowledge` | List all knowledge types (ordered by `order`). Optional query: `category` (e.g. `survival`, `industry`, `agriculture`, `craft`, `technology`, `culture`) to filter |
| `GET` | `/knowledge/:id` | Get one knowledge by id |
| `GET` | `/knowledge/:id/countries` | List countries that have unlocked this knowledge (each row includes `unlockedAt` date) |
| `GET` | `/countries/:id/knowledge` | List knowledge unlocked by this country (each item includes `unlockedAt`) |

**Responses:** JSON. 404 when knowledge or country not found; 400 for invalid id.

---

## Skills (user-level)

Skills are abilities that **users** learn (e.g. fishing, carpentry, hiking). Each skill requires the **country** to have a specific **knowledge** first (`skill.knowledgeId`). The more people in a country who have a skill, the easier it is for others there to learn it (`country_skills.peopleCount`). Learning logic is in `src/lib/skill.ts` (not wired to API yet).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/skills` | List all skills (ordered by `order`). Optional query: `category` (e.g. `survival`, `craft`, `agriculture`) to filter |
| `GET` | `/skills/:id` | Get one skill by id. Optional query: `withKnowledge=true` to include `knowledgeName` |
| `GET` | `/skills/:id/users` | List users who have this skill (each includes `learnedAt`) |
| `GET` | `/users/:id/skills` | List skills this user has (each includes `learnedAt`) |
| `GET` | `/countries/:id/skills` | List country_skills for this country (skill name, knowledge name, `peopleCount` for ease of learning) |

**Responses:** JSON. 404 when skill, user, or country not found; 400 for invalid id.

---

## Error responses

All endpoints return JSON `{ "error": "message" }` with status 400 (bad request), 404 (not found), or 500 (server error).
