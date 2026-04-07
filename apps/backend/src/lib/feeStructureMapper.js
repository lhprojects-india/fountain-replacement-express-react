import { Prisma } from '@prisma/client';

export function normalizeCity(city) {
  return (city || '').trim().toLowerCase();
}

function sniffCurrency(perHourStr) {
  const s = String(perHourStr || '');
  if (s.includes('£')) return '£';
  if (s.includes('€')) return '€';
  if (/\bKr\b/i.test(s)) return 'Kr';
  if (s.includes('$')) return '$';
  return '£';
}

export function detailsToBlocks(details) {
  if (!details?.length) return [];
  return details.map((d) => ({
    shiftLength: d.shiftLength,
    minimumFee: Number(d.minimumFee),
    includedTasks: d.includedTasks,
    additionalTaskFee: Number(d.additionalTaskFee),
    density: d.density,
  }));
}

/** @param {Array<{ city: string; vehicleType: string; perHour: string; perTask: string; details: Array<Record<string, unknown>> }>} rows */
export function dbRowsToLegacyList(rows) {
  const byCity = new Map();
  for (const row of rows) {
    if (!byCity.has(row.city)) byCity.set(row.city, []);
    byCity.get(row.city).push(row);
  }

  const result = [];
  for (const [city, cityRows] of byCity) {
    const hasCarOrVan = cityRows.some((r) => r.vehicleType === 'car' || r.vehicleType === 'van');
    if (hasCarOrVan) {
      const car = cityRows.find((r) => r.vehicleType === 'car');
      const van = cityRows.find((r) => r.vehicleType === 'van');
      const ref = car || van;
      result.push({
        city,
        feeType: 'vehicle-specific',
        currency: sniffCurrency(ref.perHour),
        blocks: {
          car: car ? detailsToBlocks(car.details) : [],
          van: van ? detailsToBlocks(van.details) : [],
        },
        averageHourlyEarnings: {
          car: car?.perHour ?? '',
          van: van?.perHour ?? '',
        },
        averagePerTaskEarnings: {
          car: car?.perTask ?? '',
          van: van?.perTask ?? '',
        },
      });
    } else {
      const general = cityRows.find((r) => r.vehicleType === 'general') || cityRows[0];
      if (!general) continue;
      result.push({
        city,
        feeType: 'general',
        currency: sniffCurrency(general.perHour),
        blocks: detailsToBlocks(general.details),
        averageHourlyEarnings: general.perHour,
        averagePerTaskEarnings: general.perTask,
      });
    }
  }

  result.sort((a, b) => a.city.localeCompare(b.city));
  return result;
}

function detailCreateFromBlock(b) {
  return {
    density: b.density,
    minimumFee: new Prisma.Decimal(String(b.minimumFee)),
    shiftLength: Number(b.shiftLength),
    includedTasks: Number(b.includedTasks),
    additionalTaskFee: new Prisma.Decimal(String(b.additionalTaskFee)),
  };
}

export function buildFeeStructureCreatesFromLegacy(body) {
  const city = normalizeCity(body.city);
  const feeType = body.feeType || 'general';
  const creates = [];

  if (feeType === 'vehicle-specific') {
    for (const vt of ['car', 'van']) {
      const blocks = body.blocks?.[vt] || [];
      const hourly = body.averageHourlyEarnings?.[vt] ?? '';
      const perTask = body.averagePerTaskEarnings?.[vt] ?? '';
      creates.push({
        city,
        vehicleType: vt,
        perHour: String(hourly).slice(0, 100),
        perTask: String(perTask).slice(0, 100),
        details: {
          create: blocks.map(detailCreateFromBlock),
        },
      });
    }
  } else {
    const blocks = Array.isArray(body.blocks) ? body.blocks : [];
    creates.push({
      city,
      vehicleType: 'general',
      perHour: String(body.averageHourlyEarnings ?? '').slice(0, 100),
      perTask: String(body.averagePerTaskEarnings ?? '').slice(0, 100),
      details: {
        create: blocks.map(detailCreateFromBlock),
      },
    });
  }

  return creates;
}
