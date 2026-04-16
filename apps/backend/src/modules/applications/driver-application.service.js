import prisma from '../../lib/prisma.js';
import { PRODUCT_DISPLAY_NAME } from '../../lib/product-name.js';
import { STAGES } from '../workflow/transition-matrix.js';
import { transitionApplication, WorkflowError } from '../workflow/stage-engine.js';
import { resendContract } from '../integrations/dropbox-sign/contract.service.js';

export class DriverApplicationServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'DriverApplicationServiceError';
    this.statusCode = statusCode;
  }
}

const STAGE_CONFIG = {
  [STAGES.APPLIED]: {
    label: 'Applied',
    description: 'Your application has been submitted.',
    driverActionRequired: false,
  },
  [STAGES.PENDING_REVIEW]: {
    label: 'Under Review',
    description: "Your application is under review. We'll update you soon.",
    driverActionRequired: false,
  },
  [STAGES.SCREENING]: {
    label: 'Screening',
    description: 'Complete your personal details and screening steps.',
    driverActionRequired: true,
    driverActionLabel: 'Begin Screening',
    driverActionRoute: '/screening',
  },
  [STAGES.ACKNOWLEDGEMENTS]: {
    label: 'Screening Complete - Under Review',
    description:
      "Your screening has been submitted. Our team is reviewing your responses. You'll be notified about next steps.",
    driverActionRequired: false,
  },
  [STAGES.CONTRACT_SENT]: {
    label: 'Contract Sent',
    description: 'A contract has been sent to your email for signature.',
    driverActionRequired: false,
  },
  [STAGES.CONTRACT_SIGNED]: {
    label: 'Contract Signed',
    description: 'Contract signed successfully. Preparing your next step.',
    driverActionRequired: false,
  },
  [STAGES.DOCUMENTS_PENDING]: {
    label: 'Documents Required',
    description: 'Upload your required documents to continue.',
    driverActionRequired: true,
    driverActionLabel: 'Upload Documents',
    driverActionRoute: '/documents',
  },
  [STAGES.DOCUMENTS_UNDER_REVIEW]: {
    label: 'Documents Under Review',
    description: 'Your uploaded documents are currently being reviewed.',
    driverActionRequired: false,
  },
  [STAGES.PAYMENT_DETAILS_PENDING]: {
    label: 'Payment Details Required',
    description: 'Submit your payment details to continue.',
    driverActionRequired: true,
    driverActionLabel: 'Submit Payment Details',
    driverActionRoute: '/payment',
  },
  [STAGES.ONBOARDING_CALL]: {
    label: 'Onboarding Call',
    description: 'An onboarding call will be scheduled soon.',
    driverActionRequired: false,
  },
  [STAGES.QUESTIONNAIRE]: {
    label: 'Assessment',
    description: 'Complete the questionnaire to proceed.',
    driverActionRequired: true,
    driverActionLabel: 'Take Assessment',
    driverActionRoute: '/questionnaire',
  },
  [STAGES.DECISION_PENDING]: {
    label: 'Final Review',
    description: 'Final review is in progress.',
    driverActionRequired: false,
  },
  [STAGES.APPROVED]: {
    label: 'Approved',
    description: 'Congratulations! You have been approved.',
    driverActionRequired: false,
  },
  [STAGES.FIRST_BLOCK_ASSIGNED]: {
    label: 'First Block Scheduled',
    description: 'Your first block date is set. Check your dashboard for details.',
    driverActionRequired: false,
  },
  [STAGES.ACTIVE]: {
    label: 'Active Driver',
    description: `You are an active ${PRODUCT_DISPLAY_NAME} driver.`,
    driverActionRequired: false,
  },
  [STAGES.REJECTED]: {
    label: 'Rejected',
    description: 'Unfortunately, your application was not successful.',
    driverActionRequired: false,
  },
  [STAGES.WITHDRAWN]: {
    label: 'Withdrawn',
    description: 'You have withdrawn your application.',
    driverActionRequired: false,
  },
  [STAGES.FIRST_BLOCK_FAILED]: {
    label: 'First Block Failed',
    description: 'The first block was not successful.',
    driverActionRequired: false,
  },
};

