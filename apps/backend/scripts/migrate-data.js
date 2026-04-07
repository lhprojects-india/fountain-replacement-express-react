import admin from 'firebase-admin';
import pkg from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { PrismaClient, Prisma } = pkg;
const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const fullServiceAccountPath = serviceAccountPath ? path.resolve(__dirname, '../../..', serviceAccountPath) : null;

if (fullServiceAccountPath && fs.existsSync(fullServiceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(fullServiceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.warn(`No service account found at ${fullServiceAccountPath}, attempting default initialization`);
  admin.initializeApp({
    projectId: 'driver-onboarding-lh'
  });
}

const db = admin.firestore();

const migrateCollection = async (collectionName, modelName, transformFn) => {
  console.log(`Migrating collection: ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const transformed = transformFn(data, doc.id);
    
    try {
      await prisma[modelName].upsert({
        where: { [Object.keys(transformed).find(k => k === 'email' || k === 'id' || k === 'city' || k === 'facility')]: transformed[Object.keys(transformed).find(k => k === 'email' || k === 'id' || k === 'city' || k === 'facility')] },
        update: transformed,
        create: transformed,
      });
      count++;
      if (count % 10 === 0) console.log(`Migrated ${count}/${snapshot.size} docs from ${collectionName}...`);
    } catch (e) {
      console.error(`Error migrating doc ${doc.id} in ${collectionName}:`, e.message);
    }
  }
  console.log(`Finished migrating ${count}/${snapshot.size} docs from ${collectionName}`);
};

const toDateTime = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (typeof timestamp === 'string') return new Date(timestamp);
  return new Date(timestamp);
};

const runMigration = async () => {
  try {
    // 1. Migrate Fountain Applicants
    await migrateCollection('fountain_applicants', 'fountainApplicant', (data, id) => ({
      email: id.toLowerCase().trim(),
      phone: data.phone,
      name: data.name,
      applicantId: data.applicantId ? String(data.applicantId) : null,
      funnelId: data.funnelId ? String(data.funnelId) : null,
      funnelTitle: data.funnelTitle ?? null,
      mot: data.mot ?? null,
      address: data.address ?? null,
      stage: data.stage,
      status: data.status,
      city: data.city,
      country: data.country,
      fountainData: data.fountainData || {},
      createdAt: toDateTime(data.createdAt) || new Date(),
      updatedAt: toDateTime(data.updatedAt) || new Date(),
      webhookReceivedAt: data.webhookReceivedAt,
      isActive: data.isActive !== false,
    }));

    // 2. Migrate Drivers (normalized drivers table — no JSON progress columns)
    await migrateCollection('drivers', 'driver', (data, id) => {
      const confirm = data.progress_confirm_details && typeof data.progress_confirm_details === 'object'
        ? data.progress_confirm_details
        : {};
      return {
        email: id.toLowerCase().trim(),
        name: data.name ?? confirm.name ?? null,
        phone: data.phone ?? confirm.phone ?? null,
        city: data.city ?? confirm.city ?? null,
        onboardingStatus: data.onboardingStatus || 'started',
        status: data.status || 'pending',
        adminNotes: data.adminNotes,
        createdAt: toDateTime(data.createdAt) || new Date(),
        updatedAt: toDateTime(data.updatedAt) || new Date(),
        completedAt: toDateTime(data.completedAt),
        statusUpdatedAt: toDateTime(data.statusUpdatedAt),
        smokingStatus: data.smokingStatus,
        hasPhysicalDifficulties: data.hasPhysicalDifficulties,
        lastRoute: data.lastRoute,
        lastRouteUpdatedAt: toDateTime(data.lastRouteUpdatedAt),
      };
    });

    // 3. Firestore `availability` JSON docs → driver_availabilities (optional; run after drivers exist)
    console.log('Skipping Firestore availability → driver_availabilities (use DB migration or custom script).');

    // 4. Migrate Verification
    await migrateCollection('verification', 'verification', (data, id) => ({
      email: id.toLowerCase().trim(),
      vehicle: data.vehicle,
      licensePlate: data.licensePlate,
      address: data.address,
      city: data.city,
      createdAt: toDateTime(data.createdAt) || new Date(),
      updatedAt: toDateTime(data.updatedAt) || new Date(),
    }));

    // 5. Migrate Fee Structures (normalized: fee_structures + block_data)
    console.log('Migrating collection: fee_structures...');
    const feeSnapshot = await db.collection('fee_structures').get();
    let feeCount = 0;
    const stringifyEarn = (v) => {
      if (v == null) return '';
      if (typeof v === 'string') return v;
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    };
    const blockToDetail = (b) => ({
      density: b.density,
      minimumFee: new Prisma.Decimal(String(b.minimumFee ?? 0)),
      shiftLength: Number(b.shiftLength ?? 4),
      includedTasks: Number(b.includedTasks ?? 0),
      additionalTaskFee: new Prisma.Decimal(String(b.additionalTaskFee ?? 0)),
    });

    for (const doc of feeSnapshot.docs) {
      const data = doc.data();
      const city = doc.id.toLowerCase().trim();
      const updatedAt = toDateTime(data.updatedAt) || new Date();
      const feeType = data.feeType || 'general';

      try {
        await prisma.feeStructure.deleteMany({ where: { city } });

        if (feeType === 'vehicle-specific' && data.blocks && typeof data.blocks === 'object' && !Array.isArray(data.blocks)) {
          for (const vt of ['car', 'van']) {
            const blockArr = data.blocks[vt] || [];
            const h =
              typeof data.averageHourlyEarnings === 'object' && data.averageHourlyEarnings
                ? data.averageHourlyEarnings[vt]
                : '';
            const t =
              typeof data.averagePerTaskEarnings === 'object' && data.averagePerTaskEarnings
                ? data.averagePerTaskEarnings[vt]
                : '';
            await prisma.feeStructure.create({
              data: {
                city,
                vehicleType: vt,
                perHour: stringifyEarn(h).slice(0, 100),
                perTask: stringifyEarn(t).slice(0, 100),
                updatedAt,
                details: {
                  create: blockArr.map(blockToDetail),
                },
              },
            });
          }
        } else {
          const blockArr = Array.isArray(data.blocks) ? data.blocks : [];
          await prisma.feeStructure.create({
            data: {
              city,
              vehicleType: 'general',
              perHour: stringifyEarn(data.averageHourlyEarnings).slice(0, 100),
              perTask: stringifyEarn(data.averagePerTaskEarnings).slice(0, 100),
              updatedAt,
              details: {
                create: blockArr.map(blockToDetail),
              },
            },
          });
        }
        feeCount++;
        if (feeCount % 10 === 0) console.log(`Migrated ${feeCount}/${feeSnapshot.size} fee_structures docs...`);
      } catch (e) {
        console.error(`Error migrating fee structure ${doc.id}:`, e.message);
      }
    }
    console.log(`Finished migrating ${feeCount}/${feeSnapshot.size} docs from fee_structures`);

    // 6. Migrate Facilities
    await migrateCollection('facilities', 'facility', (data, id) => ({
      facility: id,
      city: data.city || data.City,
      address: data.address || data.Address,
      createdAt: toDateTime(data.createdAt) || new Date(),
      updatedAt: toDateTime(data.updatedAt) || new Date(),
    }));

    // 7. Migrate Authorized Emails
    await migrateCollection('authorized_emails', 'authorizedEmail', (data, id) => ({
      email: id.toLowerCase().trim(),
      createdAt: toDateTime(data.createdAt) || new Date(),
      addedAt: toDateTime(data.addedAt) || new Date(),
    }));

    // 8. Migrate Admins
    await migrateCollection('admins', 'admin', (data, id) => ({
      email: id.toLowerCase().trim(),
      role: data.role || 'admin',
      name: data.name,
      createdAt: toDateTime(data.createdAt) || new Date(),
      updatedAt: toDateTime(data.updatedAt) || new Date(),
    }));

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

runMigration();
