import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const speed = page.locator('#spectator-speed');
async function instrument() {
  await page.evaluate(async () => {
    const { Match } = await import('/src/engine.js');
    const update = Match.prototype.update;
    Match.prototype.update = function(dt) { window.qaMatch = this; window.qaDt = dt; return update.call(this, dt); };
  });
}
async function beginQuick() {
  await page.goto('http://localhost:4173');
  await instrument();
  await page.getByRole('button', { name: 'Jogo rápido', exact: true }).click();
  await page.locator('#start-button').click();
  await page.waitForFunction(() => !document.getElementById('pause-button').disabled);
}
try {
  await beginQuick();
  assert.equal(await speed.isVisible(), false);
  await page.keyboard.press('Space');
  await speed.waitFor({ state: 'visible' });
  assert.equal(await speed.inputValue(), '1');
  assert.deepEqual(await speed.locator('option').allTextContents(), ['1×', '1,5×', '2×', '2,5×', '3×']);
  await speed.selectOption('3');
  const before = await page.evaluate(() => window.qaMatch.remaining);
  await page.waitForTimeout(1000);
  const after = await page.evaluate(() => window.qaMatch.remaining);
  assert.ok(before - after > 2.5 && before - after < 3.6, `3x advancement: ${before - after}`);
  await page.locator('#pause-button').click();
  const paused = await page.evaluate(() => window.qaMatch.remaining);
  await speed.selectOption('2.5');
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => window.qaMatch.remaining), paused);
  await speed.focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await speed.inputValue(), '3');
  assert.equal(await page.evaluate(() => window.qaMatch.status), 'paused');
  await page.locator('#pause-button').click();
  await page.waitForTimeout(150);
  assert.ok(await page.evaluate(() => window.qaMatch.remaining) < paused);
  await page.screenshot({ path: '.scratch/spectator-speed/desktop.png' });
  await page.setViewportSize({ width: 320, height: 740 });
  const layout = await page.evaluate(() => {
    const select = document.getElementById('spectator-speed').getBoundingClientRect();
    const pause = document.getElementById('pause-button').getBoundingClientRect();
    return { fits: select.left >= 0 && pause.right <= innerWidth, sameRow: Math.abs(select.top - pause.top) < 5, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.deepEqual(layout, { fits: true, sameRow: true, overflow: false });
  await page.screenshot({ path: '.scratch/spectator-speed/mobile.png' });
  await page.locator('#game-back').click();
  await page.locator('#start-button').click();
  assert.equal(await speed.inputValue(), '1');
  assert.equal(await speed.isVisible(), false);

  await page.goto('http://localhost:4173');
  await page.evaluate(async () => {
    const { Story, STORY_SAVE_KEY } = await import('/src/story.js');
    const story = new Story('clariana', () => 0.5);
    story.stage = story.preliminaryStages;
    localStorage.setItem(STORY_SAVE_KEY, story.serialize());
  });
  await page.reload();
  await instrument();
  await page.locator('#resume-story').click();
  await page.waitForFunction(() => !document.getElementById('pause-button').disabled);
  await page.evaluate(() => { window.qaMatch.players.find(player => player.id === 'human').lives = 1; });
  await page.keyboard.press('Space');
  await page.locator('#overlay-watch').waitFor({ state: 'visible' });
  assert.equal(await speed.isVisible(), false);
  await page.locator('#overlay-watch').click();
  await speed.waitFor({ state: 'visible' });
  await speed.selectOption('2.5');
  // Finish the observed first round deterministically to check the next arena's controls.
  await page.evaluate(() => {
    const match = window.qaMatch;
    const loser = match.players.find(player => player.id === 'flavio');
    loser.alive = false;
    match.eliminationGroups.push(['flavio']);
    match.status = 'finished';
  });
  await page.waitForFunction(() => document.getElementById('game-title').textContent.includes('Segundo turno'));
  assert.equal(await speed.inputValue(), '2.5');
  assert.equal(await speed.isVisible(), false);
  await page.waitForFunction(() => !document.getElementById('pause-button').disabled);
  await speed.waitFor({ state: 'visible' });
  assert.equal(await speed.inputValue(), '2.5');
  await page.evaluate(() => { const match = window.qaMatch; const loser = match.players[1]; loser.alive = false; match.eliminationGroups.push([loser.id]); match.status = 'finished'; });
  await page.waitForFunction(() => document.getElementById('overlay-title').textContent === 'Segundo turno encerrado');
  assert.equal(await speed.isVisible(), false);
  await page.locator('#overlay-button').click();
  assert.equal(await speed.inputValue(), '1');
  assert.equal(await speed.isVisible(), false);
  assert.deepEqual(errors, []);
  await page.evaluate(() => localStorage.removeItem('bomber-politicos.story.v1'));
  console.log('PASS: spectator visibility, five options, 3x time, pause, keyboard, mobile layout, reset, story watch and retained speed through next round.');
} finally { await browser.close(); }
