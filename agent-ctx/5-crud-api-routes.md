# Task 5 - CRUD API Routes for HIS Models

## Work Summary

Created proper CRUD API routes for 3 HIS models that previously had no CRUD APIs (only accessible via aggregation endpoint).

## Files Created

1. `/src/app/api/his-conversion-rules/route.ts` - GET (list with pagination, category filter, keyword search) + POST
2. `/src/app/api/his-conversion-rules/[id]/route.ts` - GET by ID + PUT (whitelist fields) + DELETE (soft delete)
3. `/src/app/api/his-validation-rules/route.ts` - GET (list with pagination, form/ruleType/severity filters, keyword search) + POST
4. `/src/app/api/his-validation-rules/[id]/route.ts` - GET by ID + PUT (whitelist fields) + DELETE (soft delete)
5. `/src/app/api/his-consistency-issues/route.ts` - GET (list with pagination, scenarioId/issueType/severity filters, keyword search) + POST
6. `/src/app/api/his-consistency-issues/[id]/route.ts` - GET by ID + PUT (whitelist fields) + DELETE (soft delete)

## Patterns Followed

- Used `import { db } from '@/lib/db'` for database access
- Used `import { NextResponse } from 'next/server'` for responses
- Used `getPaginationParams` from `@/lib/api-utils` for pagination
- Return `{ success: true, data: { items, total, page, pageSize } }` for list endpoints
- Return `{ success: true, data: item }` for single item endpoints
- Return `{ success: false, message: '...' }` for errors
- Proper error handling with try/catch
- 404 check before PUT/DELETE with appropriate Chinese error messages
- Whitelisted fields in PUT to prevent mass assignment
- Soft delete (status=0) in DELETE
- Required field validation in POST
- Params as Promise<{ id: string }> pattern (Next.js 16)

## Test Results

All endpoints verified working via curl:
- GET /api/his-conversion-rules → 18 items ✅
- GET /api/his-conversion-rules?category=代码映射 → 5 items ✅
- GET /api/his-conversion-rules/[id] → single item ✅
- POST /api/his-conversion-rules → create ✅
- PUT /api/his-conversion-rules/[id] → update ✅
- DELETE /api/his-conversion-rules/[id] → soft delete (status=0) ✅
- GET /api/his-validation-rules → 33 items ✅
- POST /api/his-validation-rules → create ✅
- GET /api/his-consistency-issues → 15 items ✅
- GET /api/his-consistency-issues/[id] → single item ✅
- POST /api/his-consistency-issues → create ✅
- DELETE /api/his-consistency-issues/[id] → soft delete (status=0) ✅

Lint: 0 errors, 0 warnings ✅
