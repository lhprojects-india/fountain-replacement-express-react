const defaultLocale =
  typeof navigator !== "undefined" && navigator.language
    ? navigator.language
    : "en-GB";

export function formatDate(value, options = { dateStyle: "medium" }) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(defaultLocale, options).format(date);
}

export function formatDateTime(value, options = { dateStyle: "medium", timeStyle: "short" }) {
  return formatDate(value, options);
}

export function formatRelativeTime(fromMs, toMs = Date.now()) {
  const diffSec = Math.round((fromMs - toMs) / 1000);
  const rtf = new Intl.RelativeTimeFormat(defaultLocale, { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, "day");
}
