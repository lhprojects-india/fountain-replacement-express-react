const TIMELINE_STAGES = [
  { key: "applied", label: "Applied" },
  { key: "pending_review", label: "Under Review" },
  { key: "screening", label: "Screening" },
  { key: "acknowledgements", label: "Acknowledgements" },
  { key: "contract_sent", label: "Contract" },
  { key: "documents_pending", label: "Documents" },
  { key: "payment_details_pending", label: "Payment Information" },
  { key: "onboarding_call", label: "Onboarding" },
  { key: "questionnaire", label: "Assessment" },
  { key: "approved", label: "Approved" },
  { key: "first_block_assigned", label: "First block" },
  { key: "active", label: "Active" },
];

const TERMINAL_RED_STAGES = new Set(["rejected", "withdrawn", "first_block_failed"]);

const mapStage = (stage) => {
  if (stage === "contract_signed") return "contract_sent";
  return stage;
};

const StageTimeline = ({ currentStage }) => {
  const mappedCurrent = mapStage(currentStage);
  const currentIndex = TIMELINE_STAGES.findIndex((stage) => stage.key === mappedCurrent);
  const isRejectedLike = TERMINAL_RED_STAGES.has(currentStage);

  return (
    <div className="w-full">
      {/* Mobile: vertical timeline */}
      <div className="md:hidden">
        <div className="space-y-3">
          {TIMELINE_STAGES.map((stage, idx) => {
            const isDone = currentIndex > -1 && idx < currentIndex && !isRejectedLike;
            const isCurrent = currentIndex === idx && !isRejectedLike;
            const isFuture = currentIndex === -1 || idx > currentIndex || isRejectedLike;
            return (
              <div key={stage.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "bg-brand-blue border-brand-blue text-white"
                          : isFuture
                            ? "bg-gray-100 border-gray-300 text-gray-500"
                            : "bg-white border-gray-300 text-gray-500"
                    }`}
                    aria-label={isDone ? `${stage.label} completed` : isCurrent ? `${stage.label} current` : `${stage.label}`}
                  >
                    {isDone ? "✓" : idx + 1}
                  </div>
                  {idx < TIMELINE_STAGES.length - 1 ? (
                    <div className={`w-0.5 flex-1 ${isDone ? "bg-green-300" : "bg-gray-200"}`} style={{ minHeight: 18 }} />
                  ) : null}
                </div>
                <div className="flex-1 pt-1">
                  <div className={`text-sm ${isCurrent ? "font-semibold text-brand-shadeBlue" : "text-gray-800"}`}>
                    {stage.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    Typical processing: 1–2 business days
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: horizontal timeline */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[720px] flex items-start justify-between gap-2">
          {TIMELINE_STAGES.map((stage, idx) => {
            const isDone = currentIndex > -1 && idx < currentIndex && !isRejectedLike;
            const isCurrent = currentIndex === idx && !isRejectedLike;
            const isFuture = currentIndex === -1 || idx > currentIndex || isRejectedLike;
            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "bg-brand-blue border-brand-blue text-white"
                          : isFuture
                            ? "bg-gray-100 border-gray-300 text-gray-500"
                            : "bg-white border-gray-300 text-gray-500"
                    }`}
                  >
                    {isDone ? "✓" : idx + 1}
                  </div>
                  {idx < TIMELINE_STAGES.length - 1 && (
                    <div className={`h-1 flex-1 ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
                <span className="mt-2 text-xs text-center text-gray-700">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      {isRejectedLike && (
        <div className="mt-3 text-sm text-red-600 font-medium">
          Application ended with status: {currentStage.replaceAll("_", " ")}
        </div>
      )}
    </div>
  );
};

export default StageTimeline;
