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
  await page.getByText('Your saved copy', { exact: true }).waitFor();
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

  // ── Step 3: selection mode, comparison and connections ─────────────────────
  const g3 = new Game(w, { seed: 7 }); g3.start();
  const PAGE = 'W-kestrel-0005';
  const ids3 = {};
  for (const id of ['A54', 'A55', 'A56', PAGE]) { g3.s.artifacts[id] = { ...g3.s.artifacts[id], visible: true }; const o = g3.open(id); ids3[id] = g3.save({ artifact: id, version: o.view.versionId }).id; }
  const old = g3.view(PAGE).cachedVersions[0];
  g3.open(PAGE, old); ids3.old = g3.save({ artifact: PAGE, version: old }).id;
  const pics = [];
  for (const a of w.artifacts.values()) {
    if (pics.length === 2 || a.access || !(a.images || []).length || w.disabled?.has(a.id)) continue;
    g3.s.artifacts[a.id] = { ...g3.s.artifacts[a.id], visible: true };
    const o = g3.open(a.id); if (!o.ok || o.view.locked || !(o.view.images || []).length) continue;
    pics.push(g3.save({ artifact: a.id, version: o.view.versionId, image: o.view.images[0] }).id);
  }
  const friends = ['A54', 'A55', 'A56'].map(id => ids3[id]);
  g3.hypothesize({ title: 'The three friends are one voice', evidence: friends });
  const t3 = Object.fromEntries(Object.entries(ids3).map(([k, id]) => [k, g3.compare([{ evidence: id }, { evidence: friends[0] }]).items[0].title]));
  const p3 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  p3.on('pageerror', e => errors.push(e.message));
  await p3.goto(base + '/__fixture');
  await p3.evaluate(({ key, save }) => localStorage.setItem(key, save), { key: saveKey(w), save: serialize(g3.s) });
  const b3 = name => p3.getByRole('button', { name, exact: true });
  const shot3 = async name => { await p3.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 5000 }); await p3.waitForTimeout(350); await p3.screenshot({ path: resolve(shots, name) }); };
  const open3 = async intro => {
    await p3.goto(base + '/games/dead-internet/');
    await p3.getByRole('button', { name: 'Continue investigation' }).click();
    await p3.getByText('Swipe up to unlock').click();
    if (intro) await p3.locator('.it-notips').click();
    await p3.locator('.dock button').nth(3).click();
  };
  const row3 = title => p3.locator('.ev-item', { has: p3.locator('.ev-open b', { hasText: title }) }).first();
  await open3(true);
  // Long press starts selection mode.
  const first3 = row3(t3.A54).locator('.ev-open');
  await first3.scrollIntoViewIfNeeded();
  const box = await first3.boundingBox();
  await p3.mouse.move(box.x + 40, box.y + box.height / 2); await p3.mouse.down(); await p3.waitForTimeout(700); await p3.mouse.up();
  await p3.getByText('1 selected', { exact: true }).waitFor();
  await row3(t3.A55).locator('.ev-open').click();
  await row3(t3.A56).locator('.ev-open').click();
  await p3.getByText('3 selected', { exact: true }).waitFor();
  assert.equal(await p3.locator('.ev-item.selected').count(), 3);
  await shot3('cb3-select.png');
  await b3('Compare (3)').click();
  // The comparison lines up visible fields and marks rows that differ, without concluding.
  await p3.locator('.cmp-table').waitFor();
  assert.deepEqual(await p3.locator('.cmp-row.head .cmp-letter').allInnerTexts(), ['A', 'B', 'C']);
  assert.ok(await p3.locator('.cmp-row.differs', { hasText: 'Source' }).count() === 1, 'three accounts look like three sources');
  await shot3('cb3-compare.png');
  // Three compared, but a connection is between exactly two: pick them.
  await b3('Connect two of these').click();
  await p3.getByText('A connection is between two. Pick the first.').waitFor();
  assert.equal(await p3.locator('.ctx-item').count(), 3);
  await p3.locator('.ctx-item', { hasText: `A · ${t3.A54}` }).click();
  assert.equal(await p3.locator('.ctx-item').count(), 2, 'the first is not offered again');
  await p3.locator('.ctx-item', { hasText: `B · ${t3.A55}` }).click();
  assert.equal(await p3.locator('.link-kinds .chip').count(), 6, 'six kinds');
  assert.deepEqual(await p3.locator('.link-editor .cmp-name b').allInnerTexts(), [t3.A54, t3.A55], 'exactly two ends');
  await b3('Same origin').click();
  assert.equal(await p3.locator('.link-sentence').innerText(), 'A and B have the same origin.');
  assert.equal(await p3.getByRole('button', { name: '⇅ Swap A and B' }).count(), 0, 'no direction to swap');
  await p3.getByRole('textbox', { name: 'Because' }).fill('Both only repost the same lines');
  await shot3('cb3-connect.png');
  await b3('Save connection').click();
  await p3.getByText('Your connections (1)', { exact: true }).waitFor();
  assert.equal(await p3.locator('.link-row .stance').first().textContent(), 'Same origin');
  assert.equal(await p3.locator('.link-row .link-text').first().innerText(), `A · ${t3.A54} and B · ${t3.A55} have the same origin`);
  await b3('Back').click();
  // Two selected go straight to the editor. "Supports" has a direction, and A and B can be swapped.
  await b3('Done').click();
  await b3('Select').click();
  await row3(t3.A56).locator('.ev-open').click();
  await row3(t3.A54).locator('.ev-open').click();
  await b3('Link').click();
  await b3('Supports').click();
  assert.equal(await p3.locator('.link-sentence').innerText(), 'A supports B.');
  assert.deepEqual(await p3.locator('.link-dir-row span:nth-child(2)').allInnerTexts(), [t3.A56, t3.A54]);
  await b3('⇅ Swap A and B').click();
  assert.deepEqual(await p3.locator('.link-dir-row span:nth-child(2)').allInnerTexts(), [t3.A54, t3.A56], 'swapped');
  assert.deepEqual(await p3.locator('.link-editor .cmp-name b').allInnerTexts(), [t3.A54, t3.A56]);
  assert.equal(await p3.locator('.chip[aria-pressed="true"]').innerText(), '✓ Supports', 'kind kept across the swap');
  await p3.getByRole('textbox', { name: 'Because' }).fill('Mike posted it first');
  await shot3('cb3-direction.png');
  await b3('Save connection').click();
  // The same direction again is the same connection; the other way round would be a new one.
  await b3('Link').click();
  await b3('Supports').click();
  await b3('⇅ Swap A and B').click();
  await b3('Save connection').click();
  await p3.getByText('You already connected these that way. Reason updated.').waitFor();
  await b3('Done').click();
  // Each end reads the direction from its own side.
  await row3(t3.A56).locator('.ev-open').click();
  await p3.getByText('Connections (1)', { exact: true }).waitFor();
  assert.equal(await p3.locator('.link-row .link-text').first().innerText(), `${t3.A54} supports this`);
  await b3('Back').click();
  await row3(t3.A54).locator('.ev-open').click();
  await p3.getByText('Connections (2)', { exact: true }).waitFor();
  assert.deepEqual((await p3.locator('.link-row .link-text').allInnerTexts()).sort(), [`This and ${t3.A55} have the same origin`, `This supports ${t3.A56}`].sort());
  await p3.locator('.link-row').last().evaluate(el => el.scrollIntoView({ block: 'center' }));
  await shot3('cb3-card.png');
  await b3('Back').click();
  // On the other end of an undirected connection it reads from that side; edit it there.
  await row3(t3.A55).locator('.ev-open').click();
  await p3.getByText('Connections (1)', { exact: true }).waitFor();
  assert.equal(await p3.locator('.link-row .link-text').first().innerText(), `This and ${t3.A54} have the same origin`);
  await p3.locator('.link-row').first().click();
  assert.equal(await p3.getByRole('textbox', { name: 'Because' }).inputValue(), 'Both only repost the same lines');
  await b3('Related').click();
  await b3('Save changes').click();
  assert.equal(await p3.locator('.link-row .stance').first().textContent(), 'Related');
  await b3('Back').click();
  // Two copies of the same page: paragraph changes.
  await row3(t3[PAGE]).locator('.ev-open').click();
  await b3('Compare with…').click();
  await p3.getByRole('searchbox', { name: 'Search evidence' }).fill('About Kestrel');
  assert.equal(await p3.locator('.picker-item').count(), 1, 'only the other copy');
  await p3.locator('.picker-item').first().click();
  await p3.getByText('Changes from A to B', { exact: true }).waitFor();
  assert.ok(await p3.locator('.cmp-change.op-removed, .cmp-change.op-added').count() > 0);
  await p3.getByText('Changes from A to B', { exact: true }).scrollIntoViewIfNeeded();
  await shot3('cb3-versions.png');
  await b3('Back').click(); await b3('Back').click();
  // Two images: switch between them at the same zoom.
  await b3('Select').click();
  for (const id of pics) await row3(t3[Object.keys(ids3).find(k => ids3[k] === id)] ?? '').count();
  const picTitles = pics.map(id => g3.compare([{ evidence: id }, { evidence: friends[0] }]).items[0].title);
  for (const tt of picTitles) await row3(tt).locator('.ev-open').click();
  await b3('Compare (2)').click();
  await p3.locator('.cmp-stage').waitFor();
  await b3('Zoom in').click();
  await p3.getByText('150%', { exact: true }).waitFor();
  const srcA = await p3.locator('.cmp-img').getAttribute('src');
  await b3('Show B').click();
  assert.notEqual(await p3.locator('.cmp-img').getAttribute('src'), srcA, 'switched image');
  await p3.getByText('150%', { exact: true }).waitFor();
  assert.ok(await p3.locator('.cmp-row', { hasText: 'Camera' }).count() + await p3.locator('.cmp-row', { hasText: 'Metadata' }).count() >= 1, 'image info lined up');
  await p3.locator('.cmp-stage').scrollIntoViewIfNeeded();
  await shot3('cb3-images.png');
  assert.ok(await p3.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
  await b3('Back').click();
  // Selection: set two aside at once.
  await b3('Set aside').click();
  await b3('Irrelevant').click();
  for (const tt of picTitles) assert.equal(await p3.locator('.ev-open b', { hasText: tt }).count(), 0, 'set aside');
  // The theory shows connections among its evidence; everything survives a reload.
  await p3.reload();
  await open3(false);
  await p3.locator('.seg.tabs button', { hasText: 'Theories' }).click();
  await p3.locator('.hyp-row', { hasText: 'The three friends are one voice' }).click();
  await p3.getByText('Connections (2)', { exact: true }).waitFor();
  assert.deepEqual((await p3.locator('.link-row .link-text').allInnerTexts()).sort(), [`${t3.A54} and ${t3.A55} are connected`, `${t3.A54} supports ${t3.A56}`].sort(), 'direction kept after reload');
  await p3.locator('.link-row').last().scrollIntoViewIfNeeded();
  await shot3('cb3-theory.png');
  await p3.close();
  console.log('PASS mobile 390×844 step 3: long press selection, compare three, pick two of three, six kinds, connection with reason, Supports with swap, duplicate refused, direction read from each end, edit on card, page versions with changes, two images switch and zoom, set aside several, theory connections, reload');

  // The W8 entry point: Browser Archive will call phone.compare() with two versions of one page.
  {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/__fixture');
    const r = await p.evaluate(async () => {
      const dir = '/games/dead-internet/';
      const { loadContent } = await import(dir + 'core/content.js');
      const { buildWorld } = await import(dir + 'core/world.js');
      const { Game } = await import(dir + 'core/game.js');
      const { Phone } = await import(dir + 'app/phone.js');
      const w = buildWorld(await loadContent(path => fetch(dir + 'content/' + path).then(r => r.json())));
      const g = new Game(w, { seed: 7 }); g.start();
      const id = 'W-kestrel-0005'; g.s.artifacts[id] = { visible: true };
      const old = g.view(id).cachedVersions[0];
      g.open(id, old); g.open(id);
      const phone = new Phone(document.getElementById('phone'), g, {});
      phone.openApp('casebook');
      phone.compare([{ artifact: id, version: old }, { artifact: id }]);
      window.__g = g; window.__old = old;
      return { evidence: g.s.evidence.length, old };
    });
    assert.equal(r.evidence, 0);
    await p.getByText('Changes from A to B', { exact: true }).waitFor();
    await p.getByRole('button', { name: 'Save to Casebook to connect them', exact: true }).click();
    await p.getByRole('button', { name: 'How are they connected?', exact: true }).waitFor();
    const saved = await p.evaluate(() => window.__g.s.evidence.map(e => [e.artifact, e.version ?? null]));
    assert.equal(saved.length, 2, 'both copies saved');
    assert.ok(saved.some(([, v]) => v === r.old), 'the archived version is saved as that version');
    await p.close();
    console.log('PASS W8 hook: phone.compare() with two versions of a page, changes shown, both copies saved before connecting');
  }

  // ── Step 4: source cards and the player's own count ───────────────────────
  {
    const g4 = new Game(w, { seed: 7 }); g4.start();
    const ids4 = {};
    for (const id of ['A16', 'A54', 'A55', 'A56']) { g4.s.artifacts[id] = { ...g4.s.artifacts[id], visible: true }; const o = g4.open(id); ids4[id] = g4.save({ artifact: id, version: o.view.versionId }).id; }
    const src4 = Object.fromEntries(Object.entries(ids4).map(([k, id]) => [k, g4.evidenceAbout(id)]));
    const MIKE = src4.A54, PAT = src4.A55, LIN = src4.A56;
    g4.hypothesize({ title: 'The three friends are one voice', evidence: [ids4.A54, ids4.A55, ids4.A56] });
    // Step 3 and step 2 already in the save: a "Same origin" connection, and a question about a source.
    g4.addLink({ a: ids4.A55, b: ids4.A56, kind: 'same_origin', note: 'Same garden photo' });
    g4.addQuestion({ text: `Who is behind ${MIKE.sourceLabel}?`, links: { sources: [MIKE.source] } });
    const p4 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    p4.on('pageerror', e => errors.push(e.message));
    await p4.goto(base + '/__fixture');
    await p4.evaluate(({ key, save }) => localStorage.setItem(key, save), { key: saveKey(w), save: serialize(g4.s) });
    const b4 = name => p4.getByRole('button', { name, exact: true });
    const shot4 = async name => { await p4.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 5000 }); await p4.waitForTimeout(350); await p4.screenshot({ path: resolve(shots, name) }); };
    const noOverflow4 = async what => assert.ok(await p4.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal overflow: ${what}`);
    const open4 = async intro => {
      await p4.goto(base + '/games/dead-internet/');
      await p4.getByRole('button', { name: 'Continue investigation' }).click();
      await p4.getByText('Swipe up to unlock').click();
      if (intro) await p4.locator('.it-notips').click();
      await p4.locator('.dock button').nth(3).click();
    };
    const theoryCounts = async () => p4.locator('.hyp-row', { hasText: 'The three friends are one voice' }).locator('.hyp-counts').innerText();
    await open4(true);
    // The Sources list: every visible source, not assessed yet.
    await b4('Sources').click();
    await p4.locator('.src-row').first().waitFor();
    assert.equal(await p4.locator('.src-row').count(), 4);
    assert.equal(await p4.locator('.src-row', { hasText: 'Not assessed' }).count(), 4, 'every card starts empty');
    await shot4('cb4-sources.png');
    // Mike's card: two questions, the player's answers only.
    await p4.locator('.src-row', { hasText: MIKE.sourceLabel }).click();
    await p4.locator('.source-detail').waitFor();
    await p4.getByText("Your own assessment. The Casebook never says whether you're right.").waitFor();
    const seg = label => p4.getByRole('group', { name: label });
    assert.equal(await seg('Do I trust this source?').locator('[aria-pressed="true"]').count(), 0);
    await seg('Do I trust this source?').getByRole('button', { name: 'Unsure' }).click();
    await seg('Is it who it claims to be?').getByRole('button', { name: 'No' }).click();
    assert.equal(await seg('Is it who it claims to be?').getByRole('button', { name: 'No' }).getAttribute('aria-pressed'), 'true');
    // Tapping an answer again takes it back.
    await seg('Do I trust this source?').getByRole('button', { name: 'Unsure' }).click();
    assert.equal(await seg('Do I trust this source?').locator('[aria-pressed="true"]').count(), 0, 'answer taken back');
    await seg('Do I trust this source?').getByRole('button', { name: 'Unsure' }).click();
    // Same origin as Pat, picked with search.
    await b4('Choose source').click();
    await p4.locator('.picker input, .sheet input').first().fill(PAT.sourceLabel);
    await p4.locator('.picker-item, .pick-item, .sheet button', { hasText: PAT.sourceLabel }).first().click();
    await p4.locator('.chip.removable', { hasText: PAT.sourceLabel }).waitFor();
    await p4.getByRole('textbox', { name: 'My comment on this source' }).fill('Only reposts, same photos as Pat.');
    // The step 2 question about this source is on its card; a new one can be asked here.
    await p4.locator('.q-row', { hasText: `Who is behind ${MIKE.sourceLabel}?` }).waitFor();
    await p4.getByRole('textbox', { name: 'Question about this source' }).fill('When was the account made?');
    await b4('Ask').click();
    await p4.locator('.q-row', { hasText: 'When was the account made?' }).waitFor();
    await p4.locator('.src-group').waitFor();
    assert.match(await p4.locator('.src-group').innerText(), new RegExp(`one source together with .*${PAT.sourceLabel}`));
    await p4.locator('.source-detail .src-head').scrollIntoViewIfNeeded();
    await shot4('cb4-card.png');
    await noOverflow4('source card');
    // Lindsay's card: tied to Pat only by the player's "Same origin" connection between evidence.
    await b4('Back').click();
    await p4.locator('.src-row', { hasText: MIKE.sourceLabel }).getByText(/Trust: Unsure · Who it claims: No · Same origin as 1 · Comment/).waitFor();
    await p4.locator('.src-row', { hasText: LIN.sourceLabel }).click();
    await p4.locator('.src-chip', { hasText: `${PAT.sourceLabel} · 1 connection` }).waitFor();
    await shot4('cb4-linked.png');
    await b4('Back').click(); await b4('Back').click();
    // The theory: 3 visible sources, 1 in the player's own count.
    await p4.locator('.seg.tabs button', { hasText: 'Theories' }).click();
    assert.match(await theoryCounts(), /3 sources \(1 in your count\)/);
    await p4.locator('.hyp-row', { hasText: 'The three friends are one voice' }).click();
    assert.equal(await p4.locator('.own-count b').innerText(), '1');
    await p4.getByText('Your count: 1 after your “same origin” answers and connections.').waitFor();
    await p4.getByText(/You doubt 1 is who it claims to be\./).waitFor();
    await shot4('cb4-theory.png');
    await noOverflow4('theory');
    // A source chip on the theory opens the card; the evidence card has a Source row too.
    await p4.locator('.src-chip', { hasText: MIKE.sourceLabel }).click();
    await p4.locator('.source-detail h2', { hasText: MIKE.sourceLabel }).waitFor();
    await p4.locator('.source-detail .ev-open').first().click();
    await p4.locator('.src-row', { hasText: `Source: ${MIKE.sourceLabel}` }).waitFor();
    await shot4('cb4-evidence.png');
    // Remove "same as" from the card: the count follows.
    await p4.locator('.src-row', { hasText: `Source: ${MIKE.sourceLabel}` }).click();
    await p4.locator('.chip.removable', { hasText: PAT.sourceLabel }).click();
    assert.equal(await p4.locator('.chip.removable').count(), 0);
    // Reload: the player's answers and comment are kept.
    await p4.reload();
    await open4(false);
    await p4.locator('.seg.tabs button', { hasText: 'Theories' }).click();
    assert.match(await theoryCounts(), /3 sources \(2 in your count\)/, 'only the connection is left');
    await p4.locator('.seg.tabs button', { hasText: 'Evidence' }).click();
    await b4('Sources').click();
    await p4.locator('.src-row', { hasText: MIKE.sourceLabel }).click();
    assert.equal(await seg('Do I trust this source?').getByRole('button', { name: 'Unsure' }).getAttribute('aria-pressed'), 'true');
    assert.equal(await p4.getByRole('textbox', { name: 'My comment on this source' }).inputValue(), 'Only reposts, same photos as Pat.');
    // Nothing the world does changed: no notification, no trust or credibility change.
    const world4 = await p4.evaluate(() => { const s = JSON.parse(Object.entries(localStorage).find(([k]) => k.startsWith('ba_deadinternet_'))[1]).state;
      return { cred: s.credibility, trust: s.trust, notes: s.notifications.length, flags: s.flags, endings: s.endings }; });
    assert.deepEqual(world4, { cred: g4.s.credibility, trust: g4.s.trust, notes: g4.s.notifications.length, flags: g4.s.flags, endings: g4.s.endings });
    assert.deepEqual(errors, []);
    await p4.close();
    console.log('PASS mobile 390×844 step 4: Sources list, source card (trust, who it claims, taking an answer back), same origin as with search, comment, questions on the card, connection ties shown, theory "3 sources (1 in your count)", source chip and evidence Source row open the card, removing "same as", reload, world unchanged');
  }

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
      // Step 3: connections of every kind, comparisons (evidence, images, two copies of a page), the editor.
      const kinds = ['supports', 'contradicts', 'related', 'same_origin', 'manipulated', 'unrelated'];
      for (let i = 0; i + 1 < ev.length && i < 120; i += 2) g.addLink({ a: ev[i], b: ev[i + 1], kind: kinds[i / 2 % 6], note: i % 4 ? 'Because I think so' : '' });
      for (let i = 0; i + 1 < ev.length && i < 60; i += 5) g.addLink({ a: ev[i + 1], b: ev[i], kind: ['supports', 'manipulated'][i % 2] });
      const versioned = [...w.artifacts.values()].filter(a => g.s.seen[a.id] != null && (g.view(a.id).cachedVersions || []).length).slice(0, 6);
      const pairs = [...Array(20).keys()].map(i => [{ evidence: ev[i * 3 % ev.length] }, { evidence: ev[(i * 3 + 1) % ev.length] }]);
      const imgs = g.s.evidence.filter(e => e.image).slice(0, 6).map(e => ({ evidence: e.id }));
      pairs.push(imgs.slice(0, 2), imgs.slice(2, 5), ev.slice(0, 3).map(id => ({ evidence: id })));
      for (const a of versioned) pairs.push([{ artifact: a.id, version: g.view(a.id).cachedVersions[0] }, { artifact: a.id }]);
      for (const items of pairs) {
        phone.replaceTop({ kind: 'compare', items }); result.screens.push(dom());
        if (items.length === 2 && items.every(x => x.evidence && g.s.evidence.find(e => e.id === x.evidence)?.image)) { click('Show B'); result.screens.push(dom()); }
      }
      for (const l of [...g.s.links.slice(0, 12), ...g.s.links.filter(l => ['supports', 'manipulated'].includes(l.kind)).slice(0, 6)]) {
        phone.replaceTop({ kind: 'link', a: l.a, b: l.b, id: l.id }); result.screens.push(dom());
        phone.replaceTop({ kind: 'link', a: l.a, b: l.b, id: l.id, swap: true }); result.screens.push(dom());
      }
      for (const pick of kinds) for (const swap of [false, true]) { phone.replaceTop({ kind: 'link', a: ev[0], b: ev[1], pick, swap }); result.screens.push(dom()); }
      for (const id of ev.slice(0, 30)) { phone.replaceTop({ kind: 'evidence', id }); result.screens.push(dom()); }
      phone.replaceTop({ kind: 'main', tab: 'evidence', group: 'all', select: ev.slice(0, 5) }); result.screens.push(dom());
      result.step3 = [g.s.links.length, pairs.length, versioned.length];
      // Step 4: source cards with every answer, "same origin as" chains, the list, the picker, theories.
      const vis = g.visibleSources().map(x => x.key).sort();
      const answers = ['yes', 'unsure', 'no', null];
      vis.forEach((key, i) => g.assessSource(key, { trust: answers[i % 4], authentic: answers[(i + 1) % 4], note: i % 3 ? 'My read' : '' }));
      for (let i = 0; i + 1 < vis.length; i += 3) g.linkSources(vis[i], vis[i + 1]);
      phone.replaceTop({ kind: 'sources' }); result.screens.push(dom());
      for (const key of vis) { phone.replaceTop({ kind: 'source', key }); result.screens.push(dom()); }
      phone.replaceTop({ kind: 'source', key: vis[0] }); click('Choose source'); result.screens.push(overlay()); phone.closeOverlay();
      phone.replaceTop({ kind: 'main', tab: 'theories', showRejected: true }); result.screens.push(dom());
      for (const hy of g.s.hypotheses) { phone.replaceTop({ kind: 'hyp', id: hy.id }); result.screens.push(dom()); }
      for (const id of ev.slice(0, 30)) { phone.replaceTop({ kind: 'evidence', id }); result.screens.push(dom()); }
      result.step4 = [vis.length, g.sources().filter(c => c.group.length).length, g.casebook().hypotheses.filter(h => h.ownSourceCount !== h.sourceCount).length];
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
  assert.ok(snapshots[0].step3[0] > 50 && snapshots[0].step3[2] > 0, 'connections and page versions in the twin DOM test');
  assert.ok(snapshots[0].step4[0] > 20 && snapshots[0].step4[1] > 0 && snapshots[0].step4[2] > 0, 'source cards, groups and own counts in the twin DOM test');
  assert.ok(snapshots.every(s => s.quoteSaved));
  assert.deepEqual(snapshots[1], snapshots[0], 'merged hidden origins must not change DOM');
  assert.deepEqual(snapshots[2], snapshots[0], 'split hidden origins must not change DOM');
  assert.deepEqual(errors, []);
  console.log(`PASS twin DOM: ${snapshots[0].count} evidence cards plus every filter/group, ${snapshots[0].step2[0]} theories, ${snapshots[0].step2[1]} questions and their search pickers, ${snapshots[0].step3[0]} connections, ${snapshots[0].step3[1]} comparisons (${snapshots[0].step3[2]} page versions), ${snapshots[0].step4[0]} source cards (${snapshots[0].step4[1]} in a group of your own) and the Sources picker, identical text, CSS classes, controls`);
} finally { await browser?.close(); await new Promise(r => server.close(r)); }
