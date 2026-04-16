import {
  createQuestionnaire,
  deleteQuestionnaire,
  getQuestionnaire,
  getQuestionnaireForApplication,
  getQuestionnaireResult,
  getQuestionnaires,
  QuestionnaireServiceError,
  submitQuestionnaireResponse,
  updateQuestionnaire,
} from './questionnaire.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof QuestionnaireServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Questionnaire controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function listQuestionnairesHandler(req, res) {
  try {
    const questionnaires = await getQuestionnaires({ cityId: req.query.cityId ?? req.query.regionId, active: req.query.active });
    return res.status(200).json({ success: true, questionnaires });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getQuestionnaireHandler(req, res) {
  try {
    const questionnaire = await getQuestionnaire(req.params.id);
    return res.status(200).json({ success: true, questionnaire });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createQuestionnaireHandler(req, res) {
  try {
    const questionnaire = await createQuestionnaire(req.validatedBody || req.body || {});
    return res.status(201).json({ success: true, questionnaire });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateQuestionnaireHandler(req, res) {
  try {
    const questionnaire = await updateQuestionnaire(req.params.id, req.validatedBody || req.body || {});
    return res.status(200).json({ success: true, questionnaire });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteQuestionnaireHandler(req, res) {
  try {
    const result = await deleteQuestionnaire(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDriverQuestionnaireHandler(req, res) {
  try {
    if (req.user?.role !== 'driver' || !req.user?.applicationId) {
      return res.status(403).json({ success: false, message: 'Driver access required.' });
    }
    const result = await getQuestionnaireForApplication(req.user.applicationId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function submitDriverQuestionnaireHandler(req, res) {
  try {
    if (req.user?.role !== 'driver' || !req.user?.applicationId) {
      return res.status(403).json({ success: false, message: 'Driver access required.' });
    }
    const result = await submitQuestionnaireResponse(
      req.user.applicationId,
      (req.validatedBody || req.body)?.questionnaireId,
      (req.validatedBody || req.body)?.answers || {}
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDriverQuestionnaireResultHandler(req, res) {
  try {
    if (req.user?.role !== 'driver' || !req.user?.applicationId) {
      return res.status(403).json({ success: false, message: 'Driver access required.' });
    }
    const result = await getQuestionnaireResult(req.user.applicationId);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return handleError(res, error);
  }
}
