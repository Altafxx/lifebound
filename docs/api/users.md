# Users domain

Users API: endpoints, request/response schemas, and types. DB tables and relations are in [db.md](./db.md). Pregnancy probability/gestation helpers are in [lib.md](./lib.md#pregnancy).

---

## Simulator date header

Many endpoints use the **current simulator date**. Send it in the header:

- **Header name:** `X-Simulator-Day`
- **Value:** date string **YYYY-MM-DD** (e.g. `0001-01-01`, `0016-01-01`). If missing or invalid, the API uses `0001-01-01`.

Used for: **POST /users**, **PUT /users/:id**, **GET /users/conceiving/:userId/:userId2**, **GET /users/:id/pregnancy**.

---

## API endpoints

Base URL: `http://localhost:{PORT}` (default 3000).

### Users

| Method   | Path          | Description            |
|----------|---------------|------------------------|
| `GET`    | `/users`      | List all users         |
| `GET`    | `/users/:id`  | Get user by id         |
| `POST`   | `/users`      | Create user (form body; see below) |
| `PUT`    | `/users/:id`  | Update user (form body, partial)   |
| `DELETE` | `/users/:id`  | Delete user (path param only)      |

**Create and update** accept **form data** (`application/x-www-form-urlencoded` or `multipart/form-data`), not JSON. `createdAt` / `updatedAt` are set from `X-Simulator-Day`, not from the body.

### Relationships

| Method | Path                          | Description |
|--------|-------------------------------|--------------|
| `GET`  | `/users/:id/relationships`    | Get structured family: father, mother, spouse, children (see below). |

**Response:** `{ father, mother, spouse, children }`

- **`father`** — `User \| null`: male parent (from `user_relationships` where `type = "parent"` and user is object; subject is resolved by gender).
- **`mother`** — `User \| null`: female parent (same, resolved by gender).
- **`spouse`** — `User \| null`: the other user in a `type = "spouse"` relationship.
- **`children`** — `User[]`: users who are object in a `type = "parent"` row where the requested user is subject.

Only **parent** and **spouse** relationship types are used. Rows are selected from `user_relationships` where `subjectUserId = id` or `objectUserId = id` and `type` is `parent` or `spouse`; subject = “the relative” (e.g. parent), object = “related to” (e.g. child).

### Pregnancy

| Method | Path                                | Description |
|--------|-------------------------------------|-------------|
| `GET`  | `/users/conceiving/:userId/:userId2` | Try to create a pregnancy between two users (male + female). Uses [lib/pregnancy](./lib.md#pregnancy). Optional `X-Simulator-Day` for `createdAt`/`updatedAt`. Returns new pregnancy or 400. |
| `GET`  | `/users/:id/pregnancy`              | Get current (incomplete) pregnancy for user. Uses `X-Simulator-Day` (no query param). |

Error responses: JSON `{ "error": "message" }` with appropriate status (4xx/5xx).

---

## Form body keys (create / update)

Use these keys when sending **form data** for POST or PUT (e.g. in Postman: Body → form-data or x-www-form-urlencoded).

**Create (POST /users)** — required unless marked optional:

| Key                | Type    | Required | Notes |
|--------------------|---------|----------|--------|
| `firstName`        | string  | Yes      | 1–255 chars |
| `lastName`        | string  | Yes      | 1–255 chars |
| `ageOverride`      | number  | No       | int ≥ 0 (days to prepend to createdAt for age; e.g. timeline jump) |
| `gender`          | string  | Yes      | `male` \| `female` \| `non-binary` |
| `birthPregnancyId`| number  | No       | int > 0 |
| `isDeceased`      | boolean | No       | send `true` or `1` for true |

**Update (PUT /users/:id)** — all optional; only send keys you want to change. Same keys as create. Use empty or `null` for `birthPregnancyId` to clear it.

**Postman bulk-edit key list:**

```
firstName
lastName
ageOverride
gender
birthPregnancyId
isDeceased
```

---

## Request/response schemas (Zod)

Defined in `api/src/users/users.schema.ts`. Use these types when adding or changing endpoints.

### User

- **Create (POST /users)** — `createUserSchema`. Body is form data; `createdAt` / `updatedAt` are set from `X-Simulator-Day` (YYYY-MM-DD) in the controller.
  - `firstName`, `lastName`: string, 1–255 chars
  - `ageOverride`: optional int ≥ 0 (days; prepends createdAt for age calculation)
  - `gender`: `"male"` \| `"female"` \| `"non-binary"`
  - `birthPregnancyId`: optional positive int
  - `isDeceased`: optional boolean (default false)

- **Update (PUT /users/:id)** — `updateUserSchema`. Body is form data; `updatedAt` set from header. Same fields as create, all optional; `birthPregnancyId` can be null.

- **Get by id** — path param `id`: positive int (validated as `getUserSchema`).

### Relationship

- **Create relationship** — `createUserRelationshipSchema` (used for DB/seeder; no dedicated POST route yet)
  - `subjectUserId`, `objectUserId`: positive int
  - `type`: `"parent"` \| `"spouse"` \| `"guardian"`
  - `isBiological`: boolean (default true)

### Pregnancy

- **Create pregnancy** — `createUserPregnancySchema`: `userId`, `gestationPeriod` (int ≥ 0), optional `isCompleted`, `createdAt` (simulator day), optional `updatedAt`.
- **Update pregnancy** — `updateUserPregnancySchema`: same fields optional (including `updatedAt`).
- **Get pregnancy** — `getUserPregnancySchema`: `id` (positive int). GET `/users/:id/pregnancy` returns an array of current (incomplete) pregnancy rows.

### Exported types

From `users.schema.ts`: `CreateUserSchema`, `UpdateUserSchema`, `GetUserSchema`, `CreateUserRelationshipSchema`, `CreateUserPregnancySchema`, `UpdateUserPregnancySchema`, `GetUserPregnancySchema`.

For shared schemas (e.g. `DaysSchema`), see [lib.md](./lib.md#schemas).
