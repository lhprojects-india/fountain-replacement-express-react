# Week 9 — Day 1: Security Hardening

## Context

The full system has been built and tested end-to-end. Now we harden it for production — security, input validation, rate limiting, and protection against common attack vectors.

**Previous day (Week 8, Day 5)**: E2E integration testing — happy path verified, edge cases tested, bugs fixed.

**What we're building today**: Security hardening across the entire backend — rate limiting, input sanitization, CORS tightening, webhook verification, and auth improvements.

## Today's Focus

1. Rate limiting
2. Input validation/sanitization
3. CORS configuration
4. Webhook signature verification
5. Auth security improvements
6. HTTP security headers

## Detailed Changes

### Backend

#### 1. Rate limiting

Install `express-rate-limit`:

```javascript
import rateLimit from 'express-rate-limit';

// Global limiter: 100 requests per minute per IP
const globalLimiter = rateLimit({ windowMs: 60000, max: 100, message: 'Too many requests' });

// Auth limiter: 5 requests per minute per IP (brute force protection)
const authLimiter = rateLimit({ windowMs: 60000, max: 5, message: 'Too many attempts. Try again later.' });

// Public API limiter: 20 requests per minute per IP
const publicLimiter = rateLimit({ windowMs: 60000, max: 20 });

// Apply:
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/public', publicLimiter);
```

#### 2. Input validation with Zod

Ensure ALL endpoints have Zod schema validation:
- Create a validation middleware:
```javascript
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
```

Apply to every route that accepts a body. List and verify all endpoints have validation.

#### 3. SQL injection prevention

Prisma already parameterizes queries, but verify:
- No raw SQL with string concatenation (check `$queryRaw` usage — the existing `getFacilitiesByCity` uses template literals correctly)
- Search parameters are always parameterized
- No `eval()` or dynamic code execution

#### 4. XSS prevention

- Sanitize all user input that will be displayed:
  - Application names, addresses, notes
  - Admin notes
  - Template content
- Install `dompurify` or `sanitize-html` for any HTML content
- Ensure React's default XSS protection is not bypassed (no `dangerouslySetInnerHTML` without sanitization)

#### 5. CORS tightening

Update `apps/backend/src/index.js`:
```javascript
const allowedOrigins = [
  process.env.DRIVER_WEB_URL || 'http://localhost:3000',
  process.env.ADMIN_WEB_URL || 'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

#### 6. Webhook signature verification

Ensure all webhook endpoints verify signatures:
- **Dropbox Sign**: Already implemented (Day 5.3)
- **Resend**: Verify using `svix` library
- **Twilio**: Verify using `twilio.validateRequest()`

Never trust webhook payloads without verification.

#### 7. Auth improvements

- **Password hashing**: Admin passwords should use bcrypt (the current code has a TODO for this)
  ```javascript
  import bcrypt from 'bcrypt';
  const hash = await bcrypt.hash(password, 12);
  const valid = await bcrypt.compare(input, hash);
  ```
  Install `bcrypt`.

- **JWT improvements**:
  - Add `iss` (issuer) and `aud` (audience) claims
  - Reduce driver JWT expiry from 7d to 24h
  - Add token refresh mechanism (optional)

- **Verification code security**:
  - Hash verification codes in DB (don't store plaintext)
  - Use `crypto.randomInt(100000, 999999)` for secure random codes
  - Rate limit code requests per email (max 3 per hour)

#### 8. HTTP security headers

Install `helmet`:
```javascript
import helmet from 'helmet';
app.use(helmet());
```

This adds:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy (configure for API)

#### 9. Sensitive data handling

- Ensure no passwords, tokens, or verification codes in response bodies
- Ensure no sensitive data in error messages sent to clients
- Ensure no stack traces in production error responses
- Add `NODE_ENV` check for error detail level

#### 10. File upload security

- Validate MIME types server-side (not just client-provided Content-Type)
- Set strict Content-Disposition headers on downloads
- S3 objects should have no public access (presigned only)
- Scan uploaded files for common malware signatures (stretch goal)

## Acceptance Criteria

- [ ] Rate limiting active on all endpoints
- [ ] Auth endpoints have strict rate limits (5/min)
- [ ] All endpoints validate input with Zod
- [ ] CORS allows only known origins
- [ ] Webhook signatures verified
- [ ] Admin passwords hashed with bcrypt
- [ ] Verification codes hashed in DB
- [ ] Security headers set via helmet
- [ ] No sensitive data in error responses
- [ ] No raw SQL with string concatenation
- [ ] File uploads validated server-side

## What's Next (Day 2)

Tomorrow we focus on **performance optimization** — database query optimization, API response caching, frontend bundle optimization, and lazy loading.
