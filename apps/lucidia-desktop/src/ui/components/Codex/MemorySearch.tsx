interface MemorySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MemorySearch({ value, onChange }: MemorySearchProps) {
  return (
    <input
      className="memory-search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search memories"
    />
  );
}
