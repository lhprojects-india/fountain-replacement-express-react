import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, PageLayout, useToast } from "@lh/shared";
import DocumentUploadCard from "../components/DocumentUploadCard";
import { publicServices } from "../lib/public-services";
import { useAuth } from "../context/AuthContext";

function pickLatestSubmission(submissions = []) {
  if (!submissions.length) return null;
  return [...submissions].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
}

const DocumentUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { application, loadDriverApplication } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [completeness, setCompleteness] = useState(null);

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await publicServices.getDriverDocuments();
      setDocuments(response?.documents || []);
      setCompleteness(response?.completeness || null);
    } catch (error) {
      toast({
        title: "Unable to load documents",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const progress = useMemo(() => {
    const required = documents.filter((item) => item.isRequired);
    const uploaded = required.filter((item) => {
      const latest = pickLatestSubmission(item.submissions);
      return Boolean(latest && ["uploading", "pending", "approved"].includes(latest.status));
    });
    const totalRequired = required.length;
    const done = uploaded.length;
    const percent = totalRequired ? Math.round((done / totalRequired) * 100) : 0;
    return { totalRequired, done, percent };
  }, [documents]);
  const hasRejected = useMemo(
    () =>
      documents.some((item) => {
        const latest = pickLatestSubmission(item.submissions);
        return latest?.status === "rejected";
      }),
    [documents]
  );

  const handleDelete = async (documentId) => {
    try {
      await publicServices.deleteDriverDocument(documentId);
      toast({ title: "Document deleted" });
      await refreshDocuments();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageLayout title="Document Upload">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-brand-shadeBlue">Upload Your Documents</h1>
          <p className="text-gray-600 mt-2">
            Please upload the required documents to proceed with your application.
          </p>

          <div className="mt-4">
            <p className="text-sm text-gray-700">
              Overall Progress: {progress.done}/{progress.totalRequired} required documents
            </p>
            <div className="mt-2 h-3 rounded bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-brand-blue transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">{progress.percent}% complete</p>
          </div>
        </section>

        <section className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-6 text-gray-600">Loading documents...</div>
          ) : (
            documents.map((item) => (
              <DocumentUploadCard
                key={item.requirementCode}
                requirement={{
                  code: item.requirementCode,
                  name: item.requirementName,
                  isRequired: item.isRequired,
                  fileTypes: item.fileTypes,
                  maxSizeMb: item.maxSizeMb,
                  maxDurationSec: item.maxDurationSec,
                }}
                submission={pickLatestSubmission(item.submissions)}
                onUploadComplete={refreshDocuments}
                onDelete={handleDelete}
                currentStage={application?.currentStage}
              />
            ))
          )}
        </section>
        {hasRejected ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Some documents were rejected. Please re-upload the rejected items with required corrections.
          </div>
        ) : null}

        <section className="flex items-center gap-3">
          <Button
            disabled={
              application?.currentStage !== "documents_pending" || !completeness?.complete || submitting
            }
            onClick={async () => {
              setSubmitting(true);
              try {
                const result = await publicServices.submitDriverDocuments();
                if (!result?.submitted) {
                  toast({
                    title: "Documents incomplete",
                    description: "Please upload all required documents before submitting.",
                    variant: "destructive",
                  });
                  await refreshDocuments();
                  return;
                }
                await loadDriverApplication();
                toast({
                  title: "Documents submitted for review",
                  description: "Your documents are now with the admin team.",
                });
                navigate("/dashboard");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Submitting..." : "Submit Documents"}
          </Button>
          <Link className="text-sm text-brand-blue hover:underline" to="/dashboard">
            Back to Dashboard
          </Link>
          {application?.currentStage === "documents_under_review" ? (
            <p className="text-sm text-gray-700">Your documents are currently being reviewed.</p>
          ) : !completeness?.complete ? (
            <p className="text-sm text-amber-700">
              Upload all required documents to continue.
            </p>
          ) : null}
        </section>
      </div>
    </PageLayout>
  );
};

export default DocumentUpload;
