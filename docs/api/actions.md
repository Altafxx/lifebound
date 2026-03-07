# Survival actions and state stats

Endpoints for user survival actions (gather, scavenge water, eat, drink, mate) and state stats regeneration. User stats tick applies health/hunger/hydration rules. See [glossary.md](./glossary.md) for state stats and user stats definitions.

---

## Simulator date header

Where noted, send **`X-Simulator-Day`** (value **YYYY-MM-DD**). If missing or invalid, the API uses `0001-01-01`.

---

## State stats regen

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/states/:id/stats/regen` | Regenerate state stats: add `waterRegeneration` to `waterReserve` and `foodRegeneration` to `foodReserve`, each clamped to the state's `waterMax` / `foodMax`. Returns updated state_stats row or 404. |

---

## User actions

All action routes use **`POST`** and path **`/users/:id/actions/<action>`** with `:id` = acting user.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users/:id/actions/gather` | Roll success (70%); on success deduct food from user's **location state** `foodReserve` and add to user's **`user_stats.food`**. Returns `{ success, foodGained?, stateStats, userStats }`. |
| `POST` | `/users/:id/actions/scavenge-water` | Roll success (60%); on success deduct water from state `waterReserve` and add to **`user_stats.water`**. Returns `{ success, waterGained?, stateStats, userStats }`. |
| `POST` | `/users/:id/actions/eat` | Body (JSON): optional `amount` (default 1). Consume from **user's** `user_stats.food`; increase `hunger` (capped 100). Returns `{ userStats }`. 400 if insufficient food. |
| `POST` | `/users/:id/actions/drink` | Body (JSON): optional `amount` (default 1). Consume from **user's** `user_stats.water`; increase `hydration` (capped 100). Returns `{ userStats }`. 400 if insufficient water. |
| `POST` | `/users/:id/actions/mate` | Body (JSON): `{ partnerId: number }`. **Both users must be spouses** (enforced in conceiving logic). Send `X-Simulator-Day`. Returns pregnancy or 400. Deducts hunger/hydration for both partners. |

**Conceiving** (GET `/users/conceiving/:userId/:userId2`) uses the same logic and also requires both users to be spouses. **Gather** and **scavenge water** deduct hunger and hydration from the acting user on success (see `src/lib/survival.ts` cost constants).

---

## User stats tick

Health rule: if **hunger < 30 or hydration < 30** then health decreases each tick; if **hunger > 90 and hydration > 90** then health increases. Optional hunger/hydration decay per tick (see `src/lib/survival.ts`).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users/:id/stats/tick` | Apply one tick to user's stats (health rule + optional decay). Returns `{ userStats }`. |
| `POST` | `/user-stats/tick` | Body (JSON): `{ userIds: number[] }`. Apply tick to each user. Returns `{ results: { userStats }[] }`. |

---

## Request/response schemas

- **Mate:** `{ partnerId: number }` (positive integer).
- **Eat / drink:** `{ amount?: number }` (optional, default 1, integer >= 1).
- **Tick batch:** `{ userIds: number[] }` (required for `/user-stats/tick`).

Error responses: JSON `{ "error": "message" }` with 4xx/5xx.
