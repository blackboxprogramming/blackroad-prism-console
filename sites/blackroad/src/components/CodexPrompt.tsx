import { useState, useMemo } from 'react';

export default function CodexPrompt({ title, bodyMarkdown, downloadName = 'codex_prompt.txt' }) {
  const [copied, setCopied] = useState(false);

  const plainText = useMemo(() => {
    return bodyMarkdown
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`{1,3}([\s\S]*?)`{1,3}/g, '$1');
  }, [bodyMarkdown]);

  async function copyAll() {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <article className="prose prose-neutral max-w-none">
        <div dangerouslySetInnerHTML={{ __html: bodyMarkdown }} />
      </article>
      <div className="mt-6 flex gap-3">
        <button onClick={copyAll} className="rounded-2xl border px-4 py-2">
          {copied ? 'Copied!' : 'Copy all'}
        </button>
        <button onClick={downloadTxt} className="rounded-2xl border px-4 py-2">
          Download .txt
        </button>
      </div>
    </section>
  );
}
