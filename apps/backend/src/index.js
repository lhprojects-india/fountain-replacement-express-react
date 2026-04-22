import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// IMPORTANT:
// In ESM, static imports are evaluated before the module body runs.
// We need dotenv to be applied before modules like prisma/firebase-admin read env vars.
const express = (await import('express')).default;
const cors = (await import('cors')).default;
const helmet = (await import('helmet')).default;
const rateLimit = (await import('express-rate-limit')).default;
const compression = (await import('compression')).default;
const pinoHttp = (await import('pino-http')).default;
const prisma = (await import('./lib/prisma.js')).default;
const { logger } = await import('./lib/logger.js');
const { checkStorageHealth } = await import('./modules/documents/storage.service.js');

// Route imports
const authRoutes = (await import('./api/routes/authRoutes.js')).default;
const driverRoutes = (await import('./api/routes/driverRoutes.js')).default;
const adminRoutes = (await import('./api/routes/adminRoutes.js')).default;
const workflowRoutes = (await import('./modules/workflow/workflow.routes.js')).default;
const { authenticateToken, authorizeAdmin } = await import('./api/middleware/authMiddleware.js');
const cityRoutes = (await import('./modules/regions/city.routes.js')).default;
const contractRoutes = (await import('./modules/contracts/contract.routes.js')).default;
const jobRoutes = (await import('./modules/jobs/job.routes.js')).default;
const publicJobRoutes = (await import('./modules/jobs/public-job.routes.js')).default;
const publicApplicationRoutes = (await import('./modules/applications/public-application.routes.js')).default;
const applicationRoutes = (await import('./modules/applications/application.routes.js')).default;
const driverAuthRoutes = (await import('./modules/applications/auth.routes.js')).default;
const driverApplicationRoutes = (await import('./modules/applications/driver-application.routes.js')).default;
const documentRoutesModule = await import('./modules/documents/document.routes.js');
const documentRequirementRoutes = documentRoutesModule.default;
const { driverRoutes: driverDocumentRoutes, adminRoutes: adminDocumentRoutes } = documentRoutesModule;
const analyticsRoutes = (await import('./modules/applications/analytics.routes.js')).default;
const communicationRoutes = (await import('./modules/communications/communication.routes.js')).default;
const paymentRoutesModule = await import('./modules/payments/payment.routes.js');
const { driverPaymentRoutes, adminPaymentRoutes } = paymentRoutesModule;
const questionnaireRoutesModule = await import('./modules/questionnaire/questionnaire.routes.js');
const { adminQuestionnaireRoutes, driverQuestionnaireRoutes } = questionnaireRoutesModule;
const { handleResendWebhook } = await import('./modules/communications/resend-webhook.js');
const { handleTwilioWebhook } = await import('./modules/communications/twilio-webhook.js');
const {
  handleDropboxSignWebhook,
  handleDropboxSignWebhookChallenge,
} = await import('./modules/integrations/dropbox-sign/dropbox-sign.webhook.js');

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  process.env.DRIVER_WEB_URL || process.env.VITE_DRIVER_APP_URL || 'http://localhost:3000',
  process.env.ADMIN_WEB_URL || process.env.VITE_ADMIN_APP_URL || 'http://localhost:3001',
].filter(Boolean);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests' },
});

function authRateLimitMax() {
  const raw = process.env.AUTH_RATE_LIMIT_MAX;
  if (raw !== undefined && raw !== '') {
    const n = Number.parseInt(String(raw), 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return process.env.NODE_ENV === 'production' ? 5 : 200;
}

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: authRateLimitMax(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again later.' },
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many public requests' },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use('/api/webhooks/resend', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use('/api', globalLimiter);
// Single limiter for all /api/auth/* (including /api/auth/driver/*). Do not mount twice — that double-counts each request.
app.use('/api/auth', authLimiter);
app.use('/api/public', publicLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/driver', driverAuthRoutes);
app.use('/api/driver', authenticateToken, driverApplicationRoutes);
app.use('/api/driver', authenticateToken, driverPaymentRoutes);
app.use('/api/driver', authenticateToken, driverQuestionnaireRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/cities', authenticateToken, authorizeAdmin, cityRoutes);
app.use('/api/contract-templates', authenticateToken, authorizeAdmin, contractRoutes);
app.use('/api/jobs', authenticateToken, authorizeAdmin, jobRoutes);
app.use('/api/public/jobs', publicJobRoutes);
app.use('/api/public/applications', publicApplicationRoutes);
app.use('/api/applications', authenticateToken, authorizeAdmin, applicationRoutes);
app.use('/api/applications', authenticateToken, authorizeAdmin, adminPaymentRoutes);
app.use('/api/questionnaires', authenticateToken, authorizeAdmin, adminQuestionnaireRoutes);
app.use('/api/document-requirements', authenticateToken, authorizeAdmin, documentRequirementRoutes);
app.use('/api/driver/documents', authenticateToken, driverDocumentRoutes);
app.use('/api/applications', authenticateToken, authorizeAdmin, adminDocumentRoutes);
app.use('/api/analytics', authenticateToken, authorizeAdmin, analyticsRoutes);
app.use('/api/communications', authenticateToken, authorizeAdmin, communicationRoutes);
app.get('/api/webhooks/dropbox-sign', handleDropboxSignWebhookChallenge);
app.post('/api/webhooks/dropbox-sign', express.urlencoded({ extended: true }), handleDropboxSignWebhook);
app.post('/api/webhooks/resend', handleResendWebhook);
app.post('/api/webhooks/twilio', express.urlencoded({ extended: false }), handleTwilioWebhook);

// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    logger.warn({ msg: 'Health check database failed', error: error?.message || error });
  }

  try {
    await checkStorageHealth();
    checks.storage = 'ok';
  } catch (error) {
    checks.storage = 'error';
    logger.warn({ msg: 'Health check storage failed', error: error?.message || error });
  }

  const healthy = Object.values(checks).every((value) => value === 'ok');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Talentrix by Laundryheap API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error({
    msg: 'Unhandled error',
    err: {
      message: err?.message,
      stack: err?.stack,
      code: err?.code,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
  });

  res.status(status).json({
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
    code: err?.code || 'INTERNAL_ERROR',
    ...(err?.errors ? { errors: err.errors } : {}),
    ...(isProduction ? {} : { stack: err?.stack }),
  });
});

app.listen(PORT, () => {
  logger.info({ msg: `Server is running on port ${PORT}` });
});

process.on('SIGTERM', async () => {
  logger.info({ msg: 'SIGTERM received, shutting down gracefully' });
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
