'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Dialog } from '@/components/ui_blocks/Dialog';
import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/rota/client';

import { FormProblem } from '../Field';
import type { StaffRow } from './StaffScreen';

export function RemoveStaffDialog({ person, onClose }: { person: StaffRow; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function remove(): Promise<void> {
    setBusy(true);
    setProblem(null);
    const result = await send(`/api/rota/staff/${encodeURIComponent(person.userId)}`, 'DELETE');
    setBusy(false);
    if (result.ok) {
      router.refresh();
      onClose();
      return;
    }
    setProblem(result.error);
  }

  const shifts =
    person.upcoming === 0
      ? 'They have no upcoming shifts.'
      : `Their ${person.upcoming} upcoming ${person.upcoming === 1 ? 'shift comes' : 'shifts come'}
        off the rota.`;

  return (
    <Dialog
      kind="confirm"
      title={`Remove ${person.name}?`}
      onClose={onClose}
      actions={
        <>
          <Button tone="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button tone="danger" busy={busy} onClick={remove}>
            {busy ? 'Removing…' : `Remove ${person.name}`}
          </Button>
        </>
      }
    >
      <FormProblem text={problem} />
      <p>
        {person.name} will not be able to sign in any more. {shifts} Any swap requests they are part
        of are turned down.
      </p>
    </Dialog>
  );
}
