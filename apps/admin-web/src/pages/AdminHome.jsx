import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@lh/shared";
import { adminServices } from "../lib/admin-services";
import { useAdminAuth } from "../context/AdminAuthContext";

function Card({ title, value, hint }) {
  return (
    <div className="adm-stat-card">
      <div className="text-xs text-slate-500 font-medium">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint ? <div className="text-xs text-slate-500 mt-1">{hint}</div> : null}
    </div>
  );
}

export default function AdminHome({ onCounts }) {
  const { currentUser } = useAdminAuth();
  const [stats, setStats] = useState({ byStage: {} });
  const [activity, setActivity] = useState([]);
  const [attention, setAttention] = useState({ overdueReview: 0, docsOver48h: 0, callsPastDue: 0 });
  const [loading, setLoading] = useState(true);
  const [analyticsRange, setAnalyticsRange] = useState(
    () => localStorage.getItem("adminAnalyticsDefaultRange") || "7d"
  );
  const [theme] = useState(() => localStorage.getItem("adminTheme") || "light");

  useEffect(() => {
    let live = true;
    const run = async () => {
      setLoading(true);
      try {
        const [s, a, queue, pendingReview, docsReview] = await Promise.all([
          adminServices.getApplicationStats(),
          adminServices.getRecentActivity(10),
          adminServices.getCallQueue().catch(() => ({ all: [] })),
          adminServices.getApplications({
            stages: ["pending_review"],
            page: 1,
            pageSize: 100,
            sortBy: "currentStageEnteredAt",
            sortOrder: "asc",
          }).catch(() => ({ applications: [] })),
          adminServices.getApplications({
            stages: ["documents_under_review"],
            page: 1,
            pageSize: 100,
            sortBy: "currentStageEnteredAt",
            sortOrder: "asc",
          }).catch(() => ({ applications: [] })),
        ]);
        if (!live) return;
        setStats(s || { byStage: {} });
        const rows = a?.activity || [];
        setActivity(rows);

        const overdueReview = (pendingReview?.applications || []).filter((app) => Boolean(app?.isOverdue)).length;
        const docsOver48h = (docsReview?.applications || []).filter((app) => Boolean(app?.isOverdue)).length;
        const callsPastDue = (queue?.all || []).filter(
          (row) => row.scheduledAt && new Date(row.scheduledAt) < new Date()
        ).length;
        setAttention({ overdueReview, docsOver48h, callsPastDue });

        const pipeline = Object.entries(s?.byStage || {})
          .filter(([stage]) => !["active", "rejected", "withdrawn", "first_block_failed"].includes(stage))
          .reduce((sum, [, count]) => sum + Number(count || 0), 0);
        onCounts?.({ pipeline, calls: Number(s?.byStage?.onboarding_call || 0) });
      } finally {
        if (live) setLoading(false);
      }
    };
    run();
    return () => {
      live = false;
    };
  }, [onCounts]);

  const kpis = useMemo(() => {
    const byStage = stats?.byStage || {};
    return [
      { title: "New", value: Number(byStage.pending_review || 0) },
      { title: "Review", value: Number(byStage.screening || 0) },
      { title: "Assessment", value: Number(byStage.questionnaire || 0) },
      { title: "Docs", value: Number(byStage.documents_under_review || 0) },
      { title: "Approved", value: Number(byStage.approved || 0) },
    ];
  }, [stats]);

  useEffect(() => {
    localStorage.setItem("adminAnalyticsDefaultRange", analyticsRange);
  }, [analyticsRange]);

  return (
    <div className="space-y-5">
      <section className="adm-card p-5">
        <h1 className="text-2xl font-semibold text-slate-900">
          Good morning, {currentUser?.name || currentUser?.email?.split("@")[0] || "Admin"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here is your hiring pipeline overview for today.
        </p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => <Card key={kpi.title} title={kpi.title} value={loading ? "..." : kpi.value} />)}
      </section>

      <section className="adm-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Needs attention</h2>
          <Link to="/pipeline" className="text-sm text-sky-700 font-medium">View all</Link>
        </div>
        <ul className="mt-3 text-sm text-slate-700 space-y-2">
          <li>{attention.overdueReview} applications overdue in pending review</li>
          <li>{attention.docsOver48h} applications overdue in documents review</li>
          <li>{attention.callsPastDue} calls past scheduled time</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Overdue is calculated using stage SLAs (e.g. documents under review: 48h).
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 adm-card p-5">
          <h2 className="font-semibold">Recent activity</h2>
          <div className="mt-3 space-y-2">
            {activity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity.</p>
            ) : activity.slice(0, 10).map((item) => (
              <div key={item.id} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
                <span className="font-medium">{item.applicationName || item.applicationEmail || `Application #${item.applicationId}`}</span>
                {" "}
                moved to <span className="text-sky-700">{item.toStage}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="adm-card p-5">
          <h2 className="font-semibold">Quick actions</h2>
          <div className="mt-3 space-y-2.5">
            <Link
              to="/jobs"
              className="h-10 w-full inline-flex items-center justify-between rounded-lg border border-sky-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-sky-50/60 transition-colors"
            >
              <span>Create Job</span>
              <span className="text-sky-700">→</span>
            </Link>
            <Link
              to="/pipeline"
              className="h-10 w-full inline-flex items-center justify-between rounded-lg border border-sky-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-sky-50/60 transition-colors"
            >
              <span>Review Documents</span>
              <span className="text-sky-700">→</span>
            </Link>
            <Link
              to="/pipeline"
              className="h-10 w-full inline-flex items-center justify-between rounded-lg border border-sky-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-sky-50/60 transition-colors"
            >
              <span>View Pipeline</span>
              <span className="text-sky-700">→</span>
            </Link>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
            <p className="text-sm font-medium">Preferences</p>
            <label className="text-xs text-slate-600 block">
              Default analytics range
              <select
                value={analyticsRange}
                onChange={(e) => setAnalyticsRange(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-slate-300 px-2.5 text-sm bg-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </label>
            <p className="text-xs text-slate-500">Theme: {theme} (dark mode scaffolded for later).</p>
          </div>
        </div>
      </section>
    </div>
  );
}
