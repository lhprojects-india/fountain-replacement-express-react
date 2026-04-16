import express from 'express';
import { cacheMiddleware } from '../../api/middleware/cache.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import logger from '../../lib/logger.js';
import {
  getAverageStageDuration,
  getApplicationsOverTime,
  getJobPerformance,
  getPipelineFunnel,
  getCityBreakdown,
} from './analytics.service.js';

const router = express.Router();

function getFilters(query = {}) {
  return {
    cityId: query.cityId,
    jobId: query.jobId,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
}

router.get('/funnel', cacheMiddleware('analytics', 120), asyncHandler(async (req, res) => {
  try {
    const result = await getPipelineFunnel(getFilters(req.query));
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error({ msg: 'Analytics funnel error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

router.get('/stage-duration', cacheMiddleware('analytics', 120), asyncHandler(async (req, res) => {
  try {
    const durations = await getAverageStageDuration(getFilters(req.query));
    return res.status(200).json({ success: true, durations });
  } catch (error) {
    logger.error({ msg: 'Analytics stage duration error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

router.get('/volume', cacheMiddleware('analytics', 120), asyncHandler(async (req, res) => {
  try {
    const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'week';
    const result = await getApplicationsOverTime(period, getFilters(req.query));
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error({ msg: 'Analytics volume error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

router.get('/cities', cacheMiddleware('analytics', 120), asyncHandler(async (req, res) => {
  try {
    const cities = await getCityBreakdown(getFilters(req.query));
    return res.status(200).json({ success: true, cities });
  } catch (error) {
    logger.error({ msg: 'Analytics cities error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

router.get('/jobs', cacheMiddleware('analytics', 120), asyncHandler(async (req, res) => {
  try {
    const jobs = await getJobPerformance(getFilters(req.query));
    return res.status(200).json({ success: true, jobs });
  } catch (error) {
    logger.error({ msg: 'Analytics jobs error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

export default router;
