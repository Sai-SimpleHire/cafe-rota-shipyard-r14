import { expect, test } from '@playwright/test';

import { MANAGER, fitsAPhone, managerContext, signInWithForm, unique } from './rota-helpers';

/**
 * Core flow 1: the manager signs in, adds a member of staff with a starting
 * password (changed at first sign-in), and removes someone who has left.
 */

test('the manager signs in with the form and lands on Plan the week', async ({ browser }) => {
  // Make sure the test manager exists, then sign in as a person would.
  await (await managerContext(browser)).close();
  const page = await browser.newPage();
  await signInWithForm(page, MANAGER.email, MANAGER.password);
  await expect(page).toHaveURL(/\/plan/);
  await expect(page.getByRole('heading', { name: 'Plan the week' })).toBeVisible();
  await expect(page.getByText('Café rota', { exact: true })).toBeVisible();
  for (const link of ['Plan the week', 'Swap requests', 'Staff']) {
    await expect(page.getByRole('link', { name: link, exact: true })).toBeVisible();
  }
});

test('a wrong password is refused without saying which half was wrong', async ({ page }) => {
  await signInWithForm(page, MANAGER.email, 'Not-The-Password-1');
  await expect(page.getByText(/do not go together|do not match/)).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in/);
});

test('someone not signed in is sent to sign in', async ({ page }) => {
  await page.goto('/staff');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fstaff/);
});

test('the manager adds a member of staff, who chooses their own password', async ({ browser }) => {
  const manager = await managerContext(browser);
  const page = await manager.newPage();
  const id = unique();
  const name = `Sam ${id}`;
  const email = `sam-${id}@example.com`;

  await page.goto('/staff');
  await expect(page.getByRole('heading', { name: 'Staff' })).toBeVisible();
  await page.getByRole('button', { name: 'Add a staff member' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a staff member' });
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByLabel('Email address').fill(email);
  const starting = await dialog.getByLabel('Starting password').inputValue();
  expect(starting.length, 'a starting password is suggested').toBeGreaterThanOrEqual(12);
  await dialog.getByRole('button', { name: 'Add them' }).click();
  await expect(dialog).toBeHidden();

  await page.getByLabel('Search').fill(id);
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row.getByText('Still on the starting password')).toBeVisible();
  await fitsAPhone(page);

  // The new person signs in with the starting password on their phone.
  const staff = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const phone = await staff.newPage();
  await signInWithForm(phone, email, starting);
  await expect(phone.getByRole('heading', { name: 'Choose your own password' })).toBeVisible();
  await expect(phone.getByRole('link', { name: 'My shifts' })).toHaveCount(0);
  await phone.getByLabel('New password').fill('My-Own-Password-42');
  await phone.getByLabel('Type it again').fill('My-Own-Password-24');
  await phone.getByRole('button', { name: 'Save my password' }).click();
  await expect(phone.getByText('Those two do not match.')).toBeVisible();
  await phone.getByLabel('Type it again').fill('My-Own-Password-42');
  await phone.getByRole('button', { name: 'Save my password' }).click();
  await expect(phone.getByRole('heading', { name: 'My shifts' })).toBeVisible();
  await expect(phone.getByText('No shifts coming up.')).toBeVisible();
  await fitsAPhone(phone);

  await page.reload();
  await page.getByLabel('Search').fill(id);
  await expect(
    page.getByRole('row', { name: new RegExp(name) }).getByText('Has their own password'),
  ).toBeVisible();
});

test('the manager removes someone who has left, and they cannot sign in', async ({ browser }) => {
  const manager = await managerContext(browser);
  const id = unique();
  const name = `Leaver ${id}`;
  const email = `leaver-${id}@example.com`;
  const password = 'Honey-toast-3301';
  const added = await manager.request.post('/api/rota/staff', { data: { name, email, password } });
  expect(added.status()).toBe(201);

  const page = await manager.newPage();
  await page.goto('/staff');
  await page.getByLabel('Search').fill(id);
  await page
    .getByRole('row', { name: new RegExp(name) })
    .getByRole('button', { name: /Remove/ })
    .click();
  const confirm = page.getByRole('dialog', { name: `Remove ${name}?` });
  await expect(confirm.getByText('will not be able to sign in any more')).toBeVisible();
  await confirm.getByRole('button', { name: `Remove ${name}` }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByRole('row', { name: new RegExp(name) })).toHaveCount(0);

  const gone = await browser.newPage();
  await signInWithForm(gone, email, password);
  await expect(gone.getByText(/do not go together|do not match/)).toBeVisible();
});
