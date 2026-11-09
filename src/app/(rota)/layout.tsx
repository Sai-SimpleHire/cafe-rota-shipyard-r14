import type { ReactNode } from 'react';

import { currentUser } from '@/components/auth/current-user';
import { memberFor } from '@/lib/rota/access';

import { RotaFrame } from './RotaFrame';

import '../rota.css';

/**
 * The frame for every signed-in screen. Each page checks for itself who may
 * see it (`pageMember`); this only decides which links to show.
 */
export default async function RotaLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const member = user ? await memberFor(user) : null;
  if (!member) return <>{children}</>;

  return (
    <RotaFrame name={member.name} role={member.role} starting={member.mustChangePassword}>
      {children}
    </RotaFrame>
  );
}
