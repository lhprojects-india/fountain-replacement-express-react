import { z } from 'zod';
import { VEHICLE_TYPES } from './application.schemas.js';

const optionalShortText = z.string().trim().min(1).max(1000).optional();

const vehicleTypeEnum = z.enum([
  VEHICLE_TYPES[0],
  VEHICLE_TYPES[1],
  VEHICLE_TYPES[2],
  VEHICLE_TYPES[3],
]);

export const withdrawApplicationSchema = z.object({
  reason: optionalShortText,
});

export const completeScreeningSchema = z.object({}).strict();

export const vehicleCheckSchema = z
  .object({
    hasOwnVehicle: z.boolean(),
    vehicleType: vehicleTypeEnum.optional(),
  })
  .refine((d) => !d.hasOwnVehicle || Boolean(d.vehicleType), {
    message: 'vehicleType is required when hasOwnVehicle is true',
    path: ['vehicleType'],
  });

export const resendContractSchema = z.object({}).strict();

export const updateApplicationProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().min(6).max(50).optional(),
    vehicleType: vehicleTypeEnum.optional(),
    vehicleDetails: z.string().trim().max(2000).optional().nullable(),
    addressLine1: z.string().trim().max(500).optional().nullable(),
    addressLine2: z.string().trim().max(500).optional().nullable(),
    city: z.string().trim().max(200).optional().nullable(),
    postcode: z.string().trim().max(50).optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one profile field is required.',
  });
