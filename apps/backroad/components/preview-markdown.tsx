'use client';

import { markdownToHtml } from '@/lib/markdown';

interface PreviewMarkdownProps {
  markdown: string;
}

export function PreviewMarkdown({ markdown }: PreviewMarkdownProps) {
  const html = markdownToHtml(markdown);
  return (
    <div className="prose prose-invert max-w-none rounded-lg border border-slate-800 bg-slate-950/80 p-4 text-sm">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