const REQUIRED_SCREENING_STEPS = [
  'confirm_details',
  'vehicle_check',
  'introduction',
  'about',
  'role',
  'availability',
  'facility_locations',
  'blocks_classification',
  'fee_structure',
  'payment_cycle_schedule',
  'routes_policy',
  'cancellation_policy',
  'smoking_fitness_check',
  'liabilities',
];

const SCREENING_STEP_LABELS = {
  confirm_details: 'Personal Details',
  vehicle_check: 'Vehicle Check',
  introduction: 'Introduction',
  about: 'Company Overview',
  role: 'Role Understanding',
  availability: 'Availability',
  facility_locations: 'Facility Locations',
  blocks_classification: 'Blocks Classification',
  fee_structure: 'Fee Structure',
  payment_cycle_schedule: 'Payment Cycle',
  routes_policy: 'Route Policy',
  cancellation_policy: 'Cancellation Policy',
  smoking_fitness_check: 'Health & Fitness Check',
  liabilities: 'Liabilities',
};

const PROFILE_APPLICATION_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'vehicleType',
  'addressLine1',
  'addressLine2',
  'city',
  'postcode',
  'country',
];

export function getStageConfig(stage) {
  return (
    STAGE_CONFIG[stage] || {
      label: 'In Progress',
      description: 'Your application is progressing.',
      driverActionRequired: false,
    }
  );
}

export async function getDriverApplication(applicationId, rawEmail) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();

  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const application = await prisma.application.findFirst({
    where: {
      id,
      email,
    },
    include: {
      job: {
        include: {
          city: {
            select: { id: true, city: true, cityCode: true, country: true },
          },
        },
      },
      stageHistory: {
        orderBy: { occurredAt: 'asc' },
      },
      documents: {
        select: { id: true, status: true },
      },
      paymentDetails: {
        select: { id: true },
      },
      questionnaireResponses: {
        select: { id: true },
      },
      driver: {
        include: {
          onboardingSteps: {
            select: { stepName: true, isConfirmed: true, confirmedAt: true },
          },
          facilities: {
            include: {
              facility: { select: { facilityCode: true, city: true, address: true } },
            },
          },
        },
      },
    },
  });

  if (!application) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }

  const documentStatusCounts = application.documents.reduce((acc, doc) => {
    const key = doc.status || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const stageConfig = getStageConfig(application.currentStage);
  const stepMap = new Map(
    (application.driver?.onboardingSteps || []).map((s) => [s.stepName, s])
  );
  const screeningSteps = REQUIRED_SCREENING_STEPS.map((name) => {
    const row = stepMap.get(name);
    return {
      name,
      label: SCREENING_STEP_LABELS[name] || name,
      completed: Boolean(row?.isConfirmed),
      completedAt: row?.confirmedAt || null,
    };
  });
  const screeningCompleted = screeningSteps.filter((s) => s.completed).length;
  const screeningTotal = screeningSteps.length;

  return {
    id: application.id,
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    phone: application.phone,
    vehicleType: application.vehicleType,
    vehicleDetails: application.vehicleDetails,
    city: application.city,
    country: application.country,
    currentStage: application.currentStage,
    currentStageEnteredAt: application.currentStageEnteredAt,
    stageConfig,
    rejectionReason: application.rejectionReason,
    firstBlockDate: application.firstBlockDate,
    firstBlockResult: application.firstBlockResult,
    contractStatus: application.contractStatus,
    onboardingCallScheduledAt: application.onboardingCallScheduledAt,
    onboardingCallCompletedAt: application.onboardingCallCompletedAt,
    onboardingCallNotes: application.onboardingCallNotes,
    createdAt: application.createdAt,
    job: {
      id: application.job.id,
      title: application.job.title,
      city: application.job.city,
      requiresOwnVehicle: Boolean(application.job.requiresOwnVehicle),
    },
    facilities: (application.driver?.facilities || []).map((df) => ({
      code: df.facilityCode,
      city: df.facility?.city,
      address: df.facility?.address,
    })),
    timeline: application.stageHistory.map((entry) => ({
      fromStage: entry.fromStage,
      toStage: entry.toStage,
      occurredAt: entry.occurredAt,
      reason: entry.reason,
    })),
    documentStatusCounts,
    paymentDetailsSubmitted: Boolean(application.paymentDetails),
    questionnaireCompleted: application.questionnaireResponses.length > 0,
    screeningProgress: {
      totalSteps: screeningTotal,
      completedSteps: screeningCompleted,
      percentage: screeningTotal ? Math.round((screeningCompleted / screeningTotal) * 100) : 0,
      steps: screeningSteps,
    },
    availableActions: stageConfig.driverActionRequired
      ? [
          {
            label: stageConfig.driverActionLabel,
            route: stageConfig.driverActionRoute,
          },
        ]
      : [],
  };
}

export async function withdrawApplication(applicationId, rawEmail, reason) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const app = await prisma.application.findFirst({
    where: { id, email },
    select: { id: true, currentStage: true },
  });
  if (!app) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }
  if ([STAGES.REJECTED, STAGES.WITHDRAWN, STAGES.ACTIVE, STAGES.FIRST_BLOCK_FAILED].includes(app.currentStage)) {
    throw new DriverApplicationServiceError('Application cannot be withdrawn from this stage.', 400);
  }

  return transitionApplication(
    id,
    STAGES.WITHDRAWN,
    {
      actorEmail: email,
      actorType: 'driver',
      reason: reason || 'driver_withdrawal',
      metadata: { source: 'driver_dashboard' },
    },
    prisma
  );
}

