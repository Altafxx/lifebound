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

Use `simulatorDateHeaderSchema` and `SIMULATOR_DAY_HEADER` in controllers that need the current simulator date from the request.

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
