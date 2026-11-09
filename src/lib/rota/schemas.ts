import { z } from 'zod';

import { field } from '@/seams/validate';

import { HHMM, ISO_DAY } from './dates';

/**
 * Every rota form's rules, used by the form in the browser and by its route on
 * the server (the `validate` convention), so the two can never disagree.
 */

const day = (label: string) => z.string().regex(ISO_DAY, `Please choose ${label}.`);
const time = (label: string) => z.string().regex(HHMM, `Please enter ${label} as 24-hour time.`);

export const AddStaffSchema = z.object({
  name: field.requiredText('their name').max(80, 'Please keep the name under 80 characters.'),
  email: field.email(),
  password: z.string().min(1, 'Please give them a starting password.'),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(1, 'Please choose a password.'),
});

export const AddShiftSchema = z
  .object({
    weekStart: day('a week'),
    day: day('a day'),
    startTime: time('the start time'),
    endTime: time('the end time'),
    userId: z.string().min(1, 'Please choose who is working.'),
  })
  .refine((shift) => shift.endTime > shift.startTime, {
    message: 'The shift has to end after it starts.',
    path: ['endTime'],
  });

export const PublishSchema = z.object({ weekStart: day('a week') });

export const AskSwapSchema = z.object({
  shiftId: field.id(),
  toUserId: z.string().min(1, 'Please choose a colleague.'),
});

export const DecideSwapSchema = z.object({
  decision: z.enum(['approve', 'decline']),
});
