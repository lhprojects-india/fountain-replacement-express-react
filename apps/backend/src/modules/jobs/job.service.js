import crypto from 'node:crypto';
import prisma from '../../lib/prisma.js';
import {
  createJobSchema,
  createPublicLinkSchema,
  formatZodError,
  updateJobSchema,
} from './job.schemas.js';

export class JobServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'JobServiceError';
    this.statusCode = statusCode;
  }
}

const SLUG_LENGTH = 10;
const SLUG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function randomSlug() {
  const bytes = crypto.randomBytes(SLUG_LENGTH);
  let s = '';
  for (let i = 0; i < SLUG_LENGTH; i += 1) {
    s += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return s;
}

async function ensureUniqueSlug(tx) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const slug = randomSlug();
    const existing = await tx.jobPublicLink.findUnique({ where: { slug } });
    if (!existing) return slug;
  }
  throw new JobServiceError('Could not generate a unique link. Try again.', 500);
}

async function assertContractBelongsToCity(contractTemplateId, cityId) {
  if (contractTemplateId == null) return;
  const tpl = await prisma.contractTemplate.findFirst({
    where: { id: contractTemplateId, cityId },
  });
  if (!tpl) {
    throw new JobServiceError('Contract template must belong to the selected city.', 400);
  }
}

export async function createJob(raw) {
  let data;
  try {
    data = createJobSchema.parse(raw);
  } catch (e) {
    throw new JobServiceError(formatZodError(e), 400);
  }
  const city = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!city) {
    throw new JobServiceError('City not found.', 404);
  }
  await assertContractBelongsToCity(data.contractTemplateId, data.cityId);
  return prisma.job.create({
    data: {
      cityId: data.cityId,
      contractTemplateId: data.contractTemplateId ?? null,
      title: data.title,
      description: data.description ?? null,
      requirements: data.requirements ?? null,
      requiresOwnVehicle: data.requiresOwnVehicle ?? false,
      isPublished: false,
    },
  });
}

export async function updateJob(id, raw) {
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new JobServiceError('Invalid job id.', 400);
  }
  let data;
  try {
    data = updateJobSchema.parse(raw);
  } catch (e) {
    throw new JobServiceError(formatZodError(e), 400);
  }
  if (Object.keys(data).length === 0) {
    throw new JobServiceError('No fields to update.', 400);
  }
  const existing = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existing) {
    throw new JobServiceError('Job not found.', 404);
  }
  const cityId = data.cityId ?? existing.cityId;
  if (data.contractTemplateId !== undefined) {
    await assertContractBelongsToCity(data.contractTemplateId, cityId);
  } else if (data.cityId !== undefined && existing.contractTemplateId != null) {
    await assertContractBelongsToCity(existing.contractTemplateId, cityId);
  }
  return prisma.job.update({
    where: { id: jobId },
    data,
  });
}

const jobDetailInclude = {
  city: true,
  contractTemplate: true,
  publicLinks: { orderBy: { createdAt: 'desc' } },
  _count: { select: { applications: true } },
};

export async function getJob(id) {
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new JobServiceError('Invalid job id.', 400);
  }
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: jobDetailInclude,
  });
  if (!job) {
    throw new JobServiceError('Job not found.', 404);
  }
  return job;
}

export async function getAllJobs(filters = {}) {
  const where = {};
  if (filters.cityId != null && filters.cityId !== '') {
    const cid = Number(filters.cityId);
    if (Number.isInteger(cid) && cid > 0) where.cityId = cid;
  }
  if (filters.isPublished === 'true') where.isPublished = true;
  if (filters.isPublished === 'false') where.isPublished = false;

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      city: { select: { id: true, city: true, cityCode: true, country: true } },
      contractTemplate: { select: { id: true, name: true, type: true } },
      _count: { select: { applications: true } },
    },
  });
}

