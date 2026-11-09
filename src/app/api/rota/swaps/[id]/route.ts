import { NextResponse, type NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/rota/access';
import { failed, invalid, refused } from '@/lib/rota/respond';
import { DecideSwapSchema } from '@/lib/rota/schemas';
import { approveSwap } from '@/lib/rota/service';
import { validateBody } from '@/seams/validate';

/**
 * `POST /api/rota/swaps/:id` — the manager approves or turns down a request.
 * Approving moves the shift; turning down leaves the rota exactly as it was.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireMember('manager');
  if (!access.ok) return access.response;
  const { id } = await context.params;

  const body = await validateBody(request, DecideSwapSchema);
  if (!body.ok) return invalid(body);

  try {
    if (body.data.decision === 'approve') {
      const outcome = await approveSwap(id);
      if (!outcome.ok) return refused(outcome.error, 409);
      return NextResponse.json({ ok: true });
    }

    const declined = await prisma.swapRequest.updateMany({
      where: { id, status: 'pending' },
      data: { status: 'declined', decidedAt: new Date() },
    });
    if (declined.count === 0) return refused('This request has already been answered.', 409);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failed('answering a swap request', error);
  }
}
