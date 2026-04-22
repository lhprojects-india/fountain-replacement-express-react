import { ContractServiceError } from './contract.service.js';
import * as contractService from './contract.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof ContractServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Contract controller error', error });
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

export async function createAndLinkDropboxTemplateHandler(req, res) {
  try {
    const result = await contractService.createAndLinkDropboxTemplate(
      req.params.id,
      req.body,
      req.file
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDropboxTemplateEditUrlHandler(req, res) {
  try {
    const result = await contractService.getDropboxTemplateEditUrlForContract(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
