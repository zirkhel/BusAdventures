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

  // ── Step 2: theories and questions ────────────────────────────────────────
  const shots = process.env.CB_SHOTS || resolve(root, 'test-results');
  await mkdir(shots, { recursive: true });
  const g2 = new Game(w, { seed: 7 }); g2.start();
  for (const id of ['A16', 'A02', 'A03', 'A17', 'A19', 'A20', 'A54', 'A55', 'A56']) { const o = g2.open(id); if (o.view && !o.view.error) g2.save({ artifact: id, version: o.view.versionId }); }
  g2.investigate('mara'); g2.investigate('acc_maraquinn');
  g2.editEvidence(g2.s.evidence[2].id, { important: true, note: 'Odd timing' });
  const p2 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  p2.on('pageerror', e => errors.push(e.message));
  await p2.goto(base + '/__fixture');
  await p2.evaluate(({ key, save }) => localStorage.setItem(key, save), { key: saveKey(w), save: serialize(g2.s) });
  const unlock = async (pg, intro) => {
    await pg.goto(base + '/games/dead-internet/');
    await pg.getByRole('button', { name: 'Continue investigation' }).click();
    await pg.getByText('Swipe up to unlock').click();
    if (intro) await pg.locator('.it-notips').click();
    await pg.locator('.dock button').nth(3).click();
  };
  const btn = (name) => p2.getByRole('button', { name, exact: true });
  // Screenshots wait for toasts and sheet animations to finish.
  const shot = async name => { await p2.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 5000 }); await p2.waitForTimeout(350); await p2.screenshot({ path: resolve(shots, name) }); };
  await unlock(p2, true);
  await p2.locator('.seg.tabs button', { hasText: 'Theories' }).click();
  await btn('New theory').click();
  // Free formulation: no claim needed while thinking.
  await p2.getByRole('textbox', { name: 'Theory in your own words' }).fill('Someone else is posting as Mara');
  await btn('Create theory').click();
  await p2.locator('.hyp-big', { hasText: 'Someone else is posting as Mara' }).waitFor();
  // Search picker instead of the long "Other evidence" list.
  assert.equal(await p2.getByText('Other evidence', { exact: true }).count(), 0, 'no long Other evidence list');
  await btn('For').click();
  const search = p2.getByRole('searchbox', { name: 'Search evidence' });
  await search.waitFor();
  const all = await p2.locator('.picker-item').count();
  assert.equal(await p2.locator('.picker .section-title').first().innerText(), 'IMPORTANT', 'important evidence first');
  await search.fill('odd timing');   // matches the player's own comment
  assert.equal(await p2.locator('.picker-item').count(), 1, 'search narrows to the commented evidence');
  const forTitle = await p2.locator('.picker-item b').first().innerText();
  await search.fill('');
  assert.equal(await p2.locator('.picker-item').count(), all);
  await search.fill('odd timing');
  await shot('cb2-search-picker.png');
  await p2.locator('.picker-item').first().click();
  await btn('Against').click();
  await p2.getByRole('searchbox', { name: 'Search evidence' }).waitFor();
  assert.equal(await p2.locator('.picker-item').count(), all - 1, 'linked evidence is not offered again');
  const againstTitle = await p2.locator('.picker-item b').nth(1).innerText();
  await p2.locator('.picker-item').nth(1).click();
  await p2.getByText('For (1)', { exact: true }).waitFor();
  await p2.getByText('Against (1)', { exact: true }).waitFor();
  assert.ok(await p2.locator('.ev-open b', { hasText: forTitle }).count() >= 1);
  // Move it from against to for and back, through the stance sheet.
  await p2.locator('.ev-item', { hasText: againstTitle }).getByRole('button', { name: 'For or against' }).click();
  await btn('For this theory').click();
  await p2.getByText('For (2)', { exact: true }).waitFor();
  await p2.locator('.ev-item', { hasText: againstTitle }).getByRole('button', { name: 'For or against' }).click();
  await btn('Against this theory').click();
  await p2.getByText('Against (1)', { exact: true }).waitFor();
  // Status with history.
  await p2.getByRole('button', { name: 'Status: Working theory' }).click();
  await btn('Convinced').click();
  await p2.getByRole('button', { name: 'Status: Convinced' }).waitFor();
  assert.deepEqual(await p2.locator('.status-log .log-row').allInnerTexts(), ['Day 1 · Working theory', 'Day 1 · Convinced']);
  await shot('cb2-theory.png');
  // An alternative explanation, written new.
  await btn('Alternative').click();
  await btn('Write a new alternative…').click();
  await p2.getByRole('textbox', { name: 'Theory in your own words' }).fill('Mara scheduled the posts herself');
  await btn('Create theory').click();
  await p2.getByText('Alternatives (1)', { exact: true }).waitFor();
  assert.equal(await p2.locator('.hist-row', { hasText: 'Mara scheduled the posts herself' }).count(), 1);
  // A question raised by the theory, then linked to a person.
  await p2.getByRole('textbox', { name: 'Question about this theory' }).fill('Who pays for the account?');
  await btn('Ask').click();
  await p2.locator('.q-row', { hasText: 'Who pays for the account?' }).click();
  await p2.getByRole('textbox', { name: 'Question' }).waitFor();
  await p2.getByRole('button', { name: 'Person or thing', exact: true }).click();
  await p2.locator('.picker-item', { hasText: 'Mara Quinn' }).first().click();
  await p2.getByText('Linked to (2)', { exact: true }).waitFor();
  assert.equal(await p2.locator('.ev-item', { hasText: 'Mara Quinn' }).count(), 1);
  await btn('Answered').click();
  await p2.getByRole('textbox', { name: 'My answer' }).fill('Not known yet, ask Theo');
  await p2.getByRole('textbox', { name: 'My answer' }).blur();
  assert.deepEqual(await p2.locator('.status-log .log-row').allInnerTexts(), ['Day 1 · Open', 'Day 1 · Answered']);
  await shot('cb2-question.png');
  // Questions live in Notes.
  await btn('Back').click(); await btn('Back').click();
  await p2.locator('.seg.tabs button', { hasText: 'Notes' }).click();
  await p2.locator('.seg.small button', { hasText: 'Questions' }).click();
  await p2.getByText('Answered (1)', { exact: true }).waitFor();
  await p2.getByRole('textbox', { name: 'New question' }).fill('Why does the obituary come before the posts?');
  await btn('Add question').click();
  await p2.getByText('Open (1)', { exact: true }).waitFor();
  await shot('cb2-questions.png');
  assert.ok(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
  // Reload: everything is in the save.
  await p2.reload();
  await unlock(p2, false);
  await p2.locator('.seg.tabs button', { hasText: 'Theories' }).click();
  await p2.locator('.hyp-row', { hasText: 'Someone else is posting as Mara' }).click();
  await p2.getByText('For (1)', { exact: true }).waitFor();
  await p2.getByText('Against (1)', { exact: true }).waitFor();
  await p2.getByRole('button', { name: 'Status: Convinced' }).waitFor();
  assert.deepEqual(await p2.locator('.status-log .log-row').allInnerTexts(), ['Day 1 · Working theory', 'Day 1 · Convinced']);
  assert.equal(await p2.locator('.hist-row', { hasText: 'Mara scheduled the posts herself' }).count(), 1);
  await p2.getByText('Alternatives (1)', { exact: true }).scrollIntoViewIfNeeded();
  await p2.locator('.screen .scroll').evaluate(el => { el.scrollTop += 220; });
  await shot('cb2-theory-more.png');
  await p2.locator('.q-row', { hasText: 'Who pays for the account?' }).click();
  assert.equal(await p2.getByRole('textbox', { name: 'My answer' }).inputValue(), 'Not known yet, ask Theo');
  await btn('Back').click();
  // Rejecting folds a theory away but keeps it and its links.
  await p2.locator('.hist-row', { hasText: 'Mara scheduled the posts herself' }).click();
  await p2.getByRole('button', { name: 'Status: Working theory' }).click();
  await btn('Rejected').click();
  await btn('Back').click(); await btn('Back').click();
  assert.equal(await p2.locator('.hyp-row', { hasText: 'Mara scheduled the posts herself' }).count(), 0, 'rejected is folded away');
  await p2.locator('.ev-group-head', { hasText: 'Rejected' }).click();
  assert.equal(await p2.locator('.hyp-row', { hasText: 'Mara scheduled the posts herself' }).count(), 1);
  await shot('cb2-theories.png');
  // The report builder only offers theories with a claim.
  await btn('Reports').click();
  assert.ok(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
  await p2.close();
  console.log('PASS mobile 390×844 step 2: free theory, search picker, for/against, status history, alternative, question linked to a person, answered, Notes, reload, rejected fold');

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
      // Step 2: theories in own words and as claims, for/against, status, alternatives, questions.
      for (const id of ['mara', 'acc_maraquinn', 'calvin', 'owen']) g.investigate(id);
      const ev = g.s.evidence.map(e => e.id);
      const th = [g.hypothesize({ title: 'Someone else posts as Mara' }).id,
        g.hypothesize({ title: 'Mara wrote it in advance', subject: 'mara', predicate: 'is_dead' }).id,
        g.hypothesize({ subject: 'acc_maraquinn', predicate: 'not_real' }).id];
      ev.forEach((id, i) => g.link(th[i % 3], id, true, i % 2 ? 'contradicts' : 'supports'));
      g.setTheoryStatus(th[1], 'convinced'); g.setTheoryStatus(th[2], 'rejected');
      g.linkAlternative(th[0], th[1]); g.linkAlternative(th[2], th[0]);
      g.visibleSources().slice(0, 24).forEach((s, i) => g.addQuestion({ text: `Who is behind ${s.label}?`,
        links: { sources: [s.key], evidence: [ev[i * 7 % ev.length]], topics: ['mara', 'calvin'].slice(0, 1 + i % 2), theories: [th[i % 3]] } }));
      g.s.questions.forEach((q, i) => g.editQuestion(q.id, { status: ['open', 'answered', 'dropped'][i % 3], answer: i % 3 === 1 ? 'My answer' : '' }));
      const overlay = () => [...phone.overlay.querySelectorAll('*')].map(el => [el.tagName, el.className?.baseVal ?? el.className, el.childElementCount ? null : el.textContent]);
      const click = label => [...phone.screen.querySelectorAll('button')].find(b => b.textContent.trim() === label).click();
      phone.replaceTop({ kind: 'main', tab: 'theories', showRejected: true }); result.screens.push(dom());
      for (const hy of g.s.hypotheses) { phone.replaceTop({ kind: 'hyp', id: hy.id }); result.screens.push(dom()); }
      phone.replaceTop({ kind: 'builder', id: th[1], title: 'Mara wrote it in advance', subject: 'mara', predicate: 'is_dead' }); result.screens.push(dom());
      phone.replaceTop({ kind: 'main', tab: 'notes', notesView: 'questions' }); result.screens.push(dom());
      for (const q of g.s.questions) { phone.replaceTop({ kind: 'question', id: q.id }); result.screens.push(dom()); }
      phone.replaceTop({ kind: 'hyp', id: th[0] });
      for (const label of ['For', 'Against', 'Alternative']) { click(label); result.screens.push(overlay()); phone.closeOverlay(); }
      phone.replaceTop({ kind: 'question', id: g.s.questions[0].id });
      for (const label of ['Evidence', 'Person or thing', 'Source', 'Theory']) { click(label); result.screens.push(overlay()); phone.closeOverlay(); }
      phone.replaceTop({ kind: 'report', case: 'quiet_account', hyps: [], events: [] }); result.screens.push(dom());
      result.step2 = [g.s.hypotheses.length, g.s.questions.length];
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
  assert.ok(snapshots[0].step2[1] > 10, 'questions in the twin DOM test');
  assert.ok(snapshots.every(s => s.quoteSaved));
  assert.deepEqual(snapshots[1], snapshots[0], 'merged hidden origins must not change DOM');
  assert.deepEqual(snapshots[2], snapshots[0], 'split hidden origins must not change DOM');
  assert.deepEqual(errors, []);
  console.log(`PASS twin DOM: ${snapshots[0].count} evidence cards plus every filter/group, ${snapshots[0].step2[0]} theories, ${snapshots[0].step2[1]} questions and their search pickers, identical text, CSS classes, controls`);
} finally { await browser?.close(); await new Promise(r => server.close(r)); }