export async function getScreeningProgress(applicationId, rawEmail) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();

  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const application = await prisma.application.findFirst({
    where: { id, email },
    include: {
      driver: {
        include: {
          availabilities: true,
          facilities: true,
          onboardingSteps: true,
        },
      },
    },
  });

  if (!application) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }

  const stepMap = new Map(
    (application.driver?.onboardingSteps ?? []).map((step) => [step.stepName, Boolean(step.isConfirmed)])
  );
  const steps = REQUIRED_SCREENING_STEPS.map((name) => ({
    stepName: name,
    isConfirmed: stepMap.get(name) ?? false,
  }));

  const completedSteps = steps.filter((step) => step.isConfirmed).length;
  const verification = await prisma.verification.findUnique({
    where: { email },
  });

  return {
    applicationId: application.id,
    currentStage: application.currentStage,
    driverId: application.driverId,
    requiredSteps: REQUIRED_SCREENING_STEPS,
    steps,
    summary: {
      completedSteps,
      totalSteps: steps.length,
      percentComplete: steps.length ? Math.round((completedSteps / steps.length) * 100) : 0,
    },
    driver: application.driver
      ? {
          id: application.driver.id,
          email: application.driver.email,
          name: application.driver.name,
          phone: application.driver.phone,
          city: application.driver.city,
          onboardingStatus: application.driver.onboardingStatus,
          availabilities: application.driver.availabilities,
          facilities: application.driver.facilities,
        }
      : null,
    verification,
  };
}

export async function isScreeningComplete(driverId, prismaClient = prisma) {
  if (!Number.isInteger(Number(driverId)) || Number(driverId) <= 0) {
    throw new DriverApplicationServiceError('Invalid driver id.', 400);
  }

  const steps = await prismaClient.driverOnboardingStep.findMany({
    where: { driverId: Number(driverId) },
    select: { stepName: true, isConfirmed: true },
  });

  const confirmed = new Set(steps.filter((step) => step.isConfirmed).map((step) => step.stepName));
  const missingSteps = REQUIRED_SCREENING_STEPS.filter((stepName) => !confirmed.has(stepName));
  return { complete: missingSteps.length === 0, missingSteps };
}

export async function completeScreening(applicationId, rawEmail) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const app = await prisma.application.findFirst({
    where: { id, email },
    select: { id: true, currentStage: true, driverId: true },
  });

  if (!app) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }
  if (!app.driverId) {
    throw new DriverApplicationServiceError('Application is not linked to a driver yet.', 400);
  }

  const completion = await isScreeningComplete(app.driverId, prisma);
  if (!completion.complete) {
    return completion;
  }

  if (app.currentStage === STAGES.ACKNOWLEDGEMENTS) {
    return completion;
  }
  if (app.currentStage !== STAGES.SCREENING) {
    throw new DriverApplicationServiceError('Application is not in screening stage.', 400);
  }

  await transitionApplication(
    app.id,
    STAGES.ACKNOWLEDGEMENTS,
    {
      actorEmail: email,
      actorType: 'driver',
      reason: 'screening_completed',
      metadata: { source: 'driver_screening_gateway' },
    },
    prisma
  );

  return completion;
}

/**
 * Screening step: own vehicle + vehicle type. Rejects when job requires own vehicle and driver answers no.
 */
