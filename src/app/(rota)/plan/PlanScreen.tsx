'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { DataTable } from '@/components/data_table/DataTable';
import { Button } from '@/components/ui_foundation/Button';
import { Status } from '@/components/ui_foundation/Status';
import { send } from '@/lib/rota/client';
import { addDays, shortDay, toDbDate, weekName } from '@/lib/rota/dates';
import type { PlannedShift, PlannedWeek } from '@/lib/rota/queries';

import { FormProblem } from '../Field';
import { AddShiftDialog, type StaffChoice } from './AddShiftDialog';
import { RemoveShiftDialog } from './RemoveShiftDialog';

export function PlanScreen({ plan, staff }: { plan: PlannedWeek; staff: StaffChoice[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<PlannedShift | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const name = weekName(plan.monday);

  async function publish(): Promise<void> {
    setPublishing(true);
    setProblem(null);
    const result = await send('/api/rota/weeks/publish', 'POST', { weekStart: plan.monday });
    setPublishing(false);
    if (result.ok) router.refresh();
    else setProblem(result.error);
  }

  const rows = plan.shifts.map((shift) => ({
    day: toDbDate(shift.day),
    starts: shift.startTime,
    ends: shift.endTime,
    who: shift.name,
    actions: (
      <Button tone="quiet" onClick={() => setRemoving(shift)}>
        Remove
        <span className="ui-visually-hidden">
          {' '}
          {shift.name}, {shortDay(shift.day)} {shift.startTime}
        </span>
      </Button>
    ),
  }));

  return (
    <>
      <div className="rota-head">
        <h1>Plan the week</h1>
        {plan.published ? null : (
          <Button tone="primary" busy={publishing} onClick={publish}>
            {publishing ? 'Publishing…' : 'Publish this week'}
          </Button>
        )}
      </div>

      <nav className="rota-toolbar" aria-label="Choose a week">
        <Link className="ui-button ui-button-quiet" href={`/plan?week=${addDays(plan.monday, -7)}`}>
          ← Previous week
        </Link>
        <span className="rota-week-name">{name}</span>
        <Link className="ui-button ui-button-quiet" href={`/plan?week=${addDays(plan.monday, 7)}`}>
          Next week →
        </Link>
        {plan.published ? (
          <Status tone="ok" label="Published" />
        ) : (
          <Status tone="warn" label="Draft — staff cannot see it" />
        )}
      </nav>

      <FormProblem text={problem} />
      {plan.published ? (
        <p className="rota-note">Published. Staff see changes to this week straight away.</p>
      ) : null}

      {staff.length === 0 ? (
        <p className="rota-empty">
          Add your staff first, then come back to plan the week.{' '}
          <Link href="/staff">Go to Staff</Link>
        </p>
      ) : (
        <div className="rota-toolbar">
          <Button onClick={() => setAdding(true)}>Add a shift</Button>
        </div>
      )}

      {rows.length === 0 ? (
        staff.length > 0 ? (
          <p className="rota-empty">
            No shifts in this week yet. Add the first one, then publish the week when it is ready.
          </p>
        ) : null
      ) : (
        <DataTable
          caption={`Shifts in the ${name.replace('Week', 'week')}`}
          rows={rows}
          pageSize={50}
          columns={[
            { key: 'day', label: 'Day' },
            { key: 'starts', label: 'Starts' },
            { key: 'ends', label: 'Ends' },
            { key: 'who', label: 'Who' },
            { key: 'actions', label: 'Actions', sortable: false },
          ]}
        />
      )}

      {adding ? (
        <AddShiftDialog plan={plan} staff={staff} onClose={() => setAdding(false)} />
      ) : null}
      {removing ? <RemoveShiftDialog shift={removing} onClose={() => setRemoving(null)} /> : null}
    </>
  );
}
