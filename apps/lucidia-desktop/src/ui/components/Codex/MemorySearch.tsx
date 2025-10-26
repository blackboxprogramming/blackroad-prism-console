import { FormEvent, useState } from 'react';
import { Button } from '@/ui/components/Primitives/Button';
import { Input } from '@/ui/components/Primitives/Input';
import { CodexDoc } from '@/shared/types';

interface MemorySearchProps {
  onSearch: (query: string) => Promise<CodexDoc[]>;
  onSendToChat: (docs: CodexDoc[]) => void;
}

export const MemorySearch = ({ onSearch, onSendToChat }: MemorySearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CodexDoc[]>([]);
  const [isSearching, setSearching] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const docs = await onSearch(query.trim());
      setResults(docs);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search memory" />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching…' : 'Search'}
        </Button>
      </form>
      <ul className="space-y-3">
        {results.map((doc) => (
          <li key={doc.id} className="rounded-md border border-slate-700 bg-surface-muted p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{doc.title}</p>
                <p className="text-xs text-slate-400">{doc.tags.join(', ')}</p>
              </div>
              <Button variant="secondary" onClick={() => onSendToChat([doc])}>
                Send to chat
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