export async function submitVehicleCheck(applicationId, rawEmail, payload) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const hasOwnVehicle = Boolean(payload?.hasOwnVehicle);
  const vehicleType = payload?.vehicleType ?? null;

  const app = await prisma.application.findFirst({
    where: { id, email },
    include: {
      job: { select: { requiresOwnVehicle: true } },
    },
  });

  if (!app) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }
  if (app.currentStage !== STAGES.SCREENING) {
    throw new DriverApplicationServiceError('Application is not in screening stage.', 400);
  }
  if (!app.driverId) {
    throw new DriverApplicationServiceError('Application is not linked to a driver yet.', 400);
  }

  const jobRequiresOwnVehicle = Boolean(app.job?.requiresOwnVehicle);

  if (!hasOwnVehicle && jobRequiresOwnVehicle) {
    try {
      await transitionApplication(
        id,
        STAGES.REJECTED,
        {
          actorEmail: email,
          actorType: 'driver',
          reason: 'does_not_meet_requirements',
          metadata: { source: 'vehicle_check_screening' },
        },
        prisma
      );
    } catch (e) {
      if (e instanceof WorkflowError) {
        throw new DriverApplicationServiceError(e.message, e.statusCode || 400);
      }
      throw e;
    }

    await prisma.application.update({
      where: { id },
      data: {
        rejectedAt: new Date(),
        rejectionReason: 'does_not_meet_requirements',
      },
    });

    return { rejected: true, currentStage: STAGES.REJECTED };
  }

  await prisma.$transaction(async (tx) => {
    const appUpdate = {};
    if (hasOwnVehicle && vehicleType) {
      appUpdate.vehicleType = vehicleType;
    } else if (!hasOwnVehicle) {
      appUpdate.vehicleType = null;
    }

    if (Object.keys(appUpdate).length > 0) {
      await tx.application.update({
        where: { id: app.id },
        data: appUpdate,
      });
    }

    await tx.driverOnboardingStep.upsert({
      where: {
        driverId_stepName: {
          driverId: app.driverId,
          stepName: 'vehicle_check',
        },
      },
      update: {
        isConfirmed: true,
        confirmedAt: new Date(),
      },
      create: {
        driverId: app.driverId,
        stepName: 'vehicle_check',
        isConfirmed: true,
        confirmedAt: new Date(),
      },
    });
  });

  return { rejected: false, currentStage: STAGES.SCREENING };
}

export async function updateApplicationProfile(applicationId, rawEmail, payload) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const app = await prisma.application.findFirst({
    where: { id, email },
    select: { id: true, email: true, driverId: true },
  });
  if (!app) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }
  if (!app.driverId) {
    throw new DriverApplicationServiceError('Application is not linked to a driver yet.', 400);
  }

  const applicationData = {};
  for (const field of PROFILE_APPLICATION_FIELDS) {
    if (payload?.[field] !== undefined) applicationData[field] = payload[field];
  }

  const fullName = [payload?.firstName, payload?.lastName].filter(Boolean).join(' ').trim() || null;
  const driverData = {
    updatedAt: new Date(),
  };
  if (payload?.phone !== undefined) driverData.phone = payload.phone;
  if (payload?.city !== undefined) driverData.city = payload.city;
  if (payload?.firstName !== undefined || payload?.lastName !== undefined) {
    driverData.name = fullName;
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(applicationData).length > 0) {
      await tx.application.update({
        where: { id: app.id },
        data: applicationData,
      });
    }

    await tx.driver.update({
      where: { id: app.driverId },
      data: driverData,
    });

    await tx.driverOnboardingStep.upsert({
      where: {
        driverId_stepName: {
          driverId: app.driverId,
          stepName: 'confirm_details',
        },
      },
      update: {
        isConfirmed: true,
        confirmedAt: new Date(),
      },
      create: {
        driverId: app.driverId,
        stepName: 'confirm_details',
        isConfirmed: true,
        confirmedAt: new Date(),
      },
    });
  });

  return getDriverApplication(id, email);
}

