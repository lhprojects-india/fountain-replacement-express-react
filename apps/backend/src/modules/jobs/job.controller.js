import { JobServiceError } from './job.service.js';
import * as jobService from './job.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof JobServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Job controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function listJobs(req, res) {
  try {
    const jobs = await jobService.getAllJobs({
      cityId: req.query.cityId ?? req.query.regionId,
      isPublished: req.query.isPublished,
    });
    return res.status(200).json({ success: true, jobs });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getJobById(req, res) {
  try {
    const job = await jobService.getJob(req.params.id);
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createJobHandler(req, res) {
  try {
    const job = await jobService.createJob(req.validatedBody || req.body);
    return res.status(201).json({ success: true, job });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateJobHandler(req, res) {
  try {
    const job = await jobService.updateJob(req.params.id, req.validatedBody || req.body);
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function publishJobHandler(req, res) {
  try {
    const job = await jobService.publishJob(req.params.id);
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function unpublishJobHandler(req, res) {
  try {
    const job = await jobService.unpublishJob(req.params.id);
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function closeJobHandler(req, res) {
  try {
    const job = await jobService.closeJob(req.params.id);
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteJobHandler(req, res) {
  try {
    const result = await jobService.deleteJob(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createLinkHandler(req, res) {
  try {
    const link = await jobService.createPublicLink(req.params.id, req.validatedBody || req.body);
    return res.status(201).json({ success: true, link });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listLinksHandler(req, res) {
  try {
    const links = await jobService.getAllPublicLinks(req.params.id);
    return res.status(200).json({ success: true, links });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deactivateLinkHandler(req, res) {
  try {
    const link = await jobService.deactivatePublicLink(req.params.linkId);
    return res.status(200).json({ success: true, link });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPublicJobBySlug(req, res) {
  try {
    const job = await jobService.getJobByPublicLink(req.params.slug);
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return handleError(res, error);
  }
}
