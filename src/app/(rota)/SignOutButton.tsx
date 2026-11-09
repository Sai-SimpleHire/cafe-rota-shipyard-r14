'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui_foundation/Button';

/** Ends this session through the sign-in component's own route. */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut(): Promise<void> {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.refresh();
    router.push('/sign-in');
  }

  return (
    <Button tone="quiet" busy={busy} onClick={signOut}>
      {busy ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
