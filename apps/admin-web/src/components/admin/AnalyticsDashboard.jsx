import { useEffect, useMemo, useState } from "react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@lh/shared";
import { adminServices } from "../../lib/admin-services";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const DATE_PRESETS = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "month", label: "This month", days: null },
  { value: "custom", label: "Custom", days: null },
];

function toStageLabel(stage) {
  return String(stage || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const AnalyticsDashboard = () => {
  const [cities, setCities] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");
  const [filters, setFilters] = useState({
    preset: "30d",
    dateFrom: "",
    dateTo: "",
    cityId: "",
    jobId: "",
  });
  const [funnel, setFunnel] = useState({ counts: {}, conversions: {} });
  const [durations, setDurations] = useState({});
  const [volume, setVolume] = useState({ period: "week", data: [] });
  const [cityBreakdown, setCityBreakdown] = useState([]);
  const [jobPerformance, setJobPerformance] = useState([]);

  useEffect(() => {
    const loadMeta = async () => {
      const [cityList, jobList] = await Promise.all([adminServices.getAllCities(), adminServices.getAllJobs()]);
      setCities(cityList || []);
      setJobs(jobList || []);
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (filters.preset === "custom") return;
    const now = new Date();
    if (filters.preset === "month") {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
      setFilters((prev) => ({ ...prev, dateFrom: start, dateTo: now.toISOString().slice(0, 10) }));
      return;
    }
    const preset = DATE_PRESETS.find((p) => p.value === filters.preset);
    const days = preset?.days || 30;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: now.toISOString().slice(0, 10) }));
  }, [filters.preset]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const payload = {
          cityId: filters.cityId || "",
          jobId: filters.jobId || "",
          dateFrom: filters.dateFrom || "",
          dateTo: filters.dateTo || "",
        };
        const [f, d, v, r, j] = await Promise.all([
          adminServices.getAnalyticsFunnel(payload),
          adminServices.getAnalyticsStageDuration(payload),
          adminServices.getAnalyticsVolume(period, payload),
          adminServices.getAnalyticsCities(payload),
          adminServices.getAnalyticsJobs(payload),
        ]);
        setFunnel(f);
        setDurations(d);
        setVolume(v);
        setCityBreakdown(r);
        setJobPerformance(j);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.dateFrom, filters.dateTo, filters.cityId, filters.jobId, period]);

  const funnelData = useMemo(
    () =>
      Object.entries(funnel.counts || {})
        .filter(([, count]) => count > 0)
        .map(([stage, count], index, arr) => {
          const next = arr[index + 1]?.[1] || 0;
          return {
            stage: toStageLabel(stage),
            count,
            conversionPct: count > 0 ? Number(((next / count) * 100).toFixed(1)) : 0,
          };
        }),
    [funnel]
  );

  const durationData = useMemo(
    () =>
      Object.entries(durations || {}).map(([stage, row]) => ({
        stage: toStageLabel(stage),
        avgHours: row.avgHours || 0,
        fill: row.avgHours < 24 ? "#16a34a" : row.avgHours < 72 ? "#f59e0b" : "#ef4444",
      })),
    [durations]
  );

  const kpis = useMemo(() => {
    const total = Object.values(funnel.counts || {}).reduce((sum, n) => sum + n, 0);
    const approved = (funnel.counts?.approved || 0) + (funnel.counts?.active || 0);
    const hireRate = total > 0 ? (approved / total) * 100 : 0;
    const avgTimeToHire =
      jobPerformance.length > 0
        ? jobPerformance.reduce((sum, row) => sum + (row.avgDaysToHire || 0), 0) / jobPerformance.length
        : 0;
    return {
      total,
      hireRate: Number(hireRate.toFixed(1)),
      avgTimeToHire: Number(avgTimeToHire.toFixed(1)),
      activeNow: funnel.counts?.active || 0,
    };
  }, [funnel, jobPerformance]);

  return (
    <div className="space-y-4">
      <div className="adm-toolbar flex flex-wrap gap-2">
        <Select value={filters.preset} onValueChange={(v) => setFilters((p) => ({ ...p, preset: v }))}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((preset) => <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value, preset: "custom" }))} className="w-[170px]" />
        <Input type="date" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value, preset: "custom" }))} className="w-[170px]" />
        <Select value={filters.cityId || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, cityId: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.city}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.jobId || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, jobId: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Job" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobs.map((j) => <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Period" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="adm-stat-card p-3"><p className="text-xs text-gray-500">Total Apps</p><p className="text-2xl font-semibold">{kpis.total}</p></div>
        <div className="adm-stat-card p-3"><p className="text-xs text-gray-500">Hire Rate</p><p className="text-2xl font-semibold">{kpis.hireRate}%</p></div>
        <div className="adm-stat-card p-3"><p className="text-xs text-gray-500">Avg Time to Hire</p><p className="text-2xl font-semibold">{kpis.avgTimeToHire}d</p></div>
        <div className="adm-stat-card p-3"><p className="text-xs text-gray-500">Active Now</p><p className="text-2xl font-semibold">{kpis.activeNow}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="adm-panel p-4">
          <p className="text-sm font-semibold mb-2">Pipeline Funnel</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={160} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d8fe3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="adm-panel p-4">
          <p className="text-sm font-semibold mb-2">Applications Over Time</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0f766e" fill="#99f6e4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="adm-panel p-4">
          <p className="text-sm font-semibold mb-2">Average Stage Duration</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={160} />
                <Tooltip />
                <Bar dataKey="avgHours">
                  {durationData.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="adm-panel p-4">
          <p className="text-sm font-semibold mb-2">City Breakdown</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="screening" stackId="a" fill="#1d4ed8" />
                <Bar dataKey="approved" stackId="a" fill="#16a34a" />
                <Bar dataKey="rejected" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="adm-panel p-4">
        <p className="text-sm font-semibold mb-3">Job Performance</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Apps</TableHead>
              <TableHead>Hired</TableHead>
              <TableHead>Conv Rate</TableHead>
              <TableHead>Avg Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(jobPerformance || []).map((row) => (
              <TableRow key={row.jobTitle}>
                <TableCell>{row.jobTitle}</TableCell>
                <TableCell>{row.applications}</TableCell>
                <TableCell>{row.hired}</TableCell>
                <TableCell>{Math.round((row.conversionRate || 0) * 100)}%</TableCell>
                <TableCell>{row.avgDaysToHire}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading analytics...</p> : null}
    </div>
  );
};

export default AnalyticsDashboard;
