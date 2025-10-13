export const UNITY_EXPORTER_DEFAULT_URL = 'http://127.0.0.1:3001';

export function resolveUnityExporterUrl(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : UNITY_EXPORTER_DEFAULT_URL;
}
