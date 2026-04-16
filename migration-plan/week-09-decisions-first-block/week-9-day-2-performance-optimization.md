# Week 9 — Day 2: Performance Optimization

## Context

Yesterday we hardened security. Today we optimize performance to ensure the system handles real-world load smoothly.

**Previous day**: Security hardening — rate limiting, input validation, CORS, webhook verification, bcrypt, helmet.

**What we're building today**: Database query optimization, API caching, frontend bundle optimization, and lazy loading.

## Today's Focus

1. Database indexing and query optimization
2. API response caching
3. Frontend bundle splitting
4. Image/asset optimization
5. Pagination optimization

## Detailed Changes

### Backend

#### 1. Database indexing

Review and add missing indexes to `schema.prisma`:

```prisma
// Application — most queried model
@@index([currentStage])           // already exists
@@index([email])                  // already exists
@@index([jobId])
@@index([createdAt])
@@index([currentStageEnteredAt])
@@index([currentStage, createdAt]) // composite for filtered + sorted queries

// ApplicationStageHistory
@@index([applicationId])          // already exists
@@index([occurredAt])

// DocumentSubmission
@@index([applicationId, status])

// CommunicationLog
@@index([applicationId])          // already exists
@@index([createdAt])

// Job
@@index([cityId, isPublished])

// JobPublicLink
@@index([slug])                   // already unique
```

Run migration: `npx prisma migrate dev --name add_performance_indexes`

#### 2. Query optimization

Review all Prisma queries for N+1 problems:

- `getAllApplications`: Use `include` to eager-load job + city in one query, not separate queries per row
- `getApplicationsByStage`: Same — eager load
- `getAdminDashboardData`: Ensure the merge loop isn't doing individual queries
- Analytics queries: Use raw SQL with `GROUP BY` for aggregate functions instead of loading all records

Example optimization:
```javascript
// Bad: N+1
const apps = await prisma.application.findMany();
for (const app of apps) {
  app.job = await prisma.job.findUnique({ where: { id: app.jobId } });
}

// Good: eager load
const apps = await prisma.application.findMany({
  include: { job: { include: { city: true } } }
});
```

#### 3. API response caching

Add simple in-memory caching for expensive, rarely-changing endpoints:

```javascript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 }); // 5 min default

export function cacheMiddleware(key, ttl) {
  return (req, res, next) => {
    const cacheKey = `${key}_${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);
    
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(cacheKey, data, ttl);
      return originalJson(data);
    };
    next();
  };
}
```

Apply to:
- `GET /api/cities` (TTL: 5 min)
- `GET /api/jobs` (TTL: 1 min)
- `GET /api/analytics/*` (TTL: 2 min)
- `GET /api/document-requirements/*` (TTL: 5 min)
- `GET /api/questionnaires` (TTL: 5 min)

Invalidate cache on mutations (create/update/delete).

Install `node-cache`.

#### 4. Pagination optimization

Ensure all list endpoints use cursor-based or offset pagination efficiently:
- Use `take` + `skip` in Prisma
- Return total count with a separate `COUNT(*)` query (not loading all records)
- Limit `pageSize` max to 100

#### 5. Response compression

```javascript
import compression from 'compression';
app.use(compression());
```

Install `compression`.

### Frontend (Admin Web + Driver Web)

#### 6. Bundle splitting

In both Vite configs, optimize chunking:
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
        charts: ['recharts'],
        dnd: ['@dnd-kit/core', '@dnd-kit/sortable'],
      }
    }
  }
}
```

#### 7. Lazy loading

Ensure all routes are lazy-loaded (already partially done):
```javascript
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Analytics = lazy(() => import('./pages/Analytics'));
// etc.
```

Also lazy-load heavy components:
- `DocumentReviewer` (only loads when opening docs)
- `KanbanBoard` (only loads when switching to board view)
- `VideoRecorder` (only loads on document upload page)
- Recharts components (only loads on analytics page)

#### 8. Image optimization

- Use WebP format for static assets where possible
- Lazy load images (use `loading="lazy"` attribute)
- Document thumbnails: request smaller sizes via S3 image transforms (or generate thumbnails server-side)

#### 9. API request optimization

- **Debounce search**: Already 300ms (verify)
- **Cancel duplicate requests**: Use AbortController for search/filter requests
- **Optimistic updates**: Already done for kanban drag-drop (verify)
- **SWR/React Query**: Use `staleTime` and `cacheTime` effectively
  ```javascript
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,    // 30s before refetch
        cacheTime: 300000,   // 5min cache
        refetchOnWindowFocus: false,
      }
    }
  });
  ```

## Acceptance Criteria

- [ ] All critical queries have appropriate indexes
- [ ] No N+1 query patterns in list endpoints
- [ ] Cache hits reduce response time for read-heavy endpoints
- [ ] Cache invalidation works on mutations
- [ ] API responses compressed
- [ ] Frontend bundles split into logical chunks
- [ ] All routes lazy-loaded
- [ ] Heavy components lazy-loaded
- [ ] Search debounced and cancellable
- [ ] Pipeline page loads in < 2s
- [ ] Application detail loads in < 1s

## What's Next (Day 3)

Tomorrow we focus on **error handling and observability** — structured logging, error tracking, health checks, and monitoring setup.
