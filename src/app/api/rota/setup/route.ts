import { NextResponse } from 'next/server';

import { requireUser } from '@/components/auth/current-user';
import { prisma } from '@/lib/prisma';
import { failed, refused } from '@/lib/rota/respond';

/**
 * `POST /api/rota/setup` — the signed-in person becomes the café's manager.
 * Only while the café has none; after that, staff are added by the manager.
 */
export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const done = await prisma.$transaction(
      async (tx) => {
        const managers = await tx.staffMember.count({
          where: { role: 'manager', removedAt: null },
        });
        if (managers > 0) return false;
        await tx.staffMember.upsert({
          where: { userId: auth.user.id },
          create: { userId: auth.user.id, role: 'manager' },
          update: { role: 'manager', removedAt: null, mustChangePassword: false },
        });
        return true;
      },
      { isolationLevel: 'Serializable' },
    );
    if (!done) return refused('This café already has a manager. Ask them to add you.');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failed('setting up the café', error);
  }
}
