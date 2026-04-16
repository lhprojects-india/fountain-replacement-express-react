import {
  getApplicationFeeStructure,
  getApplicationRegionConfig as getApplicationCityConfig,
  completeScreening,
  DriverApplicationServiceError,
  getDriverApplication,
  resendDriverContract,
  getScreeningProgress,
  getStageConfig,
  submitVehicleCheck,
  updateApplicationProfile,
  withdrawApplication,
} from './driver-application.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof DriverApplicationServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Driver application controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

function assertDriverUser(req, res) {
  if (req.user?.role !== 'driver') {
    res.status(403).json({ success: false, message: 'Driver access required.' });
    return false;
  }
  if (!req.user?.applicationId) {
    res.status(401).json({ success: false, message: 'Invalid driver session.' });
    return false;
  }
  return true;
}

export async function getDriverApplicationHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const application = await getDriverApplication(req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, application });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDriverApplicationTimelineHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const application = await getDriverApplication(req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, timeline: application.timeline });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDriverApplicationStageInfoHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const application = await getDriverApplication(req.user.applicationId, req.user.email);
    return res.status(200).json({
      success: true,
      currentStage: application.currentStage,
      stageInfo: getStageConfig(application.currentStage),
      availableActions: application.availableActions,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function withdrawDriverApplicationHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await withdrawApplication(
      req.user.applicationId,
      req.user.email,
      (req.validatedBody || req.body)?.reason
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getScreeningProgressHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const screening = await getScreeningProgress(req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, screening });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function completeScreeningHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await completeScreening(req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function vehicleCheckHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await submitVehicleCheck(
      req.user.applicationId,
      req.user.email,
      req.validatedBody || req.body || {}
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateApplicationProfileHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const application = await updateApplicationProfile(
      req.user.applicationId,
      req.user.email,
      req.validatedBody || req.body || {}
    );
    return res.status(200).json({ success: true, application });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationFeeStructureHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await getApplicationFeeStructure(req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationCityConfigHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await getApplicationCityConfig(req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendDriverContractHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await resendDriverContract(req.user.applicationId, req.user.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
