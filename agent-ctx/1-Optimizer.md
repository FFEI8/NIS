# Task 1 - Optimizer Agent Work Record

## Task: Optimize APIs and enhance MDRO warning rules

### Work Completed

#### 1. Login API Optimization (`/src/app/api/auth/login/route.ts`)

**Problem**: The original deeply nested `include` query fetched the entire user → roles → role → permissions → permission + menus → menu tree in a single giant query. This caused excessive memory usage and was a root cause of server crashes under load.

**Solution**: Split into 4 simpler queries with `select`:
- **Query 1**: Find user with `select` (only needed fields: id, username, password, name, avatar, phone, email, dept, status) + role IDs only (no nested role objects)
- **Query 2-4** (parallel via `Promise.all`):
  - Fetch role basic info (id, code, name) with `select`
  - Fetch permission codes via RolePermission with `select: { permission: { select: { code: true } } }`
  - Fetch menu IDs via RoleMenu with `select: { menuId: true }`
- **Query 5**: Build menu tree with **5-minute cache** (same menu IDs → cached tree)

**Memory savings**: From one deeply nested object (user with roles, each role with permissions and menus, each with full objects) to 4 small flat result sets.

#### 2. Dashboard API Optimization (`/src/app/api/dashboard/route.ts`)

**Problem**: Three `findMany()` calls without limits fetched ALL records from antibioticUsage, handHygiene, and environmentalMonitor tables, then computed averages in JS. Another `findMany()` on infectionCase fetched all 15+ fields when only 3 were needed for analytics.

**Solution**:
- Antibiotic usage rate: `findMany()` → `aggregate({ _avg: { usageRate: true }, _count: true })`
- Hand hygiene rate: `findMany()` → `aggregate({ _avg: { complianceRate: true }, _count: true })`
- Environmental hygiene rate: `findMany()` + `.filter()` → two `count()` calls (total + where result='合格')
- 5 independent count queries parallelized with `Promise.all`
- Infection analytics: `findMany()` with `select: { infectionDate, infectionSite, dept }` instead of all fields

#### 3. Warning Rules Page Enhancement (`/src/components/pages/warning-rules.tsx`)

**Added `QuickCreateMDRODialog`** with templates for 5 MDRO bacteria:

| Bacteria | Type | TimeWindow | Level | Key Depts | Cooldown | Priority |
|----------|------|-----------|-------|-----------|----------|----------|
| 鲍曼不动杆菌 | CRAB | 24h | 高 | ICU,呼吸科,神经外科,烧伤科 | 120min | 10 |
| 肺炎克雷伯菌 | CRKP | 24h | 高 | ICU,呼吸科,肝胆外科,血液科 | 120min | 10 |
| 金黄色葡萄球菌 | MRSA | 48h | 中 | ICU,外科,骨科,皮肤科 | 180min | 7 |
| 屎肠球菌 | VRE | 24h | 高 | ICU,血液科,肾内科,肿瘤科 | 120min | 10 |
| 铜绿假单胞菌 | CRPA | 48h | 中 | ICU,呼吸科,烧伤科,肿瘤科 | 180min | 7 |

Each template includes:
- Pre-filled rule name, code, category, ruleType, description
- conditionValue = bacteria Chinese name (for `contains` operator matching)
- Recommended warningLevel based on clinical severity
- Target departments based on typical infection patterns
- Risk notes explaining why the bacteria is dangerous
- Individual create button + "一键创建全部5条规则" batch creation

**UI additions**:
- New lucide-react imports: Sparkles, FlaskConical
- "快速创建MDRO规则" button in page header (rose-colored outline)
- Removed unused `isMDROCategory` variable from WarningRuleForm

#### 4. Lint Check
- `bun run lint` passes with 0 errors, 0 warnings
