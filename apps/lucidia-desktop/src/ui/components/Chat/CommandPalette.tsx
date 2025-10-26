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
import { Dialog } from '../Primitives/Dialog';
import { Button } from '../Primitives/Button';
import { useCodex } from '../../hooks/useCodex';
import { useTasks } from '../../hooks/useTasks';
import { useState } from 'react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { addDoc } = useCodex();
  const { addTask } = useTasks();
  const [command, setCommand] = useState('');

  const handleCommand = () => {
    if (command.startsWith('/memory add')) {
      addDoc({ title: 'New memory', tags: [], content: command.replace('/memory add', '').trim() });
    } else if (command.startsWith('/task new')) {
      addTask(command.replace('/task new', '').trim() || 'Untitled task');
    }
    setCommand('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Command Palette">
      <div className="command-palette">
        <input
          className="command-input"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="/memory add ... or /task new ..."
          autoFocus
        />
        <div className="command-actions">
          <Button onClick={handleCommand}>Run</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
