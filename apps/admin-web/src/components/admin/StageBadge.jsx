const STAGE_CLASS_MAP = {
  applied: "bg-blue-100 text-blue-800 border-blue-200",
  pending_review: "bg-blue-100 text-blue-800 border-blue-200",
  screening: "bg-amber-100 text-amber-800 border-amber-200",
  acknowledgements: "bg-yellow-100 text-yellow-800 border-yellow-200",
  contract_sent: "bg-purple-100 text-purple-800 border-purple-200",
  contract_signed: "bg-purple-100 text-purple-800 border-purple-200",
  documents_pending: "bg-orange-100 text-orange-800 border-orange-200",
  documents_under_review: "bg-orange-100 text-orange-800 border-orange-200",
  payment_details_pending: "bg-indigo-100 text-indigo-800 border-indigo-200",
  onboarding_call: "bg-teal-100 text-teal-800 border-teal-200",
  questionnaire: "bg-teal-100 text-teal-800 border-teal-200",
  decision_pending: "bg-gray-100 text-gray-800 border-gray-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  first_block_assigned: "bg-emerald-100 text-emerald-900 border-emerald-200",
  active: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  withdrawn: "bg-red-100 text-red-800 border-red-200",
  first_block_failed: "bg-red-100 text-red-800 border-red-200",
};

function toStageLabel(stage) {
  return String(stage || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const StageBadge = ({ stage, label }) => {
  const classes = STAGE_CLASS_MAP[stage] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {label || toStageLabel(stage)}
    </span>
  );
};

export default StageBadge;
