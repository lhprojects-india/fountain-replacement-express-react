import { useState, useEffect } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminServices } from "../lib/admin-services";
import FeeStructureManager from "../components/admin/FeeStructureManager";
import FacilityManager from "../components/admin/FacilityManager";
import RegionManager from "../components/admin/RegionManager";
import JobManager from "../components/admin/JobManager";
import AdminManager from "../components/admin/AdminManager";
import EmailTemplateManager from "../components/admin/EmailTemplateManager";
import NotificationSettingsManager from "../components/admin/NotificationSettingsManager";
import CommunicationsOverview from "../components/admin/CommunicationsOverview";
import QuestionnaireBuilder from "../components/admin/QuestionnaireBuilder";
import ApplicationPipeline from "../components/admin/ApplicationPipeline";
import AnalyticsDashboard from "../components/admin/AnalyticsDashboard";
import AdminErrorBoundary from "../components/admin/AdminErrorBoundary";
import { Button } from "@lh/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lh/shared";
import { Badge } from "@lh/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lh/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@lh/shared";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@lh/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lh/shared";
import { Textarea } from "@lh/shared";
import { Input } from "@lh/shared";
import { useToast } from "@lh/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@lh/shared";
import {
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  FileText,
  User,
  Phone,
  Mail,
  Briefcase,
  Trash2,
  Users,
  ChevronRight,
  Printer,
  Settings,
  LogOut,
  Edit,
  BarChart3,
  RefreshCw,
  UserCheck,
  PauseCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@lh/shared";
import { getCurrentStage } from "@lh/shared";
import { LaundryheapLogo, ProductBrandHeading } from "@lh/shared";
import { getVehicleTypeFromMOT } from "@lh/shared";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@lh/shared";

const DAYS_ORDER = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];

