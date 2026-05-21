import { useNavigate } from "react-router-dom";
import { Button } from "@lh/shared";
import { ArrowRight, CalendarClock, CircleCheckBig, FileSignature, FileText, PhoneCall, Wallet } from "lucide-react";

const StageActionPanel = ({ application, documentProgress = null }) => {
  const navigate = useNavigate();
  const stage = application?.currentStage;
  const reason = application?.rejectionReason;
  const contractStatus = application?.contractStatus;
  const missingScreeningLabels = Array.isArray(application?.screeningProgress?.missingStepLabels)
    ? application.screeningProgress.missingStepLabels.filter(Boolean)
    : [];

  if (!stage) return null;

  const go = (route) => navigate(route);

  const actionMap = {
    pending_review: {
      text: "Your application is under review. We'll notify you when there's an update.",
    },
    screening: {
      text: "Please complete your screening details to continue.",
      buttonLabel: "Begin Screening",
      route: "/screening",
    },
    acknowledgements:
      missingScreeningLabels.length > 0
        ? {
            text: `Your application is under review, but one or more screening steps are still missing: ${missingScreeningLabels.join(", ")}.`,
            buttonLabel: "Complete Missing Step",
            route: "/screening/summary",
            tone: "warning",
          }
        : {
            text: "Your screening has been submitted. Our team is reviewing your responses. You'll be notified about next steps.",
          },
    contract_sent: {
      text: application?.contractSigningUrl
        ? `Your contract is ready to review and sign. We've also emailed you a copy at ${application?.email || "your email"}.`
        : `A contract has been sent to ${application?.email || "your email"}. Please check your inbox (including spam) and sign it.`,
      buttonLabel: application?.contractSigningUrl ? "Review & Sign Contract" : "Open Contract Page",
      route: "/contract",
    },
    contract_signed: {
      text: "Your contract has been signed! We will let you know about next steps.",
    },
    documents_pending: {
      text: documentProgress
        ? `Please upload your required documents. ${documentProgress.done} of ${documentProgress.total} uploaded.`
        : "Please upload your required documents.",
      buttonLabel: "Upload Documents",
      route: "/documents",
    },
    documents_under_review: {
      text: "Your documents are currently being reviewed.",
    },
    payment_details_pending: {
      text: "Submit your payment details to continue.",
      buttonLabel: "Submit Payment Details",
      route: "/payment",
    },
    onboarding_call: {
      text: application?.onboardingCallScheduledAt
        ? `Your onboarding call is scheduled for ${new Date(application.onboardingCallScheduledAt).toLocaleString()}. Our team will call you at ${application?.phone || "your phone number on file"}.`
        : "An onboarding call will be scheduled. We'll notify you with the date and time.",
    },
    questionnaire: {
      text: "Please complete your assessment questionnaire.",
      buttonLabel: "Take Assessment",
      route: "/questionnaire",
    },
    decision_pending: {
      text: "Final review is in progress.",
    },
    approved: {
      text: "Congratulations! You've been approved.",
    },
    rejected: {
      text: `Unfortunately, your application was not successful.${reason ? ` Reason: ${reason}` : ""}`,
      tone: "danger",
    },
    withdrawn: {
      text: "You have withdrawn your application.",
      tone: "danger",
    },
  };

  const config = actionMap[stage] || {
    text: "Your application is progressing. We'll show your next action soon.",
  };

  const iconMap = {
    screening: <ArrowRight className="h-4 w-4" />,
    contract_sent: <FileSignature className="h-4 w-4" />,
    documents_pending: <FileText className="h-4 w-4" />,
    payment_details_pending: <Wallet className="h-4 w-4" />,
    onboarding_call: <PhoneCall className="h-4 w-4" />,
    questionnaire: <CircleCheckBig className="h-4 w-4" />,
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        config.tone === "danger"
          ? "border-red-200 bg-red-50"
          : config.tone === "warning"
            ? "border-amber-200 bg-amber-50"
            : "border-gray-200 bg-gray-50"
      }`}
    >
      <p
        className={
          config.tone === "danger"
            ? "text-red-700"
            : config.tone === "warning"
              ? "text-amber-800"
              : "text-gray-700"
        }
      >
        {config.text}
      </p>
      {config.tone !== "danger" && config.tone !== "warning" ? (
        <p className="text-xs text-gray-500 mt-2 inline-flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5" />
          Typical processing time: 1-2 business days
        </p>
      ) : null}
      {stage === "contract_sent" && contractStatus ? (
        <p className="text-xs text-gray-500 mt-2">Current contract status: {contractStatus}</p>
      ) : null}
      {stage === "onboarding_call" ? (
        <p className="text-xs text-gray-500 mt-2">
          If you need to reschedule, contact us at support@laundryheap.com
        </p>
      ) : null}
      {stage === "onboarding_call" && application?.phone ? (
        <p className="text-xs mt-1">
          <a href={`tel:${application.phone}`} className="underline">Tap to call {application.phone}</a>
        </p>
      ) : null}
      {config.buttonLabel && (
        <Button
          className="mt-4 min-h-[44px]"
          onClick={() => {
            if (config.action) {
              config.action();
              return;
            }
            go(config.route);
          }}
        >
          {iconMap[stage] || null}
          {config.buttonLabel}
        </Button>
      )}
    </div>
  );
};

export default StageActionPanel;
