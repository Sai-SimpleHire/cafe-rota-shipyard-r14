'use client';

import { useState } from 'react';

import { Button } from '@/components/ui_foundation/Button';
import { Status } from '@/components/ui_foundation/Status';
import { longDay, shortDay } from '@/lib/rota/dates';
import type { MyShift, SwapAnswer } from '@/lib/rota/queries';

import type { StaffChoice } from '../plan/AddShiftDialog';
import { AskSwapDialog } from './AskSwapDialog';

export function ShiftCards({
  shifts,
  colleagues,
  answers,
}: {
  shifts: MyShift[];
  colleagues: StaffChoice[];
  answers: SwapAnswer[];
}) {
  const [asking, setAsking] = useState<MyShift | null>(null);

  return (
    <>
      {shifts.length === 0 ? (
        <p className="rota-empty">
          No shifts coming up. When the manager publishes a week, your shifts appear here.
        </p>
      ) : (
        <ul className="rota-cards">
          {shifts.map((shift, index) => (
            <li key={shift.id} className={index === 0 ? 'rota-card is-next' : 'rota-card'}>
              {index === 0 ? <Status tone="neutral" label="Next shift" /> : null}
              <p className="rota-card-day">{longDay(shift.day)}</p>
              <p className="rota-card-time">
                {shift.startTime} – {shift.endTime}
              </p>
              <div className="rota-card-foot">
                {shift.pendingSwapWith ? (
                  <Status
                    tone="warn"
                    label={`Swap with ${shift.pendingSwapWith} — waiting for the manager`}
                  />
                ) : (
                  <Button onClick={() => setAsking(shift)} disabled={colleagues.length === 0}>
                    Ask to swap
                    <span className="ui-visually-hidden"> your shift on {longDay(shift.day)}</span>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {answers.length > 0 ? (
        <section aria-labelledby="answers-heading">
          <h2 id="answers-heading">Recent answers</h2>
          <ul className="rota-answers">
            {answers.map((answer) => (
              <li key={answer.id}>
                {shortDay(answer.day)} {answer.startTime}–{answer.endTime} to {answer.toName} —{' '}
                {answer.approved ? (
                  <Status tone="ok" label="approved" />
                ) : (
                  <Status tone="neutral" label="turned down" />
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {asking ? (
        <AskSwapDialog shift={asking} colleagues={colleagues} onClose={() => setAsking(null)} />
      ) : null}
    </>
  );
}
