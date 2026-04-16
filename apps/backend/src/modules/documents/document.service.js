import prisma from '../../lib/prisma.js';
import { STAGES } from '../workflow/transition-matrix.js';
import { transitionApplication } from '../workflow/stage-engine.js';
import { dispatchNotifications } from '../communications/notification.service.js';
import { deleteFile, generateDownloadUrl, generateUploadUrl } from './storage.service.js';

export class DocumentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'DocumentServiceError';
    this.statusCode = statusCode;
  }
}

function toId(raw, label) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new DocumentServiceError(`Invalid ${label}.`, 400);
  }
  return value;
}

function normalizeMime(mime) {
  return String(mime || '').trim().toLowerCase();
}

function toSafeDownloadFileName(fileName) {
  const cleaned = String(fileName || '')
    .replace(/[\r\n"]/g, '')
    .replace(/[^\w.\-() ]/g, '_')
    .trim();
  return cleaned || 'document';
}

function toSafeResponseContentType(rawMime) {
  const mime = normalizeMime(rawMime);
  const isValidMime = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(mime);
  return isValidMime ? mime : 'application/octet-stream';
}

function sanitizePathPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
}

function buildStorageKey(applicationId, requirementCode, fileName) {
  const safeName = sanitizePathPart(fileName) || 'file';
  const timestamp = Date.now();
  return `applications/${applicationId}/${requirementCode}/${timestamp}_${safeName}`;
}

async function getApplicationForDriver(applicationId, email) {
  return prisma.application.findFirst({
    where: {
      id: toId(applicationId, 'application id'),
      email: String(email || '').trim().toLowerCase(),
    },
    include: {
      job: { select: { cityId: true } },
    },
  });
}

async function getApplicationById(applicationId) {
  return prisma.application.findUnique({
    where: { id: toId(applicationId, 'application id') },
    include: {
      job: { select: { cityId: true } },
    },
  });
}

function parseAllowedFileTypes(fileTypes) {
  return String(fileTypes || '')
    .split(',')
    .map((type) => normalizeMime(type))
    .filter(Boolean);
}

function getLatestByRequirement(submissions = []) {
  const sorted = [...submissions].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const latestByCode = new Map();
  for (const submission of sorted) {
    if (!latestByCode.has(submission.requirementCode)) {
      latestByCode.set(submission.requirementCode, submission);
    }
  }
  return latestByCode;
}

function safeParseReviewerNotes(reviewerNotes) {
  if (!reviewerNotes) return { notes: '', checklist: [] };
  try {
    const parsed = JSON.parse(reviewerNotes);
    if (parsed && typeof parsed === 'object') {
      const notes = typeof parsed.notes === 'string' ? parsed.notes : '';
      const checklist = Array.isArray(parsed.checklist)
        ? parsed.checklist
          .filter((item) => item && typeof item === 'object')
          .map((item) => ({
            item: String(item.item || '').trim(),
            passed: Boolean(item.passed),
          }))
          .filter((item) => item.item)
        : [];
      return { notes, checklist };
    }
  } catch {
    return { notes: String(reviewerNotes || ''), checklist: [] };
  }
  return { notes: '', checklist: [] };
}

function serializeReviewerNotes(notes = '', checklist = []) {
  return JSON.stringify({
    notes: String(notes || '').trim(),
    checklist: Array.isArray(checklist)
      ? checklist
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          item: String(item.item || '').trim(),
          passed: Boolean(item.passed),
        }))
        .filter((item) => item.item)
      : [],
  });
}

function normalizeChecklistPayload(checklist) {
  if (!Array.isArray(checklist)) return [];
  return checklist
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      item: String(item.item || '').trim(),
      passed: Boolean(item.passed),
    }))
    .filter((item) => item.item);
}

function isVideoRequirement(requirement) {
  const allowedTypes = parseAllowedFileTypes(requirement?.fileTypes);
  return allowedTypes.some((type) => type.startsWith('video/'));
}