export async function publishJob(id) {
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new JobServiceError('Invalid job id.', 400);
  }
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { city: true },
  });
  if (!job) {
    throw new JobServiceError('Job not found.', 404);
  }
  if (!job.city.isActive) {
    throw new JobServiceError('Cannot publish a job for an inactive city.', 409);
  }
  if (job.closedAt) {
    throw new JobServiceError('Cannot publish a closed job. Reopen by clearing close date first.', 409);
  }
  return prisma.job.update({
    where: { id: jobId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  });
}

export async function unpublishJob(id) {
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new JobServiceError('Invalid job id.', 400);
  }
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new JobServiceError('Job not found.', 404);
  }
  return prisma.job.update({
    where: { id: jobId },
    data: {
      isPublished: false,
    },
  });
}

export async function closeJob(id) {
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new JobServiceError('Invalid job id.', 400);
  }
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new JobServiceError('Job not found.', 404);
  }
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.jobPublicLink.updateMany({
      where: { jobId, isActive: true },
      data: { isActive: false },
    });
    return tx.job.update({
      where: { id: jobId },
      data: {
        closedAt: now,
        isPublished: false,
      },
    });
  });
}

export async function deleteJob(id) {
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new JobServiceError('Invalid job id.', 400);
  }
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { _count: { select: { applications: true } } },
  });
  if (!job) {
    throw new JobServiceError('Job not found.', 404);
  }
  if (job._count.applications > 0) {
    throw new JobServiceError(
      'Cannot delete a job that has applications. Close the job instead.',
      409
    );
  }
  await prisma.job.delete({ where: { id: jobId } });
  return { id: jobId, deleted: true };
}

export async function createPublicLink(jobId, raw = {}) {
  const id = Number(jobId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new JobServiceError('Invalid job id.', 400);
  }
  let opts;
  try {
    opts = createPublicLinkSchema.parse(raw || {});
  } catch (e) {
    throw new JobServiceError(formatZodError(e), 400);
  }
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    throw new JobServiceError('Job not found.', 404);
  }
  return prisma.$transaction(async (tx) => {
    const slug = await ensureUniqueSlug(tx);
    return tx.jobPublicLink.create({
      data: {
        jobId: id,
        slug,
        isActive: true,
        expiresAt: opts.expiresAt ?? null,
      },
    });
  });
}

export async function deactivatePublicLink(linkId) {
  const lid = Number(linkId);
  if (!Number.isInteger(lid) || lid <= 0) {
    throw new JobServiceError('Invalid link id.', 400);
  }
  const link = await prisma.jobPublicLink.findUnique({ where: { id: lid } });
  if (!link) {
    throw new JobServiceError('Link not found.', 404);
  }
  return prisma.jobPublicLink.update({
    where: { id: lid },
    data: { isActive: false },
  });
}

export async function getAllPublicLinks(jobId) {
  const id = Number(jobId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new JobServiceError('Invalid job id.', 400);
  }
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    throw new JobServiceError('Job not found.', 404);
  }
  return prisma.jobPublicLink.findMany({
    where: { jobId: id },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Public apply flow: increment clicks, return safe job payload (no internal ids).
 */
export async function getJobByPublicLink(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new JobServiceError('Invalid link.', 404);
  }
  const normalized = slug.trim();
  if (!normalized) {
    throw new JobServiceError('Invalid link.', 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    const link = await tx.jobPublicLink.findUnique({
      where: { slug: normalized },
      include: {
        job: {
          include: { city: true },
        },
      },
    });
    if (!link || !link.job) {
      return null;
    }
    const now = new Date();
    if (!link.isActive) {
      return null;
    }
    if (link.expiresAt && link.expiresAt < now) {
      return null;
    }
    if (!link.job.isPublished || link.job.closedAt) {
      return null;
    }

    await tx.jobPublicLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    return link.job;
  });

  if (!result) {
    throw new JobServiceError('This apply link is not valid or has expired.', 404);
  }

  return {
    title: result.title,
    description: result.description,
    requirements: result.requirements,
    requiresOwnVehicle: result.requiresOwnVehicle,
    city: {
      city: result.city.city,
      cityCode: result.city.cityCode,
      country: result.city.country,
      currency: result.city.currency,
      currencySymbol: result.city.currencySymbol,
      timezone: result.city.timezone,
    },
  };
}
