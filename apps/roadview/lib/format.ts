export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatCredScore(score: number): string {
  return `${score.toFixed(0)}/100`;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}% confidence`;
}

export function getCredibilityTone(score: number): {
  background: string;
  text: string;
} {
  if (score >= 75) {
    return { background: 'bg-emerald-500/20', text: 'text-emerald-300' };
  }
  if (score >= 50) {
    return { background: 'bg-amber-500/20', text: 'text-amber-300' };
  }
  return { background: 'bg-rose-500/20', text: 'text-rose-300' };
}
