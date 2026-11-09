import { NextResponse, type NextRequest } from 'next/server';

import { checkPassword, hashPassword, normaliseEmail } from '@/components/auth/password';
import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/rota/access';
import { failed, invalid, refused } from '@/lib/rota/respond';
import { AddStaffSchema } from '@/lib/rota/schemas';
import { validateBody } from '@/seams/validate';

/**
 * `POST /api/rota/staff` — the manager adds a member of staff with a starting
 * password, which they must change the first time they sign in.
 *
 * The account is made with the sign-in component's own password rules and
 * hashing, rather than through its register route, which would sign the
 * manager in as the new person.
 */
export async function POST(request: NextRequest) {
  const access = await requireMember('manager');
  if (!access.ok) return access.response;

  const body = await validateBody(request, AddStaffSchema);
  if (!body.ok) return invalid(body);

  const email = normaliseEmail(body.data.email);
  const check = checkPassword(body.data.password, { email, name: body.data.name });
  if (!check.ok)
    return refused(check.issues[0] ?? 'Please choose a stronger password.', 400, 'password');

  try {
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) return refused('Someone already uses that email address here.', 409, 'email');

    const passwordHash = await hashPassword(body.data.password);
    const userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: body.data.name, passwordHash },
        select: { id: true },
      });
      await tx.staffMember.create({
        data: { userId: user.id, role: 'staff', mustChangePassword: true },
      });
      return user.id;
    });
    return NextResponse.json({ ok: true, userId }, { status: 201 });
  } catch (error) {
    return failed('adding a member of staff', error);
  }
}
