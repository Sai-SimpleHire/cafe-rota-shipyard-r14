import { describe, expect, it } from 'vitest';

import { checkPassword } from '@/components/auth/password';
import { suggestPassword } from '@/lib/rota/client';
import { AddShiftSchema, AddStaffSchema, AskSwapSchema } from '@/lib/rota/schemas';
import { validate } from '@/seams/validate';

describe('rota form rules', () => {
  it('needs a name, an email address and a starting password for a new person', () => {
    const result = validate(AddStaffSchema, { name: ' ', email: 'nope', password: '' });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.fieldErrors).sort()).toEqual(['email', 'name', 'password']);
  });

  it('suggests starting passwords the sign-in rules accept', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(checkPassword(suggestPassword(), { email: 'sam@example.com', name: 'Sam' }).ok).toBe(
        true,
      );
    }
  });

  it('refuses a shift that ends before it starts, on the end time', () => {
    const result = validate(AddShiftSchema, {
      weekStart: '2026-11-09',
      day: '2026-11-10',
      startTime: '13:00',
      endTime: '07:00',
      userId: 'u1',
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.fieldErrors.endTime).toBe('The shift has to end after it starts.');
  });

  it('accepts an ordinary shift and refuses a made-up time', () => {
    const shift = {
      weekStart: '2026-11-09',
      day: '2026-11-10',
      startTime: '07:00',
      endTime: '13:00',
      userId: 'u1',
    };
    expect(validate(AddShiftSchema, shift).ok).toBe(true);
    expect(validate(AddShiftSchema, { ...shift, startTime: '25:00' }).ok).toBe(false);
  });

  it('needs a colleague to swap with', () => {
    expect(validate(AskSwapSchema, { shiftId: 's1', toUserId: '' }).ok).toBe(false);
  });
});
