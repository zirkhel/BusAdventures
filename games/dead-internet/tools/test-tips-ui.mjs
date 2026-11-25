// Punkt 9 (25.11.2026): tips and Casebook help at 390×844. Run on its own, never with the node suite:
// PLAYWRIGHT_MODULE=/path/to/playwright node games/dead-internet/tools/test-tips-ui.mjs
// Covers: a new game has tips on; tips come one at a time, where the mechanic is used; Casebook
// Help opens without touching tips; the tips setting survives a reload and loading a save;
// "Show intro tips again" only clears which tips were seen; Start over turns tips on again.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { loadWorld } from './lib/node-world.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = resolve(root, '.' + path);
  if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403).end(); return; }
  if (path.endsWith('/')) file = resolve(file, 'index.html');
  try { const data = await readFile(file); res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' })[extname(file)] || 'application/octet-stream'); res.end(data); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const shots = process.env.CB_SHOTS || resolve(root, 'test-results');
await mkdir(shots, { recursive: true });
const w = await loadWorld();
const T = w.strings.tips, H = w.strings.help;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push(e.message));
  const prefs = () => p.evaluate(() => JSON.parse(localStorage.getItem('ba_deadinternet_tips') || 'null'));
  const shot = async name => { await p.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 8000 }); await p.waitForTimeout(350); await p.screenshot({ path: resolve(shots, name) }); };
  const tipCount = () => p.locator('.tipbox .tip').count();
  // Going home may show the "Time" tip; it is dismissed so it does not cover the dock.
  const home = async () => { if (!(await p.locator('.home').count())) await p.locator('.hb-pill').click(); await p.locator('.home').waitFor(); if (await tipCount()) await p.locator('.tip-ok').click(); };
  const openApp = async id => { await home(); await p.locator(`.app-icon[data-app="${id}"]`).first().click(); };
  const newGame = async () => {
    await p.locator('.menu-item').first().click();
    await p.locator('.name-input').fill('Sam');
    await p.getByRole('button', { name: w.strings.intro.start }).click();
    await p.getByText('Swipe up to unlock').click();
  };
  const resume = async () => { await p.getByRole('button', { name: 'Continue investigation' }).click(); await p.getByText('Swipe up to unlock').click(); };
  const settingsToggle = () => p.getByRole('checkbox', { name: T.settingsShow });
  const toSettings = async () => { await openApp('settings'); await settingsToggle().waitFor(); };
  const toReport = async () => {
    await openApp('casebook');
    await p.locator('.bar-link', { hasText: 'Reports' }).click();
    await p.getByRole('button', { name: /New report/ }).first().click();
  };

  // 1. A previous game had tips off; a new game turns them on again.
  await p.goto(base + '/games/dead-internet/');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ba_deadinternet_tips', JSON.stringify({ off: true, seen: ['read', 'report'], introDone: true })); });
  await p.reload();
  await newGame();
  assert.deepEqual(await prefs(), { off: false, seen: [], introDone: false }, 'a new game starts with tips on');
  await p.locator('.intro-sheet').waitFor();
  await p.locator('.it-go').click();
  assert.equal((await prefs()).off, false);

  // 2. Tips come one at a time, where the mechanic is used: on the report screen, "Publishing"
  //    shows and the editor's review waits; dismissing the first brings the second.
  await toReport();
  await p.locator('.tip[data-tip="report"]').waitFor();
  assert.equal(await tipCount(), 1, 'never two tips at once');
  assert.deepEqual((await prefs()).seen.filter(k => ['report', 'review'].includes(k)), ['report'], 'the waiting tip is not seen yet');
  await shot('cb5-tips-one.png');
  await p.locator('.tip-ok').click();
  await p.locator('.tip[data-tip="review"]').waitFor();
  assert.equal(await tipCount(), 1);
  assert.equal(await p.locator('.tip[data-tip="review"] .tip-text').innerText(), T.list.review.text);
  await shot('cb5-tips-next.png');
  await p.locator('.tip-ok').click();
  assert.equal(await tipCount(), 0);

  // 3. Casebook Help: opens any time, from the Casebook bar; reading it changes no tips.
  await openApp('casebook');
  for (let i = 0; i < 6 && !(await p.locator('.cb-help').count()); i++) await p.getByRole('button', { name: 'Back', exact: true }).first().click();
  const before = await prefs();
  await p.locator('.cb-help').click();
  await p.locator('.help-topic').first().waitFor();
  assert.deepEqual(await p.locator('.help-topic summary').allInnerTexts(), Object.values(H.topics).map(t => t.title));
  await p.locator('.help-topic[data-topic="supports_dana"] summary').click();
  assert.equal(await p.locator('.help-topic[data-topic="supports_dana"] p').innerText(), H.topics.supports_dana.text);
  await p.locator('.help-topic[data-topic="sources"] summary').click();
  await shot('cb5-help-topics.png');
  assert.deepEqual(await prefs(), before, 'help does not reset or show tips');
  assert.equal(await tipCount(), 0);
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow: help');

  // 4. The setting survives restarting the app and loading a save.
  await toSettings();
  await settingsToggle().uncheck();
  assert.equal((await prefs()).off, true);
  await p.reload();
  await resume();
  await toSettings();
  assert.equal(await settingsToggle().isChecked(), false, 'still off after a restart');
  const saveText = await p.evaluate(() => Object.entries(localStorage).find(([k]) => k.startsWith('ba_deadinternet_') && k !== 'ba_deadinternet_tips')[1]);
  const file = resolve(tmpdir(), 'di-tips-save.json');
  await writeFile(file, saveText);
  await p.locator('input[type=file]').setInputFiles(file);
  await p.waitForEvent('load');
  await resume();
  await toSettings();
  assert.equal(await settingsToggle().isChecked(), false, 'still off after loading a save');

  // 5. "Show intro tips again" only clears which tips were seen: on/off stays, nothing shows now.
  await settingsToggle().check();
  const seenBefore = await prefs();
  assert.ok(seenBefore.seen.length >= 2);
  await p.locator('.tips-reset').click();
  assert.deepEqual(await prefs(), { ...seenBefore, seen: [] });
  assert.equal(await tipCount(), 0, 'no tips shown by the reset');
  await shot('cb5-tips-settings.png');
  await toReport();
  await p.locator('.tip[data-tip="report"]').waitFor();
  assert.equal(await tipCount(), 1, 'they come back one at a time, in context');

  // 6. Start over: a new game, with tips on again even if they were off.
  await p.locator('.tip-off').click();
  assert.equal((await prefs()).off, true);
  await toSettings();
  await p.locator('.set-row.danger').click();
  await p.locator('.sheet-item', { hasText: 'Start over' }).last().click();
  await p.waitForEvent('load');
  await newGame();
  assert.deepEqual(await prefs(), { off: false, seen: [], introDone: false });
  assert.deepEqual(errors, []);
  console.log('PASS mobile 390×844 tips and help: new game has tips on, one tip at a time in context (second waits, then shows), Casebook Help opens without touching tips, setting kept after reload and after loading a save, "Show intro tips again" only clears seen tips, Start over turns tips on');
} finally {
  await browser?.close();
  server.close();
}
