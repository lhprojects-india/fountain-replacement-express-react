import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from "@lh/shared";
import StageBadge from "./StageBadge";
const DocumentReviewer = lazy(() => import("./DocumentReviewer"));
import { adminServices } from "../../lib/admin-services";
import TransitionDialog from "./TransitionDialog";
import { useAdminAuth } from "../../context/AdminAuthContext";

const ApplicationDetailPanel = ({ applicationId, open, onClose, onTransitioned, initialTab = "profile" }) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [availableTransitions, setAvailableTransitions] = useState([]);
  const [dialogStage, setDialogStage] = useState("");
  const [notes, setNotes] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [expandedCommId, setExpandedCommId] = useState(null);
  const [retryingLogId, setRetryingLogId] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [reopenOpen, setReopenOpen] = useState(false);
  const [contractStatusData, setContractStatusData] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [callAt, setCallAt] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [callReason, setCallReason] = useState("");
  const [callBusy, setCallBusy] = useState(false);
  const [decisionSummary, setDecisionSummary] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decisionReason, setDecisionReason] = useState("other");
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [fbAssignAt, setFbAssignAt] = useState("");
  const [fbRescheduleAt, setFbRescheduleAt] = useState("");
  const [fbRescheduleReason, setFbRescheduleReason] = useState("");
  const [fbResultNotes, setFbResultNotes] = useState("");
  const [fbBusy, setFbBusy] = useState(false);
  const [fbConfirmPass, setFbConfirmPass] = useState(false);
  const [fbConfirmFail, setFbConfirmFail] = useState(false);
  const { adminRole } = useAdminAuth();
  const canReopen = adminRole === "super_admin" || adminRole === "app_admin";
  const canTransition = adminRole !== "admin_view";

  useEffect(() => {
    if (!open || !applicationId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [detail, transitions] = await Promise.all([
          adminServices.getApplicationDetail(applicationId),
          adminServices.getAvailableTransitions(applicationId),
        ]);
        setApplication(detail);
        setNotes(detail.notes || []);
        setAvailableTransitions(transitions || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, applicationId]);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab || "profile");
    }
  }, [open, initialTab]);

  const fullName = useMemo(() => {
    if (!application) return "";
    return `${application.firstName || ""} ${application.lastName || ""}`.trim() || application.email;
  }, [application]);

  const reloadDetail = async () => {
    const [detail, transitions, thread] = await Promise.all([
      adminServices.getApplicationDetail(application.id),
      adminServices.getAvailableTransitions(application.id),
      adminServices.getApplicationNotes(application.id),
    ]);
    setApplication(detail);
    setNotes(thread || []);
    setAvailableTransitions(transitions || []);
    const logs = await adminServices.getCommunicationLog(application.id);
    setCommunications(logs || []);
    const contract = await adminServices.getContractStatus(application.id).catch(() => null);
    setContractStatusData(contract);
    const payment = await adminServices.getApplicationPaymentDetails(application.id).catch(() => null);
    setPaymentDetails(payment);
    const summary = await adminServices.getDecisionSummary(application.id).catch(() => null);
    setDecisionSummary(summary);
  };

  useEffect(() => {
    if (!open || !applicationId) return;
    let active = true;
    const loadComms = async () => {
      try {
        const logs = await adminServices.getCommunicationLog(applicationId);
        if (active) setCommunications(logs || []);
      } catch {
        if (active) setCommunications([]);
      }
    };
    const loadContract = async () => {
      try {
        const contract = await adminServices.getContractStatus(applicationId);
        if (active) setContractStatusData(contract);
      } catch {
        if (active) setContractStatusData(null);
      }
    };
    const loadPayment = async () => {
      setPaymentLoading(true);
      try {
        const payment = await adminServices.getApplicationPaymentDetails(applicationId);
        if (active) setPaymentDetails(payment);
      } catch {
        if (active) setPaymentDetails(null);
      } finally {
        if (active) setPaymentLoading(false);
      }
    };
    const loadDecision = async () => {
      try {
        const summary = await adminServices.getDecisionSummary(applicationId);
        if (active) setDecisionSummary(summary);
      } catch {
        if (active) setDecisionSummary(null);
      }
    };
    loadComms();
    loadContract();
    loadPayment();
    loadDecision();
    return () => {
      active = false;
    };
  }, [open, applicationId]);

  const handleTransitionSuccess = async () => {
    await reloadDetail();
    onTransitioned?.();
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await adminServices.addApplicationNote(application.id, newNote.trim());
    setNewNote("");
    await reloadDetail();
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) return;
    await adminServices.reopenApplication(application.id, reopenReason.trim());
    setReopenOpen(false);
    setReopenReason("");
    await handleTransitionSuccess();
  };

  const handleSendContract = async () => {
    await adminServices.sendContract(application.id);
    await reloadDetail();
  };

  const handleResendContract = async () => {
    await adminServices.resendContract(application.id);
    await reloadDetail();
  };

  const handleCancelContract = async () => {
    await adminServices.cancelContract(application.id);
    await reloadDetail();
  };

  const statusIcon = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "queued" || s === "accepted") return "⏳";
    if (s === "sent") return "✉️";
    if (s === "delivered") return "✅";
    if (s === "opened") return "📖";
    if (["bounced", "failed", "undelivered", "complained"].includes(s)) return "❌";
    return "•";
  };

  const handleRetryCommunication = async (logId) => {
    setRetryingLogId(logId);
    try {
      await adminServices.retryCommunicationLog(logId);
      await reloadDetail();
    } finally {
      setRetryingLogId(null);
    }
  };

  const handleMarkContractSigned = async () => {
    await adminServices.markContractSigned(application.id);
    await reloadDetail();
    onTransitioned?.();
  };

  const handleVerifyPayment = async () => {
    setVerifyingPayment(true);
    try {
      await adminServices.verifyApplicationPaymentDetails(application.id);
      await reloadDetail();
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleScheduleCall = async () => {
    if (!callAt) return;
    setCallBusy(true);
    try {
      await adminServices.scheduleOnboardingCall(application.id, new Date(callAt).toISOString());
      await reloadDetail();
    } finally {
      setCallBusy(false);
    }
  };

  const handleCompleteCall = async () => {
    setCallBusy(true);
    try {
      await adminServices.completeOnboardingCall(application.id, callNotes);
      setCallNotes("");
      await handleTransitionSuccess();
    } finally {
      setCallBusy(false);
    }
  };

  const handleRescheduleCall = async () => {
    if (!callAt) return;
    setCallBusy(true);
    try {
      await adminServices.rescheduleOnboardingCall(application.id, new Date(callAt).toISOString(), callReason);
      setCallReason("");
      await reloadDetail();
    } finally {
      setCallBusy(false);
    }
  };

  const handleNoShow = async (action = "none") => {
    setCallBusy(true);
    try {
      await adminServices.markOnboardingCallNoShow(application.id, {
        action,
        reason: callReason || "Driver no-show",
        scheduledAt: action === "reschedule" && callAt ? new Date(callAt).toISOString() : undefined,
      });
      await handleTransitionSuccess();
    } finally {
      setCallBusy(false);
    }
  };

  const handleApproveDecision = async () => {
    setDecisionBusy(true);
    try {
      await adminServices.approveApplicationFinal(application.id, decisionNotes);
      setDecisionNotes("");
      await handleTransitionSuccess();
    } finally {
      setDecisionBusy(false);
    }
  };

  const handleRejectDecision = async () => {
    setDecisionBusy(true);
    try {
      await adminServices.rejectApplicationFinal(application.id, decisionReason, decisionNotes);
      setDecisionNotes("");
      await handleTransitionSuccess();
    } finally {
      setDecisionBusy(false);
    }
  };

  const handleAssignFirstBlock = async () => {
    if (!fbAssignAt) return;
    setFbBusy(true);
    try {
      await adminServices.assignFirstBlock(application.id, new Date(fbAssignAt).toISOString());
      setFbAssignAt("");
      await handleTransitionSuccess();
    } finally {
      setFbBusy(false);
    }
  };

  const handleRescheduleFirstBlockPanel = async () => {
    if (!fbRescheduleAt) return;
    setFbBusy(true);
    try {
      await adminServices.rescheduleFirstBlock(
        application.id,
        new Date(fbRescheduleAt).toISOString(),
        fbRescheduleReason
      );
      setFbRescheduleAt("");
      setFbRescheduleReason("");
      await reloadDetail();
    } finally {
      setFbBusy(false);
    }
  };

  const handleFirstBlockPass = async () => {
    setFbBusy(true);
    try {
      await adminServices.recordFirstBlockResult(application.id, "passed", fbResultNotes);
      setFbResultNotes("");
      setFbConfirmPass(false);
      await handleTransitionSuccess();
    } finally {
      setFbBusy(false);
    }
  };

  const handleFirstBlockFail = async () => {
    setFbBusy(true);
    try {
      await adminServices.recordFirstBlockResult(application.id, "failed", fbResultNotes);
      setFbResultNotes("");
      setFbConfirmFail(false);
      await handleTransitionSuccess();
    } finally {
      setFbBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent className="adm-modal max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{fullName || "Application"}</span>
            {application?.currentStage && <StageBadge stage={application.currentStage} />}
          </DialogTitle>
        </DialogHeader>

        {loading || !application ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100/90 border border-slate-200 p-1">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="decision">Decision</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Email:</strong> {application.email || "-"}</div>
                <div><strong>Phone:</strong> {application.phone || "-"}</div>
                <div><strong>City:</strong> {application.city || "-"}</div>
                <div><strong>Vehicle:</strong> {application.vehicleType || "-"}</div>
                <div><strong>Job:</strong> {application.job?.title || "-"}</div>
                <div><strong>Job city:</strong> {application.job?.city?.city || "-"}</div>
              </div>
              {application.firstBlockDate || application.firstBlockResult ? (
                <div className="adm-panel p-3 bg-slate-50/70 space-y-1 text-sm">
                  <div className="font-semibold">First block</div>
                  <div>
                    <strong>Date:</strong>{" "}
                    {application.firstBlockDate
                      ? new Date(application.firstBlockDate).toLocaleString()
                      : "—"}
                  </div>
                  <div>
                    <strong>Result:</strong> {application.firstBlockResult || "—"}
                  </div>
                </div>
              ) : null}
              {application?.questionnaireResponses?.length ? (
                <div className="adm-panel p-3 bg-white space-y-2">
                  <div className="text-sm font-semibold">Assessment Result</div>
                  {(() => {
                    const latest = application.questionnaireResponses[0];
                    return (
                      <>
                        <div className="text-sm">
                          Score: {latest.score ?? "-"}%{" "}
                          {latest.passed ? (
                            <span className="inline-flex rounded bg-green-100 px-2 py-1 text-xs text-green-700">Passed</span>
                          ) : (
                            <span className="inline-flex rounded bg-red-100 px-2 py-1 text-xs text-red-700">Failed</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {(latest.questionnaire?.questions || []).map((q) => {
                            const options = Array.isArray(q.options) ? q.options : [];
                            const selectedValue = latest.answers?.[q.id];
                            const selected = options.find((o) => String(o.value) === String(selectedValue));
                            const correct = options.find((o) => Boolean(o.isCorrect));
                            const isCorrect = correct && selected && String(correct.value) === String(selected.value);
                            return (
                              <div key={q.id} className="rounded border border-slate-200 p-2 text-xs bg-slate-50/30">
                                <div className="font-medium">{q.questionText}</div>
                                <div className={isCorrect ? "text-green-700" : "text-red-700"}>
                                  Driver: {selected?.label || "-"}
                                </div>
                                <div className="text-gray-600">Correct: {correct?.label || "-"}</div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <div className="space-y-2">
                {(application.stageHistory || []).map((row) => (
                  <div key={row.id} className="adm-panel p-3 text-sm">
                    <div className="font-medium">{row.fromStage || "start"} -&gt; {row.toStage}</div>
                    <div className="text-gray-600">
                      {new Date(row.occurredAt).toLocaleString()} | {row.actorType || "system"} {row.actorEmail ? `(${row.actorEmail})` : ""}
                    </div>
                    {row.reason ? <div className="text-gray-700 mt-1">Reason: {row.reason}</div> : null}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Suspense fallback={<p className="text-sm text-gray-600">Loading document reviewer...</p>}>
                <DocumentReviewer applicationId={application?.id} onReviewed={reloadDetail} />
              </Suspense>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <div className="space-y-3">
                {(notes || []).length ? (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="adm-panel p-3">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {note.authorEmail} · {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No notes yet.</p>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                  />
                  <Button onClick={handleAddNote}>Add Note</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="communications" className="mt-4">
              <div className="space-y-2">
                {communications.some(
                  (log) =>
                    log.channel === "email" &&
                    ["bounced", "failed", "complained"].includes(String(log.status || "").toLowerCase())
                ) ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
                    ⚠️ Email delivery failed - email may be invalid.
                  </div>
                ) : null}
                {communications.length === 0 ? (
                  <p className="text-sm text-gray-600">No communication log entries yet.</p>
                ) : (
                  communications.map((log) => (
                    <div key={log.id} className="adm-panel p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="font-medium">
                          {statusIcon(log.status)} {log.channel?.toUpperCase() || "CHANNEL"} -{" "}
                          {log.subject || "(no subject)"}
                        </div>
                        <div className="text-gray-600">
                          {log.status || "queued"} |{" "}
                          {log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Recipient: {log.recipientEmail || log.recipientPhone || "-"}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpandedCommId((prev) => (prev === log.id ? null : log.id))
                            }
                          >
                            {expandedCommId === log.id ? "Hide Body" : "View Body"}
                          </Button>
                          {["bounced", "failed", "undelivered", "complained"].includes(
                            String(log.status || "").toLowerCase()
                          ) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryCommunication(log.id)}
                              disabled={retryingLogId === log.id}
                            >
                              {retryingLogId === log.id ? "Retrying..." : "Retry"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {expandedCommId === log.id ? (
                        <div className="mt-2 p-2 rounded bg-gray-50 text-sm whitespace-pre-wrap">
                          {log.body || log.errorMessage || "(no body)"}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="payment" className="mt-4">
              {paymentLoading ? (
                <p className="text-sm text-gray-600">Loading payment details...</p>
              ) : !paymentDetails?.hasSubmission ? (
                <p className="text-sm text-gray-600">No payment details submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 flex items-center gap-2">
                    <span>
                      Submitted: {paymentDetails?.submittedAt ? new Date(paymentDetails.submittedAt).toLocaleString() : "-"}
                    </span>
                    {paymentDetails?.verifiedAt ? (
                      <span className="inline-flex rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">
                        Pending verification
                      </span>
                    )}
                  </div>
                  <div className="adm-panel">
                    <div className="grid grid-cols-1 gap-0 divide-y">
                      {Object.entries(paymentDetails?.details || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 text-sm">
                          <span className="text-gray-600">{key.replaceAll("_", " ")}</span>
                          <span className="font-medium text-gray-900">{String(value || "-")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {!paymentDetails?.verifiedAt ? (
                    <Button variant="outline" onClick={handleVerifyPayment} disabled={verifyingPayment}>
                      {verifyingPayment ? "Verifying..." : "Verify Payment Details"}
                    </Button>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Verified by {paymentDetails?.verifiedBy || "-"} on {new Date(paymentDetails.verifiedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="decision" className="mt-4">
              {!decisionSummary ? (
                <p className="text-sm text-gray-600">Decision summary unavailable.</p>
              ) : (
                <div className="space-y-3">
                  <div className="adm-panel p-3 bg-white">
                    <div className="text-sm">
                      Recommendation:{" "}
                      <span className={
                        decisionSummary.recommendation === "approve"
                          ? "text-green-700 font-semibold"
                          : decisionSummary.recommendation === "reject"
                            ? "text-red-700 font-semibold"
                            : "text-amber-700 font-semibold"
                      }>
                        {String(decisionSummary.recommendation || "review").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="rounded border border-slate-200 p-2 bg-white">Screening: {decisionSummary.screeningProgress?.done}/{decisionSummary.screeningProgress?.total}</div>
                    <div className="rounded border border-slate-200 p-2 bg-white">Documents: {decisionSummary.documentsStatus?.approvedRequired}/{decisionSummary.documentsStatus?.totalRequired}</div>
                    <div className="rounded border border-slate-200 p-2 bg-white">Contract: {decisionSummary.contractStatus?.isSigned ? "Signed" : decisionSummary.contractStatus?.status || "Pending"}</div>
                    <div className="rounded border border-slate-200 p-2 bg-white">Payment: {decisionSummary.paymentDetails?.verified ? "Verified" : decisionSummary.paymentDetails?.submitted ? "Submitted" : "Missing"}</div>
                    <div className="rounded border border-slate-200 p-2 bg-white">Assessment: {decisionSummary.questionnaireResult?.score ?? "-"}% {decisionSummary.questionnaireResult?.passed ? "(Passed)" : "(Failed)"}</div>
                    <div className="rounded border border-slate-200 p-2 bg-white">Call notes: {decisionSummary.callNotes?.notes || "-"}</div>
                  </div>
                  <Input
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Decision notes (optional)"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={handleApproveDecision} disabled={decisionBusy || application.currentStage !== "decision_pending"}>
                      ✅ Approve
                    </Button>
                    <select
                      className="h-10 rounded-md border px-3 text-sm"
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      disabled={application.currentStage !== "decision_pending"}
                    >
                      {adminServices.getRejectionReasons().map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <Button variant="outline" onClick={handleRejectDecision} disabled={decisionBusy || application.currentStage !== "decision_pending"}>
                      ❌ Reject
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="actions" className="mt-4 space-y-3">
              <div className="text-sm text-gray-700">Move this application to the next valid stage with confirmation.</div>
              {(application.currentStage === "acknowledgements" ||
                application.currentStage === "contract_sent" ||
                application.currentStage === "contract_signed") && (
                <div className="adm-panel p-3 bg-gray-50 space-y-2">
                  <div className="text-sm font-medium">Contract</div>
                  <div className="text-xs text-gray-600">
                    Status: {contractStatusData?.contractStatus || application.contractStatus || "not_sent"}
                    {application.contractSignedAt
                      ? ` | Signed on ${new Date(application.contractSignedAt).toLocaleString()}`
                      : ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    Method: {(contractStatusData?.contractStatus || application.contractStatus) === "sent_manual" ? "Manual" : "Dropbox Sign"}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {application.currentStage === "acknowledgements" && (
                      <Button variant="outline" onClick={handleSendContract}>
                        Send Contract
                      </Button>
                    )}
                    {application.currentStage === "contract_sent" && (
                      <>
                        <Button variant="outline" onClick={handleResendContract}>
                          Resend Reminder
                        </Button>
                        <Button variant="outline" onClick={handleCancelContract}>
                          Cancel Contract
                        </Button>
                        <Button variant="outline" onClick={handleMarkContractSigned}>
                          Mark as Signed
                        </Button>
                      </>
                    )}
                    {application.contractStatus === "send_failed" && (
                      <Button variant="outline" onClick={handleSendContract}>
                        Retry Send
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {application.currentStage === "onboarding_call" ? (
                <div className="adm-panel p-3 bg-gray-50 space-y-3">
                  <div className="text-sm font-medium">Onboarding Call</div>
                  <div className="text-xs text-gray-600">
                    {application.onboardingCallScheduledAt
                      ? `Scheduled for ${new Date(application.onboardingCallScheduledAt).toLocaleString()}`
                      : "Not yet scheduled"}
                  </div>
                  <div className="text-sm">
                    Phone:{" "}
                    {application.phone ? (
                      <a href={`tel:${application.phone}`} className="underline">
                        {application.phone}
                      </a>
                    ) : "-"}
                  </div>
                  <Input
                    type="datetime-local"
                    value={callAt}
                    onChange={(e) => setCallAt(e.target.value)}
                    placeholder="Schedule date/time"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={handleScheduleCall} disabled={!callAt || callBusy}>
                      Schedule
                    </Button>
                    <Button variant="outline" onClick={handleRescheduleCall} disabled={!callAt || callBusy}>
                      Reschedule
                    </Button>
                  </div>
                  <Input
                    value={callReason}
                    onChange={(e) => setCallReason(e.target.value)}
                    placeholder="Reschedule reason (optional)"
                  />
                  <Input
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Call notes"
                  />
                  <Button variant="outline" onClick={handleCompleteCall} disabled={callBusy}>
                    Complete Call (move to questionnaire)
                  </Button>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => handleNoShow("none")} disabled={callBusy}>
                      Mark No Show
                    </Button>
                    <Button variant="outline" onClick={() => handleNoShow("reschedule")} disabled={callBusy || !callAt}>
                      No Show + Reschedule
                    </Button>
                    <Button variant="outline" onClick={() => handleNoShow("reject")} disabled={callBusy}>
                      No Show + Reject
                    </Button>
                  </div>
                </div>
              ) : null}
              {application.currentStage === "approved" ? (
                <div className="adm-panel p-3 bg-emerald-50/80 space-y-3">
                  <div className="text-sm font-medium">First block</div>
                  <p className="text-xs text-gray-600">
                    Assign a date and time for the driver&apos;s first block. They will be moved to{" "}
                    <span className="font-medium">first block assigned</span> and notified (if templates are configured).
                  </p>
                  <Input
                    type="datetime-local"
                    value={fbAssignAt}
                    onChange={(e) => setFbAssignAt(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleAssignFirstBlock} disabled={!fbAssignAt || fbBusy}>
                    {fbBusy ? "Saving…" : "Assign first block"}
                  </Button>
                </div>
              ) : null}
              {application.currentStage === "first_block_assigned" ? (
                <div className="adm-panel p-3 bg-emerald-50/80 space-y-3">
                  <div className="text-sm font-medium">First block scheduled</div>
                  <p className="text-xs text-gray-700">
                    {application.firstBlockDate
                      ? new Date(application.firstBlockDate).toLocaleString()
                      : "No date set — use reschedule below."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="text-green-800 border-green-300" onClick={() => { setFbConfirmPass(true); setFbResultNotes(""); }}>
                      Record pass
                    </Button>
                    <Button variant="outline" className="text-red-800 border-red-300" onClick={() => { setFbConfirmFail(true); setFbResultNotes(""); }}>
                      Record fail
                    </Button>
                  </div>
                  <div className="text-xs font-medium text-gray-700 pt-1">Reschedule</div>
                  <Input
                    type="datetime-local"
                    value={fbRescheduleAt}
                    onChange={(e) => setFbRescheduleAt(e.target.value)}
                  />
                  <Input
                    value={fbRescheduleReason}
                    onChange={(e) => setFbRescheduleReason(e.target.value)}
                    placeholder="Reason (optional)"
                  />
                  <Button variant="outline" onClick={handleRescheduleFirstBlockPanel} disabled={!fbRescheduleAt || fbBusy}>
                    {fbBusy ? "Saving…" : "Update block date"}
                  </Button>
                </div>
              ) : null}
              {application.currentStage === "active" ? (
                <div className="adm-panel p-3 bg-green-50 space-y-1">
                  <div className="text-sm font-medium text-green-900">Driver is active</div>
                  <p className="text-xs text-green-800">
                    Active since{" "}
                    {application.currentStageEnteredAt
                      ? new Date(application.currentStageEnteredAt).toLocaleString()
                      : "—"}
                    .
                  </p>
                  {application.firstBlockDate ? (
                    <p className="text-xs text-gray-600">
                      First block: {new Date(application.firstBlockDate).toLocaleString()}
                      {application.firstBlockResult ? ` · ${application.firstBlockResult}` : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {canTransition && availableTransitions
                  .filter((stage) => stage !== "rejected" && stage !== "withdrawn")
                  .map((stage) => (
                  <Button key={stage} variant="outline" onClick={() => setDialogStage(stage)}>
                    Move to {stage.replaceAll("_", " ")}
                  </Button>
                ))}
                {canTransition && availableTransitions.includes("rejected") && (
                  <Button className="bg-red-600 hover:bg-red-700" onClick={() => setDialogStage("rejected")}>
                    Reject
                  </Button>
                )}
                {canReopen && (application.currentStage === "rejected" || application.currentStage === "withdrawn") ? (
                  <Button variant="outline" onClick={() => setReopenOpen(true)}>
                    Re-open Application
                  </Button>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
      <TransitionDialog
        open={canTransition && Boolean(dialogStage)}
        onClose={() => setDialogStage("")}
        application={application}
        toStage={dialogStage}
        onSuccess={handleTransitionSuccess}
      />
      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent className="adm-modal">
          <DialogHeader>
            <DialogTitle>Re-open application</DialogTitle>
          </DialogHeader>
          <Input
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Reason (required)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>Cancel</Button>
            <Button onClick={handleReopen} disabled={!reopenReason.trim()}>Confirm Re-open</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fbConfirmPass} onOpenChange={setFbConfirmPass}>
        <DialogContent className="adm-modal">
          <DialogHeader>
            <DialogTitle>Confirm first block passed</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">This moves the application to active and sends the welcome notification if configured.</p>
          <Textarea value={fbResultNotes} onChange={(e) => setFbResultNotes(e.target.value)} placeholder="Notes (optional)" rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFbConfirmPass(false)}>Cancel</Button>
            <Button className="bg-green-700 hover:bg-green-800" onClick={handleFirstBlockPass} disabled={fbBusy}>
              {fbBusy ? "Saving…" : "Confirm pass"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fbConfirmFail} onOpenChange={setFbConfirmFail}>
        <DialogContent className="adm-modal">
          <DialogHeader>
            <DialogTitle>Confirm first block failed</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">The application will be rejected with reason &quot;failed first block&quot;.</p>
          <Textarea value={fbResultNotes} onChange={(e) => setFbResultNotes(e.target.value)} placeholder="Notes (optional)" rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFbConfirmFail(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleFirstBlockFail} disabled={fbBusy}>
              {fbBusy ? "Saving…" : "Confirm fail"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ApplicationDetailPanel;
