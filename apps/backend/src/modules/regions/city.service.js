import prisma from '../../lib/prisma.js';
import { createCitySchema, formatZodError, updateCitySchema } from './city.schemas.js';
import { seedDefaultRequirements } from '../documents/document-requirement.service.js';

export class CityServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'CityServiceError';
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

export async function createCity(raw) {
  let data;
  try {
    data = createCitySchema.parse(raw);
  } catch (e) {
    throw new CityServiceError(formatZodError(e), 400);
  }
  try {
    const presetKey = String(data.paymentPreset || data.cityCode || '').toUpperCase();
    const paymentFieldsSchema =
      data.paymentFieldsSchema ||
      PAYMENT_PRESETS[presetKey] ||
      null;
    const city = await prisma.city.create({
      data: {
        city: data.city,
        cityCode: data.cityCode,
        country: data.country,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        timezone: data.timezone,
        paymentFieldsSchema,
        isActive: data.isActive,
      },
    });

    if (data.seedDocumentDefaults) {
      await seedDefaultRequirements(city.id);
    }

    return city;
  } catch (e) {
    if (e.code === 'P2002') {
      throw new CityServiceError('A city with this name or city code already exists.', 409);
    }
    throw e;
  }
}

export async function updateCity(id, raw) {
  const cityId = Number(id);
  if (!Number.isInteger(cityId) || cityId <= 0) {
    throw new CityServiceError('Invalid city id.', 400);
  }
  let data;
  try {
    data = updateCitySchema.parse(raw);
  } catch (e) {
    throw new CityServiceError(formatZodError(e), 400);
  }
  if (Object.keys(data).length === 0) {
    throw new CityServiceError('No fields to update.', 400);
  }
  const existing = await prisma.city.findUnique({ where: { id: cityId } });
  if (!existing) {
    throw new CityServiceError('City not found.', 404);
  }
  try {
    return await prisma.city.update({
      where: { id: cityId },
      data,
    });
  } catch (e) {
    if (e.code === 'P2002') {
      throw new CityServiceError('A city with this name or city code already exists.', 409);
    }
    throw e;
  }
}

export async function getCity(id) {
  const cityId = Number(id);
  if (!Number.isInteger(cityId) || cityId <= 0) {
    throw new CityServiceError('Invalid city id.', 400);
  }
  const city = await prisma.city.findUnique({
    where: { id: cityId },
    include: {
      contractTemplates: { orderBy: { name: 'asc' } },
      _count: { select: { jobs: true, contractTemplates: true } },
    },
  });
  if (!city) {
    throw new CityServiceError('City not found.', 404);
  }
  return city;
}

export async function getAllCities() {
  return prisma.city.findMany({
    orderBy: { city: 'asc' },
    include: {
      contractTemplates: { orderBy: { name: 'asc' } },
      _count: { select: { jobs: true, contractTemplates: true } },
    },
  });
}

export async function deleteCity(id) {
  const cityId = Number(id);
  if (!Number.isInteger(cityId) || cityId <= 0) {
    throw new CityServiceError('Invalid city id.', 400);
  }
  const existing = await prisma.city.findUnique({ where: { id: cityId } });
  if (!existing) {
    throw new CityServiceError('City not found.', 404);
  }
  const publishedJobs = await prisma.job.count({
    where: { cityId: cityId, isPublished: true },
  });
  if (publishedJobs > 0) {
    throw new CityServiceError(
      'Cannot deactivate a city that has published jobs. Unpublish jobs first.',
      409
    );
  }
  return prisma.city.update({
    where: { id: cityId },
    data: { isActive: false },
  });
}

export async function getCityByCode(code) {
  if (!code || typeof code !== 'string') {
    throw new CityServiceError('City code is required.', 400);
  }
  const normalized = code.trim().toUpperCase();
  const city = await prisma.city.findUnique({
    where: { cityCode: normalized },
    include: {
      contractTemplates: { orderBy: { name: 'asc' } },
      _count: { select: { jobs: true, contractTemplates: true } },
    },
  });
  if (!city) {
    throw new CityServiceError('City not found.', 404);
  }
  return city;
}
