import { NextResponse, type NextRequest } from 'next/server';

import { checkPassword, hashPassword, verifyPassword } from '@/components/auth/password';
import { createSession, revokeAllSessions } from '@/components/auth/session';
import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/rota/access';
import { failed, invalid, refused } from '@/lib/rota/respond';
import { NewPasswordSchema } from '@/lib/rota/schemas';
import { validateBody } from '@/seams/validate';

/**
 * `POST /api/rota/password` — a member of staff replaces the starting password
 * the manager gave them with their own.
 *
 * Uses the sign-in component's rules and hashing. Every other session is
 * signed out (the manager knew the old password), and this one is renewed.
 */
export async function POST(request: NextRequest) {
  const access = await requireMember(undefined, { allowStartingPassword: true });
  if (!access.ok) return access.response;
  const { member } = access;
  // Only for swapping the starting password. Changing your own password later
  // goes through "I have forgotten my password", which proves the email: a
  // session alone (a phone left unlocked) must not be enough to take an account.
  if (!member.mustChangePassword) {
    return refused('Your password is already your own.', 409);
  }

  const body = await validateBody(request, NewPasswordSchema);
  if (!body.ok) return invalid(body);

  const check = checkPassword(body.data.password, { email: member.email, name: member.name });
  if (!check.ok)
    return refused(check.issues[0] ?? 'Please choose a stronger password.', 400, 'password');

  try {
    const user = await prisma.user.findUnique({
      where: { id: member.userId },
      select: { passwordHash: true },
    });
    if (user && (await verifyPassword(body.data.password, user.passwordHash))) {
      return refused('Please choose a password different from the starting one.', 400, 'password');
    }

    const passwordHash = await hashPassword(body.data.password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: member.userId }, data: { passwordHash } }),
      prisma.staffMember.update({
        where: { userId: member.userId },
        data: { mustChangePassword: false },
      }),
    ]);
    await revokeAllSessions(member.userId);
    await createSession(member.userId, {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failed('changing a password', error);
  }
}
