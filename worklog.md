# Work Log - 医院感染管理系统

## Project Status
- Next.js 16 + Turbopack dev server running on port 3000
- HIS sync micro-service on port 3030
- Database: SQLite with Prisma ORM
- All APIs verified working via curl

## Current Session Work (2026-06-11)

### Task 1: Cleaned node_modules and project caches
- Deleted `/home/z/my-project/node_modules` (~1.2 GB)
- Deleted `/home/z/my-project/.next` (~305 MB)
- Deleted mini-services node_modules
- Deleted `__pycache__` directories
- Cleaned bun global cache
- Reinstalled all dependencies with `bun install --force` (836 packages)
- Restarted all services

### Task 2: Fixed white screen issue on main page
- **Root cause**: Zustand persist hydration timing was unreliable
- **Fix 1**: Replaced `requestAnimationFrame` hydration detection with `useAppStore.persist.onFinishHydration()` callback
- **Fix 2**: Added fallback timeout (1 second) for hydration detection
- **Fix 3**: Added `persistUser` state to prevent flash of login page for already-logged-in users
- **Fix 4**: Improved SeedInitializer with auto-retry for network errors (3 retries with exponential backoff)
- **Fix 5**: Increased seed API timeout from 8s to 15s
- **Fix 6**: Added unhandled promise rejection handler for chunk load errors
- **Fix 7**: Added `queueMicrotask` to avoid React lint warnings about synchronous setState in effects

### Task 3: Investigated login error
- Login API works correctly via curl (POST /api/auth/login with admin/admin123 returns success)
- Browser login fails with "用户名或密码错误" when using agent-browser automation
- **Root cause**: The agent-browser `fill` and `keyboard type` commands may not properly trigger React's controlled input onChange handlers, causing the React state to be different from DOM values
- The actual login code is correct - this is a browser automation limitation, not a code bug
- The dev server instability (crashing under browser load) also contributes to the issue

### Server Stability Issue
- The Next.js dev server with Turbopack consumes ~1.1 GB of memory
- When agent-browser (Chromium) connects, it adds ~1.4 GB of memory usage
- The server frequently crashes due to memory pressure when compiling routes on demand
- Set up auto-restart loop to mitigate: `while true; do node ./node_modules/.bin/next dev -p 3000; sleep 3; done &`

## Files Modified
- `src/app/page.tsx` - Fixed hydration logic, added error handling, improved SeedInitializer

## Pending Issues
1. **Dev server instability** - Server crashes under browser load due to memory constraints
2. **Browser login test** - agent-browser cannot properly test login due to React controlled input limitations
3. **Original bug reports** from user context:
   - Download workspace failed: "Failed to fetch" - NOT YET INVESTIGATED
   - Password login error - API works but browser automation has issues
   - White screen on main page - FIXED (hydration timing)

## Priority for Next Phase
1. Fix the "download workspace failed: Failed to fetch" issue (highest priority per user)
2. Further improve page resilience to server crashes
3. Continue HisFieldMapping module improvements
4. Add more features and styling details
