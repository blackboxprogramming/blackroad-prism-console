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
