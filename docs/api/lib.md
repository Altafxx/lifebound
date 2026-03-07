# Shared libs

`src/errors.ts` and `src/lib/` — errors, shared Zod schemas, age helpers, and pregnancy helpers.

---

## Age

**Module:** `src/lib/age.ts`

Constants and helpers for simulator age (days/years). Start date is 0001-01-01. Age uses **ageOverride** (days to prepend to createdAt): age in days = (currentSimulatorDate − createdAt) in days + (ageOverride ?? 0).

- **`SIMULATOR_START_DATE`** — `"0001-01-01"`.
- **`DAYS_PER_YEAR`** — `365.25`.
- **`getAgeInDays(createdAt, currentSimulatorDate, ageOverrideDays?)`** — returns age in days (calendar-aware).
- **`getAgeInYears(createdAt, currentSimulatorDate, ageOverrideDays?)`** — returns full years (floor of days / DAYS_PER_YEAR).
- **`getAgeInDaysAndYears(...)`** — returns `{ days, years }`.

---

## Errors

**Module:** `src/errors.ts`

- **`ERROR_MESSAGES`** — default messages for 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504.
- **`getErrorMessage(statusCode)`** — returns default message for that code or a generic fallback.
- **`createErrorResponse(message, statusCode?)`** — returns `{ error, statusCode }` (default status 500).

Controllers catch errors and return `c.json({ error: message }, status)`. Use `getErrorMessage(500)` for unknown/server errors.

---

## Schemas

**Module:** `src/lib/schemas.ts`

Shared Zod schemas used across domains.

- **`daysSchema`** — `{ days: number }`, int ≥ 0.
- **`DaysSchema`** — type inferred from `daysSchema`.
- **`simulatorDateHeaderSchema`** — validates `X-Simulator-Day` header value as **YYYY-MM-DD** date string.
- **`SIMULATOR_DAY_HEADER`** — constant `"x-simulator-day"` (header name).
- **`SimulatorDateHeader`** — type inferred from `simulatorDateHeaderSchema`.
- **`getSimulatorDate(headerValue)`** — parses the `X-Simulator-Day` header; returns the parsed date string or `SIMULATOR_START_DATE` if missing/invalid. Use in any controller that needs the current simulator day (e.g. users, actions).

Use `simulatorDateHeaderSchema`, `SIMULATOR_DAY_HEADER`, and `getSimulatorDate` in controllers that need the current simulator date from the request.

---

## Pregnancy

**Module:** `src/lib/pregnancy.ts`

Pregnancy probability and gestation used by the users domain (e.g. conceiving endpoint). All age arguments are in **years**. The conceiving endpoint uses `getAgeInYears(createdAt, simulatorDate, ageOverride)` from `lib/age.ts` to pass age in years to these helpers.

### Probability (female)

- **`getFemalePregnancyProbability(age)`** — returns 0–100% by age band:
  - 18–24: 27.5%
  - 25–29: 22.5%
  - 30–34: 17.5%
  - 35–39: 12.5%
  - 40–45: 5%
  - else: 0%

### Probability (male)

- **`getMalePregnancyProbability(age)`** — returns 0–100% by age band:
  - 20–24: 27.5%
  - 25–29: 22.5%
  - 30–39: 12.5%
  - 40+: 2.5%
  - else: 0%

### Combined and occurrence

- **`getCombinedPregnancyProbability(femaleAge, maleAge)`** — `min(female, male)` probability.
- **`checkPregnancyOccurrence(probability)`** — `Math.random() * 100 <= probability`.

### Gestation

- **`calculateGestationPeriod()`** — returns gestation **in days** with weighted distribution:
  - 2%: 132–230
  - 10%: 231–258
  - 76%: 259–285
  - 10%: 286–313
  - 2%: 314–375

Use these helpers when adding or changing pregnancy-related behavior (e.g. new conceiving or pregnancy endpoints).

---

## Survival

**Module:** `src/lib/survival.ts`

Success rates and constants for gather/scavenge; health/hunger/hydration tick rules used by the actions domain and stats tick endpoint.

- **Constants:** `GATHER_SUCCESS_RATE` (70), `SCAVENGE_WATER_SUCCESS_RATE` (60), `GATHER_FOOD_AMOUNT`, `SCAVENGE_WATER_AMOUNT`, `HUNGER_PER_FOOD_UNIT`, `HYDRATION_PER_WATER_UNIT`, `HEALTH_DECAY_PER_TICK`, `HEALTH_REGEN_PER_TICK`, `HUNGER_HYDRATION_LOW_THRESHOLD` (30), `HUNGER_HYDRATION_HIGH_THRESHOLD` (90), `HUNGER_DECAY_PER_TICK`, `HYDRATION_DECAY_PER_TICK`.
- **Action costs (hunger/hydration deducted when performing the action):** `GATHER_HUNGER_COST`, `GATHER_HYDRATION_COST`, `SCAVENGE_HUNGER_COST`, `SCAVENGE_HYDRATION_COST`, `MATE_HUNGER_COST`, `MATE_HYDRATION_COST`.
- **`rollSuccess(rate)`** — returns true with probability rate/100 (rate 0–100).
- **`computeNextUserStatsAfterTick(current, options?)`** — given current `{ hunger, hydration, health }`, returns next values: health decays if hunger or hydration &lt; 30; health regens if both &gt; 90; optional hunger/hydration decay. Used by `POST /users/:id/stats/tick` and `POST /user-stats/tick`.
