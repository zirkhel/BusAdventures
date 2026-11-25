// W8 in the browser at 390×844: Browser's Archive, "Compare with…" into Casebook, and the twin DOM
// check of every Archive screen. Run on its own, not alongside the engine suite:
// PLAYWRIGHT_MODULE=/path/to/playwright CB_SHOTS=/workspace/dead-internet-shots node games/dead-internet/tools/test-browser-archive-ui.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { loadWorld } from './lib/node-world.mjs';
import { Game } from '../core/game.js';
import { serialize, saveKey } from '../core/save.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/__fixture') { res.setHeader('Content-Type', 'text/html'); res.end('<html><head><link rel="stylesheet" href="/games/dead-internet/app/style.css"></head><body><div id="phone"></div></body></html>'); return; }
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
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const errors = [];
  const w = await loadWorld(), g = new Game(w, { seed: 7 }); g.start();
  const ABOUT = 'W-kestrel-0005', TEAM = 'A20', DELETED = 'DR-2025-0418', STORY = 'DR-2025-0101';
  for (const id of [ABOUT, TEAM, DELETED, STORY]) g.s.artifacts[id] = { ...g.s.artifacts[id], visible: true };
  const url = id => w.artifacts.get(id).url;
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/__fixture');
  await page.evaluate(({ key, save }) => localStorage.setItem(key, save), { key: saveKey(w), save: serialize(g.s) });
  await page.goto(base + '/games/dead-internet/');
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByText('Swipe up to unlock').click();
  await page.locator('.it-notips').click();
  const b = name => page.getByRole('button', { name, exact: true });
  const shot = async name => { await page.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 5000 }); await page.waitForTimeout(350); await page.screenshot({ path: resolve(shots, name) }); };
  const go = async address => { const a = page.locator('input.addr'); await a.fill(address); await a.press('Enter'); };
  const noOverflow = async what => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal overflow: ${what}`);
  await page.locator('.dock button').nth(0).click();

  // A page with an earlier copy shows a thin Archive strip.
  await go(url(ABOUT));
  const strip = page.locator('.archive-strip');
  await strip.waitFor();
  assert.match(await strip.innerText(), /Archive · 2 copies of this page/);
  await shot('w8-page.png');
  await strip.click();
  // The Archive: oldest first, each copy can be opened, ticked, or compared with the current page.
  await page.locator('.archive').waitFor();
  assert.equal(await page.locator('.arch-head h1').innerText(), 'Archive');
  assert.deepEqual(await page.locator('.arch-kind').allInnerTexts(), ['Seeker cache', 'Current page']);
  const dates = await page.locator('.arch-date').allInnerTexts();
  assert.match(dates[0], /2014/);
  assert.equal(await page.locator('.arch-cmp').count(), 1, 'only the older copy offers "Compare with current"');
  assert.equal(await page.locator('.addr-tag').textContent(), 'archive');
  await page.getByText('Tick two copies to compare them side by side.').waitFor();
  await page.locator('.arch-pick').nth(1).click();
  await page.getByText('Pick one more copy to compare.').waitFor();
  await page.locator('.arch-pick').nth(0).click();
  assert.equal(await page.locator('.arch-row.picked').count(), 2);
  await shot('w8-archive.png');
  await noOverflow('archive');
  // Ticked newest first, compared oldest first: "Changes from A to B" reads forwards.
  await b('Compare these two').click();
  await page.getByText('Changes from A to B', { exact: true }).waitFor();
  const head = await page.locator('.cmp-row', { hasText: 'Copy' }).locator('.cmp-cell').allInnerTexts();
  assert.deepEqual(head, ['Cached copy', 'Current page']);
  const dateRow = await page.locator('.cmp-row', { hasText: 'Date' }).locator('.cmp-cell').allInnerTexts();
  assert.match(dateRow[0], /2014/);
  await page.getByText('Changes from A to B', { exact: true }).scrollIntoViewIfNeeded();
  await shot('w8-compare.png');
  // Not saved yet: connecting needs both copies in Casebook, exactly as compared.
  await b('Save to Casebook to connect them').click();
  await b('How are they connected?').click();
  await b('Possibly manipulated').click();
  assert.equal(await page.locator('.link-sentence').innerText(), 'A may be manipulated, compared with B.');
  await b('Back').click();
  await b('Back').click();
  // Back in the Archive, both copies now say they are in Casebook.
  await page.locator('.archive').waitFor();
  assert.equal(await page.locator('.arch-saved').count(), 2, 'both copies are in Casebook now');
  // Open the cached copy: its banner compares it with the current page in one tap.
  await page.locator('.arch-open').first().click();
  await page.getByText('Seeker cache', { exact: true }).waitFor();
  await b('Compare with current page').waitFor();
  assert.equal(await page.locator('.archive-strip').count(), 0, 'the banner has "All copies"; no second way in');
  await shot('w8-cached.png');
  await b('Compare with current page').click();
  await page.getByText('Changes from A to B', { exact: true }).waitFor();
  await b('Back').click();
  await b('All copies').click();
  await page.locator('.archive').waitFor();

  // Brightline's Team page: the 2024 copy against today.
  await go(url(TEAM));
  await page.locator('.archive-strip').click();
  await page.locator('.arch-cmp').click();
  await page.getByText('Changes from A to B', { exact: true }).waitFor();
  assert.ok(await page.locator('.cmp-change.op-removed').count() > 0, 'something on the 2024 page is gone today');
  await page.getByText('Changes from A to B', { exact: true }).scrollIntoViewIfNeeded();
  await shot('w8-team.png');
  await noOverflow('team comparison');
  await b('Back').click();

  // A deleted story: "All copies in Archive" from the gone page; one copy, nothing to compare.
  await go(url(DELETED));
  await b('All copies in Archive').click();
  await page.locator('.archive').waitFor();
  await page.getByText('The page has been deleted. Only copies remain.').waitFor();
  await page.getByText('Only one copy so far. Nothing to compare yet.').waitFor();
  assert.equal(await page.locator('.arch-cmp').count(), 0);
  await shot('w8-deleted.png');

  // A Daily Record story that was updated: the Archive strip in Browser compares the two.
  await go(url(STORY));
  await page.locator('.archive-strip').click();
  assert.deepEqual(await page.locator('.arch-kind').allInnerTexts(), ['Seeker cache', 'Current page']);
  await page.locator('.arch-cmp').click();
  await page.getByText('Changes from A to B', { exact: true }).waitFor();
  await shot('w8-story.png');

  // Reload: the saved copies and the connection-less comparison survive; the Archive is rebuilt.
  await page.reload();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByText('Swipe up to unlock').click();
  await page.locator('.dock button').nth(0).click();
  await go(url(ABOUT));
  await page.locator('.archive-strip').click();
  assert.equal(await page.locator('.arch-saved').count(), 2, 'saved copies persist');
  assert.deepEqual(errors, []);
  await page.close();
  console.log('PASS mobile 390×844 W8: Archive strip, oldest first, tick two, compare oldest first, save both and open the connection editor, cached banner "Compare with current page", All copies, Brightline Team 2024, deleted story, updated Daily Record story, reload');

  // In the paper itself: "Other versions" in the share sheet opens the same Archive.
  {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/__fixture');
    await p.evaluate(async id => {
      const dir = '/games/dead-internet/';
      const { loadContent } = await import(dir + 'core/content.js');
      const { buildWorld } = await import(dir + 'core/world.js');
      const { Game } = await import(dir + 'core/game.js');
      const { Phone } = await import(dir + 'app/phone.js');
      const w = buildWorld(await loadContent(path => fetch(dir + 'content/' + path).then(r => r.json())));
      const g = new Game(w, { seed: 7 }); g.start();
      g.s.artifacts[id] = { visible: true };
      const phone = new Phone(document.getElementById('phone'), g, {});
      phone.openArtifact(id);
    }, STORY);
    await p.locator('[aria-label="Share"]').first().click();
    await p.locator('.ctx-item', { hasText: 'Other versions' }).click();
    await p.locator('.archive').waitFor();
    assert.deepEqual(await p.locator('.arch-kind').allInnerTexts(), ['Seeker cache', 'Current page']);
    await p.getByRole('button', { name: 'Back', exact: true }).click();
    await p.locator('[aria-label="Share"]').first().waitFor();
    await p.close();
    console.log('PASS W8 in the paper: "Other versions" opens the Archive, and Back returns to the story');
  }

  // Twin DOM: every Archive screen, ticked pairs, banners and gone pages look the same in worlds
  // that differ only in hidden canon.
  const snapshots = [];
  for (const mode of ['base', 'merged', 'split']) {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/__fixture');
    snapshots.push(await p.evaluate(async mode => {
      const dir = '/games/dead-internet/';
      const { loadContent } = await import(dir + 'core/content.js');
      const { buildWorld } = await import(dir + 'core/world.js');
      const { Game } = await import(dir + 'core/game.js');
      const { Phone } = await import(dir + 'app/phone.js');
      const { scanText } = await import(dir + 'core/refs.js');
      const w = buildWorld(await loadContent(path => fetch(dir + 'content/' + path).then(r => r.json())));
      if (mode !== 'base') {
        const src = (kind, id) => mode === 'merged' ? 'one-source' : `${kind}:${id}`;
        for (const a of w.artifacts.values()) {
          a.source = src('artifact', a.id);
          for (const v of a.versions) v.source = src('version', a.id + v.id);
          const named = new Set(scanText(w, a.versions.map(v => `${v.title ?? a.title} ${v.body ?? a.body}`).join(' ')).map(x => x.id));
          a.mentions = [...new Set([...(a.mentions || []), ...[...w.entities.values()].filter(e => !e.secret && !named.has(e.id)).map(e => e.id)])];
        }
        for (const i of w.images.values()) i.source = src('image', i.id);
        for (const c of w.characters.values()) { c.source = src('character', c.id); for (const r of c.responses || []) r.source = src('response', r.id); }
        for (const r of w.rules) for (const e of r.do || []) if (e.message) e.message.source = src('rule', r.id);
        const ids = [...w.entities.keys()]; let i = 0;
        for (const a of w.accounts.values()) a.operatedBy = ids[(i++ * 7) % ids.length];
        for (const e of w.entities.values()) if (typeof e.isHuman === 'boolean') e.isHuman = !e.isHuman;
        for (const c of w.claims.values()) c.truth = c.truth === 'true' ? 'false' : 'true';
        w.facts.length = 0;
      }
      const g = new Game(w, { seed: 7 }); g.start();
      for (const a of w.artifacts.values()) {
        if (w.disabled?.has(a.id)) continue;
        g.s.artifacts[a.id] = { visible: true };
        const o = g.open(a.id);
        if (o.view?.error && o.view.cachedVersions?.length) { g.open(a.id, o.view.cachedVersions.at(-1)); continue; }
        if (!o.ok || o.view.locked) continue;
        if (o.view.cachedVersions?.length) g.save({ artifact: a.id, version: o.view.cachedVersions[0] });
      }
      const phone = new Phone(document.getElementById('phone'), g, {});
      phone.openApp('browser');
      const dom = () => [...phone.screen.querySelectorAll('*')].map(el => [el.tagName, el.className?.baseVal ?? el.className, el.childElementCount ? null : el.textContent, el.value ?? null, el.getAttribute('aria-pressed')]);
      const screens = [];
      let archives = 0, deleted = 0;
      for (const id of Object.keys(g.s.seen).sort()) {
        const ar = g.archive(id);
        if (ar.error || !ar.entries.length) continue;
        archives++; if (ar.status !== 'live') deleted++;
        phone.replaceTop({ kind: 'archive', id }); screens.push(dom());
        if (ar.entries.length >= 2) { phone.replaceTop({ kind: 'archive', id, pick: [ar.entries.length - 1, 0] }); screens.push(dom()); }
        for (const x of ar.entries) {
          if (x.kind === 'cached') { const r = g.open(id, x.version); phone.replaceTop({ kind: 'page', id, version: x.version, view: r.view, url: r.view.url || '' }); screens.push(dom()); }
          if (x.kind === 'current') { phone.replaceTop({ kind: 'page', id, version: null, view: g.view(id), url: g.view(id).url || '' }); screens.push(dom()); }
        }
        if (ar.status !== 'live') { phone.replaceTop({ kind: 'page', id, version: null, view: g.view(id), url: ar.url || '' }); screens.push(dom()); }
      }
      return { archives, deleted, screens };
    }, mode));
    await p.close();
  }
  assert.ok(snapshots[0].archives >= 10 && snapshots[0].deleted > 0, 'Archive screens in the twin DOM test');
  assert.deepEqual(snapshots[1], snapshots[0], 'merged hidden origins must not change the Archive DOM');
  assert.deepEqual(snapshots[2], snapshots[0], 'split hidden origins must not change the Archive DOM');
  assert.deepEqual(errors, []);
  console.log(`PASS twin DOM W8: ${snapshots[0].archives} Archive screens (${snapshots[0].deleted} for pages that are gone), ticked pairs, cached and current pages with strips and banners, identical in three twin worlds`);
} finally {
  await browser?.close();
  server.close();
}
