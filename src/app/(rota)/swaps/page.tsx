import type { Metadata } from 'next';

import { pageMember } from '@/lib/rota/access';
import { allSwaps } from '@/lib/rota/queries';

import { SwapTable } from './SwapTable';

export const metadata: Metadata = { title: 'Swap requests · Café rota' };

/** Swap requests (manager): approve or turn down; the rota changes only on approval. */
export default async function SwapsPage() {
  await pageMember('/swaps', 'manager');
  const swaps = await allSwaps();

  return (
    <>
      <div className="rota-head">
        <h1>Swap requests</h1>
      </div>
      <SwapTable swaps={swaps} />
    </>
  );
}
