import prisma from '../../lib/prisma.js';
import {
  createContractSchema,
  formatZodError,
  updateContractSchema,
} from './contract.schemas.js';

export class ContractServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ContractServiceError';
    this.statusCode = statusCode;
  }
}

export async function createContractTemplate(raw) {
  let data;
  try {
    data = createContractSchema.parse(raw);
  } catch (e) {
    throw new ContractServiceError(formatZodError(e), 400);
  }
  const city = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!city) {
    throw new ContractServiceError('City not found.', 404);
  }
  return prisma.contractTemplate.create({ data });
}

export async function updateContractTemplate(id, raw) {
  const templateId = Number(id);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    throw new ContractServiceError('Invalid contract template id.', 400);
  }
  let data;
  try {
    data = updateContractSchema.parse(raw);
  } catch (e) {
    throw new ContractServiceError(formatZodError(e), 400);
  }
  if (Object.keys(data).length === 0) {
    throw new ContractServiceError('No fields to update.', 400);
  }
  const existing = await prisma.contractTemplate.findUnique({ where: { id: templateId } });
  if (!existing) {
    throw new ContractServiceError('Contract template not found.', 404);
  }
  return prisma.contractTemplate.update({
    where: { id: templateId },
    data,
  });
}

export async function getContractTemplate(id) {
  const templateId = Number(id);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    throw new ContractServiceError('Invalid contract template id.', 400);
  }
  const template = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
    include: { city: true },
  });
  if (!template) {
    throw new ContractServiceError('Contract template not found.', 404);
  }
  return template;
}

export async function getContractTemplatesByCity(cityId) {
  const cid = Number(cityId);
  if (!Number.isInteger(cid) || cid <= 0) {
    throw new ContractServiceError('Invalid city id.', 400);
  }
  const city = await prisma.city.findUnique({ where: { id: cid } });
  if (!city) {
    throw new ContractServiceError('City not found.', 404);
  }
  return prisma.contractTemplate.findMany({
    where: { cityId: cid },
    orderBy: { name: 'asc' },
    include: { city: { select: { id: true, city: true, cityCode: true } } },
  });
}

export async function getAllContractTemplates() {
  return prisma.contractTemplate.findMany({
    orderBy: [{ cityId: 'asc' }, { name: 'asc' }],
    include: { city: { select: { id: true, city: true, cityCode: true } } },
  });
}

export async function deleteContractTemplate(id) {
  const templateId = Number(id);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    throw new ContractServiceError('Invalid contract template id.', 400);
  }
  const existing = await prisma.contractTemplate.findUnique({ where: { id: templateId } });
  if (!existing) {
    throw new ContractServiceError('Contract template not found.', 404);
  }
  const publishedRefs = await prisma.job.count({
    where: { contractTemplateId: templateId, isPublished: true },
  });
  if (publishedRefs > 0) {
    throw new ContractServiceError(
      'Cannot deactivate a template linked to published jobs. Unpublish those jobs first.',
      409
    );
  }
  return prisma.contractTemplate.update({
    where: { id: templateId },
    data: { isActive: false },
  });
}
