import { NextResponse, type NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/rota/access';
import { daysOfWeek, mondayOf, toDbDate } from '@/lib/rota/dates';
import { failed, invalid, refused } from '@/lib/rota/respond';
import { AddShiftSchema } from '@/lib/rota/schemas';
import { activeStaff, clashFor } from '@/lib/rota/service';
import { validateBody } from '@/seams/validate';

/**
 * `POST /api/rota/shifts` — the manager adds a shift to a week. The week is
 * created as a draft the first time anything is added to it.
 */
export async function POST(request: NextRequest) {
  const access = await requireMember('manager');
  if (!access.ok) return access.response;

  const body = await validateBody(request, AddShiftSchema);
  if (!body.ok) return invalid(body);
  const shift = body.data;

  const monday = mondayOf(shift.weekStart);
  if (!daysOfWeek(monday).includes(shift.day)) {
    return refused('Please choose a day in this week.', 400, 'day');
  }

  try {
    const person = await activeStaff(prisma, shift.userId);
    if (!person) return refused('Please choose someone on the rota.', 400, 'userId');

    const clash = await clashFor(prisma, { ...shift, name: person.name });
    if (clash) return refused(clash, 409, 'startTime');

    const week = await prisma.rotaWeek.upsert({
      where: { startsOn: toDbDate(monday) },
      create: { startsOn: toDbDate(monday) },
      update: {},
    });
    await prisma.shift.create({
      data: {
        weekId: week.id,
        day: toDbDate(shift.day),
        startTime: shift.startTime,
        endTime: shift.endTime,
        userId: shift.userId,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return failed('adding a shift', error);
  }
}
