const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_REGEX = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

export function detectPii(markdown: string): string[] {
  const matches = new Set<string>();
  if (EMAIL_REGEX.test(markdown)) matches.add('Email address detected');
  if (PHONE_REGEX.test(markdown)) matches.add('Phone number detected');
  if (SSN_REGEX.test(markdown)) matches.add('Sensitive number detected');
  return Array.from(matches);
}
