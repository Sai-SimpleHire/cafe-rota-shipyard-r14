'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { AppShell } from '@/components/ui_blocks/AppShell';

import { SignOutButton } from './SignOutButton';

const MANAGER_LINKS = [
  { href: '/plan', label: 'Plan the week' },
  { href: '/swaps', label: 'Swap requests' },
  { href: '/staff', label: 'Staff' },
];
const STAFF_LINKS = [{ href: '/shifts', label: 'My shifts' }];

/**
 * The frame every signed-in screen sits in: the app's name, who is signed in,
 * sign out, and one link per screen this person may use.
 */
export function RotaFrame({
  name,
  role,
  starting,
  children,
}: {
  name: string;
  role: 'manager' | 'staff';
  /** Still on the starting password: no links until they choose their own. */
  starting: boolean;
  children: ReactNode;
}) {
  const path = usePathname() ?? '/';
  const links = starting ? [] : role === 'manager' ? MANAGER_LINKS : STAFF_LINKS;

  return (
    <div className="rota-frame">
      <header className="rota-topbar">
        <p className="rota-brand">Café rota</p>
        <div className="rota-who">
          <span>Signed in as {name}</span>
          <SignOutButton />
        </div>
      </header>
      <AppShell items={links} path={path}>
        {children}
      </AppShell>
    </div>
  );
}
