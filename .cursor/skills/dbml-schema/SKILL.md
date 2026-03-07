---
name: dbml-schema
description: Write and update DBML schema files for this project. Use when creating or editing .dbml files, schema.dbml, or when the user asks for DBML conventions or database diagram syntax.
---

# DBML Schema Conventions (Lifebound)

When writing or updating DBML in this project, follow these conventions so the schema stays consistent and tooling (e.g. dbdiagram.io) works correctly.

## Enums

- Use **PascalCase** names in double quotes: `Enum "Gender"`, `Enum "RelationshipType"`.
- Reference enums in columns by the same name (no quotes): `Gender`, `RelationshipType`.
- Values stay lowercase in double quotes: `"male"`, `"female"`, `"parent"`, `"spouse"`, `"guardian"`.

```dbml
Enum "Gender" {
  "male"
  "female"
  "non-binary"
}

Enum "RelationshipType" {
  "parent"
  "spouse"
  "guardian"
}
```

## Tables

- **Table names**: Use **PascalCase** and the `"public"."tableName"` form.
- **Column names**: Use **camelCase** in double quotes, e.g. `"countryId"`, `"userId"`.
- **Refs**: Point to the same PascalCase table names, e.g. `ref: < "public"."users"."id"`, `ref: < "public"."userPregnancies"."id"`.

```dbml
Table "public"."users" {
  "id" int [pk, not null]
  "birthPregnancyId" int [note: '...', ref: < "public"."userPregnancies"."id"]
  "firstName" varchar(500) [not null]
  ...
}
```

## Indexes (composite unique)

- Define indexes **inside the table block**, not in a global `Indexes` block.
- Use an `Indexes { ... }` block at the end of the table (after all columns).
- For composite uniques, give an explicit **name** matching the DB constraint (snake_case).

```dbml
Table "public"."userRelationships" {
  "id" int [pk, not null]
  "subjectUserId" int [not null, ref: < "public"."users"."id"]
  "objectUserId" int [not null, ref: < "public"."users"."id"]
  "type" RelationshipType [not null]
  "isBiological" boolean [not null, default: true]
  "createdAt" date [not null]

  Indexes {
    (subjectUserId, objectUserId, type) [unique, name: "user_relationships_subject_object_type_unique"]
  }
}
```

Same pattern for junction / link tables that have a unique on (parentId, childId):

- `countryKnowledges`: `(countryId, knowledgeId) [unique, name: "country_knowledges_country_knowledge_unique"]`
- `countrySkills`: `(countryId, skillId) [unique, name: "country_skills_country_skill_unique"]`
- `countryNeighbors`: `(countryId, neighborCountryId) [unique, name: "country_neighbors_country_neighbor_unique"]`
- `userSkills`: `(userId, skillId) [unique, name: "user_skills_user_skill_unique"]`
- `countryAchievements`: `(countryId, achievementId) [unique, name: "country_achievements_country_achievement_unique"]`
- `userOccupations`: `(userId, occupationId) [unique, name: "user_occupations_user_occupation_unique"]`

## Column attributes

- Use `note: '...'` for comments (single-quoted string).
- Use `default: value` for defaults (e.g. `default: false`, `default: 100`).
- Use `[unique]` only for single-column uniqueness (e.g. `userId` in `userStats`).
- Types: `int`, `bigint`, `smallint`, `text`, `boolean`, `date`, `varchar(500)` (or appropriate length), `text[]` for arrays.

## File location

- The canonical DBML schema for this project is **`schema.dbml`** at the repository root.
- When updating the schema from the codebase (e.g. Drizzle), keep table/column names in DBML aligned with the conventions above (PascalCase table names, camelCase column names, refs and indexes as specified).

## Quick checklist

- [ ] Enums: PascalCase name, values in double quotes; columns reference enum by name.
- [ ] Tables: `"public"."PascalCaseTableName"`; columns in double quotes, camelCase.
- [ ] Refs: `ref: < "public"."PascalCaseTable"."id"` (same PascalCase as table name).
- [ ] Composite uniques: `Indexes { (colA, colB) [unique, name: "snake_case_constraint_name"] }` inside the table.
- [ ] Notes: `note: 'Single-quoted description'`.
