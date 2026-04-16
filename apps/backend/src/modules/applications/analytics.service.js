import prisma from '../../lib/prisma.js';

function asDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildWhere(filters = {}) {
  const where = {};
  const and = [];
  const cityId = Number(filters.cityId ?? filters.regionId);
  const jobId = Number(filters.jobId);
  const dateFrom = asDate(filters.dateFrom);
  const dateTo = asDate(filters.dateTo);

  if (Number.isInteger(cityId) && cityId > 0) {
    and.push({ job: { cityId } });
  }
  if (Number.isInteger(jobId) && jobId > 0) {
    and.push({ jobId });
  }
  if (dateFrom || dateTo) {
    const createdAt = {};
    if (dateFrom) createdAt.gte = dateFrom;
    if (dateTo) createdAt.lte = dateTo;
    and.push({ createdAt });
  }
  if (and.length === 1) return and[0];
  if (and.length > 1) where.AND = and;
  return where;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 0) return (arr[mid - 1] + arr[mid]) / 2;
  return arr[mid];
}

export async function getPipelineFunnel(filters = {}) {
  const where = buildWhere(filters);
  const apps = await prisma.application.findMany({
    where,
    select: { id: true },
  });
  const appIds = apps.map((a) => a.id);
  if (!appIds.length) return { counts: {}, conversions: {} };

  const history = await prisma.applicationStageHistory.findMany({
    where: { applicationId: { in: appIds } },
    select: { applicationId: true, toStage: true },
  });

  const stageMap = new Map();
  for (const row of history) {
    if (!stageMap.has(row.toStage)) stageMap.set(row.toStage, new Set());
    stageMap.get(row.toStage).add(row.applicationId);
  }

  const orderedStages = [
    'applied',
    'pending_review',
    'screening',
    'acknowledgements',
    'contract_sent',
    'contract_signed',
    'documents_pending',
    'documents_under_review',
    'payment_details_pending',
    'onboarding_call',
    'questionnaire',
    'decision_pending',
    'approved',
    'first_block_assigned',
    'active',
    'rejected',
    'withdrawn',
    'first_block_failed',
  ];

  const counts = {};
  orderedStages.forEach((stage) => {
    counts[stage] = stageMap.get(stage)?.size || 0;
  });

  const conversions = {};
  for (let i = 0; i < orderedStages.length - 1; i += 1) {
    const current = counts[orderedStages[i]] || 0;
    const next = counts[orderedStages[i + 1]] || 0;
    conversions[`${orderedStages[i]}->${orderedStages[i + 1]}`] = current > 0 ? next / current : 0;
  }
  return { counts, conversions };
}

export async function getAverageStageDuration(filters = {}) {
  const where = buildWhere(filters);
  const apps = await prisma.application.findMany({
    where,
    select: {
      id: true,
      currentStage: true,
      stageHistory: {
        select: { toStage: true, occurredAt: true },
        orderBy: { occurredAt: 'asc' },
      },
    },
  });

  const durationsByStage = {};
  apps.forEach((app) => {
    const events = app.stageHistory || [];
    for (let i = 0; i < events.length; i += 1) {
      const current = events[i];
      const next = events[i + 1];
      const endAt = next?.occurredAt || (app.currentStage === current.toStage ? new Date() : current.occurredAt);
      const hours = Math.max(0, (new Date(endAt).getTime() - new Date(current.occurredAt).getTime()) / (1000 * 60 * 60));
      if (!durationsByStage[current.toStage]) durationsByStage[current.toStage] = [];
      durationsByStage[current.toStage].push(hours);
    }
  });

  const result = {};
  Object.entries(durationsByStage).forEach(([stage, values]) => {
    result[stage] = {
      avgHours: Number(average(values).toFixed(2)),
      medianHours: Number(median(values).toFixed(2)),
    };
  });
  return result;
}

export async function getApplicationsOverTime(period = 'week', filters = {}) {
  const where = buildWhere(filters);
  const apps = await prisma.application.findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const keyForDate = (value) => {
    const d = new Date(value);
    if (period === 'day') return d.toISOString().slice(0, 10);
    if (period === 'month') return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
    return weekStart.toISOString().slice(0, 10);
  };

  const map = new Map();
  apps.forEach((app) => {
    const key = keyForDate(app.createdAt);
    map.set(key, (map.get(key) || 0) + 1);
  });

  const data = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  return { period, data };
}

export async function getCityBreakdown(filters = {}) {
  const where = buildWhere(filters);
  const apps = await prisma.application.findMany({
    where,
    select: {
      currentStage: true,
      job: { select: { city: { select: { city: true } } } },
    },
  });

  const byCity = new Map();
  apps.forEach((app) => {
    const cityName = app.job?.city?.city || 'Unknown';
    if (!byCity.has(cityName)) {
      byCity.set(cityName, {
        city: cityName,
        total: 0,
        pending: 0,
        screening: 0,
        approved: 0,
        rejected: 0,
      });
    }
    const row = byCity.get(cityName);
    row.total += 1;
    if (app.currentStage === 'pending_review') row.pending += 1;
    if (app.currentStage === 'screening') row.screening += 1;
    if (app.currentStage === 'approved' || app.currentStage === 'active') row.approved += 1;
    if (app.currentStage === 'rejected') row.rejected += 1;
  });

  return [...byCity.values()].sort((a, b) => b.total - a.total);
}

export async function getJobPerformance(filters = {}) {
  const where = buildWhere(filters);
  const apps = await prisma.application.findMany({
    where,
    select: {
      id: true,
      createdAt: true,
      currentStage: true,
      job: { select: { id: true, title: true } },
      stageHistory: {
        select: { toStage: true, occurredAt: true },
        orderBy: { occurredAt: 'asc' },
      },
    },
  });

  const rows = new Map();
  apps.forEach((app) => {
    const jobId = app.job?.id || 0;
    const jobTitle = app.job?.title || 'Unknown';
    if (!rows.has(jobId)) {
      rows.set(jobId, {
        jobId,
        jobTitle,
        applications: 0,
        hired: 0,
        conversionRate: 0,
        avgDaysToHire: 0,
        _daysToHire: [],
      });
    }
    const row = rows.get(jobId);
    row.applications += 1;
    const hiredAt = app.stageHistory.find((h) => h.toStage === 'approved' || h.toStage === 'active')?.occurredAt;
    if (hiredAt) {
      row.hired += 1;
      const days = Math.max(0, (new Date(hiredAt).getTime() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      row._daysToHire.push(days);
    }
  });

  const out = [...rows.values()].map((row) => ({
    jobTitle: row.jobTitle,
    applications: row.applications,
    hired: row.hired,
    conversionRate: row.applications > 0 ? Number((row.hired / row.applications).toFixed(3)) : 0,
    avgDaysToHire: row._daysToHire.length ? Number(average(row._daysToHire).toFixed(2)) : 0,
  }));
  return out.sort((a, b) => b.applications - a.applications);
}