export async function getApplicationFeeStructure(applicationId, rawEmail) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const app = await prisma.application.findFirst({
    where: { id, email },
    include: { job: { include: { city: true } } },
  });
  if (!app) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }

  const city = app.city || app.job?.city?.city || null;
  const vehicleType = app.vehicleType || null;

  let feeStructure = null;
  if (city && vehicleType) {
    feeStructure = await prisma.feeStructure.findFirst({
      where: { city, vehicleType },
      include: { details: true },
      orderBy: { updatedAt: 'desc' },
    });
  }
  if (!feeStructure && city) {
    feeStructure = await prisma.feeStructure.findFirst({
      where: { city },
      include: { details: true },
      orderBy: { updatedAt: 'desc' },
    });
  }
  if (!feeStructure) {
    feeStructure = await prisma.feeStructure.findFirst({
      include: { details: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  return {
    city,
    vehicleType,
    currencySymbol: app.job?.city?.currencySymbol || '£',
    feeStructure: feeStructure
      ? {
          id: feeStructure.id,
          city: feeStructure.city,
          vehicleType: feeStructure.vehicleType,
          perHour: feeStructure.perHour,
          perTask: feeStructure.perTask,
          blocks: feeStructure.details.map((d) => ({
            density: d.density,
            shiftLength: d.shiftLength,
            minimumFee: Number(d.minimumFee),
            includedTasks: d.includedTasks,
            additionalTaskFee: Number(d.additionalTaskFee),
          })),
        }
      : null,
  };
}

function getPaymentConfigForCity(city) {
  const normalized = String(city || '').trim().toLowerCase();
  const london = ['london'];
  const usa = ['new york', 'miami', 'boston', 'chicago'];
  if (london.includes(normalized)) {
    return {
      paymentCycle: {
        text: 'Payments are processed weekly in arrears.',
        example: 'You receive the payment breakdown by Wednesday and funds by Friday or Monday end of day.',
      },
      scheduling: {
        text: 'Blocks are published 2 weeks in advance at 10:00 AM by vehicle category days.',
        details: ['Vans: Sunday and Monday', 'Cars: Tuesday and Wednesday'],
      },
      cancellation: { hideReleaseFee: false, releaseFeePercent: 10, exampleBlockFee: 50 },
    };
  }
  if (usa.includes(normalized)) {
    return {
      paymentCycle: {
        text: 'Payments are processed weekly in arrears.',
        example: 'You receive the payment breakdown by Wednesday and funds by Friday or Monday end of day.',
      },
      scheduling: {
        text: 'Blocks are published two weeks in advance every Monday at 12:00 PM.',
      },
      cancellation: { hideReleaseFee: true, releaseFeePercent: 10, exampleBlockFee: 50 },
    };
  }
  return {
    paymentCycle: {
      text: 'Payments are processed weekly in arrears.',
      example: 'You receive the payment breakdown by Wednesday and funds by Friday or Monday end of day.',
    },
    scheduling: {
      text: 'Blocks are published two weeks in advance every Monday at 10:00 AM.',
    },
    cancellation: { hideReleaseFee: false, releaseFeePercent: 10, exampleBlockFee: 50 },
  };
}

export async function getApplicationRegionConfig(applicationId, rawEmail) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const app = await prisma.application.findFirst({
    where: { id, email },
    include: { job: { include: { city: true } } },
  });
  if (!app) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }

  const city = app.city || app.job?.city?.city || '';
  const config = getPaymentConfigForCity(city);

  return {
    city: {
      id: app.job?.city?.id || null,
      city: app.job?.city?.city || null,
      cityCode: app.job?.city?.cityCode || null,
      country: app.job?.city?.country || null,
      currency: app.job?.city?.currency || null,
      currencySymbol: app.job?.city?.currencySymbol || '£',
      applicantCity: city,
    },
    paymentCycle: config.paymentCycle,
    scheduling: config.scheduling,
    cancellation: config.cancellation,
  };
}

export async function resendDriverContract(applicationId, rawEmail) {
  const id = Number(applicationId);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!Number.isInteger(id) || id <= 0) {
    throw new DriverApplicationServiceError('Invalid application id.', 400);
  }
  if (!email) {
    throw new DriverApplicationServiceError('Invalid session.', 401);
  }

  const app = await prisma.application.findFirst({
    where: { id, email },
    select: { id: true, currentStage: true },
  });
  if (!app) {
    throw new DriverApplicationServiceError('Application not found.', 404);
  }
  if (app.currentStage !== STAGES.CONTRACT_SENT) {
    throw new DriverApplicationServiceError('Contract resend is only available at contract sent stage.', 400);
  }

  return resendContract(id, prisma);
}
