import { FormEvent, useState } from 'react';
import { Button } from '../Primitives/Button';

interface ComposerProps {
  disabled?: boolean;
  onSubmit: (value: string) => void;
}

export function Composer({ disabled, onSubmit }: ComposerProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        className="composer-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Send a message (Shift+Enter for newline)"
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Send
      </Button>
    </form>
  );
}
