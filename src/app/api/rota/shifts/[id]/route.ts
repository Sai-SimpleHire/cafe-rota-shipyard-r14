import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/rota/access';
import { failed, refused } from '@/lib/rota/respond';

/**
 * `DELETE /api/rota/shifts/:id` — the manager takes a shift off the rota.
 * Its swap requests go with it (a relation inside the rota's own tables).
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireMember('manager');
  if (!access.ok) return access.response;
  const { id } = await context.params;

  try {
    const removed = await prisma.shift.deleteMany({ where: { id } });
    if (removed.count === 0) return refused('That shift is no longer on the rota.', 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failed('removing a shift', error);
  }
}
