import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const html = await readFile(new URL('../dist-download/Skygun-play.html', import.meta.url), 'utf8');
assert(!html.includes('type="module"'), 'Download must not require module fetching');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
try {
  const page = await browser.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => { requests.push(route.request().url()); return route.abort(); });
  await page.context().setOffline(true);
  await page.clock.install();
  // Deterministic seed without exposing development helpers in the artifact.
  await page.evaluate(() => {
    Object.defineProperty(crypto, 'getRandomValues', { value: array => { array.fill(2026); return array; } });
  });
  // This managed browser blocks file:// navigation. Execute the downloaded
  // document offline instead; this is not a claim of Mac/iPad file-open testing.
  await page.setContent(html);
  assert.equal(await page.locator('canvas').count(), 1);
  assert.equal(await page.evaluate(() => typeof window.skygun), 'undefined');
  for (const [angle, power] of [[45, 41], [45, 40], [45, 41], [45, 39], [45, 38]]) {
    for (const [id, value] of [['angle', angle], ['power', power]]) {
      const slider = page.locator(`#${id}`);
      const current = Number(await slider.inputValue());
      for (let i = 0; i < Math.abs(current - value); i++) await slider.press(value > current ? 'ArrowRight' : 'ArrowLeft');
    }
    await page.getByRole('button', { name: /Fire shot/ }).click();
    await page.clock.runFor(7000);
  }
  assert.equal(await page.locator('#result-title').textContent(), 'Moss takes the hill!');
  await page.getByRole('button', { name: 'Play again' }).click();
  assert.equal(await page.locator('#hp-0').getAttribute('value'), '100');
  assert.equal(await page.locator('#hp-1').getAttribute('value'), '100');
  assert.equal(await page.locator('#turn-number').textContent(), 'TURN 01 / PLAYER 1');
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, [], 'Offline download must not fetch any assets');
  console.log('PASS: standalone document loads offline, completes a five-shot match and rematch, has no runtime errors or external requests, and omits debug helpers.');
} finally {
  await browser.close();
}
