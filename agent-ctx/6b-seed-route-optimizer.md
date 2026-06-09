# Task 6b: Seed Route Optimizer

## Task
Remove configuration data from seed route to prevent Turbopack OOM crashes.

## Changes Made
1. **File**: `/src/app/api/seed/route.ts`
   - Removed 6 `deleteMany` calls: `db.department.deleteMany()`, `db.diseaseCategory.deleteMany()`, `db.dictItem.deleteMany()`, `db.systemConfig.deleteMany()`, `db.mdroRuleTemplate.deleteMany()`, `db.targetMonitoringItem.deleteMany()`
   - Added comment explaining these are seeded via `scripts/seed-config.ts`
   - Removed configuration data sections:
     - Department (24 departments, ~26 lines)
     - DiseaseCategory (39 diseases, ~47 lines)
     - DictItem (~170 items across 30+ categories, ~268 lines)
     - SystemConfig (12 configs, ~16 lines)
     - MdroRuleTemplate (5 templates, ~74 lines)
     - TargetMonitoringItem (6 items, ~10 lines)
   - Added comment noting configuration data is seeded separately

## Result
- File reduced from **1815** to **1363** lines (452 lines removed, 25% reduction)
- Lint passes with 0 errors
- All business seed data preserved (Users, Roles, Permissions, Menus, InfectionCases, Warnings, etc.)

## Verification
- `bun run lint` passes with 0 errors
