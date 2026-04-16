import {
  checkDocumentCompleteness,
  confirmUpload,
  deleteDocument,
  DocumentServiceError,
  getDocumentReviewContext,
  getDocumentDownloadUrl,
  getDocumentSummary,
  getDocumentsByApplication,
  requestReuploadUrl,
  requestUploadUrl,
  reviewAllDocuments,
  reviewDocument,
  submitDocumentsForReview,
} from './document.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof DocumentServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Document controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

function assertDriverUser(req, res) {
  if (req.user?.role !== 'driver' || !req.user?.applicationId || !req.user?.email) {
    res.status(403).json({ success: false, message: 'Driver access required.' });
    return false;
  }
  return true;
}

export async function requestUploadUrlHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const { requirementCode, fileName, fileType, fileSizeBytes } = req.validatedBody || req.body || {};
    const result = await requestUploadUrl(
      req.user.applicationId,
      requirementCode,
      fileName,
      fileType,
      fileSizeBytes,
      req.user.email
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function confirmUploadHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const body = req.validatedBody || req.body || {};
    const result = await confirmUpload(
      body?.documentId,
      req.user.applicationId,
      req.user.email,
      body?.durationSec
    );
    return res.status(200).json({ success: true, document: result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listOwnDocumentsHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await getDocumentsByApplication(req.user.applicationId, req.user.email, false);
    const completeness = await checkDocumentCompleteness(req.user.applicationId, req.user.email, false);
    return res.status(200).json({ success: true, ...result, completeness });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteOwnDocumentHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await deleteDocument(req.params.id, req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getOwnDocumentDownloadUrlHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await getDocumentDownloadUrl(req.params.id, req.user.email, {
      isAdmin: false,
      applicationId: req.user.applicationId,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function submitDocumentsHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await submitDocumentsForReview(req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reuploadDocumentHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const { fileName, fileType, fileSizeBytes } = req.validatedBody || req.body || {};
    const result = await requestReuploadUrl(
      req.params.id,
      req.user.applicationId,
      req.user.email,
      fileName,
      fileType,
      fileSizeBytes
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listApplicationDocumentsHandler(req, res) {
  try {
    const result = await getDocumentsByApplication(req.params.id, req.user?.email, true);
    const completeness = await checkDocumentCompleteness(req.params.id, req.user?.email, true);
    return res.status(200).json({ success: true, ...result, completeness });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationDocumentSummaryHandler(req, res) {
  try {
    const summary = await getDocumentSummary(req.params.id, req.user?.email, true);
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationDocumentDownloadUrlHandler(req, res) {
  try {
    const result = await getDocumentDownloadUrl(req.params.docId, req.user?.email, { isAdmin: true });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reviewDocumentHandler(req, res) {
  try {
    const body = req.validatedBody || req.body || {};
    const result = await reviewDocument(
      req.params.docId,
      req.params.id,
      req.user?.email,
      body?.status,
      body?.notes,
      body?.checklist
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationDocumentContextHandler(req, res) {
  try {
    const result = await getDocumentReviewContext(req.params.docId, req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reviewAllDocumentsHandler(req, res) {
  try {
    const result = await reviewAllDocuments(
      req.params.id,
      req.user?.email,
      (req.validatedBody || req.body)?.decisions || []
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
