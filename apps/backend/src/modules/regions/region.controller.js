import { RegionServiceError } from './region.service.js';
import * as regionService from './region.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof RegionServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Region controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function listRegions(req, res) {
  try {
    const regions = await regionService.getAllRegions();
    return res.status(200).json({ success: true, regions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRegionById(req, res) {
  try {
    const region = await regionService.getRegion(req.params.id);
    return res.status(200).json({ success: true, region });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createRegionHandler(req, res) {
  try {
    const region = await regionService.createRegion(req.validatedBody || req.body);
    return res.status(201).json({ success: true, region });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateRegionHandler(req, res) {
  try {
    const region = await regionService.updateRegion(req.params.id, req.validatedBody || req.body);
    return res.status(200).json({ success: true, region });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteRegionHandler(req, res) {
  try {
    const region = await regionService.deleteRegion(req.params.id);
    return res.status(200).json({ success: true, region });
  } catch (error) {
    return handleError(res, error);
  }
}
