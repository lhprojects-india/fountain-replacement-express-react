import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from "@lh/shared";
import { Columns3, List, MoreHorizontal } from "lucide-react";
import { adminServices } from "../../lib/admin-services";
import StageBadge from "./StageBadge";
import ApplicationDetailPanel from "./ApplicationDetailPanel";
import TransitionDialog from "./TransitionDialog";
import AdminNotesDialog from "./AdminNotesDialog";
const KanbanBoard = lazy(() => import("./KanbanBoard"));
import ActivityFeed from "./ActivityFeed";
import CallQueue from "./CallQueue";
import BlockQueue from "./BlockQueue";
import { useAdminAuth } from "../../context/AdminAuthContext";

const QUICK_STAGES = ["pending_review", "screening", "documents_pending", "approved", "rejected"];
const VEHICLE_TYPES = [
  "small_car_hatchback",
  "large_car_sedan",
  "small_van",
  "large_van",
];
const CONTRACT_STATUSES = ["pending", "sent", "signed", "declined", "voided"];
const KANBAN_COLUMNS = [
  "pending_review",
  "screening",
  "acknowledgements",
  "contract_sent",
  "contract_signed",
  "documents_pending",
  "documents_under_review",
  "payment_details_pending",
  "onboarding_call",
  "questionnaire",
  "decision_pending",
  "approved",
  "first_block_assigned",
];
const TERMINAL_STAGES = ["rejected", "withdrawn", "active", "first_block_failed"];
const TRANSITION_MATRIX = {
  applied: ["pending_review"],
  pending_review: ["screening", "rejected"],
  screening: ["acknowledgements", "rejected", "withdrawn"],
  acknowledgements: ["contract_sent", "rejected", "withdrawn"],
  contract_sent: ["contract_signed", "rejected", "withdrawn"],
  contract_signed: ["documents_pending"],
  documents_pending: ["documents_under_review", "withdrawn"],
  documents_under_review: ["payment_details_pending", "documents_pending", "rejected"],
  payment_details_pending: ["onboarding_call", "withdrawn"],
  onboarding_call: ["questionnaire", "rejected", "withdrawn"],
  questionnaire: ["decision_pending"],
  decision_pending: ["approved", "rejected"],
  approved: ["first_block_assigned"],
  first_block_assigned: ["active", "first_block_failed"],
  first_block_failed: ["rejected"],
};
const STAGE_ACCENT_CLASS = {
  pending_review: "border-l-blue-400",
  screening: "border-l-amber-400",
  acknowledgements: "border-l-yellow-400",
  contract_sent: "border-l-purple-400",
  contract_signed: "border-l-purple-500",
  documents_pending: "border-l-orange-400",
  documents_under_review: "border-l-orange-500",
  payment_details_pending: "border-l-indigo-400",
  onboarding_call: "border-l-teal-400",
  questionnaire: "border-l-cyan-400",
  decision_pending: "border-l-gray-500",
  approved: "border-l-green-500",
  first_block_assigned: "border-l-emerald-600",
  rejected: "border-l-red-500",
  withdrawn: "border-l-rose-500",
  active: "border-l-green-600",
  first_block_failed: "border-l-red-700",
};
const TABLE_COLUMNS = [
  { key: "name", label: "Name", always: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City" },
  { key: "vehicleType", label: "Vehicle Type" },
  { key: "jobTitle", label: "Job" },
  { key: "cityName", label: "Job city" },
  { key: "stage", label: "Stage" },
  { key: "timeInStage", label: "Time in Stage" },
  { key: "createdAt", label: "Applied Date" },
  { key: "updatedAt", label: "Last Updated" },
  { key: "contractStatus", label: "Contract Status" },
  { key: "documentsStatus", label: "Documents Status" },
  { key: "adminNotes", label: "Admin Notes" },
];
const DEFAULT_PRESETS = [
  { id: "default-needs-attention", name: "Needs Attention", filters: { stages: ["pending_review"], stageAgePreset: "3d" } },
  {
    id: "default-needs-document-review",
    name: "Needs Document Review",
    filters: { stages: ["documents_under_review"], sortBy: "currentStageEnteredAt", sortOrder: "asc" },
  },
  { id: "default-ready-screening", name: "Ready for Screening", filters: { stages: ["pending_review"] } },
  { id: "default-documents-due", name: "Documents Due", filters: { stages: ["documents_pending"] } },
  { id: "default-ready-decision", name: "Ready for Decision", filters: { stages: ["decision_pending"] } },
  { id: "default-first-blocks", name: "First blocks", filters: { stages: ["first_block_assigned"] } },
];
const initialFilters = {
  search: "",
  stages: [],
  cityIds: [],
  jobIds: [],
  vehicleTypes: [],
  contractStatus: [],
  hasDocuments: "",
  dateFrom: "",
  dateTo: "",
  stageEnteredFrom: "",
  stageEnteredTo: "",
  stageAgePreset: "",
  overdueOnly: false,
  page: 1,
  pageSize: 25,
  sortBy: "createdAt",
  sortOrder: "desc",
};

function formatAge(ms) {
  if (ms == null) return "-";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "<1h";
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  if (days < 1) return `${hours}h`;
  return `${days}d ${remH}h`;
}

function getStageAgeClass(app) {
  if (app?.isOverdue) return "text-red-600 font-medium";
  if (app?.slaHoursRemaining == null) return "";
  const elapsedHours = (app.timeInCurrentStageMs || 0) / (1000 * 60 * 60);
  const slaHours = elapsedHours + app.slaHoursRemaining;
  if (slaHours <= 0) return "text-red-600 font-medium";
  const ratio = elapsedHours / slaHours;
  if (ratio >= 0.5) return "text-amber-600";
  return "text-green-700";
}

const ApplicationPipeline = () => {
  const { toast } = useToast();
  const { adminRole } = useAdminAuth();
  const canTransition = adminRole !== "admin_view";
  const canExport = adminRole !== "admin_view";
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupedApplications, setGroupedApplications] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, totalPages: 1, totalCount: 0 });
  const [stats, setStats] = useState({ total: 0, byStage: {} });
  const [cities, setCities] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detailInitialTab, setDetailInitialTab] = useState("profile");
  const [selectedRows, setSelectedRows] = useState([]);
  const [view, setView] = useState(() => localStorage.getItem("adminPipelineView") || "table");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      const custom = JSON.parse(localStorage.getItem("adminPipelineCustomPresets") || "[]");
      return [...DEFAULT_PRESETS, ...(Array.isArray(custom) ? custom : [])];
    } catch {
      return DEFAULT_PRESETS;
    }
  });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("adminPipelineColumns") || "[]");
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.map((k) => (k === "regionName" ? "cityName" : k));
      }
    } catch {
      // ignore parse failure
    }
    return TABLE_COLUMNS.map((c) => c.key);
  });
  const [exporting, setExporting] = useState(false);
  const [activeDragApp, setActiveDragApp] = useState(null);
  const [transitionTarget, setTransitionTarget] = useState({ stage: "", app: null, bulk: false });
  const [notesTarget, setNotesTarget] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [showActivity, setShowActivity] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [quickResults, setQuickResults] = useState({ applications: [], jobs: [], cities: [] });
  const [showCallQueue, setShowCallQueue] = useState(false);
  const [showBlockQueue, setShowBlockQueue] = useState(false);
  const [decisionRecommendations, setDecisionRecommendations] = useState({});
  const loadAbortRef = useRef(null);
  const quickSearchAbortRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("adminPipelineColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    const custom = savedPresets.filter((p) => !String(p.id || "").startsWith("default-"));
    localStorage.setItem("adminPipelineCustomPresets", JSON.stringify(custom));
  }, [savedPresets]);

  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim(), page: 1 }));
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const load = async () => {
    if (loadAbortRef.current) {
      loadAbortRef.current.abort();
    }
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setIsLoading(true);
    const baseFilters = {
      ...filters,
      stage: filters.stages.join(","),
      cityId: filters.cityIds[0] || "",
      jobId: filters.jobIds[0] || "",
    };
    try {
      const [list, grouped, stageStats, cityList, jobList] = await Promise.all([
        adminServices.getApplications(baseFilters, { signal: controller.signal }),
        adminServices.getApplicationsByStage(baseFilters, { signal: controller.signal }),
        adminServices.getApplicationStats(),
        adminServices.getAllCities(),
        adminServices.getAllJobs(),
      ]);
    const apps = list.applications || [];
    const groupedData = grouped.grouped || {};
    if (filters.overdueOnly) {
      const filteredApps = apps.filter((a) => a.isOverdue);
      const filteredGrouped = Object.fromEntries(
        Object.entries(groupedData).map(([stage, data]) => [
          stage,
          {
            count: (data.applications || []).filter((a) => a.isOverdue).length,
            applications: (data.applications || []).filter((a) => a.isOverdue),
          },
        ])
      );
      setApplications(filteredApps);
      setGroupedApplications(filteredGrouped);
    } else {
      setApplications(apps);
      setGroupedApplications(groupedData);
    }
    setPagination(list.pagination || { page: 1, pageSize: 25, totalPages: 1, totalCount: 0 });
    setStats(stageStats || { total: 0, byStage: {} });
    setCities(cityList || []);
    setJobs(jobList || []);
    setSelectedRows([]);
    const pending = (apps || []).filter((a) => a.currentStage === "decision_pending");
      if (pending.length) {
        const entries = await Promise.all(
          pending.map(async (app) => {
            try {
              const summary = await adminServices.getDecisionSummary(app.id);
              return [app.id, summary?.recommendation || "review"];
            } catch {
              return [app.id, "review"];
            }
          })
        );
        setDecisionRecommendations(Object.fromEntries(entries));
      } else {
        setDecisionRecommendations({});
      }
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        return;
      }
      toast({
        title: "Failed to load applications",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      if (loadAbortRef.current === controller) {
        loadAbortRef.current = null;
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuickOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!quickOpen) return;
    const id = setTimeout(async () => {
      if (!quickQuery.trim()) {
        setQuickResults({ applications: [], jobs: [], cities: [] });
        return;
      }
      if (quickSearchAbortRef.current) {
        quickSearchAbortRef.current.abort();
      }
      const controller = new AbortController();
      quickSearchAbortRef.current = controller;
      try {
        const result = await adminServices.quickSearch(quickQuery, 7, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setQuickResults(result);
        }
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
      }
    }, 250);
    return () => {
      clearTimeout(id);
      if (quickSearchAbortRef.current) {
        quickSearchAbortRef.current.abort();
        quickSearchAbortRef.current = null;
      }
    };
  }, [quickQuery, quickOpen]);

  useEffect(() => {
    load();
  }, [filters]);

  const statsCards = useMemo(
    () => [
      ["Total Applications", stats.total || 0],
      ["Pending Review", stats.byStage?.pending_review || 0],
      ["In Screening", stats.byStage?.screening || 0],
      ["Documents Pending", stats.byStage?.documents_pending || 0],
      ["Approved", stats.byStage?.approved || 0],
      ["Rejected", stats.byStage?.rejected || 0],
    ],
    [stats]
  );

  const selectedApplications = useMemo(
    () => applications.filter((app) => selectedRows.includes(app.id)),
    [applications, selectedRows]
  );
  const bulkValidTransitions = useMemo(() => {
    if (!selectedApplications.length) return [];
    const transitionSets = selectedApplications.map((app) => new Set(TRANSITION_MATRIX[app.currentStage] || []));
    const intersection = [...transitionSets[0]].filter((stage) => transitionSets.every((set) => set.has(stage)));
    return intersection;
  }, [selectedApplications]);

  const terminalStageCounts = useMemo(
    () =>
      TERMINAL_STAGES.map((stage) => ({
        stage,
        count: groupedApplications?.[stage]?.count || 0,
      })).filter((item) => item.count > 0),
    [groupedApplications]
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];
    filters.stages.forEach((stage) => chips.push({ key: `s-${stage}`, label: `Stage: ${stage.replaceAll("_", " ")}`, clear: () => setFilters((p) => ({ ...p, stages: p.stages.filter((s) => s !== stage), page: 1 })) }));
    filters.vehicleTypes.forEach((v) => chips.push({ key: `v-${v}`, label: `Vehicle: ${v}`, clear: () => setFilters((p) => ({ ...p, vehicleTypes: p.vehicleTypes.filter((x) => x !== v), page: 1 })) }));
    if (filters.cityIds.length) chips.push({ key: "r", label: "City set", clear: () => setFilters((p) => ({ ...p, cityIds: [], page: 1 })) });
    if (filters.jobIds.length) chips.push({ key: "j", label: "Job set", clear: () => setFilters((p) => ({ ...p, jobIds: [], page: 1 })) });
    if (filters.contractStatus.length) chips.push({ key: "c", label: `Contract: ${filters.contractStatus.join(", ")}`, clear: () => setFilters((p) => ({ ...p, contractStatus: [], page: 1 })) });
    if (filters.hasDocuments !== "") chips.push({ key: "d", label: `Has docs: ${filters.hasDocuments}`, clear: () => setFilters((p) => ({ ...p, hasDocuments: "", page: 1 })) });
    if (filters.dateFrom || filters.dateTo) chips.push({ key: "date", label: `Applied: ${filters.dateFrom || "..."} to ${filters.dateTo || "..."}`, clear: () => setFilters((p) => ({ ...p, dateFrom: "", dateTo: "", page: 1 })) });
    if (filters.stageAgePreset) chips.push({ key: "age", label: `In stage > ${filters.stageAgePreset}`, clear: () => setFilters((p) => ({ ...p, stageAgePreset: "", stageEnteredTo: "", page: 1 })) });
    return chips;
  }, [filters]);

  const primaryForwardStage = (app) =>
    (TRANSITION_MATRIX[app.currentStage] || []).find((s) => s !== "rejected" && s !== "withdrawn");

  const canDropToStage = (targetStage) => {
    if (!activeDragApp) return true;
    return (TRANSITION_MATRIX[activeDragApp.currentStage] || []).includes(targetStage);
  };

  const onKanbanDragStart = (event) => {
    const id = Number(event.active?.id);
    if (!id) return;
    const app = Object.values(groupedApplications)
      .flatMap((group) => group.applications || [])
      .find((row) => row.id === id);
    setActiveDragApp(app || null);
  };

  const onKanbanDragEnd = async (event) => {
    const appId = Number(event.active?.id);
    const toStage = event.over?.id;
    const fromStage = activeDragApp?.currentStage;
    setActiveDragApp(null);
    if (!appId || !toStage || !fromStage || fromStage === toStage) return;
    if (!(TRANSITION_MATRIX[fromStage] || []).includes(String(toStage))) {
      toast({ title: "Invalid transition", description: "This stage change is not allowed.", variant: "destructive" });
      return;
    }

    const previous = structuredClone(groupedApplications);
    const sourceItems = [...(groupedApplications[fromStage]?.applications || [])];
    const moving = sourceItems.find((row) => row.id === appId);
    if (!moving) return;
    const nextSource = sourceItems.filter((row) => row.id !== appId);
    const targetItems = [...(groupedApplications[toStage]?.applications || [])];
    setGroupedApplications({
      ...groupedApplications,
      [fromStage]: { count: nextSource.length, applications: nextSource },
      [toStage]: { count: targetItems.length + 1, applications: [{ ...moving, currentStage: String(toStage), timeInCurrentStageMs: 0 }, ...targetItems] },
    });
    try {
      await adminServices.transitionApplication(appId, String(toStage));
      toast({ title: "Transition successful", description: "Application stage updated." });
    } catch (e) {
      setGroupedApplications(previous);
      toast({ title: "Transition failed", description: e?.message || "Could not move application.", variant: "destructive" });
    }
  };

  const handleTransitionSuccess = (result) => {
    if (result?.succeeded || result?.failed) {
      toast({ title: "Bulk transition complete", description: `${result.succeeded?.length || 0} succeeded, ${result.failed?.length || 0} failed.` });
    } else {
      toast({ title: "Transition successful", description: "Application stage updated." });
    }
    load();
  };

  const toggleStage = (stage) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      stages: prev.stages.includes(stage) ? prev.stages.filter((s) => s !== stage) : [...prev.stages, stage],
    }));
  };

  const toggleColumn = (columnKey) => {
    const col = TABLE_COLUMNS.find((c) => c.key === columnKey);
    if (col?.always) return;
    setVisibleColumns((prev) => (prev.includes(columnKey) ? prev.filter((c) => c !== columnKey) : [...prev, columnKey]));
  };

  const applyPreset = (preset) => {
    const next = { ...initialFilters, ...preset.filters, page: 1 };
    setFilters(next);
    setSearchInput(next.search || "");
  };

  const deletePreset = (presetId) => {
    if (String(presetId).startsWith("default-")) return;
    setSavedPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    setSavedPresets((prev) => [...prev, { id: `custom-${Date.now()}`, name, filters }]);
    setPresetName("");
    setShowSavePreset(false);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await adminServices.exportApplications(filters, "csv");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Export failed", description: e?.message || "Could not export CSV.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const pollContracts = async () => {
    try {
      const result = await adminServices.pollAllPendingContracts();
      toast({
        title: "Contract status poll complete",
        description: `Checked ${result?.checked || 0} pending contract(s).`,
      });
      load();
    } catch (e) {
      toast({
        title: "Contract status poll failed",
        description: e?.message || "Unable to poll pending contracts.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statsCards.map(([label, value]) => (
          <div key={label} className="adm-stat-card p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => toggleStage(stage)}
            className={`adm-chip px-3 py-1.5 text-sm ${
              filters.stages.includes(stage) ? "adm-chip-active" : ""
            }`}
          >
            {stage.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <div className="adm-toolbar flex flex-wrap gap-2">
        <div className="mr-2 flex items-center rounded-lg border border-slate-200 bg-white p-1">
          <Button
            variant="outline"
            size="sm"
            className={view === "table" ? "!bg-sky-600 hover:!bg-sky-700 !text-white !border-sky-600 rounded-md" : "text-slate-700 hover:bg-slate-100 rounded-md border-transparent"}
            onClick={() => { setView("table"); localStorage.setItem("adminPipelineView", "table"); }}
          >
            <List className="h-4 w-4 mr-1" />Table
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={view === "kanban" ? "!bg-sky-600 hover:!bg-sky-700 !text-white !border-sky-600 rounded-md" : "text-slate-700 hover:bg-slate-100 rounded-md border-transparent"}
            onClick={() => { setView("kanban"); localStorage.setItem("adminPipelineView", "kanban"); }}
          >
            <Columns3 className="h-4 w-4 mr-1" />Board
          </Button>
        </div>
        <Input placeholder="Search name/email/phone/city" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="min-w-[220px] flex-1" />
        <Select value={filters.cityIds[0] || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, cityIds: v === "all" ? [] : [v], page: 1 }))}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.city}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" className="adm-btn-outline" onClick={() => setShowMoreFilters((v) => !v)}>{showMoreFilters ? "Hide Filters" : "More Filters"}</Button>
        <Button
          variant={filters.overdueOnly ? "default" : "outline"}
          className={filters.overdueOnly ? "" : "adm-btn-outline"}
          onClick={() => setFilters((p) => ({ ...p, overdueOnly: !p.overdueOnly, page: 1 }))}
        >
          Overdue only
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" className="adm-btn-outline">My Filters</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {savedPresets.map((preset) => (
              <DropdownMenuItem key={preset.id} onClick={() => applyPreset(preset)}>
                <div className="flex w-full items-center justify-between gap-2">
                  <span>{preset.name}</span>
                  {!String(preset.id).startsWith("default-") ? (
                    <button type="button" className="text-xs text-red-600" onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}>Delete</button>
                  ) : null}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="adm-btn-outline" onClick={() => setShowSavePreset(true)}>Save Filter</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" className="adm-btn-outline">Columns</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {TABLE_COLUMNS.map((column) => (
              <DropdownMenuItem key={column.key} onClick={() => toggleColumn(column.key)}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={visibleColumns.includes(column.key)} readOnly disabled={Boolean(column.always)} />
                  <span>{column.label}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="adm-btn-outline" onClick={() => setShowActivity((v) => !v)}>{showActivity ? "Hide Activity" : "Show Activity"}</Button>
        <Button variant="outline" className="adm-btn-outline" onClick={() => setShowCallQueue((v) => !v)}>{showCallQueue ? "Hide Calls" : "Call Queue"}</Button>
        <Button variant="outline" className="adm-btn-outline" onClick={() => setShowBlockQueue((v) => !v)}>{showBlockQueue ? "Hide First Blocks" : "First Blocks"}</Button>
        <Button variant="outline" className="adm-btn-outline" onClick={() => setQuickOpen(true)}>Quick Jump</Button>
        <Button variant="outline" className="adm-btn-outline" onClick={pollContracts}>Poll Contract Status</Button>
        {canExport ? (
          <Button
            onClick={exportCsv}
            disabled={exporting}
            className="h-9 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-none"
          >
            {exporting ? "Exporting..." : `Export ${pagination.totalCount || 0} applications`}
          </Button>
        ) : null}
      </div>

      {showMoreFilters ? (
        <div className="adm-toolbar flex flex-wrap gap-2">
          <Select value={filters.jobIds[0] || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, jobIds: v === "all" ? [] : [v], page: 1 }))}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Job" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((j) => <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <select multiple value={filters.vehicleTypes} onChange={(e) => setFilters((p) => ({ ...p, vehicleTypes: Array.from(e.target.selectedOptions).map((o) => o.value), page: 1 }))} className="h-24 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm">
            {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value, page: 1 }))} className="w-[170px]" />
          <Input type="date" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value, page: 1 }))} className="w-[170px]" />
          <Select value={filters.contractStatus[0] || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, contractStatus: v === "all" ? [] : [v], page: 1 }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Contract status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contract status</SelectItem>
              {CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.hasDocuments === "" ? "all" : String(filters.hasDocuments)} onValueChange={(v) => setFilters((p) => ({ ...p, hasDocuments: v === "all" ? "" : v, page: 1 }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Has documents" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Has documents</SelectItem>
              <SelectItem value="false">No documents</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.stageAgePreset || "none"}
            onValueChange={(v) => {
              if (v === "none") return setFilters((p) => ({ ...p, stageAgePreset: "", stageEnteredTo: "", page: 1 }));
              const days = v === "3d" ? 3 : 7;
              const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
              setFilters((p) => ({ ...p, stageAgePreset: v, stageEnteredTo: d, page: 1 }));
            }}
          >
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Time in stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any time in stage</SelectItem>
              <SelectItem value="3d">&gt; 3 days</SelectItem>
              <SelectItem value="7d">&gt; 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {showCallQueue ? (
        <CallQueue
          onOpenApplication={(id) => {
            setDetailInitialTab("actions");
            setSelectedId(id);
          }}
        />
      ) : null}

      {showBlockQueue ? (
        <BlockQueue
          onOpenApplication={(id) => {
            setDetailInitialTab("actions");
            setSelectedId(id);
          }}
        />
      ) : null}

      {activeFilterChips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilterChips.map((chip) => (
            <button key={chip.key} type="button" onClick={chip.clear} className="adm-chip px-3 py-1 text-sm">
              {chip.label} ×
            </button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => { setFilters(initialFilters); setSearchInput(""); }}>Clear all</Button>
        </div>
      ) : null}

      <div className="flex gap-3 items-start">
      <div className="flex-1 min-w-0">
      {view === "table" ? (
        <div className="adm-table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={applications.length > 0 && selectedRows.length === applications.length}
                    onChange={(e) => setSelectedRows(e.target.checked ? applications.map((a) => a.id) : [])}
                    aria-label="Select all rows"
                    className="h-4 w-4"
                  />
                </TableHead>
                {visibleColumns.includes("name") ? <TableHead>Name</TableHead> : null}
                {visibleColumns.includes("email") ? <TableHead>Email</TableHead> : null}
                {visibleColumns.includes("phone") ? <TableHead>Phone</TableHead> : null}
                {visibleColumns.includes("city") ? <TableHead>City</TableHead> : null}
                {visibleColumns.includes("vehicleType") ? <TableHead>Vehicle Type</TableHead> : null}
                {visibleColumns.includes("jobTitle") ? <TableHead>Job</TableHead> : null}
                {visibleColumns.includes("cityName") ? <TableHead>Job city</TableHead> : null}
                {visibleColumns.includes("stage") ? <TableHead>Stage</TableHead> : null}
                {visibleColumns.includes("timeInStage") ? <TableHead>Time in Stage</TableHead> : null}
                {visibleColumns.includes("createdAt") ? <TableHead>Applied</TableHead> : null}
                {visibleColumns.includes("updatedAt") ? <TableHead>Last Updated</TableHead> : null}
                {visibleColumns.includes("contractStatus") ? <TableHead>Contract</TableHead> : null}
                {visibleColumns.includes("documentsStatus") ? <TableHead>Documents</TableHead> : null}
                {visibleColumns.includes("adminNotes") ? <TableHead>Admin Notes</TableHead> : null}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`loading-${idx}`}>
                    <TableCell colSpan={16}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-sm text-gray-500 py-8">
                    {activeFilterChips.length > 0
                      ? "No applications match your filters."
                      : "No applications yet. Create a job and share the link to start receiving applications."}
                  </TableCell>
                </TableRow>
              ) : applications.map((app) => (
                <TableRow key={app.id} className={app.isOverdue ? "bg-red-50/40 border-l-2 border-l-red-300" : "hover:bg-slate-50/70"}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(app.id)}
                      onChange={(e) => setSelectedRows(e.target.checked ? [...new Set([...selectedRows, app.id])] : selectedRows.filter((id) => id !== app.id))}
                      aria-label={`Select ${app.name}`}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  {visibleColumns.includes("name") ? (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{app.name}</span>
                        {app.emailDeliveryFailed ? <span title="Email delivery issues detected">⚠️</span> : null}
                      </div>
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("email") ? <TableCell>{app.email}</TableCell> : null}
                  {visibleColumns.includes("phone") ? <TableCell>{app.phone || "-"}</TableCell> : null}
                  {visibleColumns.includes("city") ? <TableCell>{app.city || "-"}</TableCell> : null}
                  {visibleColumns.includes("vehicleType") ? <TableCell>{app.vehicleType || "-"}</TableCell> : null}
                  {visibleColumns.includes("jobTitle") ? <TableCell>{app.jobTitle || "-"}</TableCell> : null}
                  {visibleColumns.includes("cityName") ? <TableCell>{app.cityName || "-"}</TableCell> : null}
                  {visibleColumns.includes("stage") ? (
                    <TableCell>
                      <div className="space-y-1">
                        <StageBadge stage={app.currentStage} label={app.currentStageLabel} />
                        {app.currentStage === "decision_pending" ? (
                          <div className="text-xs">
                            Rec:{" "}
                            <span className={
                              decisionRecommendations[app.id] === "approve"
                                ? "text-green-700 font-medium"
                                : decisionRecommendations[app.id] === "reject"
                                  ? "text-red-700 font-medium"
                                  : "text-amber-700 font-medium"
                            }>
                              {String(decisionRecommendations[app.id] || "review").toUpperCase()}
                            </span>
                          </div>
                        ) : null}
                        {app.contractStatus ? (
                          <div className="text-xs text-gray-500">
                            {app.contractStatus === "signed"
                              ? "✅ Contract signed"
                              : app.contractStatus === "declined"
                                ? "❌ Contract declined"
                                : "📝 Contract pending"}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("timeInStage") ? (
                    <TableCell className={getStageAgeClass(app)}>
                      {formatAge(app.timeInCurrentStageMs)}
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("createdAt") ? <TableCell>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}</TableCell> : null}
                  {visibleColumns.includes("updatedAt") ? <TableCell>{app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : "-"}</TableCell> : null}
                  {visibleColumns.includes("contractStatus") ? <TableCell>{app.contractStatus || "-"}</TableCell> : null}
                  {visibleColumns.includes("documentsStatus") ? (
                    <TableCell>
                      {(() => {
                        const total = Number(app.documentSummary?.total || 0);
                        const byStatus = app.documentSummary?.byStatus || {};
                        const rejected = Number(byStatus.rejected || 0);
                        const pending = Number(byStatus.pending || 0) + Number(byStatus.uploading || 0);
                        const approved = Number(byStatus.approved || 0);
                        if (rejected > 0) {
                          return <span className="text-red-700 font-medium">{rejected} rejected</span>;
                        }
                        if (pending > 0) {
                          return <span className="text-amber-700 font-medium">{pending} pending</span>;
                        }
                        if (approved > 0 && total > 0) {
                          return <span className="text-green-700 font-medium">{approved}/{total} approved</span>;
                        }
                        return <span className="text-gray-600">{total}</span>;
                      })()}
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("adminNotes") ? <TableCell className="max-w-[220px] truncate">{app.adminNotes || "-"}</TableCell> : null}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="adm-btn-outline"
                        onClick={() => {
                          setDetailInitialTab("profile");
                          setSelectedId(app.id);
                        }}
                      >
                        View
                      </Button>
                      {app.currentStage === "documents_under_review" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="adm-btn-outline"
                          onClick={() => {
                            setDetailInitialTab("documents");
                            setSelectedId(app.id);
                          }}
                        >
                          Review Documents
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-slate-500 hover:text-slate-900"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setDetailInitialTab("profile"); setSelectedId(app.id); }}>
                            View Details
                          </DropdownMenuItem>
                          {app.currentStage === "documents_under_review" ? (
                            <DropdownMenuItem onClick={() => { setDetailInitialTab("documents"); setSelectedId(app.id); }}>
                              Review Documents
                            </DropdownMenuItem>
                          ) : null}
                          {canTransition && primaryForwardStage(app) ? <DropdownMenuItem onClick={() => setTransitionTarget({ stage: primaryForwardStage(app), app, bulk: false })}>Move to {primaryForwardStage(app).replaceAll("_", " ")}</DropdownMenuItem> : null}
                          {canTransition && (TRANSITION_MATRIX[app.currentStage] || []).includes("rejected") ? <DropdownMenuItem className="text-red-600" onClick={() => setTransitionTarget({ stage: "rejected", app, bulk: false })}>Reject</DropdownMenuItem> : null}
                          {canTransition && app.currentStage === "decision_pending" ? (
                            <>
                              <DropdownMenuItem
                                className="text-green-700"
                                onClick={async () => {
                                  await adminServices.approveApplicationFinal(app.id, "");
                                  await load();
                                }}
                              >
                                Quick Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-700"
                                onClick={async () => {
                                  await adminServices.rejectApplicationFinal(app.id, "other", "");
                                  await load();
                                }}
                              >
                                Quick Reject
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          <DropdownMenuItem onClick={() => setNotesTarget(app)}>Add Note</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-3">
          {terminalStageCounts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {terminalStageCounts.map((item) => (
                <div key={item.stage} className="rounded-md border bg-white px-3 py-1.5 text-sm text-gray-700">
                  {item.stage.replaceAll("_", " ")}: <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          ) : null}
          <Suspense fallback={<div className="adm-panel p-4 text-sm text-gray-500">Loading board...</div>}>
            <KanbanBoard
              columns={KANBAN_COLUMNS}
              groupedApplications={groupedApplications}
              canDropToStage={canDropToStage}
              onCardClick={(app) => setSelectedId(app.id)}
              onDragStart={onKanbanDragStart}
              onDragEnd={onKanbanDragEnd}
              activeCardId={activeDragApp?.id || null}
              accentClassByStage={STAGE_ACCENT_CLASS}
            />
          </Suspense>
        </div>
      )}
      </div>
      {showActivity ? <ActivityFeed onOpenApplication={(id) => setSelectedId(id)} /> : null}
      </div>

      {canTransition && selectedRows.length > 0 ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 adm-panel px-4 py-3 z-50 flex items-center gap-3">
          <span className="text-sm font-medium">{selectedRows.length} selected</span>
          {bulkValidTransitions.filter((stage) => stage !== "withdrawn").map((stage) => (
            <Button key={stage} size="sm" variant="outline" className="adm-btn-outline" onClick={() => setTransitionTarget({ stage, app: null, bulk: true })}>
              {stage === "rejected" ? "Reject" : `Move to ${stage.replaceAll("_", " ")}`}
            </Button>
          ))}
          {selectedApplications.every((a) => a.currentStage === "contract_sent") ? (
            <Button size="sm" variant="outline" className="adm-btn-outline" onClick={pollContracts}>
              Poll Status
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setSelectedRows([])}>Clear</Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {view === "table"
            ? `Page ${pagination.page} of ${pagination.totalPages} (${pagination.totalCount} total)`
            : `${Object.values(groupedApplications).reduce((acc, group) => acc + (group?.count || 0), 0)} applications`}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="adm-btn-outline" disabled={view !== "table" || pagination.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>Prev</Button>
          <Button size="sm" variant="outline" className="adm-btn-outline" disabled={view !== "table" || pagination.page >= pagination.totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
        </div>
      </div>

      <ApplicationDetailPanel
        applicationId={selectedId}
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        onTransitioned={load}
        initialTab={detailInitialTab}
      />
      <TransitionDialog
        open={canTransition && Boolean(transitionTarget.stage)}
        onClose={() => setTransitionTarget({ stage: "", app: null, bulk: false })}
        application={transitionTarget.app}
        toStage={transitionTarget.stage}
        isBulk={transitionTarget.bulk}
        bulkIds={selectedRows}
        onSuccess={handleTransitionSuccess}
      />
      <AdminNotesDialog
        open={Boolean(notesTarget)}
        onClose={() => setNotesTarget(null)}
        application={notesTarget}
        onSaved={() => {
          toast({ title: "Notes saved", description: "Application notes updated." });
          load();
        }}
      />
      <Dialog open={showSavePreset} onOpenChange={setShowSavePreset}>
        <DialogContent className="adm-modal">
          <DialogHeader>
            <DialogTitle>Save filter preset</DialogTitle>
          </DialogHeader>
          <Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Preset name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePreset(false)}>Cancel</Button>
            <Button onClick={savePreset}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="adm-modal max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick Jump</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Search applications, jobs, cities..."
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-[420px] overflow-auto">
            <div>
              <p className="text-xs font-semibold mb-2 text-gray-500">Applications</p>
              <div className="space-y-1">
                {quickResults.applications.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className="w-full text-left rounded border p-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setSelectedId(app.id);
                      setQuickOpen(false);
                    }}
                  >
                    <p className="font-medium">{`${app.firstName || ""} ${app.lastName || ""}`.trim()}</p>
                    <p className="text-xs text-gray-500">{app.email}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 text-gray-500">Jobs</p>
              <div className="space-y-1">
                {quickResults.jobs.map((job) => (
                  <div key={job.id} className="rounded border p-2 text-sm">{job.title}</div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 text-gray-500">Cities</p>
              <div className="space-y-1">
                {quickResults.cities.map((city) => (
                  <div key={city.id} className="rounded border p-2 text-sm">{city.city}</div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationPipeline;
