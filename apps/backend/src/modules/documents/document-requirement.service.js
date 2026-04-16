import prisma from '../../lib/prisma.js';

export class DocumentRequirementServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'DocumentRequirementServiceError';
    this.statusCode = statusCode;
  }
}

const DEFAULT_REQUIREMENTS = [
  {
    code: 'selfie',
    name: 'Selfie Photo',
    fileTypes: 'image/jpeg,image/png',
    isRequired: true,
    maxSizeMb: 5,
    maxDurationSec: null,
    sortOrder: 1,
  },
  {
    code: 'driving_license',
    name: 'Driving License',
    fileTypes: 'image/jpeg,image/png,application/pdf',
    isRequired: true,
    maxSizeMb: 10,
    maxDurationSec: null,
    sortOrder: 2,
  },
  {
    code: 'vehicle_photo',
    name: 'Vehicle Photo',
    fileTypes: 'image/jpeg,image/png',
    isRequired: true,
    maxSizeMb: 10,
    maxDurationSec: null,
    sortOrder: 3,
  },
  {
    code: 'id_document',
    name: 'ID Document',
    fileTypes: 'image/jpeg,image/png,application/pdf',
    isRequired: true,
    maxSizeMb: 10,
    maxDurationSec: null,
    sortOrder: 4,
  },
  {
    code: 'vehicle_video',
    name: 'Vehicle Video',
    fileTypes: 'video/mp4,video/webm',
    isRequired: true,
    maxSizeMb: 100,
    maxDurationSec: 120,
    sortOrder: 5,
  },
];

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_');
}

async function ensureCity(cityId) {
  const id = Number(cityId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new DocumentRequirementServiceError('Invalid city id.', 400);
  }
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) {
    throw new DocumentRequirementServiceError('City not found.', 404);
  }
  return id;
}

export function getDefaultRequirements() {
  return DEFAULT_REQUIREMENTS.map((row) => ({ ...row }));
}

export async function getRequirementsByCity(cityId) {
  const id = await ensureCity(cityId);
  return prisma.documentRequirement.findMany({
    where: { cityId: id },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createRequirement(raw) {
  const cityId = await ensureCity(raw?.cityId ?? raw?.regionId);
  const code = normalizeCode(raw?.code || raw?.name);
  if (!code) {
    throw new DocumentRequirementServiceError('Code is required.', 400);
  }

  const existing = await prisma.documentRequirement.findUnique({
    where: { cityId_code: { cityId, code } },
  });
  if (existing) {
    throw new DocumentRequirementServiceError('Code must be unique per city.', 409);
  }

  return prisma.documentRequirement.create({
    data: {
      cityId,
      name: String(raw?.name || '').trim(),
      code,
      description: raw?.description?.trim() || null,
      fileTypes: String(raw?.fileTypes || '').trim(),
      isRequired: raw?.isRequired ?? true,
      maxSizeMb: Number(raw?.maxSizeMb) || 10,
      maxDurationSec: raw?.maxDurationSec != null ? Number(raw.maxDurationSec) : null,
      sortOrder: Number(raw?.sortOrder) || 0,
    },
  });
}

export async function updateRequirement(id, raw) {
  const reqId = Number(id);
  if (!Number.isInteger(reqId) || reqId <= 0) {
    throw new DocumentRequirementServiceError('Invalid requirement id.', 400);
  }
  const existing = await prisma.documentRequirement.findUnique({ where: { id: reqId } });
  if (!existing) {
    throw new DocumentRequirementServiceError('Requirement not found.', 404);
  }

  const nextCode = raw?.code != null ? normalizeCode(raw.code) : existing.code;
  if (nextCode !== existing.code) {
    const conflict = await prisma.documentRequirement.findUnique({
      where: { cityId_code: { cityId: existing.cityId, code: nextCode } },
    });
    if (conflict && conflict.id !== reqId) {
      throw new DocumentRequirementServiceError('Code must be unique per city.', 409);
    }
  }

  return prisma.documentRequirement.update({
    where: { id: reqId },
    data: {
      name: raw?.name != null ? String(raw.name).trim() : undefined,
      code: raw?.code != null ? nextCode : undefined,
      description: raw?.description != null ? raw.description?.trim() || null : undefined,
      fileTypes: raw?.fileTypes != null ? String(raw.fileTypes).trim() : undefined,
      isRequired: raw?.isRequired != null ? Boolean(raw.isRequired) : undefined,
      maxSizeMb: raw?.maxSizeMb != null ? Number(raw.maxSizeMb) : undefined,
      maxDurationSec: raw?.maxDurationSec != null ? Number(raw.maxDurationSec) : undefined,
      sortOrder: raw?.sortOrder != null ? Number(raw.sortOrder) : undefined,
    },
  });
}

export async function deleteRequirement(id) {
  const reqId = Number(id);
  if (!Number.isInteger(reqId) || reqId <= 0) {
    throw new DocumentRequirementServiceError('Invalid requirement id.', 400);
  }
  const requirement = await prisma.documentRequirement.findUnique({ where: { id: reqId } });
  if (!requirement) {
    throw new DocumentRequirementServiceError('Requirement not found.', 404);
  }

  const linkedSubmissions = await prisma.documentSubmission.count({
    where: {
      requirementCode: requirement.code,
      application: {
        job: {
          cityId: requirement.cityId,
        },
      },
    },
  });

  if (linkedSubmissions > 0) {
    throw new DocumentRequirementServiceError(
      'Cannot delete requirement with existing submissions for this city.',
      409
    );
  }

  await prisma.documentRequirement.delete({ where: { id: reqId } });
  return { id: reqId, deleted: true };
}

export async function seedDefaultRequirements(cityId) {
  const id = await ensureCity(cityId);
  const defaults = getDefaultRequirements();

  const existing = await prisma.documentRequirement.findMany({
    where: { cityId: id },
    select: { code: true },
  });
  const existingSet = new Set(existing.map((r) => r.code));
  const toCreate = defaults.filter((row) => !existingSet.has(row.code));

  if (!toCreate.length) {
    return { created: 0, total: existing.length };
  }

  await prisma.documentRequirement.createMany({
    data: toCreate.map((row) => ({
      cityId: id,
      ...row,
    })),
  });

  const total = await prisma.documentRequirement.count({ where: { cityId: id } });
  return { created: toCreate.length, total };
}
