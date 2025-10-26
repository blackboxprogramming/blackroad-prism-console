import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/ui/components/Primitives/Button';
import { Input } from '@/ui/components/Primitives/Input';
import { secureDelete, secureGet, secureSet } from '@/ui/lib/ipc';

interface SecureTokenFieldProps {
  storageKey: string;
}

export const SecureTokenField = ({ storageKey }: SecureTokenFieldProps) => {
  const [value, setValue] = useState('');
  const [isLoaded, setLoaded] = useState(false);

  useEffect(() => {
    secureGet({ key: storageKey }).then((response) => {
      setValue(response.value ? '••••••••' : '');
      setLoaded(true);
    });
  }, [storageKey]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    await secureSet({ key: storageKey, value: value.trim() });
    setValue('••••••••');
  };

  const handleDelete = async () => {
    await secureDelete({ key: storageKey });
    setValue('');
  };

  return (
    <form onSubmit={handleSave} className="space-y-2">
      <label className="text-xs uppercase text-slate-400" htmlFor={`secure-${storageKey}`}>
        Secure Token
      </label>
      <Input
        id={`secure-${storageKey}`}
        type="password"
        disabled={!isLoaded}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter secret token"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={!value.trim()}>Save</Button>
        <Button type="button" variant="ghost" onClick={handleDelete}>
          Remove
        </Button>
      </div>
    </form>
  );
};
