import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({ mangle: false, headerIds: false });

export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { async: false });
  return DOMPurify.sanitize(html);
}
