'use client';

import { formatConfidence, formatCredScore, getCredibilityTone } from '../lib/format';

type CredibilityBadgeProps = {
  credScore: number;
  confidence: number;
};

export function CredibilityBadge({ credScore, confidence }: CredibilityBadgeProps) {
  const tone = getCredibilityTone(credScore);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tone.background} ${tone.text}`}
      role="status"
      aria-label={`Credibility score ${credScore} with ${formatConfidence(confidence)}`}
      title={formatConfidence(confidence)}
    >
      Credibility {formatCredScore(credScore)}
    </span>
  );
}
