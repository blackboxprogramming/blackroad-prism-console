'use client';

import { Markdown } from '@/lib/markdown';

export function ContentRenderer({ content }: { content: string }) {
  return (
    <section className="prose prose-slate mt-6 max-w-none">
      <Markdown content={content} />
    </section>
  );
}
