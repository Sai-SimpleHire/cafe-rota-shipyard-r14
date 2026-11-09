import { prisma } from '@/lib/prisma';

import { displayName } from './access';
import { daysOfWeek, fromDbDate, toDbDate, today } from './dates';

/**
 * What the rota screens read. Every name is looked up from auth's User by id,
 * since rota tables hold a plain `userId` rather than a relation.
 */

export interface Person {
  userId: string;
  name: string;
  email: string;
  hasOwnPassword: boolean;
}

/** Names for a set of user ids, including people who have since left. */
export async function namesFor(userIds: readonly string[]): Promise<Map<string, string>> {
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(userIds)] } },
    select: { id: true, name: true, email: true },
  });
  return new Map(users.map((user) => [user.id, displayName(user)]));
}

/** Everyone currently on the rota as staff, by name. */
export async function listStaff(): Promise<Person[]> {
  const members = await prisma.staffMember.findMany({
    where: { role: 'staff', removedAt: null },
    select: { userId: true, mustChangePassword: true },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: members.map((member) => member.userId) } },
    select: { id: true, name: true, email: true },
  });
  const byId = new Map(users.map((user) => [user.id, user]));
  return members
    .flatMap((member) => {
      const user = byId.get(member.userId);
      if (!user) return [];
      return [
        {
          userId: user.id,
          name: displayName(user),
          email: user.email,
          hasOwnPassword: !member.mustChangePassword,
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** How many shifts from today on each person has. */
export async function upcomingShiftCounts(): Promise<Map<string, number>> {
  const groups = await prisma.shift.groupBy({
    by: ['userId'],
    where: { day: { gte: toDbDate(today()) } },
    _count: { _all: true },
  });
  return new Map(groups.map((group) => [group.userId, group._count._all]));
}

export interface PlannedShift {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  userId: string;
  name: string;
}

export interface PlannedWeek {
  monday: string;
  days: string[];
  published: boolean;
  shifts: PlannedShift[];
}

/** One week as the manager plans it: drafts included. */
export async function weekPlan(monday: string): Promise<PlannedWeek> {
  const week = await prisma.rotaWeek.findUnique({
    where: { startsOn: toDbDate(monday) },
    include: { shifts: { orderBy: [{ day: 'asc' }, { startTime: 'asc' }] } },
  });
  const shifts = week?.shifts ?? [];
  const names = await namesFor(shifts.map((shift) => shift.userId));
  return {
    monday,
    days: daysOfWeek(monday),
    published: Boolean(week?.publishedAt),
    shifts: shifts.map((shift) => ({
      id: shift.id,
      day: fromDbDate(shift.day),
      startTime: shift.startTime,
      endTime: shift.endTime,
      userId: shift.userId,
      name: names.get(shift.userId) ?? 'Someone who has left',
    })),
  };
}

export interface MyShift {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  /** The colleague a waiting swap request names, if there is one. */
  pendingSwapWith: string | null;
}

export interface SwapAnswer {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  toName: string;
  approved: boolean;
}

/** A member of staff's own shifts in published weeks, from today on, soonest first. */
export async function myShifts(userId: string): Promise<MyShift[]> {
  const shifts = await prisma.shift.findMany({
    where: { userId, day: { gte: toDbDate(today()) }, week: { publishedAt: { not: null } } },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    include: { swapRequests: { where: { status: 'pending', fromUserId: userId } } },
  });
  const names = await namesFor(
    shifts.flatMap((shift) => shift.swapRequests.map((s) => s.toUserId)),
  );
  return shifts.map((shift) => {
    const waiting = shift.swapRequests[0];
    return {
      id: shift.id,
      day: fromDbDate(shift.day),
      startTime: shift.startTime,
      endTime: shift.endTime,
      pendingSwapWith: waiting ? (names.get(waiting.toUserId) ?? 'a colleague') : null,
    };
  });
}

/** The last few answers to this person's swap requests. */
export async function recentAnswers(userId: string): Promise<SwapAnswer[]> {
  const answered = await prisma.swapRequest.findMany({
    where: { fromUserId: userId, status: { in: ['approved', 'declined'] } },
    orderBy: { decidedAt: 'desc' },
    take: 5,
    include: { shift: true },
  });
  const names = await namesFor(answered.map((swap) => swap.toUserId));
  return answered.map((swap) => ({
    id: swap.id,
    day: fromDbDate(swap.shift.day),
    startTime: swap.shift.startTime,
    endTime: swap.shift.endTime,
    toName: names.get(swap.toUserId) ?? 'a colleague',
    approved: swap.status === 'approved',
  }));
}

export interface SwapRow {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  fromName: string;
  toName: string;
  askedOn: string;
  status: 'pending' | 'approved' | 'declined';
}

/** Every swap request the manager needs: waiting ones first, then the latest answers. */
export async function allSwaps(): Promise<SwapRow[]> {
  const [waiting, answered] = await Promise.all([
    prisma.swapRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: { shift: true },
    }),
    prisma.swapRequest.findMany({
      where: { status: { not: 'pending' } },
      orderBy: { decidedAt: 'desc' },
      take: 50,
      include: { shift: true },
    }),
  ]);
  const swaps = [...waiting, ...answered];
  const names = await namesFor(swaps.flatMap((swap) => [swap.fromUserId, swap.toUserId]));
  return swaps.map((swap) => ({
    id: swap.id,
    day: fromDbDate(swap.shift.day),
    startTime: swap.shift.startTime,
    endTime: swap.shift.endTime,
    fromName: names.get(swap.fromUserId) ?? 'Someone who has left',
    toName: names.get(swap.toUserId) ?? 'Someone who has left',
    askedOn: fromDbDate(swap.createdAt),
    status: swap.status === 'approved' || swap.status === 'declined' ? swap.status : 'pending',
  }));
}
