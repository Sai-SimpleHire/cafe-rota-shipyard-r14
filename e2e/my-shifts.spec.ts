import { expect, test } from '@playwright/test';

import {
  addDays,
  addShift,
  addStaff,
  farWeek,
  fitsAPhone,
  longDay,
  managerContext,
  publish,
  signInWithForm,
} from './rota-helpers';

/**
 * Core flow 3: a member of staff signs in and sees only their own published
 * shifts, soonest first.
 */

test('a member of staff sees only their own published shifts, soonest first', async ({
  browser,
}) => {
  const manager = await managerContext(browser);
  const { account: ana } = await addStaff(manager.request, browser, 'Ana');
  const { account: ben } = await addStaff(manager.request, browser, 'Ben');
  const week = farWeek();
  const later = addDays(week, 7);

  // Added out of order, across a published week, a later published week and a draft.
  await addShift(manager.request, {
    week: later,
    day: addDays(later, 3),
    startTime: '10:00',
    endTime: '16:00',
    userId: ana.userId,
  });
  await addShift(manager.request, {
    week,
    day: addDays(week, 4),
    startTime: '12:00',
    endTime: '17:00',
    userId: ana.userId,
  });
  await addShift(manager.request, {
    week,
    day: addDays(week, 1),
    startTime: '07:00',
    endTime: '13:00',
    userId: ana.userId,
  });
  await addShift(manager.request, {
    week,
    day: addDays(week, 2),
    startTime: '08:00',
    endTime: '12:00',
    userId: ben.userId,
  });
  const draft = addDays(week, 14);
  await addShift(manager.request, {
    week: draft,
    day: draft,
    startTime: '09:00',
    endTime: '11:00',
    userId: ana.userId,
  });
  await publish(manager.request, week);
  await publish(manager.request, later);

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await signInWithForm(page, ana.email, ana.password);
  await expect(page.getByRole('heading', { name: 'My shifts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Plan the week' })).toHaveCount(0);

  const cards = page.locator('.rota-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText(longDay(addDays(week, 1)));
  await expect(cards.nth(0)).toContainText('Next shift');
  await expect(cards.nth(0)).toContainText('07:00 – 13:00');
  await expect(cards.nth(1)).toContainText(longDay(addDays(week, 4)));
  await expect(cards.nth(2)).toContainText(longDay(addDays(later, 3)));

  // Not Ben's shift, and not the draft week.
  await expect(page.getByText(longDay(addDays(week, 2)))).toHaveCount(0);
  await expect(page.getByText(longDay(draft))).toHaveCount(0);
  await fitsAPhone(page);

  // Staff cannot open the manager's screens.
  await page.goto('/plan');
  await expect(page).toHaveURL(/\/shifts/);
});