async function getRequirementByCode(cityId, requirementCode) {
  return prisma.documentRequirement.findUnique({
    where: {
      cityId_code: {
        cityId,
        code: String(requirementCode || '').trim(),
      },
    },
  });
}

async function loadAppAndRequirement(applicationId, requirementCode, email, isAdmin = false) {
  const application = isAdmin
    ? await getApplicationById(applicationId)
    : await getApplicationForDriver(applicationId, email);

  if (!application) {
    throw new DocumentServiceError('Application not found.', 404);
  }

  const requirement = await getRequirementByCode(application.job.cityId, requirementCode);
  if (!requirement) {
    throw new DocumentServiceError('Document requirement not found for this application.', 404);
  }

  return { application, requirement };
}

export async function requestUploadUrl(
  applicationId,
  requirementCode,
  fileName,
  fileType,
  fileSizeBytes,
  requestorEmail
) {
  const code = String(requirementCode || '').trim();
  const mimeType = normalizeMime(fileType);
  const sizeBytes = Number(fileSizeBytes);
  const cleanFileName = String(fileName || '').trim();

  if (!code || !cleanFileName || !mimeType || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new DocumentServiceError('requirementCode, fileName, fileType and fileSizeBytes are required.', 400);
  }

  const { application, requirement } = await loadAppAndRequirement(
    applicationId,
    code,
    requestorEmail,
    false
  );

  if (application.currentStage !== STAGES.DOCUMENTS_PENDING) {
    throw new DocumentServiceError('Uploads are only allowed in documents pending stage.', 400);
  }

  let allowedTypes = parseAllowedFileTypes(requirement.fileTypes);
  if (isVideoRequirement(requirement)) {
    const videoTypes = ['video/mp4', 'video/webm'];
    allowedTypes = [...new Set([...allowedTypes, ...videoTypes])];
  }
  if (allowedTypes.length && !allowedTypes.includes(mimeType)) {
    throw new DocumentServiceError('File type is not allowed for this document requirement.', 400);
  }

  const maxSizeBytes = requirement.maxSizeMb * 1024 * 1024;
  if (sizeBytes > maxSizeBytes) {
    throw new DocumentServiceError(`File exceeds maximum size of ${requirement.maxSizeMb}MB.`, 400);
  }

  const key = buildStorageKey(application.id, requirement.code, cleanFileName);
  const expiresInSeconds = isVideoRequirement(requirement) ? 30 * 60 : 15 * 60;
  const { uploadUrl, expiresAt } = await generateUploadUrl(key, mimeType, { expiresInSeconds });

  const submission = await prisma.documentSubmission.create({
    data: {
      applicationId: application.id,
      requirementCode: requirement.code,
      fileName: cleanFileName,
      fileUrl: key,
      fileType: mimeType,
      fileSizeBytes: sizeBytes,
      status: 'uploading',
      uploadedAt: new Date(),
    },
  });

  return {
    uploadUrl,
    documentId: submission.id,
    key,
    expiresAt,
  };
}