export default function AdminDashboard() {
  const { currentUser, isAuthorized, signOut, adminRole } = useAdminAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  const [applicationToReset, setApplicationToReset] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [onboardingFilter, setOnboardingFilter] = useState("completed");
  const [cityFilter, setCityFilter] = useState("all");
  const [navCounts, setNavCounts] = useState({ pipelineActive: 0, publishedJobs: 0 });

  useEffect(() => {
    // Add admin-page class to body to enable text selection
    document.body.classList.add('admin-page');

    // Only load data if user is authenticated and authorized
    if (currentUser && isAuthorized) {
      loadData();
    }

    // Cleanup: remove class when component unmounts
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, [currentUser, isAuthorized]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let [applicationsData, statsData, jobsData] = await Promise.all([
        adminServices.getAllApplications(),
        adminServices.getApplicationStats(),
        adminServices.getAllJobs()
      ]);

      // Filter by accessible cities if restricted
      if (currentUser?.accessibleCities?.length > 0 && adminRole !== 'super_admin') {
        const accessibleCitiesLower = currentUser.accessibleCities.map(c => c.toLowerCase());
        applicationsData = applicationsData.filter(app => app.city && accessibleCitiesLower.includes(app.city.toLowerCase()));

        // Recalculate stats from filtered applications
        statsData = {
          total: applicationsData.length,
          pending: applicationsData.filter(app => !app.status || app.status === 'pending').length,
          onHold: applicationsData.filter(app => app.status === 'on_hold').length,
          approved: applicationsData.filter(app => app.status === 'approved').length,
          hired: applicationsData.filter(app => app.status === 'hired').length,
          rejected: applicationsData.filter(app => app.status === 'rejected').length,
          completed: applicationsData.filter(app => app.onboardingStatus === 'completed').length,
          inProgress: applicationsData.filter(app => app.onboardingStatus === 'started').length,
        };
      }

      setApplications(applicationsData);
      setStats(statsData);
      const byStage = statsData?.byStage || {};
      const pipelineActive = Object.entries(byStage)
        .filter(([stage]) => !["rejected", "withdrawn", "active", "first_block_failed"].includes(stage))
        .reduce((sum, [, count]) => sum + Number(count || 0), 0);
      const publishedJobs = (jobsData || []).filter((job) => Boolean(job.isPublished)).length;
      setNavCounts({ pipelineActive, publishedJobs });
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Unable to load admin data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (email, status) => {
    try {
      const success = await adminServices.updateApplicationStatus(email, status, adminNotes);
      if (success) {
        toast({
          title: "Status updated",
          description: `Application status updated to ${status}.`,
        });
        setAdminNotes("");
        setSelectedApplication(null);
        await loadData(); // Reload data to reflect changes
      } else {
        toast({
          title: "Update failed",
          description: "Unable to update application status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message || "Unable to update application status.",
        variant: "destructive",
      });
    }
  };

  const handleResetProgress = async (email) => {
    try {
      const result = await adminServices.resetDriverProgress(email);
      if (result.success) {
        toast({
          title: "Progress reset",
          description: "Driver can now restart the onboarding process.",
        });
        loadData();
      } else {
        toast({
          title: "Reset failed",
          description: result.message || "Unable to reset driver progress.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "Unable to reset driver progress.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteApplication = async (email) => {
    try {
      const success = await adminServices.deleteApplication(email);
      if (success) {
        toast({
          title: "Application deleted",
          description: "Application has been permanently deleted.",
        });
        loadData();
      } else {
        toast({
          title: "Delete failed",
          description: "Unable to delete application.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Unable to delete application.",
        variant: "destructive",
      });
    }
  };

  // Extract unique cities and stages from applications
  const uniqueCities = [...new Set(applications.map(app => app.city).filter(Boolean))].sort();
  const uniqueStages = [...new Set(applications.map(app => getCurrentStage(app)))].sort();

  // Derived analytics data
  const withdrawnCount = applications.filter(app => app.status === "withdrawn").length;
  const onHoldCount = applications.filter(app => app.status === "on_hold").length;

  const statusChartData = [
    { status: "Pending", key: "pending", count: stats.pending || 0 },
    { status: "On Hold", key: "on_hold", count: onHoldCount },
    { status: "Approved", key: "approved", count: stats.approved || 0 },
    { status: "Hired", key: "hired", count: stats.hired || 0 },
    { status: "Rejected", key: "rejected", count: stats.rejected || 0 },
    { status: "Withdrawn", key: "withdrawn", count: withdrawnCount },
  ].filter(item => item.count > 0);

  const onboardingChartData = [
    { name: "Completed", value: stats.completed || 0 },
    { name: "In Progress", value: stats.inProgress || 0 },
  ].filter(item => item.value > 0);

  const applicationsByDate = (() => {
    const dateMap = {};

    applications.forEach((app) => {
      if (!app.createdAt) return;
      const dateObj = app.createdAt instanceof Date ? app.createdAt : new Date(app.createdAt);
      if (Number.isNaN(dateObj.getTime())) return;

      const key = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!dateMap[key]) {
        dateMap[key] = { date: key, total: 0, hired: 0, rejected: 0 };
      }
      dateMap[key].total += 1;
      if (app.status === "hired") dateMap[key].hired += 1;
      if (app.status === "rejected") dateMap[key].rejected += 1;
    });

    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => ({
        ...item,
        label: new Date(item.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
      }));
  })();

  const cityInsights = (() => {
    const cityMap = {};

    applications.forEach((app) => {
      const city = app.city || "Unknown";
      if (!cityMap[city]) {
        cityMap[city] = {
          city,
          total: 0,
          hired: 0,
          completed: 0,
          rejected: 0,
        };
      }

      cityMap[city].total += 1;
      if (app.status === "hired") cityMap[city].hired += 1;
      if (app.onboardingStatus === "completed") cityMap[city].completed += 1;
      if (app.status === "rejected") cityMap[city].rejected += 1;
    });

    return Object.values(cityMap)
      .map((item) => ({
        ...item,
        // Conversion vs total applications
        conversionRate: item.total > 0 ? Math.round((item.hired / item.total) * 100) : 0,
        // Conversion vs completed applications
        completedConversionRate:
          item.completed > 0 ? Math.round((item.hired / item.completed) * 100) : 0,
      }))
      .sort((a, b) => b.hired - a.hired);
  })();

  const weeklyStatusData = (() => {
    const weekMap = new Map();
    const now = new Date();
    for (let i = 4; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - (i * 7));
      const weekKey = `${d.getFullYear()}-${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}-${d.getMonth() + 1}`;
      weekMap.set(weekKey, { label: `WK ${5 - i}`, pending: 0, approved: 0, rejected: 0 });
    }

    applications.forEach((app) => {
      if (!app.createdAt) return;
      const d = app.createdAt instanceof Date ? app.createdAt : new Date(app.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const weekKey = `${d.getFullYear()}-${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}-${d.getMonth() + 1}`;
      if (!weekMap.has(weekKey)) return;

      const row = weekMap.get(weekKey);
      if (!app.status || app.status === "pending") row.pending += 1;
      if (app.status === "approved" || app.status === "hired") row.approved += 1;
      if (app.status === "rejected") row.rejected += 1;
    });

    return Array.from(weekMap.values());
  })();

  const totalApplicants = applications.length;
  const totalApprovedOrHired = applications.filter((app) => app.status === "approved" || app.status === "hired").length;
  const totalRejected = applications.filter((app) => app.status === "rejected").length;
  const pendingReview = applications.filter((app) => !app.status || app.status === "pending" || app.status === "on_hold").length;
  const hiringRate = totalApplicants > 0 ? ((stats.hired || 0) / totalApplicants) * 100 : 0;

  const STATUS_COLORS = {
    Pending: "#FFD06D", // Brand-yellow
    "On Hold": "#FFB55D", // Brand-shadeYellow (replacing orange)
    Approved: "#04B4A8", // Brand-shadeTeal
    Hired: "#202B93", // Brand-shadeBlue
    Rejected: "#EF8EA2", // Brand-pink (using pink for rejected/destructive)
    Withdrawn: "#6b7280",
  };

  const PIE_COLORS = ["#0890F1", "#2FCCC0", "#FFD06D", "#EF8EA2", "#202B93"];

  // Count active filters
  const activeFiltersCount = [
    searchQuery && 1,
    statusFilter !== "all" && 1,
    stageFilter !== "all" && 1,
    cityFilter !== "all" && 1,
    onboardingFilter !== "all" && 1,
  ].filter(Boolean).length;

  // Filter applications based on search and filters
  const filteredApplications = applications.filter((app) => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.city?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "pending" && (!app.status || app.status === "pending")) ||
      app.status === statusFilter;

    // Stage filter
    const matchesStage = stageFilter === "all" ||
      getCurrentStage(app) === stageFilter;

    // Onboarding filter
    const matchesOnboarding = onboardingFilter === "all" ||
      app.onboardingStatus === onboardingFilter;

    // City filter
    const matchesCity = cityFilter === "all" ||
      app.city === cityFilter;

    return matchesSearch && matchesStatus && matchesStage && matchesOnboarding && matchesCity;
  });

  const getStatusBadge = (status) => {
    const labelMap = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      hired: "Hired",
      on_hold: "On Hold",
    };
    const label = labelMap[status] || "Pending";
    const badgeClass = `adm-badge adm-badge-${status || 'pending'}`;
    return <span className={badgeClass}>{label}</span>;
  };

  const getOnboardingStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="adm-badge adm-badge-completed">Completed</span>
      );
    }
    return (
      <span className="adm-badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
        In Progress
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--adm-surface)' }}>
        {/* Header Skeleton */}
        <header className="adm-header">
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-lg bg-white/20" />
            <Skeleton className="h-5 w-44 rounded bg-white/20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-36 rounded-full bg-white/20" />
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
          </div>
        </header>

        <div className="flex">
          {/* Sidebar skeleton */}
          <aside className="adm-sidebar">
            <div className="px-6 mb-8">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
            <div className="flex-1 px-3 space-y-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          </aside>

          {/* Main content skeleton */}
          <div className="adm-main flex-1 p-8 space-y-8">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="adm-stat-card border-l-4 border-gray-200">
                  <Skeleton className="h-3 w-24 mb-4" />
                  <Skeleton className="h-9 w-16" />
                </div>
              ))}
            </div>

            {/* Filter bar skeleton */}
            <div className="adm-filter-bar gap-4">
              <Skeleton className="h-11 flex-1 min-w-[280px] rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>

            {/* Table skeleton */}
            <div className="adm-card overflow-hidden">
              <div className="adm-table-header">
                <div className="grid grid-cols-8 gap-4 px-6 py-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-3 rounded" />
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen adm-tabs-sidebar" style={{ background: 'var(--adm-surface)' }}>
      {/* Fixed top header */}
      <header className="adm-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg">
            <svg width="20" height="20" viewBox="270 0 170 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M280.839 14.6317C274.557 19.0512 270.817 26.2593 270.817 33.9496V83.0697C270.817 93.8463 276.229 103.9 285.217 109.821L342.641 147.655C350.499 152.832 360.678 152.832 368.536 147.655L425.96 109.821C434.948 103.9 440.36 93.8463 440.36 83.0698V33.9496C440.36 26.2594 436.62 19.0512 430.338 14.6317L415.635 4.28764C406.826 -1.90906 394.946 -1.33884 386.769 5.67309L370.912 19.272C362.091 26.836 349.086 26.836 340.265 19.272L324.408 5.67308C316.231 -1.33884 304.351 -1.90906 295.542 4.28764L280.839 14.6317Z" fill="#FFD06D" />
            </svg>
          </div>
          <ProductBrandHeading
            mainClassName="text-xl font-bold text-white tracking-tight"
            bylineClassName="text-xs font-medium text-white/75 mt-0.5"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white">
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">{adminRole?.replace('_', ' ')}</span>
            {adminRole === "admin_view" ? (
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">View only</span>
            ) : null}
            <span className="text-sm font-medium truncate max-w-[160px] hidden sm:inline">{currentUser?.email}</span>
          </div>
          <div className="flex items-center gap-1 border-l border-white/10 pl-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="rounded-full h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="rounded-full h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs wraps both sidebar and main content */}
      <Tabs defaultValue="pipeline" className="flex">
        {/* Fixed left sidebar */}
        <aside className="adm-sidebar adm-no-scrollbar">
          <div className="px-6 mb-8">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'var(--adm-nav-bg)' }}
              >
                <svg width="22" height="22" viewBox="270 0 170 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M280.839 14.6317C274.557 19.0512 270.817 26.2593 270.817 33.9496V83.0697C270.817 93.8463 276.229 103.9 285.217 109.821L342.641 147.655C350.499 152.832 360.678 152.832 368.536 147.655L425.96 109.821C434.948 103.9 440.36 93.8463 440.36 83.0698V33.9496C440.36 26.2594 436.62 19.0512 430.338 14.6317L415.635 4.28764C406.826 -1.90906 394.946 -1.33884 386.769 5.67309L370.912 19.272C362.091 26.836 349.086 26.836 340.265 19.272L324.408 5.67308C316.231 -1.33884 304.351 -1.90906 295.542 4.28764L280.839 14.6317Z" fill="#FFD06D" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black leading-tight" style={{ color: 'var(--adm-nav-bg)' }}>Onboarding</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Admin Orchestrator</p>
              </div>
            </div>
          </div>

          <TabsList className="flex-1 flex flex-col items-stretch gap-0.5 px-3 bg-transparent h-auto">
            <TabsTrigger value="pipeline" className="adm-nav-item justify-start">
              <span>Pipeline</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/70">{navCounts.pipelineActive}</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="adm-nav-item justify-start">
              Applications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="adm-nav-item justify-start">
              Analytics
            </TabsTrigger>
            {(adminRole === "super_admin" || adminRole === "app_admin") ? (
              <TabsTrigger value="jobs" className="adm-nav-item justify-start">
                <span>Jobs</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/70">{navCounts.publishedJobs}</span>
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="settings" className="adm-nav-item justify-start">
              Settings
            </TabsTrigger>
          </TabsList>
        </aside>

        {/* Main content area */}
        <main className="adm-main flex-1">
          <div className="p-8 space-y-8">

          <TabsContent value="pipeline" className="space-y-4 mt-0">
            <AdminErrorBoundary>
              <ApplicationPipeline />
            </AdminErrorBoundary>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 mt-0">
            <AdminErrorBoundary>
              <AnalyticsDashboard />
            </AdminErrorBoundary>
          </TabsContent>

          {/* Applications Tab */}

          {/* Applications Tab */}

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4 mt-0">
            {/* Applications-only Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="adm-stat-card border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: 'var(--adm-brand-blue)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--adm-outline)' }}>Total Applications</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-bold" style={{ color: 'var(--adm-on-surface)' }}>{stats.total || 0}</span>
                </div>
              </div>

              <div className="adm-stat-card border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: 'var(--adm-brand-shade-yellow)', background: 'rgba(255,224,174,0.2)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 text-amber-700/70">Pending Review</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-bold text-amber-900">{stats.pending || 0}</span>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="adm-stat-card border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: 'var(--adm-brand-blue)', background: 'rgba(186,235,255,0.2)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--adm-brand-shade-blue)', opacity: 0.7 }}>Approved</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-bold" style={{ color: 'var(--adm-brand-shade-blue)' }}>{stats.approved || 0}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--adm-brand-light-blue)' }}>
                    <CheckCircle className="h-5 w-5" style={{ color: 'var(--adm-brand-blue)' }} />
                  </div>
                </div>
              </div>

              <div className="adm-stat-card border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: 'var(--adm-brand-teal)', background: 'rgba(147,236,229,0.2)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--adm-brand-shade-teal)', opacity: 0.8 }}>Hired</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-bold" style={{ color: 'var(--adm-brand-shade-teal)' }}>{stats.hired || 0}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--adm-brand-light-teal)' }}>
                    <UserCheck className="h-5 w-5" style={{ color: 'var(--adm-brand-shade-teal)' }} />
                  </div>
                </div>
              </div>

              <div className="adm-stat-card border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: 'var(--adm-brand-pink)', background: 'rgba(251,180,194,0.2)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--adm-brand-shade-pink)', opacity: 0.8 }}>Rejected</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-bold" style={{ color: 'var(--adm-brand-shade-pink)' }}>{stats.rejected || 0}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--adm-brand-light-pink)' }}>
                    <XCircle className="h-5 w-5" style={{ color: 'var(--adm-brand-shade-pink)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Single-row filter bar */}
            <div
              className="p-4 rounded-xl flex flex-wrap items-center gap-3"
              style={{ background: 'var(--adm-surface-container-low)' }}
            >
              {/* Search */}
              <div className="flex-1 min-w-[260px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--adm-outline)' }} />
                <Input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 h-10 rounded-xl bg-white text-sm shadow-sm"
                  style={{ border: '1px solid rgba(191,199,212,0.2)', outline: 'none' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--adm-outline)' }}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="h-10 rounded-xl bg-white text-sm shadow-sm min-w-[140px] flex flex-row items-center justify-between [&>span]:order-1 [&>svg]:order-2"
                  style={{ border: '1px solid rgba(191,199,212,0.2)' }}
                >
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* City */}
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger
                  className="h-10 rounded-xl bg-white text-sm shadow-sm min-w-[140px] flex flex-row items-center justify-between [&>span]:order-1 [&>svg]:order-2"
                  style={{ border: '1px solid rgba(191,199,212,0.2)' }}
                >
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stage */}
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger
                  className="h-10 rounded-xl bg-white text-sm shadow-sm min-w-[150px] flex flex-row items-center justify-between [&>span]:order-1 [&>svg]:order-2"
                  style={{ border: '1px solid rgba(191,199,212,0.2)' }}
                >
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {uniqueStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Onboarding progress */}
              <Select value={onboardingFilter} onValueChange={setOnboardingFilter}>
                <SelectTrigger
                  className="h-10 rounded-xl bg-white text-sm shadow-sm min-w-[150px] flex flex-row items-center justify-between [&>span]:order-1 [&>svg]:order-2"
                  style={{ border: '1px solid rgba(191,199,212,0.2)' }}
                >
                  <SelectValue placeholder="All Progress" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Progress</SelectItem>
                  <SelectItem value="started">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset — only when filters are active */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setStageFilter("all");
                    setOnboardingFilter("completed");
                    setCityFilter("all");
                  }}
                  className="h-10 px-3 rounded-xl bg-white text-sm font-medium shadow-sm transition-colors"
                  style={{ border: '1px solid rgba(191,199,212,0.2)', color: 'var(--adm-outline)' }}
                  title="Reset all filters"
                >
                  <Filter className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Applications Table */}
            <div className="adm-card overflow-hidden">
              {/* Summary Bar */}
              <div className="px-6 py-3 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--adm-surface-container)' }}>
                <p className="text-sm" style={{ color: 'var(--adm-on-surface-variant)' }}>
                  Showing <span className="font-semibold" style={{ color: 'var(--adm-on-surface)' }}>1 to {Math.min(filteredApplications.length, 25)}</span> of{' '}
                  <span className="font-semibold" style={{ color: 'var(--adm-on-surface)' }}>{applications.length.toLocaleString()}</span> applications
                </p>
                {filteredApplications.filter(app => app.onboardingStatus === 'completed' && (!app.status || app.status === 'pending')).length > 0 && (
                  <span className="adm-badge adm-badge-pending">
                    <Clock className="h-3 w-3" />
                    {filteredApplications.filter(app => app.onboardingStatus === 'completed' && (!app.status || app.status === 'pending')).length} awaiting review
                  </span>
                )}
              </div>

              <div className="overflow-x-auto adm-custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: 'var(--adm-surface-container-low)' }}>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6" style={{ color: 'var(--adm-on-surface-variant)' }}>Name</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6" style={{ color: 'var(--adm-on-surface-variant)' }}>Email</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6" style={{ color: 'var(--adm-on-surface-variant)' }}>Phone</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6" style={{ color: 'var(--adm-on-surface-variant)' }}>City</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6" style={{ color: 'var(--adm-on-surface-variant)' }}>App Status</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6" style={{ color: 'var(--adm-on-surface-variant)' }}>Stage</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6" style={{ color: 'var(--adm-on-surface-variant)' }}>Progress</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6" style={{ color: 'var(--adm-on-surface-variant)' }}>Created</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-[0.05em] py-4 px-6 text-right" style={{ color: 'var(--adm-on-surface-variant)' }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-gray-500 px-4">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-gray-400" />
                            <p className="text-sm font-medium">No applications found</p>
                            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApplications.map((app, index) => (
                        <TableRow
                          key={app.id ?? app.applicantId ?? app.email ?? `${app.email ?? "app"}-${index}`}
                          className="adm-table-row"
                        >
                          {/* Name + avatar */}
                          <TableCell className="adm-table-cell">
                            {(() => {
                              const avatarPalette = [
                                { bg: '#BAEBFF', fg: '#202B93' },
                                { bg: '#FFE5AE', fg: '#92400e' },
                                { bg: '#93ECE5', bg2: '#d1fae5', fg: '#065f46' },
                                { bg: '#FBB4C2', fg: '#be123c' },
                              ];
                              const seed = (app.name || app.email || '').charCodeAt(0) % avatarPalette.length;
                              const { bg, fg } = avatarPalette[seed];
                              const initials = (app.name || app.email || '?').trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
                              return (
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{ background: bg, color: fg }}
                                  >
                                    {initials}
                                  </div>
                                  <p className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--adm-on-surface)' }}>
                                    {app.name || 'N/A'}
                                  </p>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="adm-table-cell text-sm" style={{ color: 'var(--adm-on-surface-variant)' }}>{app.email}</TableCell>
                          <TableCell className="adm-table-cell text-sm" style={{ color: 'var(--adm-on-surface-variant)' }}>{app.phone || 'N/A'}</TableCell>
                          <TableCell className="adm-table-cell">
                            <span className="text-sm" style={{ color: 'var(--adm-on-surface)' }}>{app.city || 'N/A'}</span>
                          </TableCell>
                          <TableCell className="adm-table-cell">{getStatusBadge(app.status)}</TableCell>
                          <TableCell className="adm-table-cell">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap"
                              style={{ background: '#1e293b', color: '#f1f5f9' }}
                            >
                              {getCurrentStage(app)}
                            </span>
                          </TableCell>
                          <TableCell className="adm-table-cell">{getOnboardingStatusBadge(app.onboardingStatus)}</TableCell>
                          <TableCell className="adm-table-cell text-sm" style={{ color: 'var(--adm-on-surface-variant)' }}>
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View — always visible */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-brand-blue text-brand-blue hover:bg-brand-lightBlue"
                                onClick={() => {
                                  setSelectedApplication(null);
                                  // If report exists, show it; otherwise create a view from available data
                                  if (app.report) {
                                    // Helper to extract timestamp value (handles Firestore Timestamps)
                                    const getTimestamp = (...fields) => {
                                      for (const field of fields) {
                                        if (field) {
                                          // If it has toDate method (Firestore Timestamp), convert it
                                          if (field.toDate && typeof field.toDate === 'function') {
                                            return field.toDate();
                                          }
                                          // If it has seconds (serialized Firestore Timestamp)
                                          if (field.seconds) {
                                            return new Date(field.seconds * 1000);
                                          }
                                          // Otherwise return as is
                                          return field;
                                        }
                                      }
                                      return null;
                                    };

                                    // Use existing report but enhance acknowledgements with timestamps if missing
                                    const enhancedAcknowledgements = {
                                      ...app.report.acknowledgements,
                                      // Add boolean flags from live data (prioritize live over stale report)
                                      role: app.roleUnderstood || app.roleAcknowledged || app?.progress_role?.confirmed || app.report.acknowledgements?.role || false,
                                      blockClassification: app.blocksClassificationAcknowledged || app.report.acknowledgements?.blockClassification || false,
                                      feeStructure: app.acknowledgedFeeStructure || app.feeStructureAcknowledged || app.report.acknowledgements?.feeStructure || false,
                                      routesPolicy: app.routesPolicyAcknowledged || app.report.acknowledgements?.routesPolicy || false,
                                      cancellationPolicy: app.acknowledgedCancellationPolicy || app.cancellationPolicyAcknowledged || app.report.acknowledgements?.cancellationPolicy || false,
                                      liabilities: app.acknowledgedLiabilities || app?.progress_liabilities?.confirmed || app.report.acknowledgements?.liabilities || false,
                                      paymentCycleSchedule: app.acknowledgedPaymentCycleSchedule || app.paymentCycleScheduleAcknowledged || app.report.acknowledgements?.paymentCycleSchedule || false,

                                      // Add timestamp fields if they don't exist in the report
                                      roleDate: getTimestamp(
                                        app.report.acknowledgements?.roleDate,
                                        app.roleUnderstoodAt,
                                        app.roleAcknowledgedAt,
                                        app?.progress_role?.confirmedAt
                                      ),
                                      blockClassificationDate: getTimestamp(
                                        app.report.acknowledgements?.blockClassificationDate,
                                        app.blocksClassificationAcknowledgedAt
                                      ),
                                      feeStructureDate: getTimestamp(
                                        app.report.acknowledgements?.feeStructureDate,
                                        app.feeStructureAcknowledgedAt
                                      ),
                                      routesPolicyDate: getTimestamp(
                                        app.report.acknowledgements?.routesPolicyDate,
                                        app.routesPolicyAcknowledgedAt
                                      ),
                                      cancellationPolicyDate: getTimestamp(
                                        app.report.acknowledgements?.cancellationPolicyDate,
                                        app.cancellationPolicyAcknowledgedAt
                                      ),
                                      liabilitiesDate: getTimestamp(
                                        app.report.acknowledgements?.liabilitiesDate,
                                        app.liabilitiesAcknowledgedAt,
                                        app?.progress_liabilities?.confirmedAt
                                      ),
                                      paymentCycleScheduleDate: getTimestamp(
                                        app.report.acknowledgements?.paymentCycleScheduleDate,
                                        app.paymentCycleScheduleAcknowledgedAt
                                      ),
                                    };

                                    const enhancedReport = {
                                      ...app.report,
                                      acknowledgements: enhancedAcknowledgements
                                    };

                                    setSelectedReport(enhancedReport);
                                  } else {
                                    // Extract vehicle type from fountain data if available
                                    const vehicleTypeFromFountain = app.fountainData
                                      ? getVehicleTypeFromMOT(app.fountainData)
                                      : null;

                                    // Create a report-like object from available data
                                    setSelectedReport({
                                      driverEmail: app.email,
                                      email: app.email,
                                      personalInfo: {
                                        name: app.name,
                                        email: app.email,
                                        phone: app.phone,
                                        city: app.city,
                                      },
                                      driverInfo: {
                                        name: app.name,
                                        email: app.email,
                                        phone: app.phone,
                                        city: app.city,
                                        vehicleType: vehicleTypeFromFountain || app.vehicleType || null,
                                        country: app.country,
                                      },
                                      availability: app.availability?.availability || app.availability,
                                      verification: app.verification,
                                      acknowledgements: {
                                        role: app.roleUnderstood || app.roleAcknowledged || app?.progress_role?.confirmed || false,
                                        roleDate: app.roleUnderstoodAt || app.roleAcknowledgedAt || app?.progress_role?.confirmedAt || app?.progress_role?.confirmedAt?.toDate?.() || null,
                                        blockClassification: app.blocksClassificationAcknowledged || false,
                                        blockClassificationDate: app.blocksClassificationAcknowledgedAt || app.blocksClassificationAcknowledgedAt?.toDate?.() || null,
                                        feeStructure: app.acknowledgedFeeStructure || app.feeStructureAcknowledged || false,
                                        feeStructureDate: app.feeStructureAcknowledgedAt || app.feeStructureAcknowledgedAt?.toDate?.() || null,
                                        routesPolicy: app.routesPolicyAcknowledged || false,
                                        routesPolicyDate: app.routesPolicyAcknowledgedAt || app.routesPolicyAcknowledgedAt?.toDate?.() || null,
                                        cancellationPolicy: app.acknowledgedCancellationPolicy || app.cancellationPolicyAcknowledged || false,
                                        cancellationPolicyDate: app.cancellationPolicyAcknowledgedAt || app.cancellationPolicyAcknowledgedAt?.toDate?.() || null,
                                        liabilities: app.acknowledgedLiabilities || app?.progress_liabilities?.confirmed || false,
                                        liabilitiesDate: app.liabilitiesAcknowledgedAt || app?.progress_liabilities?.confirmedAt || app?.progress_liabilities?.confirmedAt?.toDate?.() || null,
                                        paymentCycleSchedule: app.acknowledgedPaymentCycleSchedule || app.paymentCycleScheduleAcknowledged || false,
                                        paymentCycleScheduleDate: app.paymentCycleScheduleAcknowledgedAt || null,
                                      },
                                      healthAndSafety: {
                                        smokingStatus: app.smokingStatus || null,
                                        hasPhysicalDifficulties: app.hasPhysicalDifficulties !== undefined ? app.hasPhysicalDifficulties : null,
                                        smokingFitnessCompleted: app.progress_smoking_fitness_check?.confirmed === true,
                                      },
                                      facilityPreferences: {
                                        selectedFacilities: app.selectedFacilities || [],
                                        acknowledged: app.facilityLocationsAcknowledged || false,
                                        acknowledgedAt: app.facilityLocationsAcknowledgedAt || null,
                                      },
                                      onboardingStatus: app.onboardingStatus,
                                      createdAt: app.createdAt,
                                      progress: app.progress,
                                    });
                                  }
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>

                              {/* 3-dot menu — all other actions */}
                              {(adminRole === 'super_admin' || adminRole === 'app_admin' || adminRole === 'admin_fleet') && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    >
                                      <span className="sr-only">More actions</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-[190px] z-50 bg-white shadow-lg">

                                    {/* Edit */}
                                    <DropdownMenuItem
                                      onClick={() => { setSelectedReport(null); setSelectedApplication(app); }}
                                    >
                                      <Edit className="mr-2 h-4 w-4 text-slate-500" />
                                      Edit Status
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {/* Approve */}
                                    {app.onboardingStatus === 'completed' && app.status !== 'approved' && app.status !== 'rejected' && app.status !== 'hired' && (
                                      <DropdownMenuItem
                                        onClick={() => handleStatusUpdate(app.email, 'approved')}
                                        className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </DropdownMenuItem>
                                    )}

                                    {/* Mark Hired */}
                                    {app.status === 'approved' && (
                                      <DropdownMenuItem
                                        onClick={() => handleStatusUpdate(app.email, 'hired')}
                                        className="text-blue-700 focus:text-blue-700 focus:bg-blue-50"
                                      >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Mark Hired
                                      </DropdownMenuItem>
                                    )}

                                    {/* Put On Hold */}
                                    {app.status !== 'on_hold' && app.status !== 'hired' && (
                                      <DropdownMenuItem
                                        onClick={() => handleStatusUpdate(app.email, 'on_hold')}
                                        className="text-amber-700 focus:text-amber-700 focus:bg-amber-50"
                                      >
                                        <PauseCircle className="mr-2 h-4 w-4" />
                                        Put On Hold
                                      </DropdownMenuItem>
                                    )}

                                    {/* Reject */}
                                    {app.onboardingStatus === 'completed' && app.status !== 'approved' && app.status !== 'rejected' && app.status !== 'hired' && (
                                      <DropdownMenuItem
                                        onClick={() => handleStatusUpdate(app.email, 'rejected')}
                                        className="text-rose-700 focus:text-rose-700 focus:bg-rose-50"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                      </DropdownMenuItem>
                                    )}

                                    {/* Reset Progress */}
                                    {app.onboardingStatus === 'completed' && (adminRole === 'super_admin' || adminRole === 'app_admin') && (
                                      <DropdownMenuItem
                                        onClick={() => setApplicationToReset(app)}
                                        className="text-amber-700 focus:text-amber-700 focus:bg-amber-50"
                                      >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Reset Progress
                                      </DropdownMenuItem>
                                    )}

                                    {/* Delete */}
                                    {(adminRole === 'super_admin' || adminRole === 'app_admin') && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => setApplicationToDelete(app)}
                                          className="text-rose-700 focus:text-rose-700 focus:bg-rose-50"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Fee Structures Tab */}
          <TabsContent value="fee-structures">
            <FeeStructureManager />
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities">
            <FacilityManager />
          </TabsContent>

          <TabsContent value="regions">
            <RegionManager />
          </TabsContent>

          <TabsContent value="jobs">
            <JobManager />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <Tabs defaultValue="regions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="regions">Regions</TabsTrigger>
                <TabsTrigger value="fee-structures">Fee Structures</TabsTrigger>
                <TabsTrigger value="facilities">Facilities</TabsTrigger>
                <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="communications">Communications</TabsTrigger>
                <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
                {(adminRole === 'super_admin' || adminRole === 'app_admin') && (
                  <TabsTrigger value="team">Team</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="regions">
                <RegionManager />
              </TabsContent>
              <TabsContent value="fee-structures">
                <FeeStructureManager />
              </TabsContent>
              <TabsContent value="facilities">
                <FacilityManager />
              </TabsContent>
              <TabsContent value="email-templates">
                <EmailTemplateManager />
              </TabsContent>
              <TabsContent value="notifications">
                <NotificationSettingsManager />
              </TabsContent>
              <TabsContent value="communications">
                <CommunicationsOverview />
              </TabsContent>
              <TabsContent value="questionnaires">
                <QuestionnaireBuilder />
              </TabsContent>
              {(adminRole === 'super_admin' || adminRole === 'app_admin') && (
                <TabsContent value="team">
                  <AdminManager />
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>

          {/* Admins Tab - Only visible to super_admin and app_admin */}
          {(adminRole === 'super_admin' || adminRole === 'app_admin') && (
            <TabsContent value="admins">
              <AdminManager />
            </TabsContent>
          )}

          </div>
        </main>
      </Tabs>

      {/* Status Update Dialog */}
      {
        selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={(open) => {
            if (!open) {
              setSelectedApplication(null);
              setAdminNotes("");
            }
          }}>
            <DialogContent className="max-w-2xl z-[200]">
              <DialogHeader>
                <DialogTitle>Update Application Status</DialogTitle>
                <DialogDescription>
                  Managing application for {selectedApplication.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Application Summary */}
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">{selectedApplication.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">City:</span>
                        <span className="ml-2 font-medium">{selectedApplication.city || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Stage:</span>
                        <span className="ml-2 font-medium">{getCurrentStage(selectedApplication)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Progress:</span>
                        <span className="ml-2">{getOnboardingStatusBadge(selectedApplication.onboardingStatus)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Update */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">Application Status</label>
                    <div className="relative z-[150]">
                      <Select
                        value={selectedApplication.status || 'pending'}
                        onValueChange={(value) => {
                          setSelectedApplication({ ...selectedApplication, status: value });
                        }}
                        disabled={adminRole === 'admin_view'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="z-[250] bg-white">
                          <SelectItem value="pending">Pending Review</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      {adminRole === 'admin_view' && (
                        <p className="text-xs text-gray-500 mt-1">View-only mode: You cannot edit application status</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">Admin Notes (Optional)</label>
                    <Textarea
                      placeholder="Add internal notes about this application..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      className="resize-none"
                      disabled={adminRole === 'admin_view'}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedApplication(null);
                    setAdminNotes("");
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                {(adminRole === 'super_admin' || adminRole === 'app_admin' || adminRole === 'admin_fleet') && (
                  <Button
                    className="bg-brand-blue hover:bg-brand-shadeBlue w-full sm:w-auto shadow-md hover:shadow-lg"
                    onClick={() => handleStatusUpdate(selectedApplication.email, selectedApplication.status || 'pending')}
                  >
                    Update Status
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )
      }

      {/* Report View Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto z-[200]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Driver Application Details</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {selectedReport?.driverEmail || selectedReport?.email || 'N/A'}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedReport?.reportId ? (
                  <Badge className="bg-brand-lightTeal text-brand-shadeTeal border-brand-teal">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete Report
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-brand-lightBlue text-brand-shadeBlue border-brand-blue">
                    <Eye className="h-3 w-3 mr-1" />
                    Data Snapshot
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const email = selectedReport?.driverEmail || selectedReport?.email;
                    if (email) {
                      window.open(`/admin/print-report/${encodeURIComponent(email)}`, '_blank');
                    }
                  }}
                  className="ml-2 gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 mt-4">
              {/* Application Summary */}
              <Card className="bg-gradient-to-r from-brand-lightBlue to-white border-brand-lightBlue">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-blue" />
                    Application Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedReport.reportId && (
                      <div>
                        <span className="text-gray-600">Report ID:</span>
                        <span className="ml-2 font-mono text-xs">{selectedReport.reportId}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedReport.driverEmail || selectedReport.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Onboarding Status:</span>
                      <span className="ml-2">{getOnboardingStatusBadge(selectedReport.onboardingStatus || 'started')}</span>
                    </div>
                    {selectedReport.createdAt && (
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2 font-medium">
                          {selectedReport.createdAt?.toDate?.()?.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) || new Date(selectedReport.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Driver Information */}
              {(selectedReport.driverInfo || selectedReport.personalInfo) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Driver Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedReport.driverInfo || selectedReport.personalInfo || {}).map(([key, value]) => (
                        <div key={key}>
                          <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                          {value ? String(value) : 'N/A'}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Availability */}
              {selectedReport.availability && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Availability Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Day</TableHead>
                            <TableHead className="font-semibold text-center">AM</TableHead>
                            <TableHead className="font-semibold text-center">PM</TableHead>
                            <TableHead className="font-semibold text-center">NGT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {DAYS_ORDER.filter(day => selectedReport.availability[day]).map((day) => {
                            const slots = selectedReport.availability[day];
                            return (
                              <TableRow key={day} className="hover:bg-gray-50">
                                <TableCell className="font-medium capitalize">{day}</TableCell>
                                <TableCell className="text-center">
                                  {slots.morning ? (
                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                      <CheckCircle className="h-4 w-4" />
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600">
                                      <XCircle className="h-4 w-4" />
                                      No
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {slots.noon ? (
                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                      <CheckCircle className="h-4 w-4" />
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600">
                                      <XCircle className="h-4 w-4" />
                                      No
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {slots.evening ? (
                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                      <CheckCircle className="h-4 w-4" />
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600">
                                      <XCircle className="h-4 w-4" />
                                      No
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Verification */}
              {(selectedReport.verification || selectedReport.verificationDetails) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Verification Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedReport.verification || selectedReport.verificationDetails || {}).map(([key, value]) => {
                        // Skip timestamp fields
                        if (key.includes('At') || key === 'email' || key === 'createdAt' || key === 'updatedAt') {
                          return null;
                        }
                        return (
                          <div key={key}>
                            <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                            {value ? String(value) : 'N/A'}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Facility Preferences */}
              {selectedReport.facilityPreferences && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Facility Preferences
                    </CardTitle>
                    <CardDescription>Facility locations the driver is comfortable working with</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedReport.facilityPreferences.selectedFacilities && selectedReport.facilityPreferences.selectedFacilities.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Selected Facilities ({selectedReport.facilityPreferences.selectedFacilities.length}):
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedReport.facilityPreferences.selectedFacilities.map((facility, index) => (
                              <Badge key={index} variant="outline" className="text-sm">
                                {facility}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No facilities selected
                        </div>
                      )}

                      <div className="pt-2 border-t flex items-center justify-end gap-2"> Acknowledgement Status:
                        <Badge variant={selectedReport.facilityPreferences.acknowledged ? "default" : "secondary"}
                          className={selectedReport.facilityPreferences.acknowledged ? "bg-green-600" : ""}>
                          {selectedReport.facilityPreferences.acknowledged ? 'Completed' : 'Pending'}
                        </Badge>
                        {selectedReport.facilityPreferences.acknowledgedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(selectedReport.facilityPreferences.acknowledgedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Health & Safety Information */}
              {selectedReport.healthAndSafety && (selectedReport.healthAndSafety.smokingStatus || selectedReport.healthAndSafety.smokingFitnessCompleted || selectedReport.healthAndSafety.hasPhysicalDifficulties !== null) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Health & Safety</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReport.healthAndSafety.smokingStatus && (
                        <div className="p-3 rounded-lg border bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">Smoking Status</span>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {selectedReport.healthAndSafety.smokingStatus === 'non-smoker'
                                  ? "Non-smoker"
                                  : "Smoker - Understands policy"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedReport.healthAndSafety.hasPhysicalDifficulties !== null && selectedReport.healthAndSafety.hasPhysicalDifficulties !== undefined && (
                        <div className="p-3 rounded-lg border bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${!selectedReport.healthAndSafety.hasPhysicalDifficulties
                              ? 'bg-green-100'
                              : 'bg-orange-100'
                              } flex items-center justify-center`}>
                              {!selectedReport.healthAndSafety.hasPhysicalDifficulties ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-orange-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">Physical Fitness</span>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {!selectedReport.healthAndSafety.hasPhysicalDifficulties
                                  ? "Can climb stairs and has no physical difficulties"
                                  : "Has physical difficulties"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acknowledgements */}
              {selectedReport.acknowledgements && Object.keys(selectedReport.acknowledgements).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Acknowledgements & Agreements</CardTitle>
                    <CardDescription>Policies and terms acknowledged during onboarding</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        // Friendly labels for each acknowledgement
                        const labels = {
                          role: 'Driver Role',
                          blockClassification: 'Block Densities',
                          feeStructure: 'Fee Structure',
                          paymentCycleSchedule: 'Payment Cycle & Schedule',
                          routesPolicy: 'Routes & Task Addition',
                          cancellationPolicy: 'Cancellation Policy',
                          liabilities: 'Liabilities'
                        };

                        // Map of acknowledgement keys to their date field names
                        const dateFields = {
                          role: 'roleDate',
                          blockClassification: 'blockClassificationDate',
                          feeStructure: 'feeStructureDate',
                          paymentCycleSchedule: 'paymentCycleScheduleDate',
                          routesPolicy: 'routesPolicyDate',
                          cancellationPolicy: 'cancellationPolicyDate',
                          liabilities: 'liabilitiesDate'
                        };

                        // Use the labels keys to drive the display order and ensure all items are shown
                        // even if they are missing from the acknowledgement data
                        const acknowledgementKeys = Object.keys(labels);

                        return acknowledgementKeys.map((key) => {
                          const value = selectedReport.acknowledgements?.[key];
                          const dateField = dateFields[key];
                          const timestamp = selectedReport.acknowledgements?.[dateField];

                          return (
                            <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                              <div className="flex items-center gap-3 flex-1">
                                {value ? (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {labels[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {value ? 'Acknowledged and accepted' : 'Not yet acknowledged'}
                                  </p>
                                  {(() => {
                                    // Handle various timestamp formats
                                    // Check if timestamp exists and is not null/undefined
                                    if (timestamp === null || timestamp === undefined || timestamp === '') {
                                      return null;
                                    }

                                    let date;
                                    try {
                                      // Firestore Timestamp object (has toDate method)
                                      if (timestamp && typeof timestamp.toDate === 'function') {
                                        date = timestamp.toDate();
                                      }
                                      // Firestore Timestamp with seconds/nanoseconds (serialized format)
                                      else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
                                        date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
                                      }
                                      // Regular Date object
                                      else if (timestamp instanceof Date) {
                                        date = timestamp;
                                      }
                                      // Date string or number (timestamp)
                                      else if (timestamp) {
                                        date = new Date(timestamp);
                                      }

                                      // Validate date
                                      if (!date || isNaN(date.getTime())) {
                                        return null;
                                      }

                                      return (
                                        <p className="text-xs text-gray-400 mt-1">
                                          {date.toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      );
                                    } catch (error) {
                                      return null;
                                    }
                                  })()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={value ? "default" : "secondary"} className={value ? "bg-green-600" : ""}>
                                  {value ? 'Completed' : 'Pending'}
                                </Badge>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress Tracking */}
              {selectedReport.progress && Object.keys(selectedReport.progress).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progress Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(selectedReport.progress).map(([key, value]) => (
                        <div key={key}>
                          <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                          <span className="text-sm text-gray-600">
                            {value ? 'Completed' : 'Not completed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Reset Progress Confirmation Dialog */}
      <AlertDialog open={!!applicationToReset} onOpenChange={(open) => !open && setApplicationToReset(null)}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Onboarding Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset this driver's onboarding progress?
              This will allow them to restart the onboarding process from the beginning.
              Their personal information and Fountain data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (applicationToReset) {
                  handleResetProgress(applicationToReset.email);
                  setApplicationToReset(null);
                }
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Reset Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Application Confirmation Dialog */}
      <AlertDialog open={!!applicationToDelete} onOpenChange={(open) => !open && setApplicationToDelete(null)}>
        <AlertDialogContent className="z-[200] border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Application
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 pt-2">
              <div className="space-y-2">
                <p className="font-semibold text-red-600">
                  This action cannot be undone!
                </p>
                <p>
                  Are you sure you want to permanently delete this application for <span className="font-medium">{applicationToDelete?.email}</span>?
                </p>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-900 mb-1">The following data will be permanently removed:</p>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Application record from Fountain applicants</li>
                    <li>Driver profile and onboarding progress</li>
                    <li>Availability schedule</li>
                    <li>Verification details</li>
                    <li>All associated reports</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (applicationToDelete) {
                  handleDeleteApplication(applicationToDelete?.email);
                  setApplicationToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
