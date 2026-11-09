import type { Metadata } from 'next';

import { pageMember } from '@/lib/rota/access';
import { weekFromParam } from '@/lib/rota/dates';
import { listStaff, weekPlan } from '@/lib/rota/queries';

import { PlanScreen } from './PlanScreen';

export const metadata: Metadata = { title: 'Plan the week · Café rota' };

/** Plan the week (manager): add shifts to a week, then publish it to staff. */
export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const monday = weekFromParam(week);
  await pageMember(`/plan?week=${monday}`, 'manager');
  const [plan, staff] = await Promise.all([weekPlan(monday), listStaff()]);

  return (
    <PlanScreen
      plan={plan}
      staff={staff.map((person) => ({ userId: person.userId, name: person.name }))}
    />
  );
}
