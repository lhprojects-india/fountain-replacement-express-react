/**
 * Upserts a local test admin for email/password login (see VITE_ENABLE_EMAIL_ADMIN_LOGIN).
 *
 * Usage (from repo root, with DATABASE_URL in .env):
 *   npm run seed:test-admin -w backend
 *
 * Env (optional):
 *   TEST_ADMIN_EMAIL    default: dev-admin@localhost.test
 *   TEST_ADMIN_PASSWORD default: dev-admin-password-change-me
 *   TEST_ADMIN_ROLE     default: super_admin
 *   TEST_ADMIN_NAME     default: Local dev admin
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const email = (process.env.TEST_ADMIN_EMAIL || 'dev-admin@localhost.test').toLowerCase().trim();
const password = process.env.TEST_ADMIN_PASSWORD || 'dev-admin-password-change-me';
const role = process.env.TEST_ADMIN_ROLE || 'super_admin';
const name = process.env.TEST_ADMIN_NAME || 'Local dev admin';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env at the repo root.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
  const admin = await prisma.admin.upsert({
    where: { email },
    create: { email, password, role, name },
    update: { password, role, name, updatedAt: new Date() },
  });
  console.log('Test admin ready:');
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${password === process.env.TEST_ADMIN_PASSWORD ? '(from TEST_ADMIN_PASSWORD)' : '(default — change via env)'}`);
  console.log(`  Role:     ${admin.role}`);
  console.log('');
  console.log('Next: in admin-web .env set VITE_ENABLE_EMAIL_ADMIN_LOGIN=true, restart Vite, then sign in with email + password.');
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
