// Run separately from the dependency-free engine suite:
// PLAYWRIGHT_MODULE=/path/to/playwright node games/dead-internet/tools/test-casebook-ui.mjs
// Optional: PLAYWRIGHT_CHANNEL=msedge (otherwise uses Playwright Chromium).
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
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.on('pageerror', e => errors.push(e.message));
  const w = await loadWorld(), g = new Game(w, { seed: 7 }); g.start();
  for (const id of ['A16', 'A02', 'A03', 'A17', 'A19', 'A20', 'A54', 'A55', 'A56']) { const o = g.open(id); if (o.view && !o.view.error) g.save({ artifact: id, version: o.view.versionId }); }
  for (let i = 0; i < 8; i++) g.addEvent({ title: `My event ${i + 1}`, date: { kind: 'unknown' }, evidence: [{ id: g.s.evidence.at(-1).id, stance: 'supports' }] });
  await page.goto(base + '/__fixture');
  await page.evaluate(({ key, save }) => localStorage.setItem(key, save), { key: saveKey(w), save: serialize(g.s) });
  await page.goto(base + '/games/dead-internet/');
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByText('Swipe up to unlock').click();
  await page.locator('.it-notips').click();
  await page.locator('.dock button').nth(3).click();
  const first = page.locator('.ev-open').first();
  const title = await first.locator('b').innerText();
  await first.click();
  const reviewed = page.getByRole('button', { name: 'Reviewed', exact: true });
  assert.equal(await reviewed.getAttribute('aria-pressed'), 'false');
  await page.getByRole('button', { name: 'Important', exact: true }).click();
  await page.getByRole('button', { name: 'Doubtful', exact: true }).click();
  await page.getByRole('textbox', { name: 'My comment' }).fill('My own reading, not a verdict.');
  const scroll = page.locator('.screen .scroll');
  await scroll.evaluate(el => { el.scrollTop = 160; });
  await page.getByRole('button', { name: 'Open original source', exact: true }).scrollIntoViewIfNeeded();
  const before = await scroll.evaluate(el => el.scrollTop);
  assert.ok(before > 0, 'card fixture really scrolls');
  await page.getByRole('button', { name: 'Open original source', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert.equal(await page.getByRole('textbox', { name: 'My comment' }).inputValue(), 'My own reading, not a verdict.');
  assert.ok(Math.abs(await scroll.evaluate(el => el.scrollTop) - before) < 2, 'return restores card scroll');
  await page.getByRole('button', { name: 'Open saved copy', exact: true }).click();
  await page.getByText('Saved copy', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Reviewed', exact: true }).click();
  await page.getByRole('button', { name: 'Set aside…', exact: true }).click();
  await page.getByRole('button', { name: 'Irrelevant', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert.equal(await page.locator('.ev-open b').filter({ hasText: title }).count(), 0);
  await page.getByRole('combobox', { name: 'Evidence filter' }).selectOption('shelved');
  await page.getByRole('button', { name: 'Newest first', exact: true }).click();
  await page.locator('.ev-open').first().click();
  assert.equal(await page.getByRole('textbox', { name: 'My comment' }).inputValue(), 'My own reading, not a verdict.');
  await page.getByRole('button', { name: 'Restore evidence', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '✓ Reviewed', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: '✓ Important', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
  await mkdir(resolve(root, 'test-results'), { recursive: true });
  await page.screenshot({ path: resolve(root, 'test-results/casebook-mobile.png') });
  await page.reload();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByText('Swipe up to unlock').click();
  await page.locator('.dock button').nth(3).click();
  await page.getByRole('combobox', { name: 'Evidence filter' }).selectOption('important');
  await page.getByRole('button', { name: 'Newest first', exact: true }).click();
  await page.locator('.ev-open').first().click();
  assert.equal(await page.getByRole('textbox', { name: 'My comment' }).inputValue(), 'My own reading, not a verdict.');
  await page.close();
  console.log('PASS mobile 390×844: review, marks, comment, source/copy, return scroll, shelving, restore, filters, reload');

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
        const o = g.open(a.id); if (!o.ok || o.view.locked) continue;
        g.save({ artifact: a.id, version: o.view.versionId });
        if (o.view.body) g.save({ artifact: a.id, version: o.view.versionId, quote: { text: o.view.body.slice(0, 30) } });
        for (const image of o.view.images || []) g.save({ artifact: a.id, version: o.view.versionId, image });
      }
      for (const m of g.s.messages) if (m.from !== 'player') g.save({ message: m.id });
      g.s.evidence.forEach((e, i) => g.editEvidence(e.id, { reviewed: i % 2 === 0, important: i % 3 === 0, doubtful: i % 4 === 0, shelf: i % 5 === 0 ? 'finished' : null, note: 'My comment' }));
      const phone = new Phone(document.getElementById('phone'), g, {});
      phone.openApp('casebook');
      const dom = () => [...phone.screen.querySelectorAll('*')].map(el => [el.tagName, el.className?.baseVal ?? el.className, el.childElementCount ? null : el.textContent, el.value ?? null, el.getAttribute('aria-pressed')]);
      const result = { count: g.s.evidence.length, screens: [] };
      for (const triage of ['active', 'unreviewed', 'important', 'doubtful', 'shelved']) {
        phone.replaceTop({ kind: 'main', tab: 'evidence', triage, group: 'all' }); result.screens.push(dom());
        phone.replaceTop({ kind: 'main', tab: 'evidence', triage, group: 'about', open: Object.fromEntries(g.topics().map(t => [t.id, true])) }); result.screens.push(dom());
      }
      for (const e of g.s.evidence) { phone.replaceTop({ kind: 'evidence', id: e.id }); result.screens.push(dom()); }
      // The same Save action used by text selection must produce evidence, not a note.
      const e = g.s.evidence.find(e => e.artifact && !e.quote && !e.image);
      const notes = g.s.notes.length;
      phone.saveText({ text: 'Saved excerpt' }, { artifact: e.artifact, version: e.version });
      result.quoteSaved = g.s.notes.length === notes && g.s.evidence.some(e => e.quote?.text === 'Saved excerpt');
      return result;
    }, mode));
    await p.close();
  }
  assert.ok(snapshots[0].count > 100);
  assert.ok(snapshots.every(s => s.quoteSaved));
  assert.deepEqual(snapshots[1], snapshots[0], 'merged hidden origins must not change DOM');
  assert.deepEqual(snapshots[2], snapshots[0], 'split hidden origins must not change DOM');
  assert.deepEqual(errors, []);
  console.log(`PASS twin DOM: ${snapshots[0].count} evidence cards plus every filter/group, identical text, CSS classes, controls`);
} finally { await browser?.close(); await new Promise(r => server.close(r)); }
