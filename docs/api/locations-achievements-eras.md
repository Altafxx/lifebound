# Locations, achievements, and eras API

Reference endpoints for continents, countries, states, achievements, and eras. Used by the simulator and admin tools.

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

## Error responses

All endpoints return JSON `{ "error": "message" }` with status 400 (bad request), 404 (not found), or 500 (server error).
