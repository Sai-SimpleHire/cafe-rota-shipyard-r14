import { expect, type APIRequestContext, type Browser, type Page } from '@playwright/test';

import { addDays, longDay, mondayOf } from '../src/lib/rota/dates';

/**
 * Shared steps for the rota's browser checks.
 *
 * The café has exactly one manager, and the first person to set the café up
 * becomes it. So every check signs in as the same test manager, creating it
 * the first time a fresh test database is used. Everything else a check needs
 * (staff, shifts, a week) it makes itself, with names nobody else uses.
 */

export const MANAGER = { email: 'e2e-manager@example.com', password: 'Check-Manager-Rota-77' };

/** A short id that makes this check's people and weeks its own. */
export function unique(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** A Monday far in the future that no other check is likely to touch. */
export function farWeek(): string {
  const weeks = 100 + Math.floor(Math.random() * 2000);
  return mondayOf(addDays(new Date().toISOString().slice(0, 10), weeks * 7));
}

export { addDays, longDay };

async function apiSignIn(request: APIRequestContext, email: string, password: string) {
  return request.post('/api/auth/login', { data: { email, password } });
}

/** A browser context signed in as the test manager, setting the café up if needed. */
export async function managerContext(browser: Browser) {
  const context = await browser.newContext();
  const { request } = context;
  let login = await apiSignIn(request, MANAGER.email, MANAGER.password);
  if (login.status() === 401) {
    const made = await request.post('/api/auth/register', {
      data: { ...MANAGER, name: 'Test Manager' },
    });
    expect(made.status(), 'the test manager account was created').toBe(201);
    login = await apiSignIn(request, MANAGER.email, MANAGER.password);
  }
  expect(login.ok(), 'the test manager signed in').toBeTruthy();
  const setup = await request.post('/api/rota/setup');
  // 409 means a manager already exists; it must be this one, which /plan proves.
  expect([200, 409]).toContain(setup.status());
  const check = await request.get('/plan', { maxRedirects: 0 });
  expect(check.status(), 'the test manager is the café manager').toBe(200);
  return context;
}

export interface StaffAccount {
  userId: string;
  name: string;
  email: string;
  password: string;
}

/** The manager adds a member of staff, who then chooses their own password. */
export async function addStaff(manager: APIRequestContext, browser: Browser, first: string) {
  const id = unique();
  const name = `${first} ${id}`;
  const email = `${first.toLowerCase()}-${id}@example.com`;
  const starting = 'Latte-crumb-4821';
  const added = await manager.post('/api/rota/staff', {
    data: { name, email, password: starting },
  });
  expect(added.status(), `${name} was added`).toBe(201);
  const { userId } = (await added.json()) as { userId: string };

  const context = await browser.newContext();
  expect((await apiSignIn(context.request, email, starting)).ok()).toBeTruthy();
  const password = 'Own-Password-Rota-9';
  const changed = await context.request.post('/api/rota/password', { data: { password } });
  expect(changed.ok(), `${name} chose their own password`).toBeTruthy();

  return { account: { userId, name, email, password }, context };
}

/** The manager adds a shift (through the route; the dialog has its own check). */
export async function addShift(
  manager: APIRequestContext,
  shift: { week: string; day: string; startTime: string; endTime: string; userId: string },
) {
  const { week, ...rest } = shift;
  const response = await manager.post('/api/rota/shifts', { data: { weekStart: week, ...rest } });
  expect(response.status(), 'the shift was added').toBe(201);
}

export async function publish(manager: APIRequestContext, week: string) {
  const response = await manager.post('/api/rota/weeks/publish', { data: { weekStart: week } });
  expect(response.ok(), 'the week was published').toBeTruthy();
}

/** Signs in through the sign-in screen, as a person would. */
export async function signInWithForm(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

/** The page is no wider than a phone. */
export async function fitsAPhone(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  const { content, screen, wide } = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    screen: window.innerWidth,
    // The elements that stick out, so a failure says where to look.
    wide: Array.from(document.querySelectorAll('body *'))
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 5)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
  }));
  expect(
    content,
    `no wider than a 390 px phone; sticking out: ${wide.join(', ')}`,
  ).toBeLessThanOrEqual(screen + 1);
}
