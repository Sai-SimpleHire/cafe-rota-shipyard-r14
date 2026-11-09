import type { Metadata } from 'next';

import { pageMember } from '@/lib/rota/access';
import { listStaff, myShifts, recentAnswers } from '@/lib/rota/queries';

import { ShiftCards } from './ShiftCards';

export const metadata: Metadata = { title: 'My shifts · Café rota' };

/** My shifts (staff): only my own, only published, soonest first. */
export default async function ShiftsPage() {
  const member = await pageMember('/shifts', 'staff');
  const [shifts, staff, answers] = await Promise.all([
    myShifts(member.userId),
    listStaff(),
    recentAnswers(member.userId),
  ]);
  const colleagues = staff
    .filter((person) => person.userId !== member.userId)
    .map((person) => ({ userId: person.userId, name: person.name }));

  return (
    <>
      <div className="rota-head">
        <h1>My shifts</h1>
      </div>
      <ShiftCards shifts={shifts} colleagues={colleagues} answers={answers} />
    </>
  );
}
