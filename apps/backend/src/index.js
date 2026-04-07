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
const prisma = (await import('./lib/prisma.js')).default;

// Route imports
const authRoutes = (await import('./api/routes/authRoutes.js')).default;
const driverRoutes = (await import('./api/routes/driverRoutes.js')).default;
const adminRoutes = (await import('./api/routes/adminRoutes.js')).default;
const webhookRoutes = (await import('./api/routes/webhookRoutes.js')).default;

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Driver Onboarding API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
