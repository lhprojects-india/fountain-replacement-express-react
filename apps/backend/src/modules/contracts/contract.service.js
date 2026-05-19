import prisma from '../../lib/prisma.js';
import {
  createContractSchema,
  formatZodError,
  linkDocusealTemplateSchema,
  updateContractSchema,
} from './contract.schemas.js';
import {
  buildTemplateEditUrl,
  getTemplate as getDocusealTemplate,
  hasClientConfig as hasDocusealConfig,
  listTemplates as listDocusealTemplates,
} from '../integrations/docuseal/docuseal.client.js';

export class ContractServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ContractServiceError';
    this.statusCode = statusCode;
  }
}

function decorateTemplate(template) {
  if (!template) return template;
  return {
    ...template,
    docusealEditUrl: template.docusealTemplateId
      ? buildTemplateEditUrl(template.docusealTemplateId)
      : null,
  };
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
  return decorateTemplate(await prisma.contractTemplate.create({ data }));
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
  if (!existing.isActive) {
    throw new ContractServiceError('Contract template is inactive.', 409);
  }
  return decorateTemplate(
    await prisma.contractTemplate.update({
      where: { id: templateId },
      data,
    })
  );
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
  return decorateTemplate(template);
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
  const templates = await prisma.contractTemplate.findMany({
    where: { cityId: cid },
    orderBy: { name: 'asc' },
    include: { city: { select: { id: true, city: true, cityCode: true } } },
  });
  return templates.map(decorateTemplate);
}

export async function getAllContractTemplates() {
  const templates = await prisma.contractTemplate.findMany({
    orderBy: [{ cityId: 'asc' }, { name: 'asc' }],
    include: { city: { select: { id: true, city: true, cityCode: true } } },
  });
  return templates.map(decorateTemplate);
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
  return decorateTemplate(
    await prisma.contractTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    })
  );
}

/**
 * Link a Docuseal template id (already created in the Docuseal admin UI) to a
 * local contract template. Optionally validates the id by fetching the
 * template metadata from Docuseal.
 */
export async function linkDocusealTemplate(id, raw) {
  const templateId = Number(id);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    throw new ContractServiceError('Invalid contract template id.', 400);
  }
  const existing = await prisma.contractTemplate.findUnique({ where: { id: templateId } });
  if (!existing) {
    throw new ContractServiceError('Contract template not found.', 404);
  }
  if (!existing.isActive) {
    throw new ContractServiceError('Contract template is inactive.', 409);
  }

  let data;
  try {
    data = linkDocusealTemplateSchema.parse(raw);
  } catch (e) {
    throw new ContractServiceError(formatZodError(e), 400);
  }

  let providerTemplate = null;
  if (hasDocusealConfig()) {
    try {
      providerTemplate = await getDocusealTemplate(data.docusealTemplateId);
    } catch (error) {
      const status = error?.statusCode || 502;
      throw new ContractServiceError(
        error?.message || 'Could not verify Docuseal template.',
        status === 404 ? 404 : 502
      );
    }
  }

  const updated = await prisma.contractTemplate.update({
    where: { id: templateId },
    data: { docusealTemplateId: data.docusealTemplateId },
  });

  return {
    template: decorateTemplate(updated),
    docusealTemplate: providerTemplate
      ? {
          id: providerTemplate.id,
          name: providerTemplate.name,
          slug: providerTemplate.slug,
          updatedAt: providerTemplate.updated_at,
        }
      : null,
  };
}

export async function unlinkDocusealTemplate(id) {
  const templateId = Number(id);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    throw new ContractServiceError('Invalid contract template id.', 400);
  }
  const existing = await prisma.contractTemplate.findUnique({ where: { id: templateId } });
  if (!existing) {
    throw new ContractServiceError('Contract template not found.', 404);
  }
  if (!existing.docusealTemplateId) {
    throw new ContractServiceError('No Docuseal template linked to this contract template.', 400);
  }
  const updated = await prisma.contractTemplate.update({
    where: { id: templateId },
    data: { docusealTemplateId: null },
  });
  return { template: decorateTemplate(updated) };
}

/**
 * Proxy /templates listing so admins can pick a Docuseal template without
 * jumping to the Docuseal UI.
 */
export async function listAvailableDocusealTemplates(query) {
  if (!hasDocusealConfig()) {
    throw new ContractServiceError(
      'Docuseal is not configured. Set DOCUSEAL_BASE_URL and DOCUSEAL_API_KEY.',
      500
    );
  }
  try {
    const list = await listDocusealTemplates({ q: query?.q, limit: query?.limit });
    const items = Array.isArray(list) ? list : list?.data || list?.templates || [];
    return items.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      folderName: t.folder_name || null,
      updatedAt: t.updated_at,
      createdAt: t.created_at,
      editUrl: buildTemplateEditUrl(t.id),
    }));
  } catch (error) {
    throw new ContractServiceError(error?.message || 'Docuseal template list failed.', 502);
  }
}
