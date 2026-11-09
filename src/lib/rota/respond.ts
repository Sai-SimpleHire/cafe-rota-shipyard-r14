import { NextResponse } from 'next/server';

import type { Invalid } from '@/seams/validate';

/** A form that did not pass its rules: one sentence, plus which field. */
export function invalid(result: Invalid): NextResponse {
  return NextResponse.json(
    { error: result.message, fieldErrors: result.fieldErrors },
    { status: 400 },
  );
}

/** A refusal a person can act on. */
export function refused(error: string, status = 409, field?: string): NextResponse {
  return NextResponse.json({ error, fieldErrors: field ? { [field]: error } : {} }, { status });
}

/** Something broke. The detail goes to the log, never to the screen. */
export function failed(where: string, error: unknown): NextResponse {
  console.error(`[rota] ${where} failed`, error);
  return NextResponse.json(
    { error: 'Something went wrong at our end. Nothing was changed.' },
    { status: 500 },
  );
}
