import { cloneElement, type ReactElement } from 'react';

/**
 * A label above its control, a hint, and the error attached to the control so
 * it is read out with it. The control is passed in and given its id and aria.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactElement<Record<string, unknown>>;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="rota-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': true } : {}),
      })}
      {hint ? (
        <p className="rota-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="rota-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** One sentence for the whole form, when it is not about a single field. */
export function FormProblem({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="rota-error" role="alert">
      {text}
    </p>
  );
}
