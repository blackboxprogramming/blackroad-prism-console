import { FormEvent, useState } from 'react';
import { Button } from '@/ui/components/Primitives/Button';

interface ComposerProps {
  onSubmit: (content: string) => void;
}

export const Composer = ({ onSubmit }: ComposerProps) => {
  const [draft, setDraft] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onSubmit(draft.trim());
    setDraft('');
  };

  return (
    <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit} aria-label="Compose message">
      <textarea
        className="min-h-[6rem] w-full rounded-md border border-slate-700 bg-surface-muted p-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Send a message. Use /memory add or /task new to route commands."
      />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Shift+Enter for newline</span>
        <Button type="submit" disabled={!draft.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
};
