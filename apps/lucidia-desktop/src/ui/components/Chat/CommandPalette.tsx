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
