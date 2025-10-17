import type { ClassificationResponse, ExplainabilityRecord } from "@lucidia/core";

export interface ClassificationPreview {
  preview: ClassificationResponse;
  explainability: ExplainabilityRecord[];
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function requestPreview(payload: {
  text: string;
  seed?: string;
  consentToken: string;
}): Promise<ClassificationPreview> {
  const response = await fetch(`${apiBase}/classify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, maxSuggestions: 4 }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(detail.message ?? "Failed to request preview");
  }

  return (await response.json()) as ClassificationPreview;
}

