import { useState } from 'react';

export function useFormError() {
  const [error, setError] = useState<string | null>(null);

  const onFieldChange = (setValue: (value: string) => void) => (value: string) => {
    setValue(value);
    setError((current) => (current ? null : current));
  };

  return { error, setError, onFieldChange };
}
