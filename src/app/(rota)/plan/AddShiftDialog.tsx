'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Dialog } from '@/components/ui_blocks/Dialog';
import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/rota/client';
import { longDay } from '@/lib/rota/dates';
import type { PlannedWeek } from '@/lib/rota/queries';
import { AddShiftSchema } from '@/lib/rota/schemas';
import { validate } from '@/seams/validate';

import { Field, FormProblem } from '../Field';

export interface StaffChoice {
  userId: string;
  name: string;
}

const FORM_ID = 'add-shift-form';

export function AddShiftDialog({
  plan,
  staff,
  onClose,
}: {
  plan: PlannedWeek;
  staff: StaffChoice[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const values = {
      ...Object.fromEntries(new FormData(event.currentTarget)),
      weekStart: plan.monday,
    };
    const checked = validate(AddShiftSchema, values);
    if (!checked.ok) {
      setErrors(checked.fieldErrors);
      return;
    }
    setErrors({});
    setProblem(null);
    setBusy(true);
    const result = await send('/api/rota/shifts', 'POST', checked.data);
    setBusy(false);
    if (result.ok) {
      router.refresh();
      onClose();
      return;
    }
    setErrors(result.fieldErrors);
    if (Object.keys(result.fieldErrors).length === 0) setProblem(result.error);
  }

  return (
    <Dialog
      kind="form"
      title="Add a shift"
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
            {busy ? 'Adding…' : 'Add the shift'}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="rota-form" onSubmit={submit} noValidate>
        <FormProblem text={problem} />
        <Field id="shift-day" label="Day" error={errors.day}>
          <select name="day" defaultValue={plan.days[0]}>
            {plan.days.map((day) => (
              <option key={day} value={day}>
                {longDay(day)}
              </option>
            ))}
          </select>
        </Field>
        <div className="rota-pair">
          <Field id="shift-start" label="Starts" error={errors.startTime}>
            <input name="startTime" type="time" defaultValue="08:00" step={300} required />
          </Field>
          <Field id="shift-end" label="Ends" error={errors.endTime}>
            <input name="endTime" type="time" defaultValue="14:00" step={300} required />
          </Field>
        </div>
        <Field id="shift-who" label="Who is working" error={errors.userId}>
          <select name="userId" defaultValue="">
            <option value="" disabled>
              Choose someone
            </option>
            {staff.map((person) => (
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
