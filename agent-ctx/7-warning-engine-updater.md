# Task 7: Warning Engine - Infectious Disease Lab Results Support

## Task Summary
Updated the warning engine at `/home/z/my-project/src/app/api/warning-engine/route.ts` to support infectious disease lab results via three new condition field handlers.

## Changes Made

### 1. New `evaluateRule` switch cases added:

#### `idLabPositive` (Infectious disease lab positive detection)
- **`contains` operator**: Searches `InfectiousDiseaseLabResult` where `isPositive=1` AND `testItemName` contains the `conditionValue`. Returns matched records with patientId, patientName, dept, sourceId, sourceType='id_lab', testItemName, resultValue, diseaseName, diseaseCategory.
- **`gt`/`gte` operators**: Counts positive results and compares with threshold. Returns same record shape with matchCount and description.

#### `idLabCount` (Infectious disease lab result count for cluster detection)
- Counts `InfectiousDiseaseLabResult` records in time window.
- Supports grouping by dept for cluster detection (similar to mdroCount cluster logic).
- Filters by `targetDiseases` if rule has it (match `diseaseName`).
- Returns matched records with full detail.

#### `notifiableDisease` (Notifiable disease detection for timeliness rules)
- **`eq` operator with value '甲类'**: Finds positive results where `diseaseCategory='甲类'`. Returns with urgency information and reportTimeLimit.
- **`timeout` operator with value '乙类'**: Finds positive results where `diseaseCategory='乙类'` and `autoReported=0` and `createdAt` more than timeWindow hours ago. Returns with elapsed hours and time limit info.
- **Generic fallback**: Finds positive results where `isNotifiable=1`, optionally filtered by `diseaseCategory`.

### 2. `testRule` function updated:
- Added test logic for `idLabPositive` (both `contains` and numeric threshold operators)
- Added test logic for `idLabCount` (with cluster detection support and targetDiseases filtering)
- Added test logic for `notifiableDisease` (甲类, 乙类 timeout, and generic modes)

### 3. Source record marking updated:
- Added `id_lab` source type handling in the matched records marking loop
- Added `id_lab` source type handling for single triggered record
- Both paths call `db.infectiousDiseaseLabResult.update({ where: { id }, data: { warningTriggered: 1 } })`

### 4. WarningRuleLog triggerSource updated:
- Now handles `id_lab` source type: `triggered.sourceType === 'id_lab' ? 'id_lab' : ...`
- sourceDetail JSON now includes `testItemName`, `diseaseName`, `diseaseCategory` fields alongside existing fields

## Verification
- ESLint passes with no errors
- Dev server running without issues
- All existing code preserved; only additions made
