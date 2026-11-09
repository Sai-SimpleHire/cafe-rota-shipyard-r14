import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

import { currentUser, requireUser } from '@/components/auth/current-user';
import type { SessionUser } from '@/components/auth/session';
import { signInLinkFor } from '@/components/auth_screens/redirect';
import { prisma } from '@/lib/prisma';

/**
 * Who someone is on the rota, on top of who is signed in.
 *
 * Sign-in (the `auth` component) says *who* this is. This says whether they
 * are the manager, a member of staff, or nobody on this café's rota — and
 * whether they still have to swap their starting password for their own.
 */

export type Role = 'manager' | 'staff';

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

/** The name people see: the one the manager typed, else the email address. */
export function displayName(user: { name: string | null; email: string }): string {
  return user.name?.trim() || user.email;
}

export async function memberFor(user: SessionUser): Promise<Member | null> {
  const row = await prisma.staffMember.findUnique({ where: { userId: user.id } });
  if (!row || row.removedAt) return null;
  return {
    userId: user.id,
    name: displayName(user),
    email: user.email,
    role: row.role === 'manager' ? 'manager' : 'staff',
    mustChangePassword: row.mustChangePassword,
  };
}

/** Whether the café has a manager yet. The first one is set up from the home screen. */
export async function cafeHasManager(): Promise<boolean> {
  const count = await prisma.staffMember.count({ where: { role: 'manager', removedAt: null } });
  return count > 0;
}

/** Where a member belongs when they arrive. */
export function homeFor(member: Member): string {
  if (member.mustChangePassword) return '/welcome';
  return member.role === 'manager' ? '/plan' : '/shifts';
}

/**
 * For a page: the member, or a redirect to where they should be instead.
 * `path` is the page's own address, so sign-in can bring them back to it.
 */
export async function pageMember(path: string, role?: Role): Promise<Member> {
  const user = await currentUser();
  if (!user) redirect(signInLinkFor(path));
  const member = await memberFor(user);
  if (!member) redirect('/');
  if (member.mustChangePassword && path !== '/welcome') redirect('/welcome');
  if (role && member.role !== role) redirect(homeFor(member));
  return member;
}

type Allowed = { ok: true; member: Member };
type Refused = { ok: false; response: NextResponse };

function refuse(error: string, status: number): Refused {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/**
 * For a route: the member, or the response that says why not.
 * Same shape as `requireUser`, so a forgotten `if` cannot let a request through.
 */
export async function requireMember(
  role?: Role,
  options: { allowStartingPassword?: boolean } = {},
): Promise<Allowed | Refused> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, response: auth.response };
  const member = await memberFor(auth.user);
  if (!member) return refuse('You are not on this café’s rota.', 403);
  if (member.mustChangePassword && !options.allowStartingPassword) {
    return refuse('Choose your own password first.', 403);
  }
  if (role && member.role !== role) return refuse('Only the manager can do that.', 403);
  return { ok: true, member };
}
