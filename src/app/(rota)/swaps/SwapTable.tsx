'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { DataTable } from '@/components/data_table/DataTable';
import { Button } from '@/components/ui_foundation/Button';
import { Status } from '@/components/ui_foundation/Status';
import { send } from '@/lib/rota/client';
import { shortDay, toDbDate } from '@/lib/rota/dates';
import type { SwapRow } from '@/lib/rota/queries';

import { FormProblem } from '../Field';

function statusOf(swap: SwapRow) {
  if (swap.status === 'approved') return <Status tone="ok" label="Approved" />;
  if (swap.status === 'declined') return <Status tone="neutral" label="Turned down" />;
  return <Status tone="warn" label="Waiting" />;
}

export function SwapTable({ swaps }: { swaps: SwapRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function decide(swap: SwapRow, decision: 'approve' | 'decline'): Promise<void> {
    setBusy(`${swap.id}:${decision}`);
    setProblem(null);
    const result = await send(`/api/rota/swaps/${encodeURIComponent(swap.id)}`, 'POST', {
      decision,
    });
    setBusy(null);
    if (!result.ok) setProblem(result.error);
    router.refresh();
  }

  if (swaps.length === 0) {
    return (
      <p className="rota-empty">
        No swap requests. When someone asks to swap a shift, it appears here for you to approve or
        turn down.
      </p>
    );
  }

  const rows = swaps.map((swap) => {
    const what = `${swap.fromName}’s shift on ${shortDay(swap.day)} to ${swap.toName}`;
    return {
      day: toDbDate(swap.day),
      time: `${swap.startTime}–${swap.endTime}`,
      from: swap.fromName,
      to: swap.toName,
      asked: toDbDate(swap.askedOn),
      status: statusOf(swap),
      actions:
        swap.status === 'pending' ? (
          <div className="rota-row-actions">
            <Button
              tone="primary"
              busy={busy === `${swap.id}:approve`}
              onClick={() => decide(swap, 'approve')}
            >
              Approve<span className="ui-visually-hidden"> {what}</span>
            </Button>
            <Button busy={busy === `${swap.id}:decline`} onClick={() => decide(swap, 'decline')}>
              Turn down<span className="ui-visually-hidden"> {what}</span>
            </Button>
          </div>
        ) : null,
    };
  });

  return (
    <>
      <FormProblem text={problem} />
      <DataTable
        caption="Swap requests, waiting ones first"
        rows={rows}
        columns={[
          { key: 'day', label: 'Day' },
          { key: 'time', label: 'Shift' },
          { key: 'from', label: 'From' },
          { key: 'to', label: 'To' },
          { key: 'asked', label: 'Asked' },
          { key: 'status', label: 'Status', sortable: false },
          { key: 'actions', label: 'Actions', sortable: false },
        ]}
      />
    </>
  );
}
