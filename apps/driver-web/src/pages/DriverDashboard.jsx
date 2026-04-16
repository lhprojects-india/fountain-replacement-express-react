import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PageLayout,
  PRODUCT_DISPLAY_NAME,
  Textarea,
} from "@lh/shared";
import { useAuth } from "../context/AuthContext";
import StageTimeline from "../components/StageTimeline";
import StageActionPanel from "../components/StageActionPanel";
import { publicServices } from "../lib/public-services";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    application,
    isLoading,
    getSession,
    loadDriverApplication,
    signOut,
  } = useAuth();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [documentProgress, setDocumentProgress] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        await getSession();
        await loadDriverApplication();
      } catch (error) {
      }
    };
    load();
  }, [getSession, loadDriverApplication]);

  useEffect(() => {
    const loadDocumentProgress = async () => {
      if (application?.currentStage !== "documents_pending") {
        setDocumentProgress(null);
        return;
      }
      try {
        const result = await publicServices.getDriverDocuments();
        const completeness = result?.completeness || {};
        setDocumentProgress({
          done: Number(completeness.submitted || 0),
          total: Number(completeness.totalRequired || 0),
        });
      } catch (error) {
        setDocumentProgress(null);
      }
    };
    loadDocumentProgress();
  }, [application?.currentStage]);

  const currentStage = application?.currentStage || "applied";
  const canWithdraw = !["rejected", "withdrawn", "active", "first_block_failed"].includes(currentStage);
  const stageLabel = application?.stageConfig?.label || "Applied";
  const stageDescription =
    application?.stageConfig?.description || "Your application is in progress.";
  const recentNotifications = (application?.timeline || [])
    .slice(-5)
    .reverse()
    .map((item, idx) => ({
      id: `${item.occurredAt || ""}-${idx}`,
      title: `Stage updated to ${String(item.toStage || "").replaceAll("_", " ")}`,
      time: item.occurredAt ? new Date(item.occurredAt).toLocaleString() : "Recent",
      body: "Check your email for details and next actions.",
    }));

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await publicServices.withdrawDriverApplication(withdrawReason);
      await loadDriverApplication();
      setWithdrawOpen(false);
      setWithdrawReason("");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <PageLayout title="Driver Dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-brand-shadeBlue">
            Welcome, {application?.firstName || currentUser?.name || "Driver"}!
          </h1>
          <Button onClick={handleLogout}>Logout</Button>
        </section>

        <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-sm text-gray-600">Application status</p>
          <h2 className="text-xl font-semibold text-brand-shadeBlue mt-1">
            Your application is in: {stageLabel}
          </h2>
          <p className="mt-2 text-gray-700">{stageDescription}</p>
          {application?.currentStage === "onboarding_call" && application?.paymentDetailsSubmitted ? (
            <p className="mt-2 text-sm text-green-700">
              Payment details received. Your onboarding call will be scheduled.
            </p>
          ) : null}
          {application?.currentStage === "approved" ? (
            <p className="mt-2 text-sm text-green-700">
              Congratulations! You&apos;ve been approved to join the {PRODUCT_DISPLAY_NAME} driver team. Your first block will be assigned soon.
            </p>
          ) : null}
          {application?.currentStage === "first_block_assigned" ? (
            <div className="mt-3 space-y-2 text-sm text-gray-800">
              {application?.firstBlockDate ? (
                <p>
                  Your first block is scheduled for{" "}
                  <strong>{new Date(application.firstBlockDate).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</strong>.
                </p>
              ) : (
                <p>Your first block is being scheduled. You will see the date here once it is set.</p>
              )}
              <p>Please arrive at your assigned facility on time.</p>
              {application?.facilities?.length ? (
                <div className="rounded-md border border-blue-100 bg-white/80 p-3">
                  <p className="font-medium text-brand-shadeBlue">Facility information</p>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    {application.facilities.map((f) => (
                      <li key={f.code || f.city}>
                        {[f.city, f.address].filter(Boolean).join(" · ") || f.code || "Facility"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="text-gray-600">
                Questions? Contact us using the phone or email on your application summary below.
              </p>
            </div>
          ) : null}
          {application?.currentStage === "active" ? (
            <div className="mt-3 space-y-2 text-sm text-gray-800">
              <p className="text-lg font-semibold text-green-800">Welcome to the {PRODUCT_DISPLAY_NAME} driver team!</p>
              <p>You are now an active driver.</p>
              {application?.currentStageEnteredAt ? (
                <p className="text-gray-600">
                  Active since {new Date(application.currentStageEnteredAt).toLocaleDateString(undefined, { dateStyle: "long" })}.
                </p>
              ) : null}
            </div>
          ) : null}
          {application?.currentStage === "rejected" ? (
            <p className="mt-2 text-sm text-amber-700">
              {application?.rejectionReason === "failed_first_block" ? (
                <>
                  Unfortunately, your first block was not successful and we are unable to proceed. If you have questions,
                  please contact us using the details below.
                </>
              ) : (
                <>
                  Thank you for your interest. Unfortunately, we&apos;re unable to proceed at this time.
                  {application?.rejectionReason ? ` Reason: ${application.rejectionReason.replaceAll("_", " ")}.` : ""}
                </>
              )}
            </p>
          ) : null}
          {canWithdraw ? (
            <div className="mt-4">
              <Button variant="outline" onClick={() => setWithdrawOpen(true)}>
                Withdraw Application
              </Button>
            </div>
          ) : null}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-brand-shadeBlue mb-4">Application Timeline</h2>
          <StageTimeline currentStage={currentStage} />
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-brand-shadeBlue mb-3">Next Action</h2>
          <StageActionPanel application={application} documentProgress={documentProgress} />
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-brand-shadeBlue mb-3">Notification Center</h2>
          {recentNotifications.length ? (
            <div className="space-y-2">
              {recentNotifications.map((note) => (
                <div key={note.id} className="rounded border p-3">
                  <p className="text-sm font-medium text-gray-900">{note.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{note.time}</p>
                  <p className="text-sm text-gray-700 mt-1">{note.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent notifications yet.</p>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-brand-shadeBlue mb-4">Application Summary</h2>
          {isLoading && !application ? (
            <p className="text-gray-600">Loading application...</p>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="text-gray-900">
                  {application?.firstName} {application?.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{application?.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{application?.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Vehicle</dt>
                <dd className="text-gray-900">{application?.vehicleType || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Job</dt>
                <dd className="text-gray-900">{application?.job?.title || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">City</dt>
                <dd className="text-gray-900">{application?.job?.city?.city || "-"}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw application?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to withdraw your application? This action can be reversed by our team.
          </p>
          <Textarea
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={withdrawing}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={withdrawing} className="bg-red-600 hover:bg-red-700">
              {withdrawing ? "Withdrawing..." : "Confirm Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default DriverDashboard;
