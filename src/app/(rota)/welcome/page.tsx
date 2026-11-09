import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { homeFor, pageMember } from '@/lib/rota/access';

import { PasswordForm } from './PasswordForm';

export const metadata: Metadata = { title: 'Choose your own password · Café rota' };

/** First sign-in: swap the starting password the manager gave for your own. */
export default async function WelcomePage() {
  const member = await pageMember('/welcome');
  if (!member.mustChangePassword) redirect(homeFor(member));

  return (
    <div className="rota-form" style={{ maxWidth: '26rem' }}>
      <h1>Choose your own password</h1>
      <p className="rota-lede">
        Your manager gave you a starting password. Pick one only you know before you see your
        shifts.
      </p>
      <PasswordForm />
    </div>
  );
}
