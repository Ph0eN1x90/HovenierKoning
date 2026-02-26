const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim();

function normalizeBaseUrl(value: string): string {
  if (!value) {
    return window.location.origin;
  }

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return window.location.origin;
  }
}

export const API_BASE_URL = normalizeBaseUrl(rawBase);
