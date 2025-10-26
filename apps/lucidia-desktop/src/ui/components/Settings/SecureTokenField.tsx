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
import { useEffect, useState } from 'react';
import { Button } from '../Primitives/Button';
import { ipc } from '../../lib/fs';

interface SecureTokenFieldProps {
  label: string;
  secretKey: string;
}

export function SecureTokenField({ label, secretKey }: SecureTokenFieldProps) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    ipc
      .secureGet({ key: secretKey })
      .then((response) => {
        if (mounted && response.value) {
          setValue('••••••');
        }
      })
      .catch(() => {
        setStatus('Unable to load secret');
      });
    return () => {
      mounted = false;
    };
  }, [secretKey]);

  const handleSave = async () => {
    await ipc.secureSet({ key: secretKey, value });
    setStatus('Saved securely');
    setValue('');
  };

  const handleClear = async () => {
    await ipc.secureDelete({ key: secretKey });
    setStatus('Deleted secret');
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
    <div className="secure-token-field">
      <label>{label}</label>
      <input
        type="password"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter token"
      />
      <div className="secure-token-actions">
        <Button variant="secondary" onClick={handleSave}>
          Save
        </Button>
        <Button variant="ghost" onClick={handleClear}>
          Delete
        </Button>
      </div>
      {status ? <p className="secure-token-status">{status}</p> : null}
    </div>
  );
}
