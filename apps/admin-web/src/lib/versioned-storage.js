const STORAGE_VERSION = 1;

export function readVersionedJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.v === STORAGE_VERSION) {
      return parsed.data ?? fallback;
    }
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeVersionedJson(key, data) {
  localStorage.setItem(key, JSON.stringify({ v: STORAGE_VERSION, data }));
}
