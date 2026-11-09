import { expect, test } from '@playwright/test';

import {
  addDays,
  addShift,
  addStaff,
  farWeek,
  fitsAPhone,
  longDay,
  managerContext,
} from './rota-helpers';

/**
 * Core flow 2: the manager plans a week (day, start, end, who) and publishes
 * it. Staff cannot see a week until it is published.
 */

test('the manager adds a shift, publishes the week, and only then staff see it', async ({
  browser,
}) => {
  const manager = await managerContext(browser);
  const { account: sam, context: samContext } = await addStaff(manager.request, browser, 'Sam');
  const week = farWeek();
  const tuesday = addDays(week, 1);

  const page = await manager.newPage();
  await page.goto(`/plan?week=${week}`);
  await expect(page.getByRole('heading', { name: 'Plan the week' })).toBeVisible();
  await expect(page.getByText('Draft — staff cannot see it')).toBeVisible();
  await expect(page.getByText('No shifts in this week yet.')).toBeVisible();

  // A shift that ends before it starts is refused, next to the end time.
  await page.getByRole('button', { name: 'Add a shift' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a shift' });
  await dialog.getByLabel('Day').selectOption(tuesday);
  await dialog.getByLabel('Starts').fill('13:00');
  await dialog.getByLabel('Ends').fill('07:00');
  await dialog.getByLabel('Who is working').selectOption(sam.userId);
  await dialog.getByRole('button', { name: 'Add the shift' }).click();
  await expect(dialog.getByText('The shift has to end after it starts.')).toBeVisible();

  await dialog.getByLabel('Starts').fill('07:00');
  await dialog.getByLabel('Ends').fill('13:00');
  await dialog.getByRole('button', { name: 'Add the shift' }).click();
  await expect(dialog).toBeHidden();
  const row = page.getByRole('row', { name: new RegExp(sam.name) });
  await expect(row).toContainText('07:00');
  await expect(row).toContainText('13:00');

  // The same person cannot be booked twice at once.
  await page.getByRole('button', { name: 'Add a shift' }).click();
  await dialog.getByLabel('Day').selectOption(tuesday);
  await dialog.getByLabel('Starts').fill('12:00');
  await dialog.getByLabel('Ends').fill('15:00');
  await dialog.getByLabel('Who is working').selectOption(sam.userId);
  await dialog.getByRole('button', { name: 'Add the shift' }).click();
  await expect(
    dialog.getByText(`${sam.name} is already working 07:00–13:00 that day.`),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();

  // Still a draft: Sam sees nothing.
  const samPage = await samContext.newPage();
  await samPage.goto('/shifts');
  await expect(samPage.getByText(longDay(tuesday), { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Publish this week' }).click();
  await expect(page.locator('.ui-status', { hasText: 'Published' })).toBeVisible();
  await expect(page.getByText('Staff see changes to this week straight away.')).toBeVisible();
  await fitsAPhone(page);

  await samPage.reload();
  await expect(samPage.getByText(longDay(tuesday), { exact: true })).toBeVisible();
  await expect(samPage.getByText('07:00 – 13:00')).toBeVisible();
});

test('an empty week cannot be published', async ({ browser }) => {
  const manager = await managerContext(browser);
  await addStaff(manager.request, browser, 'Jo');
  const page = await manager.newPage();
  await page.goto(`/plan?week=${farWeek()}`);
  await page.getByRole('button', { name: 'Publish this week' }).click();
  await expect(page.getByText('Add at least one shift before publishing.')).toBeVisible();
  await expect(page.getByText('Draft — staff cannot see it')).toBeVisible();
});

test('the manager removes a shift from the week', async ({ browser }) => {
  const manager = await managerContext(browser);
  const { account: kim } = await addStaff(manager.request, browser, 'Kim');
  const week = farWeek();
  await addShift(manager.request, {
    week,
    day: addDays(week, 2),
    startTime: '09:00',
    endTime: '15:00',
    userId: kim.userId,
  });

  const page = await manager.newPage();
  await page.goto(`/plan?week=${week}`);
  await page
    .getByRole('row', { name: new RegExp(kim.name) })
    .getByRole('button', { name: /Remove/ })
    .click();
  const confirm = page.getByRole('dialog', { name: 'Remove this shift?' });
  await confirm.getByRole('button', { name: 'Remove the shift' }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByRole('row', { name: new RegExp(kim.name) })).toHaveCount(0);
});
