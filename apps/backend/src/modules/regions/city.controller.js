import { CityServiceError } from './city.service.js';
import * as cityService from './city.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof CityServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'City controller error', error: error?.message || String(error), stack: error?.stack });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function listCities(req, res) {
  try {
    const cities = await cityService.getAllCities();
    return res.status(200).json({ success: true, cities });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCityById(req, res) {
  try {
    const city = await cityService.getCity(req.params.id);
    return res.status(200).json({ success: true, city });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createCityHandler(req, res) {
  try {
    const city = await cityService.createCity(req.validatedBody || req.body);
    return res.status(201).json({ success: true, city });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCityHandler(req, res) {
  try {
    const city = await cityService.updateCity(req.params.id, req.validatedBody || req.body);
    return res.status(200).json({ success: true, city });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteCityHandler(req, res) {
  try {
    const city = await cityService.deleteCity(req.params.id);
    return res.status(200).json({ success: true, city });
  } catch (error) {
    return handleError(res, error);
  }
}
