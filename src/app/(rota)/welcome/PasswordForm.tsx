'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { buttonProps } from '@/components/ui_foundation/primitives';
import { send } from '@/lib/rota/client';

import { Field, FormProblem } from '../Field';

export function PasswordForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') ?? '');
    const again = String(data.get('again') ?? '');
    if (!password) return setErrors({ password: 'Please choose a password.' });
    if (password !== again) return setErrors({ again: 'Those two do not match.' });

    setErrors({});
    setProblem(null);
    setBusy(true);
    const result = await send('/api/rota/password', 'POST', { password });
    if (result.ok) {
      router.push('/');
      router.refresh();
      return;
    }
    setBusy(false);
    setErrors(result.fieldErrors);
    if (Object.keys(result.fieldErrors).length === 0) setProblem(result.error);
  }

  return (
    <form className="rota-form" onSubmit={submit} noValidate>
      <FormProblem text={problem} />
      <Field
        id="new-password"
        label="New password"
        hint="At least 12 characters, with three of: small letters, capitals, numbers, symbols."
        error={errors.password}
      >
        <input name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field id="again-password" label="Type it again" error={errors.again}>
        <input name="again" type="password" autoComplete="new-password" required />
      </Field>
      <div>
        <button {...buttonProps({ tone: 'primary', busy })} type="submit">
          {busy ? 'Saving…' : 'Save my password'}
        </button>
      </div>
    </form>
  );
}
