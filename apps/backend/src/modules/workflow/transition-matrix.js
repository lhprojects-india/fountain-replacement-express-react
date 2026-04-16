export const STAGES = {
  APPLIED: 'applied',
  PENDING_REVIEW: 'pending_review',
  SCREENING: 'screening',
  ACKNOWLEDGEMENTS: 'acknowledgements',
  CONTRACT_SENT: 'contract_sent',
  CONTRACT_SIGNED: 'contract_signed',
  DOCUMENTS_PENDING: 'documents_pending',
  DOCUMENTS_UNDER_REVIEW: 'documents_under_review',
  PAYMENT_DETAILS_PENDING: 'payment_details_pending',
  ONBOARDING_CALL: 'onboarding_call',
  QUESTIONNAIRE: 'questionnaire',
  DECISION_PENDING: 'decision_pending',
  APPROVED: 'approved',
  FIRST_BLOCK_ASSIGNED: 'first_block_assigned',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  FIRST_BLOCK_FAILED: 'first_block_failed',
};

export const TRANSITION_MATRIX = {
  [STAGES.APPLIED]: [STAGES.PENDING_REVIEW],
  [STAGES.PENDING_REVIEW]: [STAGES.SCREENING, STAGES.REJECTED, STAGES.WITHDRAWN],
  [STAGES.SCREENING]: [STAGES.ACKNOWLEDGEMENTS, STAGES.REJECTED, STAGES.WITHDRAWN],
  [STAGES.ACKNOWLEDGEMENTS]: [STAGES.CONTRACT_SENT, STAGES.REJECTED, STAGES.WITHDRAWN],
  [STAGES.CONTRACT_SENT]: [STAGES.CONTRACT_SIGNED, STAGES.REJECTED, STAGES.WITHDRAWN],
  [STAGES.CONTRACT_SIGNED]: [STAGES.DOCUMENTS_PENDING, STAGES.WITHDRAWN],
  [STAGES.DOCUMENTS_PENDING]: [STAGES.DOCUMENTS_UNDER_REVIEW, STAGES.WITHDRAWN],
  [STAGES.DOCUMENTS_UNDER_REVIEW]: [
    STAGES.PAYMENT_DETAILS_PENDING,
    STAGES.DOCUMENTS_PENDING,
    STAGES.REJECTED,
  ],
  [STAGES.PAYMENT_DETAILS_PENDING]: [STAGES.ONBOARDING_CALL, STAGES.WITHDRAWN],
  [STAGES.ONBOARDING_CALL]: [STAGES.QUESTIONNAIRE, STAGES.REJECTED, STAGES.WITHDRAWN],
  [STAGES.QUESTIONNAIRE]: [STAGES.DECISION_PENDING, STAGES.WITHDRAWN],
  [STAGES.DECISION_PENDING]: [STAGES.APPROVED, STAGES.REJECTED, STAGES.WITHDRAWN],
  [STAGES.APPROVED]: [STAGES.FIRST_BLOCK_ASSIGNED, STAGES.WITHDRAWN],
  [STAGES.FIRST_BLOCK_ASSIGNED]: [STAGES.ACTIVE, STAGES.FIRST_BLOCK_FAILED, STAGES.WITHDRAWN],
  [STAGES.FIRST_BLOCK_FAILED]: [STAGES.REJECTED],
  [STAGES.REJECTED]: [STAGES.PENDING_REVIEW],
  [STAGES.WITHDRAWN]: [STAGES.PENDING_REVIEW],
};

export const TERMINAL_STAGES = [STAGES.ACTIVE, STAGES.REJECTED, STAGES.WITHDRAWN];

export const REJECTION_ALLOWED_FROM = [
  STAGES.PENDING_REVIEW,
  STAGES.SCREENING,
  STAGES.DOCUMENTS_UNDER_REVIEW,
  STAGES.ONBOARDING_CALL,
  STAGES.DECISION_PENDING,
  STAGES.FIRST_BLOCK_FAILED,
];

export const REJECTION_REASONS = [
  'does_not_meet_requirements',
  'failed_screening',
  'documents_invalid',
  'failed_questionnaire',
  'failed_first_block',
  'no_response',
  'duplicate_application',
  'other',
];

export const REJECTION_REASON_LABELS = {
  does_not_meet_requirements: 'Does not meet requirements',
  failed_screening: 'Failed screening',
  documents_invalid: 'Invalid or fraudulent documents',
  failed_questionnaire: 'Failed assessment questionnaire',
  failed_first_block: 'Failed first block',
  no_response: 'No response from candidate',
  duplicate_application: 'Duplicate application',
  other: 'Other',
};

export const STAGE_SLA_HOURS = {
  pending_review: 48,
  screening: 168,
  acknowledgements: 168,
  contract_sent: 72,
  documents_pending: 168,
  documents_under_review: 48,
  payment_details_pending: 168,
  onboarding_call: 120,
  questionnaire: 72,
  decision_pending: 48,
};

export function isValidTransition(fromStage, toStage) {
  const allowedNext = TRANSITION_MATRIX[fromStage] ?? [];
  return allowedNext.includes(toStage);
}
