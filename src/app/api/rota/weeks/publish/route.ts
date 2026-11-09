import { NextResponse, type NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/rota/access';
import { mondayOf, toDbDate } from '@/lib/rota/dates';
import { failed, invalid, refused } from '@/lib/rota/respond';
import { PublishSchema } from '@/lib/rota/schemas';
import { validateBody } from '@/seams/validate';

/**
 * `POST /api/rota/weeks/publish` — the manager publishes a week. From now on
 * staff see their shifts in it, including any added later.
 */
export async function POST(request: NextRequest) {
  const access = await requireMember('manager');
  if (!access.ok) return access.response;

  const body = await validateBody(request, PublishSchema);
  if (!body.ok) return invalid(body);

  try {
    const week = await prisma.rotaWeek.findUnique({
      where: { startsOn: toDbDate(mondayOf(body.data.weekStart)) },
      select: { id: true, publishedAt: true, _count: { select: { shifts: true } } },
    });
    if (!week || week._count.shifts === 0) {
      return refused('Add at least one shift before publishing.', 400);
    }
    if (!week.publishedAt) {
      await prisma.rotaWeek.update({ where: { id: week.id }, data: { publishedAt: new Date() } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failed('publishing a week', error);
  }
}
