import { useEffect, useState } from 'react';
import { Input } from '@/ui/components/Primitives/Input';

interface CommandPaletteProps {
  onCommand: (command: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ onCommand, isOpen, onClose }: CommandPaletteProps) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="w-[32rem] rounded-lg border border-slate-700 bg-surface p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!value.trim()) return;
            onCommand(value.trim());
            onClose();
          }}
        >
          <Input
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Run a command, e.g. /memory add"
          />
        </form>
      </div>
    </div>
  );
};
