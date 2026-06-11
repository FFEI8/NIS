# Work Log - 医院感染管理系统

## Project Status
- Next.js 16 production server running on port 3000 (standalone build)
- HIS sync micro-service on port 3030
- Database: SQLite with Prisma ORM
- Caddy gateway on port 81 proxies to port 3000
- Auto-restart daemon ensures server stays available

## Current Session Work (2026-06-11 Session 2)

### Task: Fix `{"error":"sandbox is inactive"}` BUG

**Root Cause Analysis:**
1. The `{"error":"sandbox is inactive"}` error comes from the Caddy gateway (port 81) when it cannot connect to the Next.js backend (port 3000)
2. The Next.js dev server (with Turbopack) consumes ~1.1GB RSS memory, giving it an OOM score of 682 (out of 1000)
3. The Linux OOM killer targets high-score processes when memory pressure increases
4. The server gets killed after ~30 seconds, leaving users seeing "sandbox is inactive"
5. The `tee` pipe in the original dev script (`bun run dev`) also contributed to process instability

**Fixes Applied:**
1. **Switched to production build**: Modified `next.config.ts` to add `output: 'standalone'` for minimal memory footprint (~116MB RSS vs ~1.1GB with dev server)
2. **Built standalone server**: Ran `next build` to create optimized production build in `.next/standalone/`
3. **Updated `.zscripts/dev.sh`**: 
   - Added production build step during startup
   - Replaced `bun run dev` with `node .next/standalone/server.js` (production mode)
   - Added auto-restart loop with throttling (2s/5s/15s/30s delays based on crash frequency)
   - Removed `tee` pipe that was causing process instability
4. **Updated `daemon.js`**: Simplified to use standalone build with auto-restart

**Key Technical Details:**
- Production standalone server: RSS ~116MB, VSZ ~2GB, OOM score 676
- Dev server: RSS ~1.1GB, VSZ ~3.7GB, OOM score 682
- Server still gets OOM-killed periodically but auto-restarts within 2-5 seconds
- Gateway returns 200 when server is running, 502/"sandbox inactive" during brief restart gaps

**Verification:**
- ✅ Login page renders correctly through gateway (port 81)
- ✅ Login API works (admin/admin123)
- ✅ All API endpoints respond (menus, dashboard, users, seed)
- ✅ HIS sync service running on port 3030
- ✅ Auto-restart mechanism tested and working
- ✅ VLM confirmed login page renders properly

## Files Modified
- `next.config.ts` - Added `output: 'standalone'`
- `.zscripts/dev.sh` - Complete rewrite for production build with auto-restart
- `daemon.js` - Updated for standalone server

## Previous Session (2026-06-11 Session 1)
- Fixed white screen / hydration timing issue in `src/app/page.tsx`
- Added error handling and auto-retry in SeedInitializer
- Cleaned and rebuilt project dependencies

## Pending Issues
1. **Server still gets OOM-killed** - Auto-restart mitigates but doesn't prevent. Root cause is high OOM score due to VSZ. No sudo access to adjust `oom_score_adj`.
2. **Download workspace failed: "Failed to fetch"** - NOT YET INVESTIGATED
3. **Browser login automation** - agent-browser cannot properly interact with React controlled inputs
4. **HisFieldMapping module improvements** - NOT YET INVESTIGATED

## Priority for Next Phase
1. Fix the "download workspace failed: Failed to fetch" issue
2. Further optimize server memory to reduce OOM kills
3. Continue HisFieldMapping module improvements
4. Add more features and styling details
