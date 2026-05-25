# Task 3 - Seed Data Updater

## Task
Update the seed route at `/src/app/api/seed/route.ts` to include infectious disease module data.

## Work Completed

### 1. New Menu Items Added
- 传染病管理 directory (code: `infectious-disease`, icon: `Bug`, sort: 2)
  - 病例上报 (code: `id-case-report`, icon: `Syringe`, sort: 0)
  - 接触者追踪 (code: `id-contact-tracing`, icon: `Network`, sort: 1)
  - 症状监测 (code: `id-symptom-surveillance`, icon: `Thermometer`, sort: 2)
  - 疫情看板 (code: `id-epidemic-dashboard`, icon: `BarChart3`, sort: 3)
  - 传染病预警 (code: `id-disease-alert`, icon: `AlertTriangle`, sort: 4)

### 2. New Permissions Added (16 total)
- id:case:list/add/edit/delete/review/report
- id:contact:list/add/edit/followup
- id:symptom:list/add/verify
- id:alert:list/handle
- id:dashboard:view

### 3. Sample Data Added
- 15 InfectiousDiseaseCase records (2 甲类, 5 乙类, 5 丙类)
- 20 ContactTracing records (linked to 10 cases)
- 12 SymptomSurveillance records (6 symptom groups)
- 8 DiseaseAlert records (various alert levels)

### 4. Role Assignments
- Super admin: all new menus and permissions
- Infection control specialist: all id:* permissions + all infectious disease menus
- Clinical doctor: id:case:list/add, id:symptom:list/add, id:dashboard:view + corresponding menus

### 5. Technical Changes
- Added deleteMany for 4 new models at cleanup section
- Adjusted sort values (shifted menus after infection-monitor by +1) to insert 传染病管理 at sort 2
- All existing data preserved

## Verification Results
- Seed API: 200 OK
- Lint: 0 errors
- Counts: 52 permissions, 26 menus, 15 ID cases, 20 contacts, 12 symptoms, 8 alerts
