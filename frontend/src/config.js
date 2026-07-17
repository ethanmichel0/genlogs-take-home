export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

export function resolveApiBaseUrl(configuredValue, isDevelopment) {
  const configuredBaseUrl = configuredValue?.replace(/\/$/, '');
  if (configuredBaseUrl) return configuredBaseUrl;

  return isDevelopment ? 'http://localhost:8000' : '';
}

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.DEV,
);
