import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CodexPrompt from '../components/CodexPrompt';

export default function CodexPromptPage() {
  const { slug } = useParams();
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    fetch(`/codex/${slug}.json`, { cache: 'no-cache' })
      .then((r) => r.json())
      .then(setPrompt)
      .catch(() =>
        setPrompt({ title: 'Not found', html: '<p>Prompt missing.</p>', copy_filename: 'prompt.txt' })
      );
  }, [slug]);
  if (!prompt) return <div className="card">Loading...</div>;
  return (
    <CodexPrompt
      title={prompt.title}
      bodyMarkdown={prompt.html}
      downloadName={prompt.copy_filename}
    />
  );
}
