'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Dialog } from '@/components/ui_blocks/Dialog';
import { Button } from '@/components/ui_foundation/Button';
import { send, suggestPassword } from '@/lib/rota/client';
import { AddStaffSchema } from '@/lib/rota/schemas';
import { validate } from '@/seams/validate';

import { Field, FormProblem } from '../Field';

const FORM_ID = 'add-staff-form';

export function AddStaffDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [starting] = useState(suggestPassword);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const checked = validate(AddStaffSchema, values);
    if (!checked.ok) {
      setErrors(checked.fieldErrors);
      return;
    }
    setErrors({});
    setProblem(null);
    setBusy(true);
    const result = await send('/api/rota/staff', 'POST', checked.data);
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
      title="Add a staff member"
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
            {busy ? 'Adding…' : 'Add them'}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="rota-form" onSubmit={submit} noValidate>
        <FormProblem text={problem} />
        <Field id="staff-name" label="Name" error={errors.name}>
          <input name="name" type="text" autoComplete="off" maxLength={80} required />
        </Field>
        <Field id="staff-email" label="Email address" error={errors.email}>
          <input name="email" type="email" autoComplete="off" required />
        </Field>
        <Field
          id="staff-password"
          label="Starting password"
          hint="Tell them this in person. They will choose their own when they first sign in."
          error={errors.password}
        >
          <input name="password" type="text" autoComplete="off" defaultValue={starting} required />
        </Field>
      </form>
    </Dialog>
  );
}
