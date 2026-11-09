'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Dialog } from '@/components/ui_blocks/Dialog';
import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/rota/client';
import { shortDay } from '@/lib/rota/dates';
import type { PlannedShift } from '@/lib/rota/queries';

import { FormProblem } from '../Field';

export function RemoveShiftDialog({
  shift,
  onClose,
}: {
  shift: PlannedShift;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function remove(): Promise<void> {
    setBusy(true);
    setProblem(null);
    const result = await send(`/api/rota/shifts/${encodeURIComponent(shift.id)}`, 'DELETE');
    setBusy(false);
    if (result.ok) {
      router.refresh();
      onClose();
      return;
    }
    setProblem(result.error);
  }

  return (
    <Dialog
      kind="confirm"
      title="Remove this shift?"
      onClose={onClose}
      actions={
        <>
          <Button tone="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button tone="danger" busy={busy} onClick={remove}>
            {busy ? 'Removing…' : 'Remove the shift'}
          </Button>
        </>
      }
    >
      <FormProblem text={problem} />
      <p>
        {shift.name}, {shortDay(shift.day)}, {shift.startTime}–{shift.endTime}. Any swap request for
        it is dropped too.
      </p>
    </Dialog>
  );
}
