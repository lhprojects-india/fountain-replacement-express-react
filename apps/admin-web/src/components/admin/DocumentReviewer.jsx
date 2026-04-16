import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from "@lh/shared";
import { adminServices } from "../../lib/admin-services";

const DocumentReviewer = ({ applicationId, onReviewed }) => {
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [completeness, setCompleteness] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [contextByDocId, setContextByDocId] = useState({});
  const [previewByDocId, setPreviewByDocId] = useState({});
  const [checklistByDocId, setChecklistByDocId] = useState({});
  const [notesByDocId, setNotesByDocId] = useState({});
  const [rejectTarget, setRejectTarget] = useState(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchSummary, setBatchSummary] = useState("");
  const [batchStats, setBatchStats] = useState({ reviewed: 0, approved: 0, rejected: 0 });

  const loadDocuments = async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const result = await adminServices.getApplicationDocuments(applicationId);
      setDocuments(result?.documents || []);
      setCompleteness(result?.completeness || null);
      if (typeof onReviewed === "function") onReviewed();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [applicationId]);

  const latestDocuments = useMemo(() => {
    return documents
      .map((item) => {
        const latest = [...(item.submissions || [])].sort(
          (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
        )[0];
        return { ...item, latest };
      })
      .filter((item) => item.latest);
  }, [documents]);

  const selectedEntry = latestDocuments[selectedIndex] || null;
  const selectedDoc = selectedEntry?.latest || null;
  const pendingDocuments = useMemo(
    () => latestDocuments.filter((row) => row.latest.status === "pending"),
    [latestDocuments]
  );
  const approvedCount = useMemo(
    () => latestDocuments.filter((row) => row.latest.status === "approved").length,
    [latestDocuments]
  );

  useEffect(() => {
    setSelectedIndex((prev) => {
      if (!latestDocuments.length) return 0;
      return Math.max(0, Math.min(prev, latestDocuments.length - 1));
    });
  }, [latestDocuments.length]);

  useEffect(() => {
    if (!applicationId || !selectedDoc) return;
    const docId = selectedDoc.id;
    if (contextByDocId[docId] && previewByDocId[docId]) return;

    let active = true;
    (async () => {
      const [context, preview] = await Promise.all([
        adminServices.getApplicationDocumentContext(applicationId, docId),
        adminServices.getApplicationDocumentDownloadUrl(applicationId, docId),
      ]);
      if (!active) return;
      setContextByDocId((prev) => ({ ...prev, [docId]: context }));
      setPreviewByDocId((prev) => ({ ...prev, [docId]: preview?.downloadUrl || "" }));
      const checklistItems = context?.requirement?.checklist || selectedEntry?.checklist || [];
      setChecklistByDocId((prev) => {
        if (prev[docId]) return prev;
        const initial = {};
        checklistItems.forEach((item) => {
          initial[item.item] = false;
        });
        return { ...prev, [docId]: initial };
      });
      setNotesByDocId((prev) => {
        if (prev[docId] != null) return prev;
        return { ...prev, [docId]: context?.document?.reviewerNotes || "" };
      });
    })().catch(() => {});

    return () => {
      active = false;
    };
  }, [applicationId, selectedDoc?.id]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = String(event.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select", "button"].includes(tag)) return;

      if (event.key === "ArrowLeft") {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (event.key === "ArrowRight") {
        setSelectedIndex((prev) => Math.min(latestDocuments.length - 1, prev + 1));
      } else if (event.key.toLowerCase() === "a") {
        if (selectedDoc?.status === "pending" && reviewingId == null) {
          void handleApprove(selectedDoc.id);
        }
      } else if (event.key.toLowerCase() === "r") {
        if (selectedDoc?.status === "pending") {
          setRejectTarget(selectedDoc.id);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [latestDocuments.length, selectedDoc, reviewingId, checklistByDocId, notesByDocId, batchMode]);

  const toChecklistPayload = (docId, checklistItems) => {
    const state = checklistByDocId[docId] || {};
    return (checklistItems || []).map((item) => ({
      item: item.item,
      passed: Boolean(state[item.item]),
    }));
  };

  const findNextPendingIndex = (fromIndex) => {
    for (let i = fromIndex + 1; i < latestDocuments.length; i += 1) {
      if (latestDocuments[i]?.latest?.status === "pending") return i;
    }
    return -1;
  };

  const handleApprove = async (docId) => {
    const entry = latestDocuments.find((row) => row.latest.id === docId);
    if (!entry) return;
    const checklistItems = contextByDocId[docId]?.requirement?.checklist || entry.checklist || [];
    const checklist = toChecklistPayload(docId, checklistItems);
    const allChecked = checklist.every((row) => row.passed);
    if (checklist.length && !allChecked) return;

    setReviewingId(docId);
    try {
      await adminServices.reviewApplicationDocument(
        applicationId,
        docId,
        "approved",
        notesByDocId[docId] || "",
        checklist
      );
      const currentIndex = latestDocuments.findIndex((row) => row.latest.id === docId);
      await loadDocuments();
      if (batchMode) {
        const nextPending = findNextPendingIndex(currentIndex);
        const nextStats = {
          reviewed: batchStats.reviewed + 1,
          approved: batchStats.approved + 1,
          rejected: batchStats.rejected,
        };
        setBatchStats(nextStats);
        if (nextPending >= 0) {
          setSelectedIndex(nextPending);
        } else {
          setBatchSummary(
            `Reviewed ${nextStats.reviewed} documents: ${nextStats.approved} approved, ${nextStats.rejected} rejected`
          );
          setBatchMode(false);
        }
      }
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (docId) => {
    const entry = latestDocuments.find((row) => row.latest.id === docId);
    if (!entry) return;
    const checklistItems = contextByDocId[docId]?.requirement?.checklist || entry.checklist || [];
    setReviewingId(docId);
    try {
      await adminServices.reviewApplicationDocument(
        applicationId,
        docId,
        "rejected",
        notesByDocId[docId] || "",
        toChecklistPayload(docId, checklistItems)
      );
      const currentIndex = latestDocuments.findIndex((row) => row.latest.id === docId);
      await loadDocuments();
      if (batchMode) {
        const nextPending = findNextPendingIndex(currentIndex);
        const nextStats = {
          reviewed: batchStats.reviewed + 1,
          approved: batchStats.approved,
          rejected: batchStats.rejected + 1,
        };
        setBatchStats(nextStats);
        if (nextPending >= 0) {
          setSelectedIndex(nextPending);
        } else {
          setBatchSummary(
            `Reviewed ${nextStats.reviewed} documents: ${nextStats.approved} approved, ${nextStats.rejected} rejected`
          );
          setBatchMode(false);
        }
      }
    } finally {
      setReviewingId(null);
    }
  };

  const startBatchReview = () => {
    if (!pendingDocuments.length) return;
    const firstPendingIndex = latestDocuments.findIndex((row) => row.latest.status === "pending");
    if (firstPendingIndex >= 0) setSelectedIndex(firstPendingIndex);
    setBatchMode(true);
    setBatchSummary("");
    setBatchStats({ reviewed: 0, approved: 0, rejected: 0 });
  };

  if (!latestDocuments.length) {
    return <div className="text-sm text-gray-600">{loading ? "Loading documents..." : "No documents uploaded yet."}</div>;
  }

  const context = selectedDoc ? contextByDocId[selectedDoc.id] : null;
  const previewUrl = selectedDoc ? previewByDocId[selectedDoc.id] : "";
  const checklistItems = context?.requirement?.checklist || selectedEntry?.checklist || [];
  const checklistState = checklistByDocId[selectedDoc?.id] || {};
  const allChecklistPassed = checklistItems.length === 0 || checklistItems.every((item) => checklistState[item.item]);
  const isVideo = String(selectedDoc?.fileType || "").startsWith("video/");
  const isImage = String(selectedDoc?.fileType || "").startsWith("image/");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-700">
            Documents: {approvedCount}/{latestDocuments.length} approved {approvedCount === latestDocuments.length ? "✅" : ""}
          </p>
          <p className="text-xs text-gray-500">
            {pendingDocuments.length} pending review
          </p>
        </div>
        <Button variant="outline" className="adm-btn-outline" onClick={startBatchReview} disabled={!pendingDocuments.length || loading}>
          Review All
        </Button>
      </div>
      {completeness?.missing?.length ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          Missing required: {completeness.missing.map((m) => m.name).join(", ")}
        </div>
      ) : null}

      <div className="adm-panel grid grid-cols-1 gap-4 p-3 md:grid-cols-2">
        <div className="rounded border border-slate-200 bg-gray-50 p-2 min-h-[300px] flex items-center justify-center">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={selectedDoc.fileName} className="max-h-[420px] rounded object-contain" />
          ) : null}
          {isVideo && previewUrl ? (
            <video src={previewUrl} controls className="max-h-[420px] w-full rounded bg-black" />
          ) : null}
          {!isImage && !isVideo && previewUrl ? (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline">
              Open document preview
            </a>
          ) : null}
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500">Type</div>
            <div className="font-medium">{selectedEntry.requirementName}</div>
            <div className="text-xs text-gray-500">
              Uploaded {new Date(selectedDoc.uploadedAt).toLocaleString()} • Status: {selectedDoc.status}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Verification checklist</div>
            <div className="space-y-1">
              {checklistItems.map((item) => (
                <label key={item.item} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(checklistState[item.item])}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setChecklistByDocId((prev) => ({
                        ...prev,
                        [selectedDoc.id]: { ...(prev[selectedDoc.id] || {}), [item.item]: checked },
                      }));
                    }}
                  />
                  <span>{item.item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Applicant info</div>
            <div className="text-sm space-y-1">
              <div>Name: {context?.applicantInfo?.firstName} {context?.applicantInfo?.lastName}</div>
              <div>City: {context?.applicantInfo?.city || "-"}</div>
              <div>Vehicle: {context?.applicantInfo?.vehicleType || "-"}</div>
              <div>Address: {context?.applicantInfo?.address || "-"}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <Textarea
              value={notesByDocId[selectedDoc.id] || ""}
              onChange={(event) => {
                setNotesByDocId((prev) => ({ ...prev, [selectedDoc.id]: event.target.value }));
              }}
              placeholder="Optional notes for approval; required for rejection"
            />
          </div>

          {context?.previousVersions?.length ? (
            <div>
              <div className="text-xs text-gray-500 mb-1">Previous uploads</div>
              <div className="space-y-1">
                {context.previousVersions.map((row) => (
                  <div key={row.id} className="rounded border border-slate-200 p-2 text-xs text-gray-600">
                    {row.fileName} • {new Date(row.uploadedAt).toLocaleString()} • {row.status}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {context?.reviewHistory?.length ? (
            <div>
              <div className="text-xs text-gray-500 mb-1">Verification history</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {context.reviewHistory.map((row) => (
                  <div key={row.id} className="rounded border border-slate-200 p-2 text-xs text-gray-700">
                    <div className="font-medium">
                      {row.status} • {new Date(row.createdAt).toLocaleString()}
                    </div>
                    <div className="text-gray-500">
                      Reviewer: {row.reviewerEmail || "system"}
                    </div>
                    {row.notes ? <div className="mt-1">Notes: {row.notes}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="adm-btn-outline"
              onClick={() => handleApprove(selectedDoc.id)}
              disabled={selectedDoc.status === "approved" || reviewingId === selectedDoc.id || !allChecklistPassed}
            >
              Approve (A)
            </Button>
            <Button
              variant="outline"
              className="adm-btn-outline"
              onClick={() => setRejectTarget(selectedDoc.id)}
              disabled={selectedDoc.status === "approved" || reviewingId === selectedDoc.id}
            >
              Reject (R)
            </Button>
          </div>
        </div>
      </div>

      <div className="adm-panel flex items-center justify-between px-3 py-2 text-sm">
        <Button variant="outline" className="adm-btn-outline" onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))} disabled={selectedIndex === 0}>
          ◀ Prev
        </Button>
        <span>
          {selectedEntry.requirementName} ({selectedIndex + 1}/{latestDocuments.length})
        </span>
        <Button
          variant="outline"
          className="adm-btn-outline"
          onClick={() => setSelectedIndex((prev) => Math.min(latestDocuments.length - 1, prev + 1))}
          disabled={selectedIndex === latestDocuments.length - 1}
        >
          Next ▶
        </Button>
      </div>

      <Dialog open={Boolean(rejectTarget)} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="adm-modal">
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
          </DialogHeader>
          <Input
            value={notesByDocId[rejectTarget] || ""}
            onChange={(event) => {
              setNotesByDocId((prev) => ({ ...prev, [rejectTarget]: event.target.value }));
            }}
            placeholder="Reason for rejection (required)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                await handleReject(rejectTarget);
                setRejectTarget(null);
              }}
              disabled={!String(notesByDocId[rejectTarget] || "").trim()}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(batchSummary)} onOpenChange={() => setBatchSummary("")}>
        <DialogContent className="adm-modal">
          <DialogHeader>
            <DialogTitle>Batch review complete</DialogTitle>
          </DialogHeader>
          <p className="text-sm">{batchSummary}</p>
          <DialogFooter>
            <Button onClick={() => setBatchSummary("")}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentReviewer;
