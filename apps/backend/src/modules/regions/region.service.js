import prisma from '../../lib/prisma.js';
import { createRegionSchema, formatZodError, updateRegionSchema } from './region.schemas.js';
import { seedDefaultRequirements } from '../documents/document-requirement.service.js';

export class RegionServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'RegionServiceError';
    this.statusCode = statusCode;
  }
}

export const PAYMENT_PRESETS = {
  UK: {
    fields: [
      { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
      { key: 'account_number', label: 'Account Number', type: 'text', required: true },
      { key: 'sort_code', label: 'Sort Code', type: 'text', required: true },
    ],
  },
  EU: {
    fields: [
      { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
      { key: 'iban', label: 'IBAN', type: 'text', required: true },
      { key: 'bic', label: 'BIC/SWIFT', type: 'text', required: true },
    ],
  },
  US: {
    fields: [
      { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
      { key: 'account_number', label: 'Account Number', type: 'text', required: true },
      { key: 'routing_number', label: 'Routing Number', type: 'text', required: true },
    ],
  },
};

export async function createRegion(raw) {
  let data;
  try {
    data = createRegionSchema.parse(raw);
  } catch (e) {
    throw new RegionServiceError(formatZodError(e), 400);
  }
  try {
    const presetKey = String(data.paymentPreset || data.code || '').toUpperCase();
    const paymentFieldsSchema =
      data.paymentFieldsSchema ||
      PAYMENT_PRESETS[presetKey] ||
      null;
    const region = await prisma.region.create({
      data: {
        name: data.name,
        code: data.code,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        timezone: data.timezone,
        paymentFieldsSchema,
        isActive: data.isActive,
      },
    });

    if (data.seedDocumentDefaults) {
      await seedDefaultRequirements(region.id);
    }

    return region;
  } catch (e) {
    if (e.code === 'P2002') {
      throw new RegionServiceError('A region with this name or code already exists.', 409);
    }
    throw e;
  }
}

export async function updateRegion(id, raw) {
  const regionId = Number(id);
  if (!Number.isInteger(regionId) || regionId <= 0) {
    throw new RegionServiceError('Invalid region id.', 400);
  }
  let data;
  try {
    data = updateRegionSchema.parse(raw);
  } catch (e) {
    throw new RegionServiceError(formatZodError(e), 400);
  }
  if (Object.keys(data).length === 0) {
    throw new RegionServiceError('No fields to update.', 400);
  }
  const existing = await prisma.region.findUnique({ where: { id: regionId } });
  if (!existing) {
    throw new RegionServiceError('Region not found.', 404);
  }
  try {
    return await prisma.region.update({
      where: { id: regionId },
      data,
    });
  } catch (e) {
    if (e.code === 'P2002') {
      throw new RegionServiceError('A region with this name or code already exists.', 409);
    }
    throw e;
  }
}

export async function getRegion(id) {
  const regionId = Number(id);
  if (!Number.isInteger(regionId) || regionId <= 0) {
    throw new RegionServiceError('Invalid region id.', 400);
  }
  const region = await prisma.region.findUnique({
    where: { id: regionId },
    include: {
      contractTemplates: { orderBy: { name: 'asc' } },
      _count: { select: { jobs: true, contractTemplates: true } },
    },
  });
  if (!region) {
    throw new RegionServiceError('Region not found.', 404);
  }
  return region;
}

export async function getAllRegions() {
  return prisma.region.findMany({
    orderBy: { name: 'asc' },
    include: {
      contractTemplates: { orderBy: { name: 'asc' } },
      _count: { select: { jobs: true, contractTemplates: true } },
    },
  });
}

export async function deleteRegion(id) {
  const regionId = Number(id);
  if (!Number.isInteger(regionId) || regionId <= 0) {
    throw new RegionServiceError('Invalid region id.', 400);
  }
  const existing = await prisma.region.findUnique({ where: { id: regionId } });
  if (!existing) {
    throw new RegionServiceError('Region not found.', 404);
  }
  const publishedJobs = await prisma.job.count({
    where: { regionId: regionId, isPublished: true },
  });
  if (publishedJobs > 0) {
    throw new RegionServiceError(
      'Cannot deactivate a region that has published jobs. Unpublish jobs first.',
      409
    );
  }
  return prisma.region.update({
    where: { id: regionId },
    data: { isActive: false },
  });
}

export async function getRegionByCode(code) {
  if (!code || typeof code !== 'string') {
    throw new RegionServiceError('Region code is required.', 400);
  }
  const normalized = code.trim().toUpperCase();
  const region = await prisma.region.findUnique({
    where: { code: normalized },
    include: {
      contractTemplates: { orderBy: { name: 'asc' } },
      _count: { select: { jobs: true, contractTemplates: true } },
    },
  });
  if (!region) {
    throw new RegionServiceError('Region not found.', 404);
  }
  return region;
}
