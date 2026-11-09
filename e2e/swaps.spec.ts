import { expect, test, type Browser } from '@playwright/test';

import {
  addDays,
  addShift,
  addStaff,
  farWeek,
  fitsAPhone,
  longDay,
  managerContext,
  publish,
} from './rota-helpers';

/**
 * Core flow 4: a member of staff asks to swap one of their shifts with a named
 * colleague; the manager approves or turns it down, and the rota changes only
 * on approval.
 */

async function shiftReadyToSwap(browser: Browser) {
  const manager = await managerContext(browser);
  const asker = await addStaff(manager.request, browser, 'Ola');
  const colleague = await addStaff(manager.request, browser, 'Pia');
  const week = farWeek();
  const day = addDays(week, 3);
  await addShift(manager.request, {
    week,
    day,
    startTime: '07:00',
    endTime: '13:00',
    userId: asker.account.userId,
  });
  await publish(manager.request, week);
  return { manager, asker, colleague, day };
}

/** The staff member asks, through their card and the dialog. */
async function askToSwap(page: import('@playwright/test').Page, colleagueName: string) {
  await page.goto('/shifts');
  await page.getByRole('button', { name: /Ask to swap/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Ask to swap this shift' });
  await expect(
    dialog.getByText('If the manager approves, the shift becomes theirs.'),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Send the request' }).click();
  await expect(dialog.getByText('Please choose a colleague.')).toBeVisible();
  await dialog.getByLabel('Who could take this shift?').selectOption({ label: colleagueName });
  await dialog.getByRole('button', { name: 'Send the request' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText(`Swap with ${colleagueName} — waiting for the manager`),
  ).toBeVisible();
}

test('an approved swap moves the shift to the colleague', async ({ browser }) => {
  const { manager, asker, colleague, day } = await shiftReadyToSwap(browser);
  const askerPage = await asker.context.newPage();
  await askerPage.setViewportSize({ width: 390, height: 844 });
  await askToSwap(askerPage, colleague.account.name);
  await fitsAPhone(askerPage);

  // Nothing has changed yet for the colleague.
  const colleaguePage = await colleague.context.newPage();
  await colleaguePage.goto('/shifts');
  await expect(colleaguePage.getByText(longDay(day), { exact: true })).toHaveCount(0);

  const page = await manager.newPage();
  await page.goto('/swaps');
  await expect(page.getByRole('heading', { name: 'Swap requests' })).toBeVisible();
  await page.getByLabel('Search').fill(asker.account.name);
  const row = page.getByRole('row', { name: new RegExp(asker.account.name) });
  await expect(row).toContainText(colleague.account.name);
  await expect(row).toContainText('Waiting');
  await row.getByRole('button', { name: /Approve/ }).click();
  await expect(row).toContainText('Approved');
  await expect(row.getByRole('button')).toHaveCount(0);
  await fitsAPhone(page);

  await colleaguePage.reload();
  await expect(colleaguePage.getByText(longDay(day), { exact: true })).toBeVisible();
  await askerPage.reload();
  await expect(askerPage.getByText('No shifts coming up.')).toBeVisible();
  await expect(askerPage.getByText('Recent answers')).toBeVisible();
  await expect(askerPage.locator('.rota-answers')).toContainText('approved');
});

test('a turned-down swap leaves the rota as it was', async ({ browser }) => {
  const { manager, asker, colleague, day } = await shiftReadyToSwap(browser);
  const askerPage = await asker.context.newPage();
  await askToSwap(askerPage, colleague.account.name);

  const page = await manager.newPage();
  await page.goto('/swaps');
  await page.getByLabel('Search').fill(asker.account.name);
  const row = page.getByRole('row', { name: new RegExp(asker.account.name) });
  await row.getByRole('button', { name: /Turn down/ }).click();
  await expect(row).toContainText('Turned down');

  await askerPage.reload();
  await expect(askerPage.getByText(longDay(day), { exact: true })).toBeVisible();
  await expect(askerPage.getByRole('button', { name: /Ask to swap/ })).toBeVisible();
  await expect(askerPage.locator('.rota-answers')).toContainText('turned down');

  const colleaguePage = await colleague.context.newPage();
  await colleaguePage.goto('/shifts');
  await expect(colleaguePage.getByText(longDay(day), { exact: true })).toHaveCount(0);
});

test('staff cannot approve swaps or open the manager’s list', async ({ browser }) => {
  const { asker } = await shiftReadyToSwap(browser);
  const page = await asker.context.newPage();
  await page.goto('/swaps');
  await expect(page).toHaveURL(/\/shifts/);
  const tried = await asker.context.request.post('/api/rota/swaps/anything', {
    data: { decision: 'approve' },
  });
  expect(tried.status()).toBe(403);
  // A signed-in session alone cannot replace a password the person already chose.
  const takeover = await asker.context.request.post('/api/rota/password', {
    data: { password: 'Someone-Elses-Password-1' },
  });
  expect(takeover.status()).toBe(409);
});
