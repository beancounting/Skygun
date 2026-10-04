import { expect, test, type Page } from '@playwright/test';
import { createGame, fire, setAim, stepGame } from '../../src/game/simulation';

const duel = [
  { angle: 45, power: 41 },
  { angle: 45, power: 40 },
  { angle: 45, power: 41 },
  { angle: 45, power: 39 },
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
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  await page.evaluate(() => window.skygun!.loadReplay(2026, []));
});

test('plays a full match using the controls, declares victory, and rematches', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  const initialTerrain = await page.evaluate(() => window.skygun!.snapshot().terrain);
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
  expect(await page.evaluate(() => window.skygun!.snapshot().terrain)).toEqual(initialTerrain);
  expect(errors).toEqual([]);
});

test('a crater removes support and settling pauses safely before handoff', async ({ page }) => {
  const before = await page.evaluate(() => window.skygun!.snapshot());
  await setSlider(page, 'Angle', 45); await setSlider(page, 'Power', 41);
  await page.getByRole('button', { name: /Fire shot/ }).click();
  for (let i = 0; i < 100; i++) {
    await page.clock.runFor(100);
    if (await page.evaluate(() => window.skygun!.snapshot().phase === 'impact')) break;
  }
  const impact = await page.evaluate(() => window.skygun!.snapshot());
  expect(impact.phase).toBe('impact');
  expect(impact.terrainRevision).toBe(1);
  expect(impact.terrain.some((h, i) => h < before.terrain[i])).toBe(true);
  expect(impact.robots[1].y).toBe(before.robots[1].y);
  for (let i = 0; i < 100; i++) {
    await page.clock.runFor(16);
    if (await page.evaluate(() => window.skygun!.snapshot().phase === 'settling')) break;
  }
  await expect(page.locator('#turn-label')).toHaveText('WATCH YOUR FOOTING');
  await expect(page.locator('#fire')).toBeDisabled();
  await page.getByRole('button', { name: 'Pause game' }).click();
  const paused = await page.evaluate(() => window.skygun!.snapshot());
  await page.clock.fastForward(10000);
  expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(paused);
  await page.getByRole('button', { name: 'Back to the hill' }).click();
  await page.clock.runFor(3000);
  const landed = await page.evaluate(() => window.skygun!.snapshot());
  expect(landed.phase).toBe('aiming'); expect(landed.active).toBe(1);
  expect(landed.robots[1].y).toBeLessThan(before.robots[1].y);
  expect(landed.robots[1].health).toBe(impact.robots[1].health);
  expect(landed.terrain).toEqual(impact.terrain);
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
  await page.clock.runFor(800);
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

test('wind-up locks controls, pauses safely, and launches once', async ({ page }) => {
  await page.getByRole('button', { name: /Fire shot/ }).click();
  await page.clock.runFor(150);
  await expect(page.locator('#turn-label')).toHaveText('WINDING UP');
  await expect(page.locator('#angle')).toBeDisabled();
  await expect(page.locator('#fire')).toBeDisabled();
  expect(await page.evaluate(() => window.skygun!.snapshot().projectile)).toBeNull();
  await page.getByRole('button', { name: 'Pause game' }).click();
  const before = await page.evaluate(() => window.skygun!.snapshot());
  await page.clock.fastForward(10000);
  expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(before);
  await page.getByRole('button', { name: 'Back to the hill' }).click();
  await page.clock.runFor(500);
  const after = await page.evaluate(() => window.skygun!.snapshot());
  expect(after.phase).toBe('flight');
  expect(after.projectile).not.toBeNull();
  expect(after.shots).toHaveLength(1);
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

test('map picker pauses a flying shot and cancel preserves the match', async ({ page }) => {
  await page.getByRole('button', { name: /Fire shot/ }).click();
  await page.clock.runFor(600);
  await page.getByRole('button', { name: 'Set up match' }).click();
  const before = await page.evaluate(() => window.skygun!.snapshot());
  expect(before.phase).toBe('flight');
  await page.getByRole('radio', { name: /High Divide/ }).check();
  await page.clock.runFor(5000);
  expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(before);
  await page.getByRole('button', { name: /Cancel/ }).click();
  expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(before);
  await page.clock.runFor(7000);
  expect(await page.evaluate(() => window.skygun!.snapshot().turn)).toBe(2);
});

test('new maps start clean matches and rematch retains the chosen layout', async ({ page }) => {
  for (const map of [{ id: 'divide', name: 'High Divide' }, { id: 'basin', name: 'The Basin' }] as const) {
    await page.getByRole('button', { name: 'Set up match' }).click();
    await page.getByRole('radio', { name: new RegExp(map.name) }).check();
    await page.getByRole('button', { name: 'Start new match' }).click();
    const start = await page.evaluate(() => window.skygun!.snapshot());
    expect(start.mapId).toBe(map.id);
    expect(start.shots).toHaveLength(0);
    expect(start.robots.map(r => r.health)).toEqual([100, 100]);
    await expect(page.getByRole('button', { name: /Fire shot/ })).toBeEnabled();
    // Drive a deterministic complete match through the shared simulation, then exercise the real rematch button.
    const game = createGame(2026, map.id);
    for (let turn = 0; turn < 15 && game.phase !== 'gameover'; turn++) {
      let best = { score: -Infinity, angle: 55, power: 45 };
      for (const angle of [45, 55, 65, 75]) for (let power = 25; power <= 80; power++) {
        const candidate = structuredClone(game), player = game.active;
        setAim(candidate, player, { angle, power }); fire(candidate);
        for (let t = 0; t < 2000 && candidate.phase !== 'aiming' && candidate.phase !== 'gameover'; t++) stepGame(candidate);
        const score = game.robots[1 - player].health - candidate.robots[1 - player].health - (game.robots[player].health - candidate.robots[player].health);
        if (score > best.score) best = { score, angle, power };
      }
      setAim(game, game.active, best); fire(game);
      for (let t = 0; t < 2000 && !['aiming', 'gameover'].includes(game.phase); t++) stepGame(game);
    }
    expect(game.phase).toBe('gameover');
    await page.evaluate(({ shots, mapId }) => window.skygun!.loadReplay(2026, shots, mapId), { shots: game.shots, mapId: map.id });
    await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();
    await page.getByRole('button', { name: 'Play again' }).click();
    const reset = await page.evaluate(() => window.skygun!.snapshot());
    expect(reset.mapId).toBe(map.id);
    expect(reset.terrain).toEqual(start.terrain);
    expect(reset.terrainRevision).toBe(0);
    expect(reset.shots).toHaveLength(0);
  }
});

test('solo locks human input, pauses thinking and cancels old plans on mode change', async ({ page }) => {
  await page.getByRole('button', { name: 'Set up match' }).click();
  await page.getByRole('radio', { name: /Solo/ }).check();
  await page.getByRole('button', { name: 'Start new match' }).click();
  await page.evaluate(() => window.skygun!.loadReplay(2026, [{ player: 0, angle: 45, power: 41 }]));
  await page.clock.runFor(100);
  await expect(page.locator('#turn-label')).toHaveText('EMBER IS THINKING');
  await expect(page.locator('#fire')).toBeDisabled();
  const before = await page.evaluate(() => window.skygun!.snapshot());
  await page.locator('#game').focus();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(before);
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.clock.runFor(10000);
  expect(await page.evaluate(() => window.skygun!.snapshot())).toEqual(before);
  await page.getByRole('button', { name: 'Back to the hill' }).click();
  await page.clock.runFor(15000);
  const after = await page.evaluate(() => window.skygun!.snapshot());
  expect(after.shots).toHaveLength(2); expect(after.active).toBe(0);
  await expect(page.locator('#fire')).toBeEnabled();
  await page.evaluate(() => window.skygun!.loadReplay(2026, [{ player: 0, angle: 45, power: 41 }]));
  await page.clock.runFor(100);
  await page.getByRole('button', { name: 'Set up match' }).click();
  await page.getByRole('radio', { name: /Two players/ }).check();
  await page.getByRole('button', { name: 'Start new match' }).click();
  await page.clock.runFor(15000);
  expect(await page.evaluate(() => window.skygun!.snapshot().shots)).toHaveLength(0);
  await page.getByRole('button', { name: /Fire shot/ }).click();
  await page.clock.runFor(15000);
  expect(await page.evaluate(() => window.skygun!.snapshot().shots)).toHaveLength(1);
  await expect(page.locator('#fire')).toBeEnabled();
});

test('solo finishes a match, rematches in solo and retains the chosen map', async ({ page }) => {
  test.setTimeout(90000);
  await page.getByRole('button', { name: 'Set up match' }).click();
  await page.getByRole('radio', { name: /Solo/ }).check();
  await page.getByRole('radio', { name: /The Basin/ }).check();
  await page.getByRole('button', { name: 'Start new match' }).click();
  await page.evaluate(() => window.skygun!.loadReplay(2026, [], 'basin'));
  for (let turn = 0; turn < 12; turn++) {
    await page.getByRole('button', { name: /Fire shot/ }).click();
    await page.clock.runFor(22000);
    if (await page.locator('#result').isVisible()) break;
  }
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();
  await page.getByRole('button', { name: 'Play again' }).click();
  expect(await page.evaluate(() => window.skygun!.snapshot().mapId)).toBe('basin');
  await expect(page.locator('#mode-label')).toHaveText('SOLO · FRIENDLY');
  await expect(page.locator('#fire')).toBeEnabled();
  await page.getByRole('button', { name: 'Set up match' }).click();
  await expect(page.getByRole('radio', { name: /Solo/ })).toBeChecked();
});
