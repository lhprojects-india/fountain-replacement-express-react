import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@lh/shared";
import { AlertTriangle } from "lucide-react";
import { adminServices } from "../../lib/admin-services";

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
  const [loading, setLoading] = useState(false);
  const isReject = toStage === "rejected";

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
      setError(e?.message || "Transition failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-gray-600">{description}</p>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
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
