import { NextResponse } from 'next/server';

import { revokeAllSessions } from '@/components/auth/session';
import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/rota/access';
import { toDbDate, today } from '@/lib/rota/dates';
import { failed, refused } from '@/lib/rota/respond';

/**
 * `DELETE /api/rota/staff/:userId` — someone has left.
 *
 * In one transaction: their sign-in is switched off, their shifts from today
 * on come off the rota, and every waiting swap they are part of is turned
 * down. Past shifts stay, with their name, as a record of who worked.
 * The rota tables hold a plain userId, so nothing cascades by itself: each of
 * these is done here explicitly.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const access = await requireMember('manager');
  if (!access.ok) return access.response;
  const { userId } = await context.params;

  try {
    const member = await prisma.staffMember.findUnique({ where: { userId } });
    if (!member || member.removedAt || member.role !== 'staff') {
      return refused('That person is not on the rota.', 404);
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.swapRequest.updateMany({
        where: { status: 'pending', OR: [{ fromUserId: userId }, { toUserId: userId }] },
        data: { status: 'declined', decidedAt: now },
      });
      await tx.shift.deleteMany({ where: { userId, day: { gte: toDbDate(today()) } } });
      await tx.staffMember.update({ where: { userId }, data: { removedAt: now } });
      await tx.user.update({ where: { id: userId }, data: { disabledAt: now } });
    });
    await revokeAllSessions(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failed('removing a member of staff', error);
  }
}
