import { useEffect, useState } from 'react';

export default function CodexPrompt({ id }: { id: string }) {
  const [text, setText] = useState('');
  useEffect(() => {
    fetch(`/api/codex/${id}`).then(r => r.text()).then(setText);
  }, [id]);
  return (
    <div>
      <pre>{text}</pre>
      <p className="mt-8 text-sm opacity-70">Need outputs? See <a className="underline" href="/artifacts">Artifacts</a> for downloads + verification.</p>
    </div>
  );
}
