import { describe, expect, it } from 'vitest';

import {
  addDays,
  daysOfWeek,
  longDay,
  mondayOf,
  overlaps,
  shortDay,
  weekFromParam,
  weekName,
} from '@/lib/rota/dates';

describe('rota dates', () => {
  it('finds the Monday of any day, including Sunday', () => {
    expect(mondayOf('2026-11-09')).toBe('2026-11-09');
    expect(mondayOf('2026-11-11')).toBe('2026-11-09');
    expect(mondayOf('2026-11-15')).toBe('2026-11-09');
    expect(mondayOf('2026-11-16')).toBe('2026-11-16');
  });

  it('crosses months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysOfWeek('2026-12-28')).toHaveLength(7);
    expect(daysOfWeek('2026-12-28')[6]).toBe('2027-01-03');
  });

  it('reads a week from the address, or falls back to this week', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    expect(weekFromParam('2026-11-20', now)).toBe('2026-11-16');
    expect(weekFromParam('nonsense', now)).toBe(mondayOf(weekFromParam(undefined, now)));
    expect(weekFromParam('2026-13-45', now)).toBe(weekFromParam(undefined, now));
  });

  it('writes days the way the screens say them', () => {
    expect(shortDay('2026-11-10')).toBe('Tue 10 Nov');
    expect(longDay('2026-11-10')).toBe('Tuesday 10 November');
    expect(weekName('2026-11-09')).toBe('Week of 9 Nov');
  });

  it('knows when two shifts overlap', () => {
    const morning = { startTime: '07:00', endTime: '13:00' };
    expect(overlaps(morning, { startTime: '12:00', endTime: '17:00' })).toBe(true);
    expect(overlaps(morning, { startTime: '13:00', endTime: '17:00' })).toBe(false);
    expect(overlaps(morning, { startTime: '08:00', endTime: '09:00' })).toBe(true);
  });
});
