'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Dialog } from '@/components/ui_blocks/Dialog';
import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/rota/client';
import { longDay } from '@/lib/rota/dates';
import type { MyShift } from '@/lib/rota/queries';
import { AskSwapSchema } from '@/lib/rota/schemas';
import { validate } from '@/seams/validate';

import { Field, FormProblem } from '../Field';
import type { StaffChoice } from '../plan/AddShiftDialog';

const FORM_ID = 'ask-swap-form';

export function AskSwapDialog({
  shift,
  colleagues,
  onClose,
}: {
  shift: MyShift;
  colleagues: StaffChoice[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const toUserId = String(new FormData(event.currentTarget).get('toUserId') ?? '');
    const checked = validate(AskSwapSchema, { shiftId: shift.id, toUserId });
    if (!checked.ok) {
      setError(checked.fieldErrors.toUserId);
      return;
    }
    setError(undefined);
    setProblem(null);
    setBusy(true);
    const result = await send('/api/rota/swaps', 'POST', checked.data);
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
      kind="form"
      title="Ask to swap this shift"
      onClose={onClose}
      actions={
        <>
          <Button tone="quiet" onClick={onClose}>
            Cancel
          </Button>
          <button
            className="ui-button ui-button-primary"
            type="submit"
            form={FORM_ID}
            aria-busy={busy || undefined}
          >
            {busy ? 'Sending…' : 'Send the request'}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="rota-form" onSubmit={submit} noValidate>
        <p>
          {longDay(shift.day)}, {shift.startTime} – {shift.endTime}. If the manager approves, the
          shift becomes theirs.
        </p>
        <FormProblem text={problem} />
        <Field id="swap-to" label="Who could take this shift?" error={error}>
          <select name="toUserId" defaultValue="">
            <option value="" disabled>
              Choose a colleague
            </option>
            {colleagues.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.name}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Dialog>
  );
}
