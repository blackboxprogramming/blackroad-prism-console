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
