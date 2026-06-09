# Task 5 - API Routes Builder Work Record

## Task
Create API routes for configuration models: Department, DictItem, DiseaseCategory, SystemConfig, MdroRuleTemplate, TargetMonitoringItem

## Files Created (12 total)

### List Routes (6 files)
1. `/src/app/api/departments/route.ts` - GET (type, status, keyword filters) + POST
2. `/src/app/api/dict-items/route.ts` - GET (category, status, keyword + ?grouped=1) + POST
3. `/src/app/api/disease-categories/route.ts` - GET (category, isNotifiable, keyword) + POST
4. `/src/app/api/system-configs/route.ts` - GET (category, configKey + ?asMap=1) + POST
5. `/src/app/api/mdro-rule-templates/route.ts` - GET (mdroType, status) + POST
6. `/src/app/api/target-monitoring-items/route.ts` - GET (category, status) + POST

### Detail Routes (6 files)
7. `/src/app/api/departments/[id]/route.ts` - GET + PUT + DELETE
8. `/src/app/api/dict-items/[id]/route.ts` - GET + PUT + DELETE
9. `/src/app/api/disease-categories/[id]/route.ts` - GET + PUT + DELETE
10. `/src/app/api/system-configs/[id]/route.ts` - GET + PUT + DELETE
11. `/src/app/api/mdro-rule-templates/[id]/route.ts` - GET + PUT + DELETE
12. `/src/app/api/target-monitoring-items/[id]/route.ts` - GET + PUT + DELETE

## Special Features
- **dict-items ?grouped=1**: Returns items grouped by category as `{ "infection_site": [...items], "specimen_type": [...items] }`
- **system-configs ?asMap=1**: Returns data as key-value map `{ "fever_threshold": "38.0", ... }`

## Patterns Used
- `{ db }` from `@/lib/db`
- `getPaginationParams` from `@/lib/api-utils`
- `params: Promise<{ id: string }>` with `await params` (Next.js 16)
- Response format: `{ success: true, data: ... }` / `{ success: false, message: ... }`
- 404 handling on GET by ID
- Integer fields parsed with `parseInt()`

## Verification
- `bun run lint` passes with 0 errors
