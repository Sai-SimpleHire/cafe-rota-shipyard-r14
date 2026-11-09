'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/rota/client';

/** Makes the signed-in person the café's manager, once, when there is none. */
export function SetUpCafe() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setUp(): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await send('/api/rota/setup', 'POST');
    if (result.ok) {
      router.push('/staff');
      router.refresh();
      return;
    }
    setError(result.error);
    setBusy(false);
  }

  return (
    <div className="rota-form">
      {error ? (
        <p className="rota-error" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <Button tone="primary" busy={busy} onClick={setUp}>
          {busy ? 'Setting up…' : 'Set up the café as its manager'}
        </Button>
      </div>
    </div>
  );
}
