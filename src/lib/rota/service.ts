import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { displayName } from './access';
import { fromDbDate, overlaps, toDbDate } from './dates';

/**
 * The rota's rules that more than one route needs: who can be given a shift,
 * whether it clashes, and what approving a swap does.
 */

type Db = Prisma.TransactionClient | typeof prisma;

/** A member of staff who is still on the rota, with their name, or null. */
export async function activeStaff(db: Db, userId: string): Promise<{ name: string } | null> {
  const member = await db.staffMember.findUnique({ where: { userId } });
  if (!member || member.removedAt || member.role !== 'staff') return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return user ? { name: displayName(user) } : null;
}

/** "Sam is already working 08:00–12:00 that day.", or null when they are free. */
export async function clashFor(
  db: Db,
  shift: { userId: string; day: string; startTime: string; endTime: string; name: string },
  ignoreShiftId?: string,
): Promise<string | null> {
  const sameDay = await db.shift.findMany({
    where: { userId: shift.userId, day: toDbDate(shift.day) },
    select: { id: true, startTime: true, endTime: true },
  });
  const clash = sameDay.find((other) => other.id !== ignoreShiftId && overlaps(other, shift));
  if (!clash) return null;
  return `${shift.name} is already working ${clash.startTime}–${clash.endTime} that day.`;
}

export type SwapOutcome = { ok: true } | { ok: false; error: string };

/**
 * Approve a swap: the shift becomes the colleague's. All in one transaction,
 * and only if nothing has changed since it was asked for.
 */
export async function approveSwap(swapId: string): Promise<SwapOutcome> {
  return prisma.$transaction(
    async (tx) => {
      const swap = await tx.swapRequest.findUnique({
        where: { id: swapId },
        include: { shift: true },
      });
      if (!swap || swap.status !== 'pending') {
        return { ok: false, error: 'This request has already been answered.' };
      }
      if (swap.shift.userId !== swap.fromUserId) {
        return { ok: false, error: 'This shift has already changed hands.' };
      }
      const colleague = await activeStaff(tx, swap.toUserId);
      if (!colleague) return { ok: false, error: 'That colleague is no longer on the rota.' };

      const clash = await clashFor(tx, {
        userId: swap.toUserId,
        day: fromDbDate(swap.shift.day),
        startTime: swap.shift.startTime,
        endTime: swap.shift.endTime,
        name: colleague.name,
      });
      if (clash) return { ok: false, error: clash };

      const now = new Date();
      await tx.shift.update({ where: { id: swap.shiftId }, data: { userId: swap.toUserId } });
      await tx.swapRequest.update({
        where: { id: swapId },
        data: { status: 'approved', decidedAt: now },
      });
      // Any other request still waiting for this shift no longer makes sense.
      await tx.swapRequest.updateMany({
        where: { shiftId: swap.shiftId, status: 'pending' },
        data: { status: 'declined', decidedAt: now },
      });
      return { ok: true } as const;
    },
    { isolationLevel: 'Serializable' },
  );
}
