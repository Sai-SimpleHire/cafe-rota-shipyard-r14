import { NextResponse, type NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/rota/access';
import { fromDbDate, today } from '@/lib/rota/dates';
import { failed, invalid, refused } from '@/lib/rota/respond';
import { AskSwapSchema } from '@/lib/rota/schemas';
import { activeStaff } from '@/lib/rota/service';
import { validateBody } from '@/seams/validate';

/**
 * `POST /api/rota/swaps` — a member of staff asks for one of their own
 * published, upcoming shifts to go to a named colleague. Nothing on the rota
 * changes until the manager approves it.
 */
export async function POST(request: NextRequest) {
  const access = await requireMember('staff');
  if (!access.ok) return access.response;
  const me = access.member.userId;

  const body = await validateBody(request, AskSwapSchema);
  if (!body.ok) return invalid(body);
  const { shiftId, toUserId } = body.data;

  try {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { week: true, swapRequests: { where: { status: 'pending' } } },
    });
    // Someone else's shift reads the same as a missing one.
    if (!shift || shift.userId !== me || !shift.week.publishedAt) {
      return refused('That shift is not one of yours.', 404);
    }
    if (fromDbDate(shift.day) < today()) return refused('That shift has already happened.', 400);
    if (shift.swapRequests.length > 0) {
      return refused('You have already asked to swap this shift.', 409);
    }
    if (toUserId === me) return refused('Please choose a colleague.', 400, 'toUserId');
    if (!(await activeStaff(prisma, toUserId))) {
      return refused('Please choose a colleague on the rota.', 400, 'toUserId');
    }

    await prisma.swapRequest.create({ data: { shiftId, fromUserId: me, toUserId } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return failed('asking for a swap', error);
  }
}
