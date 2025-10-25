const KEYWORDS = ['harass', 'threat', 'dox', 'hate'];

export function detectAbuse(markdown: string): string[] {
  const lowered = markdown.toLowerCase();
  return KEYWORDS.filter((keyword) => lowered.includes(keyword)).map(
    (keyword) => `Potentially harmful language detected: "${keyword}"`,
  );
}