export async function requestReuploadUrl(
  documentId,
  applicationId,
  requestorEmail,
  fileName,
  fileType,
  fileSizeBytes
) {
  const targetDocumentId = toId(documentId, 'document id');
  const appId = toId(applicationId, 'application id');
  const email = String(requestorEmail || '').trim().toLowerCase();
  const cleanFileName = String(fileName || '').trim();
  const mimeType = normalizeMime(fileType);
  const sizeBytes = Number(fileSizeBytes);

  if (!cleanFileName || !mimeType || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new DocumentServiceError('fileName, fileType and fileSizeBytes are required.', 400);
  }

  const existing = await prisma.documentSubmission.findFirst({
    where: {
      id: targetDocumentId,
      applicationId: appId,
      application: { email },
    },
    include: {
      application: {
        include: {
          job: { select: { cityId: true } },
        },
      },
    },
  });
  if (!existing) {
    throw new DocumentServiceError('Document submission not found.', 404);
  }
  if (existing.status !== 'rejected') {
    throw new DocumentServiceError('Only rejected documents can be re-uploaded.', 400);
  }
  if (existing.application.currentStage !== STAGES.DOCUMENTS_UNDER_REVIEW) {
    throw new DocumentServiceError('Re-upload is only available while documents are under review.', 400);
  }

  const requirement = await getRequirementByCode(existing.application.job.cityId, existing.requirementCode);
  if (!requirement) {
    throw new DocumentServiceError('Document requirement not found for this application.', 404);
  }

  let allowedTypes = parseAllowedFileTypes(requirement.fileTypes);
  if (isVideoRequirement(requirement)) {
    allowedTypes = [...new Set([...allowedTypes, 'video/mp4', 'video/webm'])];
  }
  if (allowedTypes.length && !allowedTypes.includes(mimeType)) {
    throw new DocumentServiceError('File type is not allowed for this document requirement.', 400);
  }
  const maxSizeBytes = requirement.maxSizeMb * 1024 * 1024;
  if (sizeBytes > maxSizeBytes) {
    throw new DocumentServiceError(`File exceeds maximum size of ${requirement.maxSizeMb}MB.`, 400);
  }

  const key = buildStorageKey(existing.applicationId, existing.requirementCode, cleanFileName);
  const expiresInSeconds = isVideoRequirement(requirement) ? 30 * 60 : 15 * 60;
  const { uploadUrl, expiresAt } = await generateUploadUrl(key, mimeType, { expiresInSeconds });

  const submission = await prisma.documentSubmission.create({
    data: {
      applicationId: existing.applicationId,
      requirementCode: existing.requirementCode,
      fileName: cleanFileName,
      fileUrl: key,
      fileType: mimeType,
      fileSizeBytes: sizeBytes,
      status: 'uploading',
      uploadedAt: new Date(),
    },
  });

  return {
    uploadUrl,
    documentId: submission.id,
    key,
    expiresAt,
  };
}

export async function confirmUpload(documentId, applicationId, requestorEmail, durationSec = null) {
  const id = toId(documentId, 'document id');
  const appId = toId(applicationId, 'application id');
  const email = String(requestorEmail || '').trim().toLowerCase();

  const submission = await prisma.documentSubmission.findFirst({
    where: {
      id,
      applicationId: appId,
      application: { email },
    },
    include: {
      application: {
        include: {
          job: { select: { cityId: true } },
        },
      },
    },
  });

  if (!submission) {
    throw new DocumentServiceError('Document submission not found.', 404);
  }

  const requirement = await getRequirementByCode(submission.application.job.cityId, submission.requirementCode);
  if (!requirement) {
    throw new DocumentServiceError('Document requirement not found for this application.', 404);
  }

  let normalizedDurationSec = null;
  if (durationSec != null && durationSec !== '') {
    const parsedDuration = Number(durationSec);
    if (!Number.isFinite(parsedDuration) || parsedDuration < 0) {
      throw new DocumentServiceError('durationSec must be a positive number.', 400);
    }
    normalizedDurationSec = Math.round(parsedDuration);
  }

  if (requirement.maxDurationSec != null) {
    if (normalizedDurationSec == null) {
      throw new DocumentServiceError('durationSec is required for this document.', 400);
    }
    if (normalizedDurationSec > requirement.maxDurationSec) {
      throw new DocumentServiceError(
        `Video duration exceeds maximum of ${requirement.maxDurationSec} seconds.`,
        400
      );
    }
  }

  return prisma.documentSubmission.update({
    where: { id: submission.id },
    data: { status: 'pending', durationSec: normalizedDurationSec },
  });
}

