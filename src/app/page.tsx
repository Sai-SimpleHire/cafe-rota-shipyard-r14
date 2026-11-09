import { redirect } from 'next/navigation';

import { currentUser } from '@/components/auth/current-user';
import { cafeHasManager, homeFor, memberFor } from '@/lib/rota/access';

import { SignOutButton } from './(rota)/SignOutButton';
import { SetUpCafe } from './SetUpCafe';

import './rota.css';

/**
 * The front door. Sends everyone to their own screen; the only thing it ever
 * shows itself is the "you are not on the rota" page, which is also where the
 * very first manager sets the café up.
 */
export default async function Home() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');
  const member = await memberFor(user);
  if (member) redirect(homeFor(member));

  const needsManager = !(await cafeHasManager());

  return (
    <main className="rota-plain">
      <h1>Café rota</h1>
      {needsManager ? (
        <>
          <p>
            This café has no manager yet. If you plan the rota, set the café up now: you will add
            your staff and plan the first week next.
          </p>
          <SetUpCafe />
        </>
      ) : (
        <p>You are not on this café’s rota yet. Ask the manager to add you.</p>
      )}
      <p className="rota-note">Signed in as {user.email}.</p>
      <SignOutButton />
    </main>
  );
}
