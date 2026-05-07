import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button, PageLayout, useToast } from "@lh/shared";
import { useAuth } from "../context/AuthContext";
import { publicServices } from "../lib/public-services";
import { PenLine, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const FIELD_LABELS = {
  signature: "Signature",
  initials: "Initials",
  date: "Date",
  fullName: "Full Name",
  email: "Email",
  text: "Text",
  checkbox: "Checkbox",
};

function autoFillValue(field, applicant) {
  switch (field.type) {
    case "fullName": return `${applicant?.firstName || ""} ${applicant?.lastName || ""}`.trim();
    case "email": return applicant?.email || "";
    case "date": return new Date().toLocaleDateString("en-GB");
    default: return "";
  }
}

export default function ContractSigning() {
  const navigate = useNavigate();
  const { loadDriverApplication } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale] = useState(1.0);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    publicServices.getMockContract()
      .then((data) => {
        setContractData(data);
        const initVals = {};
        (data.fields || []).forEach((f) => {
          initVals[f.id] = autoFillValue(f, data.applicant);
        });
        setFieldValues(initVals);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || "Could not load contract.");
        setLoading(false);
      });
  }, []);

  const pageFields = (contractData?.fields || []).filter((f) => f.page === currentPage);

  const allRequiredFilled = (contractData?.fields || [])
    .filter((f) => f.required !== false)
    .every((f) => {
      if (f.type === "checkbox") return Boolean(fieldValues[f.id]);
      if (f.type === "signature" || f.type === "initials") return Boolean(fieldValues[f.id]);
      return String(fieldValues[f.id] || "").trim().length > 0;
    });

  const handleSign = async () => {
    if (!allRequiredFilled) {
      toast({ title: "Please complete all required fields before signing.", variant: "destructive" });
      return;
    }
    setSigning(true);
    try {
      await publicServices.mockSignContract();
      await loadDriverApplication();
      setSigned(true);
    } catch (err) {
      toast({ title: "Signing failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-slate-500">Loading your contract…</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
        </div>
      </PageLayout>
    );
  }

  if (signed) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          <h2 className="text-xl font-semibold">Contract Signed!</h2>
          <p className="text-slate-500 text-sm max-w-sm">
            Your contract has been signed successfully. We will review it and notify you about next steps.
          </p>
          <Button className="bg-brand-blue hover:bg-brand-shadeBlue mt-2" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <PenLine className="h-5 w-5 text-brand-blue" />
            Review &amp; Sign Your Contract
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {contractData?.templateName || "Contract"} — Please review the document and complete all required fields below, then click Sign.
          </p>
        </div>

        {/* PDF viewer */}
        <div className="rounded-xl border bg-slate-100 overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b text-sm">
            <button
              type="button"
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-slate-600 text-xs">Page {currentPage} / {numPages || "—"}</span>
            <button
              type="button"
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-auto flex justify-center py-4">
            <Document file={contractData?.pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
              <div className="relative select-none" ref={pageRef}>
                <Page pageNumber={currentPage} scale={scale} renderAnnotationLayer renderTextLayer />
                {/* Overlay fields */}
                {pageFields.map((field) => {
                  const val = fieldValues[field.id] ?? "";
                  return (
                    <div
                      key={field.id}
                      className="absolute"
                      style={{
                        left: field.x * scale,
                        top: field.y * scale,
                        width: field.width * scale,
                        height: field.height * scale,
                        zIndex: 10,
                      }}
                    >
                      {field.type === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => setFieldValues((v) => ({ ...v, [field.id]: e.target.checked }))}
                          className="w-full h-full cursor-pointer"
                        />
                      ) : field.type === "signature" || field.type === "initials" ? (
                        <div
                          className={`w-full h-full border-2 rounded flex items-center justify-center cursor-pointer text-xs font-medium transition-colors ${
                            val
                              ? "bg-blue-50 border-blue-400 text-blue-700"
                              : "bg-white border-dashed border-slate-400 text-slate-400 hover:border-blue-400 hover:text-blue-500"
                          }`}
                          onClick={() =>
                            setFieldValues((v) => ({
                              ...v,
                              [field.id]: v[field.id]
                                ? ""
                                : `${contractData?.applicant?.firstName || ""} ${contractData?.applicant?.lastName || ""}`.trim(),
                            }))
                          }
                        >
                          {val ? (
                            <span className="font-signature text-sm truncate px-1">{val}</span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <PenLine className="h-3 w-3" />
                              {field.type === "initials" ? "Initials" : "Sign here"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => setFieldValues((v) => ({ ...v, [field.id]: e.target.value }))}
                          placeholder={field.label || FIELD_LABELS[field.type] || ""}
                          className="w-full h-full border border-slate-300 rounded px-1 text-xs bg-white/90 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Document>
          </div>
        </div>

        {/* Fields summary list */}
        {(contractData?.fields || []).length > 0 && (
          <div className="mb-6 rounded-xl border bg-white divide-y">
            {(contractData.fields || []).map((field) => {
              const val = fieldValues[field.id] ?? "";
              const filled = field.type === "checkbox" ? Boolean(val) : String(val).trim().length > 0;
              return (
                <div key={field.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${filled ? "bg-emerald-500" : "bg-amber-400"}`} />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{field.label || FIELD_LABELS[field.type]}</span>
                    <span className="text-slate-400 ml-2 text-xs">Page {field.page}</span>
                    {field.required !== false && !filled && (
                      <span className="text-amber-600 text-xs ml-1">(required)</span>
                    )}
                  </div>
                  {filled && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
          <Button
            className="bg-brand-blue hover:bg-brand-shadeBlue"
            onClick={handleSign}
            disabled={signing || !allRequiredFilled}
          >
            {signing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing…</>
            ) : (
              <><PenLine className="h-4 w-4 mr-2" />Sign Contract</>
            )}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
