# Task 3-6: HIS Sync Mini Service

## Task Info
- **Task ID**: 3-6
- **Agent**: HIS Sync Service Builder
- **Task**: Create HIS synchronization mini-service supporting multiple sync modes

## Architecture
- **Service Port**: 3030
- **Database**: SQLite via `bun:sqlite` (direct access to main app's `/home/z/my-project/db/custom.db`)
- **MSSQL**: Mock implementation (real mssql native module can't compile in sandbox)
- **Frontend Access**: Via Caddy gateway `?XTransformPort=3030`

## What Was Built

### Mini-Service at `/home/z/my-project/mini-services/his-sync-service/`

#### Files:
1. **package.json** - Minimal dependencies (none needed, uses bun:sqlite built-in)
2. **index.ts** - ~800 lines, complete service implementation

#### API Endpoints (10 total):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/his-sync/configs | 获取所有同步配置 |
| POST | /api/his-sync/configs | 创建同步配置 |
| PUT | /api/his-sync/configs/:id | 更新同步配置 |
| DELETE | /api/his-sync/configs/:id | 删除同步配置 |
| POST | /api/his-sync/test-connection | 测试HIS数据库连接 |
| POST | /api/his-sync/execute/:id | 执行同步任务 |
| GET | /api/his-sync/logs | 获取同步日志(分页) |
| GET | /api/his-sync/logs/:id | 获取日志详情 |
| POST | /api/his-sync/seed | 初始化种子数据 |
| GET | /api/his-sync/health | 健康检查 |

#### Sync Modes Implemented:

1. **direct** (数据库直连) - Connect to HIS SQL Server, run syncQuery, transform data, insert into target table
2. **sync_table** (同步表方案) - Read from HIS sync table, mark processed records
3. **esb** (ESB企业服务总线) - Call ESB endpoint, parse response, insert data
4. **api** (REST/SOAP接口) - Call HIS REST API, parse response, insert data

#### Seed Data (5 configs):

| Name | Mode | Scenario | Enabled |
|------|------|----------|---------|
| 体温数据直连同步 | direct | temperature | ✅ |
| 微生物检验LIS同步 | direct | micro_lab | ✅ |
| 传染病检验ESB推送 | esb | infectious_lab | ✅ |
| 患者信息API同步 | api | patient_info | ✅ |
| 体温同步表方案 | sync_table | temperature | ❌ |

#### Key Features:
- **Field Mapping**: JSON-configurable field mapping with HIS→System field translation
- **Transform Rules**: code_map (代码转换), date_format (日期格式), value_map (值映射), default (默认值)
- **Incremental Sync**: Supports incrementalField + lastSyncTime for delta syncs
- **Auto Warning**: Temperature sync auto-creates SymptomSurveillance + WarningRecord for fever (≥38.0°C)
- **Fever Level Calculation**: Matches main app logic (正常/低热/中度发热/高热/超高热)
- **Sync Logging**: Full execution logging with sourceCount, targetCount, duration, dataSample
- **Connection Testing**: Mock connection test with server info display
- **CUID IDs**: 25-char random strings starting with a letter

#### Test Results:
- ✅ Health check: Returns configCount, logCount, mode=mock
- ✅ Seed: Created 5 configs successfully
- ✅ Execute temperature direct: 15 records synced, 304ms duration
- ✅ Execute micro_lab direct: 10 records synced, 303ms
- ✅ Execute ESB: 5 records synced, 1ms
- ✅ Execute API: 10 source, patient_info processed
- ✅ Disabled config: Returns error "该同步配置已禁用"
- ✅ Test connection: Returns mock success with server info
- ✅ Logs: Returns paginated results with config details

## Technical Decisions:
1. Used `bun:sqlite` instead of `better-sqlite3` (native module compilation fails in sandbox)
2. Used `Bun.serve()` for HTTP server (no Express needed)
3. Mock MSSQL implementation generates realistic data based on SQL query patterns
4. No `--hot` flag in dev script (service crashes on hot-reload with SQLite WAL mode)
5. Direct SQL access to main app's SQLite database (same as Prisma but via bun:sqlite)
