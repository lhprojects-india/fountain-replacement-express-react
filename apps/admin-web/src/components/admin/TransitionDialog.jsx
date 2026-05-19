import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@lh/shared";
import { AlertTriangle } from "lucide-react";
import { adminServices } from "../../lib/admin-services";

const toReadable = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .trim();

const formatTransitionError = (error, fallbackToStage) => {
  const details = error?.errors;
  const missingStepLabels = Array.isArray(details?.missingStepLabels)
    ? details.missingStepLabels.filter(Boolean)
    : [];
  const missingSteps = Array.isArray(details?.missingSteps)
    ? details.missingSteps.map(toReadable).filter(Boolean)
    : [];
  const missingList = missingStepLabels.length > 0 ? missingStepLabels : missingSteps;

  if (missingList.length > 0) {
    const fromStage = toReadable(details?.fromStage);
    const toStage = toReadable(details?.toStage || fallbackToStage);
    const transitionText =
      fromStage && toStage
        ? `${fromStage} to ${toStage}`
        : toStage
          ? `to ${toStage}`
          : "to the selected stage";
    return `Cannot move ${transitionText}. Missing screening steps: ${missingList.join(", ")}.`;
  }

  return error?.message || "Transition failed.";
};

const getBypassPayloadFromError = (error, fallbackToStage) => {
  if (error?.code !== "MISSING_SCREENING_STEPS") return null;
  const details = error?.errors || {};
  const missingSteps = Array.isArray(details?.missingSteps)
    ? details.missingSteps.filter(Boolean)
    : [];
  return {
    bypassGuard: true,
    bypassCode: error?.code,
    fromStage: details?.fromStage || null,
    toStage: details?.toStage || fallbackToStage || null,
    missingSteps,
    bypassReason: "admin_override_missing_screening_steps",
  };
};

const REJECTION_REASON_LABELS = {
  does_not_meet_requirements: "Does not meet requirements",
  failed_screening: "Failed screening",
  documents_invalid: "Invalid or fraudulent documents",
  failed_questionnaire: "Failed assessment questionnaire",
  failed_first_block: "Failed first block",
  no_response: "No response from candidate",
  duplicate_application: "Duplicate application",
  other: "Other",
};

const TransitionDialog = ({
  open,
  onClose,
  application,
  toStage,
  onSuccess,
  isBulk = false,
  bulkIds = [],
}) => {
  const [reason, setReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const isReject = toStage === "rejected";

  useEffect(() => {
    if (!open) {
      setReason("");
      setRejectionReason("");
      setError("");
      setErrorDetails(null);
      setLoading(false);
    }
  }, [open]);

  const title = useMemo(() => {
    if (isBulk) return isReject ? `Reject ${bulkIds.length} applications?` : `Move ${bulkIds.length} applications?`;
    if (isReject) return "Reject Application?";
    return `Move to ${String(toStage || "").replaceAll("_", " ")}?`;
  }, [isBulk, isReject, bulkIds.length, toStage]);

  const description = useMemo(() => {
    if (isBulk) return `This will update ${bulkIds.length} selected applications.`;
    if (!application) return "";
    return `This will move ${application.firstName || ""} ${application.lastName || ""} from ${application.currentStage} to ${toStage}.`;
  }, [isBulk, bulkIds.length, application, toStage]);

  const handleConfirm = async () => {
    if (isReject && !rejectionReason) {
      setError("Please select a rejection reason.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const finalReason = isReject ? rejectionReason : reason;
      if (isBulk) {
        const result = await adminServices.bulkTransitionApplications(
          bulkIds,
          toStage,
          finalReason,
          isReject ? { rejectionReason, additionalNotes: reason || null } : {}
        );
        onSuccess?.(result);
      } else {
        await adminServices.transitionApplication(
          application.id,
          toStage,
          finalReason
        );
        onSuccess?.();
      }
      setReason("");
      setRejectionReason("");
      onClose?.();
    } catch (e) {
      setErrorDetails(e || null);
      setError(formatTransitionError(e, toStage));
    } finally {
      setLoading(false);
    }
  };

  const handleBypassConfirm = async () => {
    if (!application?.id || isBulk) return;
    const metadata = getBypassPayloadFromError(errorDetails, toStage);
    if (!metadata) return;
    setLoading(true);
    setError("");
    try {
      await adminServices.transitionApplication(
        application.id,
        toStage,
        reason,
        metadata
      );
      onSuccess?.();
      setReason("");
      setRejectionReason("");
      setErrorDetails(null);
      onClose?.();
    } catch (e) {
      setErrorDetails(e || null);
      setError(formatTransitionError(e, toStage));
    } finally {
      setLoading(false);
    }
  };

  const bypassMetadata = !isBulk ? getBypassPayloadFromError(errorDetails, toStage) : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isReject ? (
          <div className="space-y-3">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action will reject the application and notify the candidate.
              </AlertDescription>
            </Alert>
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select rejection reason" />
              </SelectTrigger>
              <SelectContent>
                {adminServices.getRejectionReasons().map((key) => (
                  <SelectItem key={key} value={key}>
                    {REJECTION_REASON_LABELS[key] || key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Additional notes (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        ) : (
          <Textarea
            placeholder="Reason/notes (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {bypassMetadata?.missingSteps?.length ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Admin override available</p>
            <p className="mt-1">
              Missing step{bypassMetadata.missingSteps.length > 1 ? "s" : ""}:{" "}
              {bypassMetadata.missingSteps.map((step) => toReadable(step)).join(", ")}
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {bypassMetadata ? (
            <Button
              variant="outline"
              onClick={handleBypassConfirm}
              disabled={loading}
              className="border-amber-400 text-amber-900 hover:bg-amber-100"
            >
              {loading ? "Working..." : "Bypass Missing Step(s) & Confirm"}
            </Button>
          ) : null}
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={isReject ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {loading ? "Working..." : isReject ? "Reject" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransitionDialog;
