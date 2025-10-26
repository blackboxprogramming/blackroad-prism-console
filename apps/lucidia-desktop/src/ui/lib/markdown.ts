import { marked } from 'marked';

const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed'];

const sanitizeHtml = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  BLOCKED_TAGS.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((node) => node.remove());
  });
  doc.querySelectorAll('*').forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
};

export const renderMarkdown = async (markdown: string): Promise<string> => {
  const raw = await marked.parse(markdown, { mangle: false, headerIds: true });
  return sanitizeHtml(raw.toString());
};
import DOMPurify from 'dompurify';

marked.use({ mangle: false, headerIds: false });

export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { async: false });
  return DOMPurify.sanitize(html);
}
