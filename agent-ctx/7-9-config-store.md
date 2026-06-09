# Task 7-9: Create Config Store and Update Pages to Use Database-Backed Configuration Data

## Work Log

### Step 1: Created Config Store (`/src/store/config-store.ts`)
- Created Zustand store with full TypeScript interface for configuration data
- Fetches 6 API endpoints in parallel using `Promise.all`:
  - `/api/departments?pageSize=100` → `departments: Department[]`
  - `/api/dict-items?grouped=1` → `dictItemsGrouped: Record<string, DictItem[]>`
  - `/api/disease-categories?pageSize=200` → `diseaseCategories: DiseaseCategory[]`
  - `/api/system-configs?asMap=1` → `systemConfigs: Record<string, string>`
  - `/api/mdro-rule-templates?pageSize=50` → `mdroRuleTemplates: MdroRuleTemplate[]`
  - `/api/target-monitoring-items?pageSize=50` → `targetMonitoringItems: TargetMonitoringItem[]`
- Helper getters: `getDeptNames(type?)`, `getDictNames(category)`, `getDictItems(category)`, `getDiseaseCategory(diseaseName)`, `getSystemConfig(key, defaultValue?)`
- Loading state guards prevent duplicate fetches

### Step 2: Updated TargetMonitoringPage
- Replaced hardcoded `items` array with data from `targetMonitoringItems` from config store
- Added `useEffect` to load configs if not loaded
- Falls back to original hardcoded items when config data hasn't loaded

### Step 3: Updated StatisticsPage
- Replaced hardcoded department names with `getDeptNames()` from config store
- Replaced hardcoded infection rates with real data from `/api/dashboard`
- Replaced `Math.random()` monthly antibiotic data with computed averages from `/api/antibiotic-usages`
- Falls back to static defaults when API data unavailable

### Step 4: Updated MainApp (page.tsx)
- Added `useConfigStore` import
- Added `loadAllConfigs()` call in MainApp's `useEffect` alongside existing `refreshMenus()`

### Step 5: Updated 11 Page Components with Dict Data

1. **infection-cases.tsx**: Dept options → `getDeptNames()`, infection site → `getDictNames('infection_site')`, status → `getDictNames('infection_case_status')`
2. **environmental-monitor.tsx**: Dept options → `getDeptNames('临床')`, sample type → `getDictNames('sample_type')`
3. **occupational-exposure.tsx**: Dept → `getDeptNames()`, exposure type → `getDictNames('exposure_type')`
4. **warnings.tsx**: Warning type → `getDictNames('warning_type')`, status → `getDictNames('warning_status')`, level → `getDictNames('warning_level')`
5. **infectious-disease-case.tsx**: Replaced `DISEASE_CATEGORY_MAP` with `getDiseaseCategory()` from config store, disease options from `diseaseCategories`, dept → `getDeptNames()`, status → `getDictNames('id_case_status')`, severity → `getDictNames('id_case_severity')`, report type → `getDictNames('id_report_type')`, isolation type → `getDictNames('id_isolation_type')`, outcome → `getDictNames('id_outcome')`
6. **contact-tracing.tsx**: Relationship → `getDictNames('contact_relationship')`, contact type → `getDictNames('contact_type')`, exposure level → `getDictNames('exposure_level')`, symptom status → `getDictNames('symptom_status')`, quarantine type → `getDictNames('quarantine_type')`, test result → `getDictNames('test_result')`, follow-up status → `getDictNames('follow_up_status')`
7. **symptom-surveillance.tsx**: Dept → `getDeptNames()`, symptom group → `getDictNames('symptom_group')`, status → `getDictNames('symptom_status')`
8. **disease-alert.tsx**: Alert type → `getDictNames('alert_type')`, alert level → `getDictNames('alert_level')`, alert source → `getDictNames('alert_source')`, status → `getDictNames('alert_status')`
9. **warning-rules.tsx**: Category → `getDictNames('rule_category')`, rule type → `getDictNames('rule_type')`, warning level → `getDictNames('warning_level')`, warning type → `getDictNames('warning_type')`, MDRO type options from `mdroRuleTemplates`
10. **micro-lab-results.tsx**: MDRO type map from `mdroRuleTemplates`, specimen type from `getDictNames('specimen_type')`
11. **his-integration-analysis.tsx**: `ALL_DEPTS` → `getDeptNames()`, localStorage config → `getSystemConfig()`

### All pages use fallback patterns
Every page uses `getDictNames('category').length > 0 ? getDictNames('category') : [...fallback]` to gracefully degrade when config data isn't available yet.

### Lint: 0 errors, 0 warnings ✅

## Stage Summary
- Created `/src/store/config-store.ts` with 6 API data sources + helper getters
- Updated 13 page components + MainApp to use config store
- Replaced all hardcoded dropdown options with database-backed dict data
- Replaced hardcoded department lists with DB-backed department data
- Replaced `DISEASE_CATEGORY_MAP` with `diseaseCategories` from DB
- Replaced `Math.random()` in statistics with real API data
- Replaced `localStorage` config in HIS page with `getSystemConfig()`
- All lint checks pass (0 errors, 0 warnings)
