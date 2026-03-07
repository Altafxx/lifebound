# Domain glossary and requirements

Definitions, overview, and requirements for all terms used in the Lifebound API and simulator.

---

## Definitions

### Geography

| Term | Definition |
|------|------------|
| **Continent** | A top-level geographic region. Identified by `id`, `name`, and unique `code` (e.g. AF, AS, EU). Countries belong to at most one continent. |
| **Country** | A sovereign or simulated nation. Has `id`, `name`, ISO codes (`isoA2`, `isoA3`, `isoNumber`), optional `continentId`, and can have states, achievements, eras, and knowledge. |
| **State** | A subdivision of a country (e.g. Malaysian states). Has `id`, `name`, and `countryId`. Users have a `location` that references a state. Seed data includes Malaysia only (13 states + 3 federal territories). |
| **State stats** | Per-state resource and regeneration: `waterReserve`, `foodReserve`, `landReserve` (current), `waterMax`, `foodMax`, `landMax` (caps), `waterRegeneration`, `foodRegeneration`. One row per state (`state_stats`). |

### People

| Term | Definition |
|------|------------|
| **User** | A simulated person. Has `firstName`, `lastName`, `gender`, `location` (state id), optional `ageOverride`, `birthPregnancyId`, `isDeceased`, and simulator dates `createdAt` / `updatedAt`. |
| **User stats** | Per-user vitality: `hunger`, `hydration`, `health` (0–100), `holding`, and inventory `food`, `water` (amounts carried; gather/scavenge add, eat/drink consume). One row per user (`user_stats`). |
| **Relationship** | A link between two users: `parent`, `spouse`, or `guardian`. Stored as subject user → object user with `type` and `isBiological`. |
| **Pregnancy** | A pregnancy record for a user (the mother), with `gestationPeriod`, `isCompleted`, and simulator dates. |

### Progression and milestones

| Term | Definition |
|------|------------|
| **Era** | A time period in the simulation (e.g. Stone Age, Bronze Age, Modern Age). Has `id`, `name`, `order` (1 = earliest), and optional `description`. Countries **enter** eras over time; a country’s **current era** is the one with the highest `order` they have entered. |
| **Country era** | A record that a country entered an era at a given simulator date (`country_eras`: `countryId`, `eraId`, `enteredAt`). Used to compute current era and era progression. |
| **Era boost** | When a country advances to a new era, neighboring countries can receive a boost (stored in `country_era_boosts`). The boost can be applied to state stats (e.g. regeneration). Logic in `src/lib/era.ts`. |
| **Achievement** | A one-off milestone a country can earn (e.g. “First Settlement”, “Trade Hub”). Has `id`, `name`, optional `description`. Stored globally; which country achieved it and when is in `country_achievements` (`achievedAt`). |
| **Knowledge** | A technology or skill a country can unlock (e.g. Fishing, Mining, Agriculture, Writing). Has `id`, `name`, optional `description`, `category` (e.g. survival, industry, culture), and `order` for display. Which country unlocked it and when is in `country_knowledges` (`unlockedAt`). |
| **Skill** | A user-level ability (e.g. Fishing, Carpentry, Hiking). Has `id`, `name`, optional `description`, `knowledgeId` (country must have this knowledge before any user can learn the skill), `order`, and optional `category`. Which user learned it and when is in `user_skills` (`learnedAt`). |
| **User skill** | A record that a user learned a skill at a given simulator date (`user_skills`: `userId`, `skillId`, `learnedAt`). |
| **Country skill** | Per-country count of users who have each skill (`country_skills`: `countryId`, `skillId`, `peopleCount`). Used for "ease of learning": more people with the skill in the country = easier to learn. Maintained when user_skills are added/removed (see `src/lib/skill.ts`). |

### Adjacency

| Term | Definition |
|------|------------|
| **Country neighbor** | Two countries that are adjacent (e.g. share a border). Stored in `country_neighbors` as (countryId, neighborCountryId). Used for era boosts: when one country advances an era, neighbors can get a boost. Seeder defines Malaysia’s neighbors (e.g. TH, ID, BN, SG). |

---

## Overview: how terms relate

```
Continents
  └── Countries (optional continentId)
        ├── States (countryId)
        │     └── State stats (stateId)
        ├── Country eras (countryId, eraId)     → current era = max order
        ├── Country achievements (countryId, achievementId)
        ├── Country knowledges (countryId, knowledgeId)
        ├── Country neighbors (countryId, neighborCountryId)
        ├── Country era boosts (countryId, sourceCountryId, eraId)
        └── Country skills (countryId, skillId, peopleCount)  → ease of learning

Users (location → state)
  ├── User stats (userId)
  ├── User relationships (subjectUserId, objectUserId, type)
  ├── User pregnancies (userId)
  └── User skills (userId, skillId, learnedAt)  → requires country to have skill.knowledgeId
```

- **Eras** define the global timeline (order 1, 2, 3, …). Each country has a **current era** and a history of **country_eras**.
- **Achievements** are global definitions; **country_achievements** record who achieved what and when.
- **Knowledges** are global definitions; **country_knowledges** record which country unlocked which knowledge and when.
- **Era boosts** are created when a country advances to a new era; they reference the advancing country, the neighbor that receives the boost, and the era.
- **Skills** are user-level; each skill has a required **knowledge** (country must have that knowledge before anyone can learn the skill). **User skills** record who learned what and when; **country_skills** stores the count of people per country per skill for "ease of learning".

---

## Requirements

### Eras

