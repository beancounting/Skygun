import { expect, test, type Page } from '@playwright/test';

const duel = [
  { angle: 45, power: 42 },
  { angle: 45, power: 37 },
  { angle: 45, power: 41 },
  { angle: 45, power: 38 },
  { angle: 45, power: 38 },
];

async function setSlider(page: Page, name: 'Angle' | 'Power', value: number): Promise<void> {
  const slider = page.getByRole('slider', { name, exact: true });
  const current = Number(await slider.inputValue());
  for (let i = 0; i < Math.abs(value - current); i++) {
    await slider.press(value > current ? 'ArrowRight' : 'ArrowLeft');
  }
  await expect(slider).toHaveValue(String(value));
}

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(() => window.skygun!.loadReplay(2026, []));
});

test('plays a full match using the controls, declares victory, and rematches', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (let index = 0; index < duel.length; index++) {
    const shot = duel[index];
    await expect(page.getByRole('button', { name: /Fire shot/ })).toBeEnabled();
    await setSlider(page, 'Angle', shot.angle);
    await setSlider(page, 'Power', shot.power);
    await page.getByRole('button', { name: /Fire shot/ }).click();
    await expect(page.getByRole('button', { name: /Fire shot/ })).toBeDisabled();
    await page.clock.runFor(7000);
  }
  await expect(page.getByRole('heading', { name: 'Moss takes the hill!' })).toBeVisible();
  await expect(page.locator('#hp-1')).toHaveAttribute('value', '0');
  expect(await page.evaluate(() => window.skygun!.snapshot().shots)).toHaveLength(5);
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('#hp-0')).toHaveAttribute('value', '100');
  await expect(page.locator('#hp-1')).toHaveAttribute('value', '100');
  await expect(page.locator('#turn-number')).toHaveText('TURN 01 / PLAYER 1');
  await expect(page.getByRole('slider', { name: 'Angle', exact: true })).toHaveValue('55');
  expect(await page.evaluate(() => window.skygun!.snapshot().shots)).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('keyboard aim, double-fire protection, and per-player aim memory', async ({ page }) => {
  const canvas = page.locator('canvas');
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#angle')).toHaveValue('56');
  await expect(page.locator('#power')).toHaveValue('53');
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.clock.runFor(7000);
  // A held Space may generate repeat keydowns after the next player's turn starts.
  await page.keyboard.down('Space');
  expect(await page.evaluate(() => window.skygun!.snapshot().shots)).toHaveLength(1);
  await expect(page.locator('#turn-number')).toHaveText('TURN 02 / PLAYER 2');
  await expect(page.locator('#angle')).toHaveValue('55');
  await page.keyboard.up('Space');
  await page.getByRole('button', { name: /Fire shot/ }).click();
  await page.clock.runFor(7000);
  await expect(page.locator('#angle')).toHaveValue('56');
  await expect(page.locator('#power')).toHaveValue('53');
});

test('help pauses a flying shot and resumes without a time jump', async ({ page }) => {
  await page.getByRole('button', { name: /Fire shot/ }).click();
  await page.clock.runFor(300);
  await page.getByRole('button', { name: 'How to play' }).click();
  const before = await page.evaluate(() => window.skygun!.snapshot());
  await page.clock.fastForward(30000);
  expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(before);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Back to the hill' }).click();
  await page.clock.runFor(100);
  const after = await page.evaluate(() => window.skygun!.snapshot());
  expect(after.projectile!.age - before.projectile!.age).toBeLessThanOrEqual(0.11);
  expect(after.projectile!.age).toBeGreaterThan(before.projectile!.age);
});

test('visibility pause preserves the match and requires explicit resume', async ({ page }) => {
  await page.getByRole('button', { name: /Fire shot/ }).click();
  await page.clock.runFor(200);
  // Synthetic visibility event: separate from real Safari backgrounding verification.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const before = await page.evaluate(() => window.skygun!.snapshot());
  await page.clock.fastForward(60000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(before);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Back to the hill' }).click();
  await page.clock.runFor(7000);
  await expect(page.locator('#turn-number')).toHaveText('TURN 02 / PLAYER 2');
});

test('resizing and rotation keep the world and controls usable', async ({ page }) => {
  const before = await page.evaluate(() => window.skygun!.snapshot());
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(50);
    expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: /Fire shot/ })).toBeVisible();
    for (const button of await page.locator('.step-button, #fire').all()) {
      const bounds = (await button.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      if (viewport.width > viewport.height) expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    }
  }
});

test('pointer or touch adjustment never fires a shot or scrolls the page', async ({ page, isMobile }) => {
  const slider = page.getByRole('slider', { name: 'Angle', exact: true });
  const bounds = (await slider.boundingBox())!;
  const scrollBefore = await page.evaluate(() => scrollY);
  const point = { x: bounds.x + bounds.width * 0.7, y: bounds.y + bounds.height / 2 };
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await page.clock.runFor(100);
  expect(Number(await slider.inputValue())).toBeGreaterThan(55);
  expect(await page.evaluate(() => window.skygun!.snapshot().shots)).toHaveLength(0);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  if (isMobile) await page.getByRole('button', { name: 'Decrease angle' }).tap();
  else await page.getByRole('button', { name: 'Decrease angle' }).click();
  expect(await page.evaluate(() => window.skygun!.snapshot().shots)).toHaveLength(0);
});
