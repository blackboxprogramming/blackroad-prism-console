import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeAccessibleEmojis from 'rehype-accessible-emojis';
import type { Components } from 'react-markdown';

const allowedSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className']],
    span: [...(defaultSchema.attributes?.span ?? []), ['className']],
    a: [...(defaultSchema.attributes?.a ?? []), ['target', 'rel']]
  }
};

const components: Components = {
  h1: (props) => <h1 className="text-3xl font-bold" {...props} />,
  h2: (props) => <h2 className="text-2xl font-semibold mt-6" {...props} />,
  h3: (props) => <h3 className="text-xl font-semibold mt-4" {...props} />,
  p: (props) => <p className="mt-4 leading-relaxed" {...props} />,
  ul: (props) => <ul className="mt-4 list-disc pl-6" {...props} />,
  ol: (props) => <ol className="mt-4 list-decimal pl-6" {...props} />,
  code: ({ className, children, ...rest }) => (
    <code className={`rounded bg-slate-100 px-1 py-0.5 text-sm ${className ?? ''}`.trim()} {...rest}>
      {children}
    </code>
  ),
  pre: (props) => <pre className="overflow-auto rounded bg-slate-900 p-4 text-slate-50" {...props} />
};

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, allowedSchema], rehypeRaw, rehypeAccessibleEmojis]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
