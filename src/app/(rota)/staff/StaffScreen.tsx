'use client';

import { useState } from 'react';

import { DataTable } from '@/components/data_table/DataTable';
import { Button } from '@/components/ui_foundation/Button';
import { Status } from '@/components/ui_foundation/Status';
import type { Person } from '@/lib/rota/queries';

import { AddStaffDialog } from './AddStaffDialog';
import { RemoveStaffDialog } from './RemoveStaffDialog';

export type StaffRow = Person & { upcoming: number };

export function StaffScreen({ staff }: { staff: StaffRow[] }) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<StaffRow | null>(null);

  const rows = staff.map((person) => ({
    name: person.name,
    email: person.email,
    status: person.hasOwnPassword ? (
      <Status tone="ok" label="Has their own password" />
    ) : (
      <Status tone="warn" label="Still on the starting password" />
    ),
    actions: (
      <Button tone="quiet" onClick={() => setRemoving(person)}>
        Remove<span className="ui-visually-hidden"> {person.name}</span>
      </Button>
    ),
  }));

  return (
    <>
      <div className="rota-head">
        <h1>Staff</h1>
        <Button tone="primary" onClick={() => setAdding(true)}>
          Add a staff member
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rota-empty">
          Nobody on the rota yet. Add each member of staff with their email address and a starting
          password.
        </p>
      ) : (
        <DataTable
          caption="Everyone on the rota"
          rows={rows}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status', sortable: false },
            { key: 'actions', label: 'Actions', sortable: false },
          ]}
        />
      )}

      {adding ? <AddStaffDialog onClose={() => setAdding(false)} /> : null}
      {removing ? <RemoveStaffDialog person={removing} onClose={() => setRemoving(null)} /> : null}
    </>
  );
}
