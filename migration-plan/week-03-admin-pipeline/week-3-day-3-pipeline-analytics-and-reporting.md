# Week 3 — Day 3: Pipeline Analytics & Reporting

## Context

We have a full admin pipeline with table + kanban views, advanced filtering, and CSV export. Today we add data visualization.

**Previous day**: Advanced filters, saved presets, column customization, CSV export.

**What we're building today**: Analytics dashboard for the hiring pipeline — conversion rates, stage duration metrics, volume charts, and city breakdowns.

## Today's Focus

1. Analytics API endpoints
2. Pipeline conversion funnel
3. Stage duration metrics
4. Volume-over-time charts
5. City breakdown

## Detailed Changes

### Backend

#### 1. `apps/backend/src/modules/applications/analytics.service.js`

New service with analytics queries:

- `getPipelineFunnel(filters?)`:
  Count of applications that have reached each stage (ever, from stage history):
  ```javascript
  { applied: 150, pending_review: 145, screening: 120, acknowledgements: 100, contract_sent: 80, ... approved: 30, active: 25, rejected: 40 }
  ```
  Conversion rate calculated as: next_stage_count / current_stage_count

- `getAverageStageDuration(filters?)`:
  For each stage, average time spent (from stage history enter → exit):
  ```javascript
  { pending_review: { avgHours: 18.5, medianHours: 12 }, screening: { avgHours: 72, medianHours: 48 }, ... }
  ```

- `getApplicationsOverTime(period, filters?)`:
  Applications created per day/week/month:
  ```javascript
  { period: 'week', data: [{ date: '2026-03-30', count: 15 }, { date: '2026-04-06', count: 22 }, ...] }
  ```

- `getCityBreakdown(filters?)`:
  Applications by city with stage distribution:
  ```javascript
  [{ city: 'UK', total: 80, pending: 10, screening: 15, approved: 20, rejected: 5, ... }, ...]
  ```

- `getJobPerformance(filters?)`:
  Per job: application count, conversion rate, avg time to hire:
  ```javascript
  [{ jobTitle: 'Van Driver London', applications: 45, hired: 12, avgDaysToHire: 14, conversionRate: 0.27 }, ...]
  ```

#### 2. `apps/backend/src/modules/applications/analytics.routes.js`

```
GET /api/analytics/funnel?cityId=&jobId=&dateFrom=&dateTo=
GET /api/analytics/stage-duration?cityId=&dateFrom=&dateTo=
GET /api/analytics/volume?period=week&cityId=&dateFrom=&dateTo=
GET /api/analytics/cities?dateFrom=&dateTo=
GET /api/analytics/jobs?dateFrom=&dateTo=
```

Mount:
```javascript
app.use('/api/analytics', authenticateToken, authorizeAdmin, analyticsRoutes);
```

### Frontend (Admin Web)

#### 1. Replace existing Analytics tab content

The current analytics tab has hardcoded data and placeholder charts. Replace entirely.

#### 2. `apps/admin-web/src/components/admin/AnalyticsDashboard.jsx`

Layout:
```
┌─────────────────────────────────────────────────┐
│ Filter bar: Date range | City | Job            │
├─────────────────────────────────────────────────┤
│ KPI Cards Row                                    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │Total    │ │Hire Rate│ │Avg Time │ │Active   ││
│ │Apps: 150│ │22%      │ │14 days  │ │Now: 25  ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐│
│ │ Pipeline Funnel      │ │ Applications Over    ││
│ │ (horizontal bar)     │ │ Time (line/bar chart)││
│ │                      │ │                      ││
│ └──────────────────────┘ └──────────────────────┘│
├─────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐│
│ │ Avg Stage Duration   │ │ City Breakdown       ││
│ │ (horizontal bar)     │ │ (stacked bar or      ││
│ │                      │ │  table)              ││
│ └──────────────────────┘ └──────────────────────┘│
├─────────────────────────────────────────────────┤
│ Job Performance Table                            │
│ Job | Apps | Hired | Conv Rate | Avg Days        │
└─────────────────────────────────────────────────┘
```

#### 3. Chart Components (using Recharts — already in deps)

- **Pipeline Funnel**: `BarChart` horizontal — each bar is a stage, showing count + conversion % label
- **Applications Over Time**: `AreaChart` or `BarChart` — x=date, y=count, toggle between daily/weekly/monthly
- **Stage Duration**: `BarChart` horizontal — each bar shows avg hours, with color coding (green < 24h, yellow < 72h, red > 72h)
- **City breakdown**: `BarChart` stacked — x=city, stacked by stage groups (active pipeline, approved, rejected)
- **Job Performance**: Table with sortable columns

#### 4. Date range filter

Preset ranges: "Last 7 days", "Last 30 days", "Last 90 days", "This month", "Custom"

All charts respond to the same filter context.

#### 5. Update `admin-services.js`

Add:
```javascript
getAnalyticsFunnel(filters?)
getAnalyticsStageDuration(filters?)
getAnalyticsVolume(period, filters?)
getAnalyticsCities(filters?)
getAnalyticsJobs(filters?)
```

## Acceptance Criteria

- [ ] Funnel API returns correct stage counts from history
- [ ] Stage duration API computes real averages
- [ ] Volume API supports day/week/month grouping
- [ ] City breakdown groups by city correctly
- [ ] KPI cards show correct computed values
- [ ] Funnel chart renders with conversion percentages
- [ ] Volume chart with period toggle works
- [ ] Stage duration chart color-codes by SLA thresholds
- [ ] Date range filter affects all charts
- [ ] City/job filter affects all charts
- [ ] Charts are responsive

## What's Next (Day 4)

Tomorrow we build **notification preferences and activity feed** — a real-time activity feed in the admin panel showing recent transitions, and settings for which notifications admins receive.
