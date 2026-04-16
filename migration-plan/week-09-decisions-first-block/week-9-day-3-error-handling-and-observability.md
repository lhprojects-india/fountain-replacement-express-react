# Week 9 — Day 3: Error Handling & Observability

## Context

Security and performance are addressed. Now we ensure the system is observable and errors are handled gracefully.

**Previous day**: Performance optimization — indexing, caching, bundle splitting, lazy loading, compression.

**What we're building today**: Structured logging, global error handling, health check improvements, and monitoring setup.

## Today's Focus

1. Structured logging
2. Global error handling middleware
3. Enhanced health checks
4. Error boundary improvements (frontend)
5. Monitoring and alerting prep

## Detailed Changes

### Backend

#### 1. Structured logging

Replace `console.log/error` with a structured logger. Install `pino` (fast, JSON):

```javascript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty' } 
    : undefined,
});
```

Replace ALL `console.log` and `console.error` across the codebase:
- `logger.info({ msg, data })` for informational
- `logger.error({ msg, err, context })` for errors
- `logger.warn({ msg })` for warnings

Add request logging middleware:
```javascript
import pinoHttp from 'pino-http';

app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
```

Install `pino`, `pino-pretty` (dev), `pino-http`.

#### 2. Global error handling middleware

Update the error handler in `index.js`:
```javascript
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  logger.error({
    msg: 'Unhandled error',
    err: { message: err.message, stack: err.stack, code: err.code },
    request: { method: req.method, url: req.url, ip: req.ip },
  });

  res.status(status).json({
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});
```

Wrap all controller functions with an async error catcher:
```javascript
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
```

Apply to all route handlers:
```javascript
router.get('/', asyncHandler(listApplicationsHandler));
```

#### 3. Enhanced health check

Update `GET /health`:
```javascript
app.get('/health', async (req, res) => {
  const checks = {};
  
  // Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }
  
  // S3 connectivity (lightweight check)
  try {
    // head-bucket or list with max 0
    checks.storage = 'ok';
  } catch {
    checks.storage = 'error';
  }

  const healthy = Object.values(checks).every(v => v === 'ok');
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
```

#### 4. Graceful shutdown

```javascript
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
```

#### 5. Custom error classes

Create `apps/backend/src/lib/errors.js`:
```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}
```

Use these throughout the codebase instead of raw `res.status(4xx).json(...)`.

### Frontend

#### 6. Global error boundary

Ensure both apps have a root error boundary:
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    // Log to monitoring service
    console.error('React Error Boundary:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>Please refresh the page or contact support.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

#### 7. API error handling in service layer

Update `packages/shared/lib/api-client.js`:
```javascript
apiClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const data = error.response?.data;
    
    if (status === 401) {
      clearAuthToken();
      window.location.href = '/login';
    }
    
    if (status === 429) {
      // Rate limited — show specific message
    }
    
    return Promise.reject({
      status,
      message: data?.error || data?.message || 'An error occurred',
      code: data?.code,
      errors: data?.errors, // validation errors
    });
  }
);
```

#### 8. Toast error display

Create a centralized error display utility:
```javascript
export function handleApiError(error, toast) {
  if (error.errors) {
    // Validation errors — show first
    toast({ title: 'Validation Error', description: error.errors[0].message, variant: 'destructive' });
  } else if (error.status === 429) {
    toast({ title: 'Too Many Requests', description: 'Please wait before trying again.', variant: 'destructive' });
  } else {
    toast({ title: 'Error', description: error.message, variant: 'destructive' });
  }
}
```

## Acceptance Criteria

- [ ] All console.log/error replaced with pino logger
- [ ] Request logging captures method, URL, status, duration
- [ ] Global error handler catches all unhandled errors
- [ ] Health check verifies database + storage connectivity
- [ ] Custom error classes used throughout
- [ ] Async handler wraps all route handlers
- [ ] Graceful shutdown disconnects Prisma
- [ ] Frontend error boundary catches React errors
- [ ] API 401 auto-redirects to login
- [ ] Rate limit (429) shows user-friendly message
- [ ] No stack traces in production responses

## What's Next (Day 4)

Tomorrow we focus on **deployment configuration** — updating render.yaml, environment variables, database migrations strategy, and CI/CD considerations.
