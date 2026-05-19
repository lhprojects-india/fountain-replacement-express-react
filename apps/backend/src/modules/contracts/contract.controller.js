import { ContractServiceError } from './contract.service.js';
import * as contractService from './contract.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof ContractServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({
    msg: 'Contract controller error',
    error: error?.message || String(error),
    stack: error?.stack,
  });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function listContractTemplates(req, res) {
  try {
    const templates = await contractService.getAllContractTemplates();
    return res.status(200).json({ success: true, templates });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listByCity(req, res) {
  try {
    const templates = await contractService.getContractTemplatesByCity(req.params.cityId);
    return res.status(200).json({ success: true, templates });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getContractTemplateById(req, res) {
  try {
    const template = await contractService.getContractTemplate(req.params.id);
    return res.status(200).json({ success: true, template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createContractTemplateHandler(req, res) {
  try {
    const template = await contractService.createContractTemplate(req.validatedBody || req.body);
    return res.status(201).json({ success: true, template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateContractTemplateHandler(req, res) {
  try {
    const template = await contractService.updateContractTemplate(
      req.params.id,
      req.validatedBody || req.body
    );
    return res.status(200).json({ success: true, template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteContractTemplateHandler(req, res) {
  try {
    const template = await contractService.deleteContractTemplate(req.params.id);
    return res.status(200).json({ success: true, template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function linkDocusealTemplateHandler(req, res) {
  try {
    const result = await contractService.linkDocusealTemplate(
      req.params.id,
      req.validatedBody || req.body
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function unlinkDocusealTemplateHandler(req, res) {
  try {
    const result = await contractService.unlinkDocusealTemplate(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAvailableDocusealTemplatesHandler(req, res) {
  try {
    const templates = await contractService.listAvailableDocusealTemplates({
      q: req.query.q,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    return res.status(200).json({ success: true, templates });
  } catch (error) {
    return handleError(res, error);
  }
}
