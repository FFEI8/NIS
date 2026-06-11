# Task ID: 4 - MDRO Stats API Builder

## Task
Create `/api/mdro-stats` endpoint and connect MDRO monitor page to real API data

## Files Created/Modified
1. **Created**: `/src/app/api/mdro-stats/route.ts` - GET handler returning MDRO statistics
2. **Modified**: `/src/components/pages/mdro-monitor.tsx` - Replaced mock data with API fetch

## API Response Structure
```json
{
  "success": true,
  "data": {
    "overview": { "total": N, "thisMonth": N, "alerts": N, "departments": N },
    "byBacteria": [
      { "name": "CRAB", "fullName": "鲍曼不动杆菌", "count": N, "trend": "up|down|stable", "trendPercent": N, "resistance": "耐碳青霉烯", "risk": "高风险|中风险|低风险", "lastDetected": "YYYY-MM-DD", "color": "rose" },
      ...
    ],
    "deptDistribution": [
      { "dept": "ICU", "count": N, "crab": N, "crkp": N, "mrsa": N, "vre": N, "crpa": N, "risk": "低风险" },
      ...
    ],
    "monthlyTrend": [
      { "month": "2026-01", "count": N },
      ...
    ],
    "recentAlerts": [
      { "id": "...", "bacteria": "鲍曼不动杆菌", "patientName": "...", "dept": "...", "warningLevel": "高", "warningType": "病例预警", "description": "...", "status": "待处理", "createdAt": "..." },
      ...
    ]
  }
}
```

## Key Decisions
- Enhanced API beyond task spec to include per-bacteria dept breakdown and metadata (resistance, risk, color, lastDetected) to support existing UI
- Used `error: unknown` with proper type narrowing instead of `error: any`
- Monthly trend initializes all 6 months with 0 to ensure chart renders even with no data
- Risk level determined by count thresholds: ≥15=高风险, ≥5=中风险, <5=低风险

## Verification
- API returns 200 via curl with correct data (16 total MDRO cases, 8 departments)
- Lint: 0 errors, 0 warnings