| Aspect | Requirement / behavior |
|--------|------------------------|
| **Definition** | Eras are defined in `eras` with a strict `order` (1 = first, e.g. Primal Age). Order is used to determine a country’s **current era** (highest order entered). |
| **Country current era** | A country’s current era is the era with the highest `order` among all `country_eras` for that country. If none, the country has no era (null). |
| **Advancing to a new era** | Game logic must decide when a country is allowed to advance (e.g. population, knowledge, or time). The API does not enforce this. To record advancement, use `advanceCountryToEra(countryId, eraId, simulatorDate)` in `src/lib/era.ts` (or insert into `country_eras` and create `country_era_boosts`). |
| **Neighbor boost** | When a country advances to a new era, `advanceCountryToEra` creates one `country_era_boosts` row per neighboring country. Applying the boost to state stats (e.g. regeneration) is optional and can be done by the caller or simulator. |
| **Data** | Seed data inserts one era per row (Primal Age → Eternal Age) and sets every country to the first era at simulator start. |

### Achievements

| Aspect | Requirement / behavior |
|--------|------------------------|
| **Definition** | Achievements are global records in `achievements` (name, optional description). No prerequisites or order. |
| **Awarding** | The API only stores which country achieved what and when (`country_achievements`: `countryId`, `achievementId`, `achievedAt`). **Requirements to earn an achievement are not stored in the API**; the game/simulator decides when to insert a row (e.g. when “First Settlement” conditions are met). |
| **Uniqueness** | At most one row per (countryId, achievementId); a country cannot “re-achieve” the same achievement. |
| **Data** | Seed data inserts a fixed list of achievements (e.g. First Settlement, Trade Hub, Cultural Center). No country_achievements are seeded; those are created by gameplay. |

### Knowledge

| Aspect | Requirement / behavior |
|--------|------------------------|
| **Definition** | Knowledges are global records in `knowledges` with `name`, optional `description`, `category`, and `order`. Categories (e.g. survival, industry, agriculture, craft, technology, culture) are for filtering and display. |
| **Unlocking** | The API only stores which country unlocked which knowledge and when (`country_knowledges`: `countryId`, `knowledgeId`, `unlockedAt`). **Prerequisites are not stored in the schema** (e.g. “Mining requires Fire”); the game/simulator can enforce rules before inserting a row. |
| **Uniqueness** | At most one row per (countryId, knowledgeId); a country cannot unlock the same knowledge twice. |
| **Starting knowledges** | Seeder can give every country a few starting knowledges (e.g. Fire, Gathering). Configurable via `STARTING_KNOWLEDGE_NAMES` in `knowledges.seeder.ts`. |
| **Data** | Seed data inserts a fixed list of knowledges (Fire, Gathering, Hunting, Fishing, Mining, Agriculture, Writing, etc.) and optionally seeds starting country_knowledges for all countries. |

### Skills

| Aspect | Requirement / behavior |
|--------|------------------------|
| **Definition** | Skills are global records in `skills` with `name`, optional `description`, `knowledgeId` (FK to knowledges), optional `prerequisiteSkillId` (another skill the user must have first), `baseSuccessRate` (0–100), `order`, and optional `category`. Each skill requires the **country** to have that knowledge before any user there can learn it. |
| **Learning** | A user can learn a skill only if (1) their country has the knowledge for that skill (`country_knowledges`), and (2) they don’t already have it. Logic: `canUserLearnSkill(userId, skillId)` and `learnSkill(userId, skillId, simulatorDate)` in `src/lib/skill.ts`. **Not wired to API yet** — no POST endpoint; call from simulator or future API. |
| **Prerequisites** | If `prerequisiteSkillId` is set, the user must already have that skill before attempting to learn this one. Enforced by `canUserLearnSkill` and `attemptLearnSkill`. |
| **Success rate** | Learning is probabilistic. Each skill has `baseSuccessRate` (0–100). Effective rate = base + adoption boost (boost capped at 30%). Use `attemptLearnSkill(userId, skillId, simulatorDate)` — rolls random; if success, records the skill. `learnSkill` forces success (for testing). |
| **Boost tiers** | Adoption = % of users in country who have the skill. Tiers: ≥30% → +5%, ≥50% → +10%, ≥75% → +15%, ≥85% → +20%, ≥95% → +25%, ≥98% → +30% (max). See `ADOPTION_BOOST_TIERS` in `src/lib/skill.ts`. |
| **Ease of learning** | The more people in the country who have the skill, the easier it is to learn. Stored as `country_skills.peopleCount`. Read with `getEaseOfLearningSkill(countryId, skillId)`. Updated automatically when `learnSkill` / `unlearnSkill` is called. |
| **Uniqueness** | At most one row per (userId, skillId) in `user_skills`; at most one row per (countryId, skillId) in `country_skills`. |
| **Data** | Seed data inserts skill types (Fishing, Carpentry, Hiking, etc.) with `knowledgeId` pointing to knowledges. No user_skills or country_skills seeded; those are created when users learn skills. |

---

## Summary table

| Concept | Stored in API | Requirements enforced by API? | Where requirements live |
|--------|----------------|--------------------------------|--------------------------|
| **Era** | Eras list; country_eras; country_era_boosts | No (who can advance) | Game/simulator; `advanceCountryToEra` records the result |
| **Achievement** | Achievements list; country_achievements | No | Game/simulator decides when to insert country_achievements |
| **Knowledge** | Knowledges list; country_knowledges | No (no prerequisites in schema) | Game/simulator can enforce prerequisites before insert |
| **Skill** | Skills list; user_skills; country_skills | Yes (in lib): country knowledge, user prerequisite, probabilistic `attemptLearnSkill`; no API endpoint yet | `src/lib/skill.ts`: `canUserLearnSkill`, `attemptLearnSkill`, `learnSkill`; boost tiers in `ADOPTION_BOOST_TIERS` |

For more detail on tables and fields, see [db.md](./db.md). For endpoints, see [locations-achievements-eras.md](./locations-achievements-eras.md) and [users.md](./users.md).
