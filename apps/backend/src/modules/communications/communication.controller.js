import {
  CommunicationServiceError,
  createTemplate,
  deleteTemplate,
  getCommunicationsByApplication,
  getTemplate,
  getTemplates,
  getCommunicationStats,
  previewTemplate,
  retryCommunicationLog,
  sendTemplateTest,
  updateTemplate,
} from './communication.service.js';
import { getNotificationMatrix } from './notification.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof CommunicationServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Communication controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function listTemplates(req, res) {
  try {
    const templates = await getTemplates(req.query || {});
    return res.status(200).json({ success: true, templates });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTemplateById(req, res) {
  try {
    const template = await getTemplate(req.params.id);
    return res.status(200).json({ success: true, template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createTemplateHandler(req, res) {
  try {
    const template = await createTemplate(req.validatedBody || req.body || {});
    return res.status(201).json({ success: true, template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateTemplateHandler(req, res) {
  try {
    const template = await updateTemplate(req.params.id, req.validatedBody || req.body || {});
    return res.status(200).json({ success: true, template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteTemplateHandler(req, res) {
  try {
    const template = await deleteTemplate(req.params.id);
    return res.status(200).json({ success: true, template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function previewTemplateHandler(req, res) {
  try {
    const body = req.validatedBody || req.body || {};
    const preview = await previewTemplate(req.params.id, body.variables || body);
    return res.status(200).json({ success: true, ...preview });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCommunicationLogHandler(req, res) {
  try {
    const logs = await getCommunicationsByApplication(req.params.applicationId);
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCommunicationStatsHandler(req, res) {
  try {
    const stats = await getCommunicationStats(req.query?.dateFrom, req.query?.dateTo);
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function testSendTemplateHandler(req, res) {
  try {
    const body = req.validatedBody || req.body || {};
    const result = await sendTemplateTest(
      req.params.id,
      body.recipient,
      body.variables || {}
    );
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function retryCommunicationLogHandler(req, res) {
  try {
    const result = await retryCommunicationLog(req.params.logId);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getNotificationMatrixHandler(req, res) {
  try {
    const matrix = await getNotificationMatrix();
    return res.status(200).json({ success: true, matrix });
  } catch (error) {
    return handleError(res, error);
  }
}