export async function getDocumentsByApplication(applicationId, requestorEmail = null, isAdmin = false) {
  const appId = toId(applicationId, 'application id');
  const email = String(requestorEmail || '').trim().toLowerCase();

  const application = isAdmin
    ? await getApplicationById(appId)
    : await getApplicationForDriver(appId, email);

  if (!application) {
    throw new DocumentServiceError('Application not found.', 404);
  }

  const [requirements, submissions] = await Promise.all([
    prisma.documentRequirement.findMany({
      where: { cityId: application.job.cityId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    prisma.documentSubmission.findMany({
      where: { applicationId: appId },
      orderBy: { uploadedAt: 'desc' },
    }),
  ]);

  const checklistRows = await prisma.verificationChecklist.findMany({
    where: { requirementCode: { in: requirements.map((row) => row.code) } },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  const checklistByCode = checklistRows.reduce((acc, row) => {
    if (!acc[row.requirementCode]) acc[row.requirementCode] = [];
    acc[row.requirementCode].push({ item: row.checkItem, sortOrder: row.sortOrder });
    return acc;
  }, {});

  const grouped = requirements.map((requirement) => {
    const requirementSubmissions = submissions
      .filter((row) => row.requirementCode === requirement.code)
      .map((row) => {
        const parsedNotes = safeParseReviewerNotes(row.reviewerNotes);
        return {
          ...row,
          reviewerNotes: parsedNotes.notes || null,
          checklistResults: parsedNotes.checklist,
        };
      });
    return {
      requirementCode: requirement.code,
      requirementName: requirement.name,
      requirementDescription: requirement.description,
      isRequired: requirement.isRequired,
      fileTypes: requirement.fileTypes,
      maxSizeMb: requirement.maxSizeMb,
      maxDurationSec: requirement.maxDurationSec,
      checklist: checklistByCode[requirement.code] || [],
      submissions: requirementSubmissions,
    };
  });

  return {
    applicationId: appId,
    currentStage: application.currentStage,
    documents: grouped,
  };
}

export async function getDocumentDownloadUrl(
  documentId,
  requestorEmail,
  { isAdmin = false, applicationId = null } = {}
) {
  const id = toId(documentId, 'document id');
  const email = String(requestorEmail || '').trim().toLowerCase();

  const submission = await prisma.documentSubmission.findUnique({
    where: { id },
    include: {
      application: {
        select: { id: true, email: true },
      },
    },
  });

  if (!submission) {
    throw new DocumentServiceError('Document submission not found.', 404);
  }

  if (!isAdmin) {
    if (!email || submission.application.email !== email) {
      throw new DocumentServiceError('Access denied.', 403);
    }
    if (applicationId != null && toId(applicationId, 'application id') !== submission.applicationId) {
      throw new DocumentServiceError('Access denied.', 403);
    }
  }

  const expiresInSeconds = isAdmin ? 15 * 60 : 5 * 60;
  const { downloadUrl, expiresAt } = await generateDownloadUrl(submission.fileUrl, {
    expiresInSeconds,
    fileName: toSafeDownloadFileName(submission.fileName),
    contentType: toSafeResponseContentType(submission.fileType),
  });
  await logDocumentAccess(
    submission.id,
    email || (isAdmin ? String(requestorEmail || '') : ''),
    isAdmin ? 'viewed' : 'downloaded'
  );
  return { downloadUrl, expiresAt };
}

export async function logDocumentAccess(documentId, accessorEmail, action) {
  const id = toId(documentId, 'document id');
  await prisma.communicationLog.create({
    data: {
      applicationId: null,
      channel: 'system_document',
      templateEventKey: `document.${String(action || 'viewed').toLowerCase()}`,
      recipientEmail: String(accessorEmail || '').trim().toLowerCase() || null,
      subject: `Document ${action || 'viewed'}`,
      body: `documentId=${id}`,
      status: 'sent',
      sentAt: new Date(),
    },
  });
}

export async function deleteDocument(documentId, applicationId, requestorEmail) {
  const id = toId(documentId, 'document id');
  const appId = toId(applicationId, 'application id');
  const email = String(requestorEmail || '').trim().toLowerCase();

  const submission = await prisma.documentSubmission.findFirst({
    where: {
      id,
      applicationId: appId,
      application: { email },
    },
  });

  if (!submission) {
    throw new DocumentServiceError('Document submission not found.', 404);
  }

  if (['approved', 'rejected'].includes(submission.status)) {
    throw new DocumentServiceError('Reviewed documents cannot be deleted.', 400);
  }

  await deleteFile(submission.fileUrl);
  await prisma.documentSubmission.delete({ where: { id: submission.id } });
  return { id: submission.id, deleted: true };
}

export async function checkDocumentCompleteness(applicationId, requestorEmail = null, isAdmin = false) {
  const appId = toId(applicationId, 'application id');
  const email = String(requestorEmail || '').trim().toLowerCase();

  const application = isAdmin
    ? await getApplicationById(appId)
    : await getApplicationForDriver(appId, email);

  if (!application) {
    throw new DocumentServiceError('Application not found.', 404);
  }

  const [requirements, submissions] = await Promise.all([
    prisma.documentRequirement.findMany({
      where: { cityId: application.job.cityId, isRequired: true },
      select: { code: true, name: true },
    }),
    prisma.documentSubmission.findMany({
      where: { applicationId: appId },
      select: { requirementCode: true, status: true },
    }),
  ]);

  const byRequirement = new Map();
  for (const submission of submissions) {
    if (!byRequirement.has(submission.requirementCode)) {
      byRequirement.set(submission.requirementCode, []);
    }
    byRequirement.get(submission.requirementCode).push(submission.status);
  }

  const submittedStatuses = new Set(['uploading', 'pending', 'approved']);
  const approvedStatuses = new Set(['approved']);

  const missing = requirements
    .filter((req) => {
      const statuses = byRequirement.get(req.code) || [];
      return !statuses.some((status) => submittedStatuses.has(status));
    })
    .map((req) => ({ code: req.code, name: req.name }));

  const submitted = requirements.filter((req) => {
    const statuses = byRequirement.get(req.code) || [];
    return statuses.some((status) => submittedStatuses.has(status));
  }).length;

  const approved = requirements.filter((req) => {
    const statuses = byRequirement.get(req.code) || [];
    return statuses.some((status) => approvedStatuses.has(status));
  }).length;

  return {
    complete: missing.length === 0,
    totalRequired: requirements.length,
    submitted,
    approved,
    missing,
  };
}

export async function getDocumentSummary(applicationId, requestorEmail = null, isAdmin = false) {
  const completeness = await checkDocumentCompleteness(applicationId, requestorEmail, isAdmin);
  const appId = toId(applicationId, 'application id');
  const submissions = await prisma.documentSubmission.findMany({
    where: { applicationId: appId },
    select: { status: true, requirementCode: true, uploadedAt: true },
    orderBy: { uploadedAt: 'desc' },
  });
  const latestByCode = getLatestByRequirement(submissions);
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const latest of latestByCode.values()) {
    if (latest.status === 'pending') pending += 1;
    if (latest.status === 'approved') approved += 1;
    if (latest.status === 'rejected') rejected += 1;
  }
  return {
    totalRequired: completeness.totalRequired,
    uploaded: completeness.submitted,
    pending,
    approved,
    rejected,
    missing: completeness.missing.map((m) => m.code),
  };
}

export async function cleanupOrphanedUploads() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stale = await prisma.documentSubmission.findMany({
    where: {
      status: 'uploading',
      uploadedAt: { lt: cutoff },
    },
    select: { id: true, fileUrl: true },
  });
  let deleted = 0;
  for (const row of stale) {
    try {
      await deleteFile(row.fileUrl);
    } catch {
      // Best effort cleanup for objects that might not exist.
    }
    await prisma.documentSubmission.delete({ where: { id: row.id } });
    deleted += 1;
  }
  return { scanned: stale.length, deleted };
}

export async function submitDocumentsForReview(applicationId, requestorEmail) {
  const appId = toId(applicationId, 'application id');
  const email = String(requestorEmail || '').trim().toLowerCase();
  const application = await getApplicationForDriver(appId, email);
  if (!application) {
    throw new DocumentServiceError('Application not found.', 404);
  }
  if (application.currentStage !== STAGES.DOCUMENTS_PENDING) {
    throw new DocumentServiceError('Application is not in documents pending stage.', 400);
  }

  const [requiredRequirements, submissions] = await Promise.all([
    prisma.documentRequirement.findMany({
      where: { cityId: application.job.cityId, isRequired: true },
      select: { code: true, name: true },
    }),
    prisma.documentSubmission.findMany({
      where: { applicationId: appId },
      orderBy: { uploadedAt: 'desc' },
    }),
  ]);

  const latestByCode = getLatestByRequirement(submissions);
  const missing = requiredRequirements
    .filter((req) => {
      const latest = latestByCode.get(req.code);
      return !latest || latest.status === 'uploading';
    })
    .map((req) => ({ code: req.code, name: req.name }));

  if (missing.length > 0) {
    return { submitted: false, missing };
  }

  await transitionApplication(
    appId,
    STAGES.DOCUMENTS_UNDER_REVIEW,
    {
      actorEmail: email,
      actorType: 'driver',
      reason: 'documents_submitted_for_review',
      metadata: { source: 'driver_documents_page' },
    },
    prisma
  );

  return { submitted: true, missing: [] };
}

export async function reviewDocument(documentId, applicationId, reviewerEmail, status, notes = '', checklist = []) {
  const id = toId(documentId, 'document id');
  const appId = toId(applicationId, 'application id');
  const reviewer = String(reviewerEmail || '').trim().toLowerCase();
  const normalizedStatus = String(status || '').trim().toLowerCase();
  if (!['approved', 'rejected'].includes(normalizedStatus)) {
    throw new DocumentServiceError('status must be approved or rejected.', 400);
  }
  if (normalizedStatus === 'rejected' && !String(notes || '').trim()) {
    throw new DocumentServiceError('Rejection notes are required.', 400);
  }
  const normalizedChecklist = normalizeChecklistPayload(checklist);

  const submission = await prisma.documentSubmission.findFirst({
    where: { id, applicationId: appId },
    include: {
      application: {
        include: {
          job: { select: { cityId: true } },
        },
      },
    },
  });
  if (!submission) {
    throw new DocumentServiceError('Document submission not found.', 404);
  }
  if (submission.application.currentStage !== STAGES.DOCUMENTS_UNDER_REVIEW) {
    throw new DocumentServiceError('Documents can only be reviewed in documents under review stage.', 400);
  }
  if (submission.status === 'approved') {
    throw new DocumentServiceError('Approved documents are locked.', 400);
  }

  const updated = await prisma.documentSubmission.update({
    where: { id: submission.id },
    data: {
      status: normalizedStatus,
      reviewerEmail: reviewer || null,
      reviewerNotes: serializeReviewerNotes(notes, normalizedChecklist),
      reviewedAt: new Date(),
    },
  });
  await prisma.documentReviewAudit.create({
    data: {
      documentSubmissionId: submission.id,
      applicationId: appId,
      reviewerEmail: reviewer || null,
      status: normalizedStatus,
      notes: String(notes || '').trim() || null,
      checklistResults: normalizedChecklist,
    },
  });

  if (normalizedStatus === 'rejected') {
    void dispatchNotifications('stage.documents_pending', submission.application, {
      rejectionNotes: String(notes || '').trim(),
      rejectedRequirementCode: submission.requirementCode,
      dashboardUrl: `${process.env.DRIVER_DASHBOARD_URL || process.env.APP_BASE_URL || ''}/documents`,
    }).catch(() => {});
  }

  const [requiredRequirements, allSubmissions] = await Promise.all([
    prisma.documentRequirement.findMany({
      where: { cityId: submission.application.job.cityId, isRequired: true },
      select: { code: true },
    }),
    prisma.documentSubmission.findMany({
      where: { applicationId: appId },
      orderBy: { uploadedAt: 'desc' },
    }),
  ]);

  const latestByCode = getLatestByRequirement(allSubmissions);
  const latestRequired = requiredRequirements.map((req) => latestByCode.get(req.code)).filter(Boolean);
  const allReviewed = latestRequired.length === requiredRequirements.length
    && latestRequired.every((doc) => ['approved', 'rejected'].includes(doc.status));
  const allApproved = allReviewed && latestRequired.every((doc) => doc.status === 'approved');

  if (allApproved && submission.application.currentStage === STAGES.DOCUMENTS_UNDER_REVIEW) {
    await transitionApplication(
      appId,
      STAGES.PAYMENT_DETAILS_PENDING,
      {
        actorEmail: null,
        actorType: 'system',
        reason: 'documents_all_approved',
        metadata: {
          source: 'admin_document_review',
          reviewedBy: reviewer || null,
        },
      },
      prisma
    );
  }

  return {
    document: {
      ...updated,
      reviewerNotes: safeParseReviewerNotes(updated.reviewerNotes).notes || null,
      checklistResults: safeParseReviewerNotes(updated.reviewerNotes).checklist,
    },
    allReviewed,
    allApproved,
  };
}

export async function reviewAllDocuments(applicationId, reviewerEmail, decisions = []) {
  const appId = toId(applicationId, 'application id');
  if (!Array.isArray(decisions) || decisions.length === 0) {
    throw new DocumentServiceError('decisions must be a non-empty array.', 400);
  }

  const results = [];
  for (const decision of decisions) {
    const result = await reviewDocument(
      decision?.documentId,
      appId,
      reviewerEmail,
      decision?.status,
      decision?.notes || '',
      decision?.checklist || []
    );
    results.push(result);
  }
  return { reviewed: results.length, results };
}

export async function getDocumentReviewContext(documentId, applicationId) {
  const id = toId(documentId, 'document id');
  const appId = toId(applicationId, 'application id');

  const submission = await prisma.documentSubmission.findFirst({
    where: { id, applicationId: appId },
    include: {
      application: {
        include: {
          job: {
            include: {
              city: { select: { id: true, city: true, cityCode: true } },
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new DocumentServiceError('Document submission not found.', 404);
  }

  const [requirement, checklist, allVersions, reviewHistory] = await Promise.all([
    getRequirementByCode(submission.application.job.cityId, submission.requirementCode),
    prisma.verificationChecklist.findMany({
      where: { requirementCode: submission.requirementCode },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.documentSubmission.findMany({
      where: {
        applicationId: appId,
        requirementCode: submission.requirementCode,
      },
      orderBy: { uploadedAt: 'desc' },
    }),
    prisma.documentReviewAudit.findMany({
      where: { documentSubmissionId: submission.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const parsedCurrentNotes = safeParseReviewerNotes(submission.reviewerNotes);
  const previousVersions = allVersions
    .filter((row) => row.id !== submission.id)
    .map((row) => {
      const parsedNotes = safeParseReviewerNotes(row.reviewerNotes);
      return {
        ...row,
        reviewerNotes: parsedNotes.notes || null,
        checklistResults: parsedNotes.checklist,
      };
    });

  return {
    document: {
      ...submission,
      reviewerNotes: parsedCurrentNotes.notes || null,
      checklistResults: parsedCurrentNotes.checklist,
    },
    applicantInfo: {
      firstName: submission.application.firstName,
      lastName: submission.application.lastName,
      address: [submission.application.addressLine1, submission.application.addressLine2]
        .filter(Boolean)
        .join(', '),
      city: submission.application.city || null,
      vehicleType: submission.application.vehicleType || null,
    },
    requirement: requirement
      ? {
        code: requirement.code,
        name: requirement.name,
        description: requirement.description,
        checklist: checklist.map((row) => ({ item: row.checkItem, sortOrder: row.sortOrder })),
      }
      : {
        code: submission.requirementCode,
        name: submission.requirementCode,
        description: null,
        checklist: [],
      },
    previousVersions,
    reviewHistory: reviewHistory.map((row) => ({
      id: row.id,
      status: row.status,
      reviewerEmail: row.reviewerEmail,
      notes: row.notes,
      checklistResults: Array.isArray(row.checklistResults) ? row.checklistResults : [],
      createdAt: row.createdAt,
    })),
  };
}
