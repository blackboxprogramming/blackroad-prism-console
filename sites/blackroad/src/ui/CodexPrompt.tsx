import { useEffect, useState } from 'react';

export default function CodexPrompt({ id }: { id: string }) {
  const [text, setText] = useState('');
  useEffect(() => {
    fetch(`/api/codex/${id}`).then(r => r.text()).then(setText);
  }, [id]);
  return <pre>{text}</pre>;
}
