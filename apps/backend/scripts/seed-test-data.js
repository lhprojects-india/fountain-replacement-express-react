import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = (await import('../src/lib/prisma.js')).default;

const REGION_CODE = 'UK_TEST';
const JOB_TITLE = 'Van Driver - London';

const STAGES = [
  'pending_review',
  'screening',
  'acknowledgements',
  'contract_sent',
  'documents_pending',
  'documents_under_review',
  'payment_details_pending',
  'onboarding_call',
  'questionnaire',
  'decision_pending',
  'approved',
  'first_block_assigned',
  'active',
  'rejected',
];

const TEST_ADMINS = [
  { email: 'superadmin.test@laundryheap.test', role: 'super_admin', name: 'Super Admin Test' },
  { email: 'appadmin.test@laundryheap.test', role: 'app_admin', name: 'App Admin Test' },
  { email: 'adminviewer.test@laundryheap.test', role: 'admin_view', name: 'Admin Viewer Test' },
];

const DOC_REQUIREMENTS = [
  { name: 'Selfie', code: 'selfie', fileTypes: 'image/*', isRequired: true, maxSizeMb: 10, sortOrder: 1 },
  { name: 'Driving License', code: 'driving_license', fileTypes: 'image/*,application/pdf', isRequired: true, maxSizeMb: 15, sortOrder: 2 },
  { name: 'Vehicle Photo', code: 'vehicle_photo', fileTypes: 'image/*', isRequired: true, maxSizeMb: 10, sortOrder: 3 },
  { name: 'Identity Document', code: 'identity_document', fileTypes: 'image/*,application/pdf', isRequired: true, maxSizeMb: 15, sortOrder: 4 },
  { name: 'Vehicle Walkaround Video', code: 'vehicle_video', fileTypes: 'video/*', isRequired: true, maxSizeMb: 150, maxDurationSec: 120, sortOrder: 5 },
];

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function ensureRegion() {
  return prisma.region.upsert({
    where: { code: REGION_CODE },
    update: {
      name: 'United Kingdom (Test)',
      currency: 'GBP',
      currencySymbol: '£',
      timezone: 'Europe/London',
      paymentFieldsSchema: {
        fields: [
          { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
          { key: 'account_number', label: 'Account Number', type: 'text', required: true },
          { key: 'sort_code', label: 'Sort Code', type: 'text', required: true },
        ],
      },
      isActive: true,
    },
    create: {
      name: 'United Kingdom (Test)',
      code: REGION_CODE,
      currency: 'GBP',
      currencySymbol: '£',
      timezone: 'Europe/London',
      paymentFieldsSchema: {
        fields: [
          { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
          { key: 'account_number', label: 'Account Number', type: 'text', required: true },
          { key: 'sort_code', label: 'Sort Code', type: 'text', required: true },
        ],
      },
      isActive: true,
    },
  });
}

async function ensureContractTemplate(regionId) {
  const existing = await prisma.contractTemplate.findFirst({
    where: { regionId, name: 'UK Driver Contract (Test)', isActive: true },
  });
  if (existing) return existing;
  return prisma.contractTemplate.create({
    data: {
      regionId,
      name: 'UK Driver Contract (Test)',
      type: 'driver_contract',
      content: 'Test contract template content for integration testing.',
      isActive: true,
    },
  });
}

async function ensureDocRequirements(regionId) {
  for (const req of DOC_REQUIREMENTS) {
    await prisma.documentRequirement.upsert({
      where: { regionId_code: { regionId, code: req.code } },
      update: req,
      create: { regionId, ...req },
    });
  }
}

async function ensureJob(regionId, contractTemplateId) {
  const existing = await prisma.job.findFirst({
    where: { regionId, title: JOB_TITLE },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    return prisma.job.update({
      where: { id: existing.id },
      data: {
        contractTemplateId,
        isPublished: true,
        publishedAt: existing.publishedAt || new Date(),
      },
    });
  }
  return prisma.job.create({
    data: {
      regionId,
      contractTemplateId,
      title: JOB_TITLE,
      description: 'E2E test job for onboarding pipeline validation.',
      requirements: 'Full UK driving license and van access preferred.',
      isPublished: true,
      publishedAt: new Date(),
    },
  });
}

async function ensurePublicLink(jobId) {
  const current = await prisma.jobPublicLink.findFirst({
    where: { jobId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  if (current) return current;
  const slug = `uk-van-driver-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
  return prisma.jobPublicLink.create({
    data: { jobId, slug, isActive: true },
  });
}

async function ensureAdmins() {
  for (const admin of TEST_ADMINS) {
    await prisma.admin.upsert({
      where: { email: admin.email },
      update: { role: admin.role, name: admin.name },
      create: { ...admin, password: 'change-me-for-local-testing' },
    });
  }
}

async function ensureQuestionnaire(regionId) {
  const title = 'Driver Readiness Assessment (Test)';
  const existing = await prisma.questionnaire.findFirst({
    where: { title, regionId },
    include: { questions: true },
  });
  if (existing) return existing;
  const questionnaire = await prisma.questionnaire.create({
    data: {
      regionId,
      title,
      description: 'Sample questionnaire for end-to-end testing.',
      passingScore: 70,
      isActive: true,
    },
  });
  await prisma.questionnaireQuestion.createMany({
    data: [
      {
        questionnaireId: questionnaire.id,
        questionText: 'What should you do if you are delayed to your block?',
        questionType: 'multiple_choice',
        options: [
          { label: 'Ignore it', value: 'ignore', isCorrect: false },
          { label: 'Inform support/admin as soon as possible', value: 'inform', isCorrect: true },
          { label: 'Cancel without notice', value: 'cancel', isCorrect: false },
        ],
        points: 1,
        sortOrder: 1,
      },
      {
        questionnaireId: questionnaire.id,
        questionText: 'Which document is required to continue onboarding?',
        questionType: 'multiple_choice',
        options: [
          { label: 'Driving license', value: 'dl', isCorrect: true },
          { label: 'Gym membership', value: 'gym', isCorrect: false },
          { label: 'Passport stamp only', value: 'stamp', isCorrect: false },
        ],
        points: 1,
        sortOrder: 2,
      },
    ],
  });
  return prisma.questionnaire.findUnique({
    where: { id: questionnaire.id },
    include: { questions: true },
  });
}

async function ensureStageApplications(jobId) {
  const result = { created: 0, updated: 0 };
  for (let i = 0; i < STAGES.length; i += 1) {
    const stage = STAGES[i];
    const email = `e2e.${stage}@driver.test`;
    const baseData = {
      jobId,
      firstName: 'E2E',
      lastName: stage.replaceAll('_', ' '),
      email,
      phone: `+44770090${String(1000 + i).slice(-4)}`,
      city: 'London',
      country: 'United Kingdom',
      vehicleType: 'van',
      currentStage: stage,
      currentStageEnteredAt: daysAgo(Math.max(0, 14 - i)),
      source: 'seed_test_data',
      ...(stage === 'approved' || stage === 'first_block_assigned' || stage === 'active'
        ? { approvedAt: daysAgo(2) }
        : {}),
      ...(stage === 'first_block_assigned' || stage === 'active'
        ? { firstBlockDate: daysAgo(-1) }
        : {}),
      ...(stage === 'active' ? { firstBlockResult: 'passed' } : {}),
      ...(stage === 'rejected'
        ? { rejectedAt: daysAgo(1), rejectionReason: 'other' }
        : {}),
    };

    const existing = await prisma.application.findUnique({
      where: { jobId_email: { jobId, email } },
      select: { id: true },
    });

    if (existing) {
      await prisma.application.update({ where: { id: existing.id }, data: baseData });
      result.updated += 1;
    } else {
      await prisma.application.create({ data: baseData });
      result.created += 1;
    }
  }
  return result;
}

async function seedMessageTemplates() {
  // Reuse existing seed script without duplicating template payloads here.
  await import('./seed-email-templates.js');
}

async function main() {
  console.log('Seeding test data for end-to-end integration...');

  const region = await ensureRegion();
  await ensureDocRequirements(region.id);

  const contractTemplate = await ensureContractTemplate(region.id);
  const job = await ensureJob(region.id, contractTemplate.id);
  const publicLink = await ensurePublicLink(job.id);
  await ensureAdmins();
  const questionnaire = await ensureQuestionnaire(region.id);
  const applications = await ensureStageApplications(job.id);
  await seedMessageTemplates();

  console.log('');
  console.log('Seed complete.');
  console.log(`Region: ${region.name} (${region.code})`);
  console.log(`Job: ${job.title} (id=${job.id})`);
  console.log(`Public link slug: ${publicLink.slug}`);
  console.log(`Questionnaire: ${questionnaire.title} (id=${questionnaire.id})`);
  console.log(`Applications: created=${applications.created}, updated=${applications.updated}`);
  console.log(`Admins ensured: ${TEST_ADMINS.length}`);
}

try {
  await main();
} catch (error) {
  console.error('seed-test-data failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
