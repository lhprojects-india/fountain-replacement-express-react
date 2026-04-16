import { ApplicationServiceError } from './application.service.js';
import * as applicationService from './application.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof ApplicationServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Application controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function submitApplicationHandler(req, res) {
  try {
    const result = await applicationService.submitApplication(req.validatedBody || req.body);
    return res.status(201).json({
      success: true,
      application: result.application,
      jobTitle: result.jobTitle,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationHandler(req, res) {
  try {
    const application = await applicationService.getApplicationDetail(req.params.id);
    return res.status(200).json({ success: true, application });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAllApplicationsHandler(req, res) {
  try {
    const result = await applicationService.getAllApplications({
      page: req.query.page,
      pageSize: req.query.pageSize,
      stage: req.query.stage,
      stages: req.query.stages,
      cityId: req.query.cityId ?? req.query.regionId,
      cityIds: req.query.cityIds ?? req.query.regionIds,
      jobId: req.query.jobId,
      jobIds: req.query.jobIds,
      vehicleTypes: req.query.vehicleTypes,
      search: req.query.search,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      stageEnteredFrom: req.query.stageEnteredFrom,
      stageEnteredTo: req.query.stageEnteredTo,
      hasDocuments: req.query.hasDocuments,
      contractStatus: req.query.contractStatus,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationsByStageHandler(req, res) {
  try {
    const result = await applicationService.getApplicationsByStage({
      stage: req.query.stage,
      stages: req.query.stages,
      cityId: req.query.cityId ?? req.query.regionId,
      cityIds: req.query.cityIds ?? req.query.regionIds,
      jobId: req.query.jobId,
      jobIds: req.query.jobIds,
      vehicleTypes: req.query.vehicleTypes,
      search: req.query.search,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      stageEnteredFrom: req.query.stageEnteredFrom,
      stageEnteredTo: req.query.stageEnteredTo,
      hasDocuments: req.query.hasDocuments,
      contractStatus: req.query.contractStatus,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function exportApplicationsHandler(req, res) {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();
    const result = await applicationService.exportApplications(
      {
        stage: req.query.stage,
        stages: req.query.stages,
        cityId: req.query.cityId ?? req.query.regionId,
        cityIds: req.query.cityIds ?? req.query.regionIds,
        jobId: req.query.jobId,
        jobIds: req.query.jobIds,
        vehicleTypes: req.query.vehicleTypes,
        search: req.query.search,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        stageEnteredFrom: req.query.stageEnteredFrom,
        stageEnteredTo: req.query.stageEnteredTo,
        hasDocuments: req.query.hasDocuments,
        contractStatus: req.query.contractStatus,
      },
      format
    );

    if (format === 'csv') {
      const stamp = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="applications-${stamp}.csv"`);
      return res.status(200).send(result.csv);
    }

    return res.status(400).json({ success: false, message: 'Unsupported export format.' });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRecentActivityHandler(req, res) {
  try {
    const result = await applicationService.getRecentActivity(
      req.query.limit,
      req.query.offset,
      {
        cityId: req.query.cityId ?? req.query.regionId,
        actorEmail: req.query.actorEmail,
      }
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function quickSearchApplicationsHandler(req, res) {
  try {
    const q = req.query.q || '';
    const limit = req.query.limit;
    const applications = await applicationService.quickSearchApplications(q, limit);
    return res.status(200).json({ success: true, applications });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationStatsHandler(req, res) {
  try {
    const stats = await applicationService.getApplicationStats();
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateApplicationNotesHandler(req, res) {
  try {
    const updated = await applicationService.updateApplicationNotes(
      req.params.id,
      (req.validatedBody || req.body)?.notes,
      req.user?.email
    );
    return res.status(200).json({ success: true, application: updated });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationNotesHandler(req, res) {
  try {
    const notes = await applicationService.getApplicationNotes(req.params.id);
    return res.status(200).json({ success: true, notes });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addApplicationNoteHandler(req, res) {
  try {
    const note = await applicationService.addApplicationNote(
      req.params.id,
      (req.validatedBody || req.body)?.content,
      req.user?.email
    );
    return res.status(201).json({ success: true, note });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function sendApplicationContractHandler(req, res) {
  try {
    const result = await applicationService.sendApplicationContract(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationContractStatusHandler(req, res) {
  try {
    const result = await applicationService.getApplicationContractStatus(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendApplicationContractHandler(req, res) {
  try {
    const result = await applicationService.resendApplicationContract(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function cancelApplicationContractHandler(req, res) {
  try {
    const result = await applicationService.cancelApplicationContract(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markApplicationContractSignedHandler(req, res) {
  try {
    const result = await applicationService.markApplicationContractSigned(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
