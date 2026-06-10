# Task 4 - Infectious Disease Lab Result API Routes Builder

## Task
Create API route files for the InfectiousDiseaseLabResult model and related models (InfectiousDiseaseTestItem, HisInfectiousDiseaseTestMapping).

## Files Created (10 total)

### Shared Helper
1. `/src/lib/infectious-disease-warning.ts` - Shared auto-warning logic helper
   - `triggerInfectiousDiseaseWarning()` - Creates WarningRecord, DiseaseAlert, InfectiousDiseaseCase
   - `lookupTestItemInfo()` - Auto-populate disease info from test item
   - `isResultPositive()` - Check if result matches positive criteria

### Lab Result Routes (5 files)
2. `/src/app/api/infectious-disease-lab-results/route.ts` - GET (paginated list with filters) + POST (create with auto-warning)
3. `/src/app/api/infectious-disease-lab-results/[id]/route.ts` - GET/PUT/DELETE (with re-evaluation on PUT)
4. `/src/app/api/infectious-disease-lab-results/sync/route.ts` - POST (HIS sync with auto-warning)
5. `/src/app/api/infectious-disease-lab-results/stats/route.ts` - GET (comprehensive statistics)

### Test Item Routes (2 files)
6. `/src/app/api/infectious-disease-test-items/route.ts` - GET (paginated with filters) + POST
7. `/src/app/api/infectious-disease-test-items/[id]/route.ts` - GET/PUT/DELETE

### HIS Mapping Routes (2 files)
8. `/src/app/api/his-id-test-mapping/route.ts` - GET (paginated with filters) + POST
9. `/src/app/api/his-id-test-mapping/[id]/route.ts` - GET/PUT/DELETE

## Key Features

### Auto-Warning Logic (CRITICAL)
When a positive lab result is detected:
1. **WarningRecord**: warningType='暴发预警' for 甲类, '病例预警' otherwise; warningLevel by category
2. **DiseaseAlert**: alertLevel='红色/橙色/黄色' by category; suggestion varies by category
3. **InfectiousDiseaseCase**: auto-created if isNotifiable=1 and no existing case; includes gender/age
4. Lab result updated with warningTriggered=1, autoReported=1, linked IDs

### Auto-Populate from Test Item
When testItemCode is provided in POST:
- Looks up InfectiousDiseaseTestItem
- Auto-fills: diseaseName, diseaseCategory, isNotifiable, reportTimeLimit, testItemName
- Auto-detects positive: checks if resultValue matches positiveResult field

### HIS Sync Logic
- Maps HIS test codes via HisInfectiousDiseaseTestMapping
- Processes each record: creates lab result, detects positives, triggers warnings
- Returns summary: synced, positive, warningsTriggered, casesCreated
- Generates sample data if no records provided

### Filters Supported
- Lab Results: isPositive, diseaseName, diseaseCategory, testItemCode, dept, keyword, status, syncStatus
- Test Items: diseaseCategory, keyword, status
- HIS Mappings: hisTestCode, testItemCode, keyword, status

## Bug Fix
- Initial implementation missed `gender` and `age` fields when creating InfectiousDiseaseCase
- Fixed by adding these fields to LabResultData interface and passing them through all callers

## Verification
- `bun run lint` passes with 0 errors
- All endpoints tested and working via curl
- Auto-warning logic verified: WarningRecord, DiseaseAlert, InfectiousDiseaseCase all created
- Stats endpoint returns correct aggregations
- Sync endpoint correctly maps HIS codes and triggers warnings
