import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/ui/components/Primitives/Button';
import { Input } from '@/ui/components/Primitives/Input';
import { CodexDoc } from '@/shared/types';

interface MemoryEditorProps {
  initial?: CodexDoc | null;
  onSave: (payload: { title: string; tags: string[]; content: string }) => void;
}

export const MemoryEditor = ({ initial, onSave }: MemoryEditorProps) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [content, setContent] = useState(initial?.content ?? '');

  useEffect(() => {
    setTitle(initial?.title ?? '');
    setTags(initial?.tags.join(', ') ?? '');
    setContent(initial?.content ?? '');
  }, [initial]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ title, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), content });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Memory editor">
      <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" required />
      <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated)" />
      <textarea
        className="h-48 w-full rounded-md border border-slate-700 bg-surface-muted p-3 text-sm text-slate-100"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Markdown content"
      />
      <Button type="submit">Save memory</Button>
    </form>
  );
};
import { useState } from 'react';
import { CodexDoc } from '../../../shared/types';
import { Button } from '../Primitives/Button';
import { renderMarkdown } from '../../lib/markdown';

interface MemoryEditorProps {
  doc: CodexDoc;
}

export function MemoryEditor({ doc }: MemoryEditorProps) {
  const [title, setTitle] = useState(doc.title);
  const [tags, setTags] = useState(doc.tags.join(', '));
  const [content, setContent] = useState(doc.content);
  const [preview, setPreview] = useState(false);

  return (
    <div className="memory-editor">
      <div className="memory-editor-controls">
        <input
          className="memory-editor-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
        />
        <input
          className="memory-editor-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="Tags (comma separated)"
        />
        <Button variant="secondary" onClick={() => setPreview((value) => !value)}>
          {preview ? 'Edit' : 'Preview'}
        </Button>
      </div>
      {preview ? (
        <article
          className="memory-preview"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      ) : (
        <textarea
          className="memory-editor-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write in Markdown"
        />
      )}
    </div>
  );
}
