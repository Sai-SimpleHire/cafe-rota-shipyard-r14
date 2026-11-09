import type { Metadata } from 'next';

import { pageMember } from '@/lib/rota/access';
import { listStaff, upcomingShiftCounts } from '@/lib/rota/queries';

import { StaffScreen } from './StaffScreen';

export const metadata: Metadata = { title: 'Staff · Café rota' };

/** Staff (manager): who is on the rota, add someone, remove someone who has left. */
export default async function StaffPage() {
  await pageMember('/staff', 'manager');
  const [staff, counts] = await Promise.all([listStaff(), upcomingShiftCounts()]);

  return (
    <StaffScreen
      staff={staff.map((person) => ({ ...person, upcoming: counts.get(person.userId) ?? 0 }))}
    />
  );
}
