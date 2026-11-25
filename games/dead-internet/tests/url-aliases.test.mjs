// Former page addresses (artifact `urlAliases`): the Harbor Festival posts moved to October
// URLs and keep their ids. Old links, bookmarks and saved evidence still reach the same post.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { validateWorld } from "../tools/lib/validate-world.mjs";
import { Game } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { resolveBrowse, isBookmarked, newBrowseSession, sessionPush, sessionBack, sessionForward } from "../core/browser.js";
import { canonicalUrl, listedPages } from "../core/sites.js";

const world = await loadWorld();
const MOVED = {
  "W-eastfieldnotes-0016": ["eastfieldnotes.blog/2021/07/harbor-festival-dog-run", "eastfieldnotes.blog/2021/10/harbor-festival-dog-run"],
  "W-eastfieldnotes-0022": ["eastfieldnotes.blog/2022/07/festival-weekend", "eastfieldnotes.blog/2022/10/festival-weekend"],
};
const started = () => { const g = new Game(world, { seed: 1 }); g.start(); return g; };
const DATE = "2026-03-09";

test("old and new addresses open the same post, same id and version, under the new address", () => {
  const g = started();
  for (const [id, [oldUrl, newUrl]] of Object.entries(MOVED)) {
    assert.equal(world.artifacts.get(id).url, newUrl);
    const viaOld = resolveBrowse(world, oldUrl, DATE), viaNew = resolveBrowse(world, newUrl, DATE);
    const viaHttps = resolveBrowse(world, `https://${oldUrl}/`, DATE);
    for (const r of [viaOld, viaNew, viaHttps]) assert.deepEqual(r, { kind: "page", artifact: id, url: newUrl }, oldUrl);
    assert.equal(canonicalUrl(world, oldUrl), newUrl);
    const a = g.open(id).view, b = g.open(viaOld.artifact).view;
    assert.equal(a.versionId, b.versionId);
    assert.equal(a.body, b.body);
  }
  // Other addresses are untouched, and a made-up July path on the blog is still a 404.
  assert.equal(canonicalUrl(world, "eastfieldnotes.blog/2019/08/fog-this-morning"), "eastfieldnotes.blog/2019/08/fog-this-morning");
  assert.equal(resolveBrowse(world, "eastfieldnotes.blog/2021/07/nothing-here", DATE).kind, "notfound");
});

test("a version 8 save with a bookmark and evidence on the old address still opens the right copy", () => {
  const g = started();
  const id = "W-eastfieldnotes-0022", [oldUrl, newUrl] = MOVED[id];
  const opened = g.open(id).view;
  const ev = g.save({ artifact: id, version: opened.versionId });
  assert.ok(ev.id, "evidence saved");
  g.s.browser.bookmarks.push({ url: oldUrl, title: "Festival weekend", artifact: id, version: opened.versionId, day: 1 });
  g.s.browser.bookmarks.push({ url: MOVED["W-eastfieldnotes-0016"][0], title: "The dog run under Harbor Festival", day: 1 });
  g.s.browser.bookmarks.push({ url: newUrl, title: "Festival weekend (twice)", artifact: id, day: 1 });
  const text = serialize(g.s);
  assert.equal(JSON.parse(text).saveVersion, 8);
  const { state, warnings } = deserialize(world, text);
  assert.deepEqual(warnings.filter(w => /dropped/.test(w)), []);
  const urls = state.browser.bookmarks.map(b => b.url);
  assert.deepEqual(urls, [newUrl, MOVED["W-eastfieldnotes-0016"][1]], "moved to the new address, no duplicate");
  assert.equal(state.browser.bookmarks[1].artifact, "W-eastfieldnotes-0016");
  assert.ok(isBookmarked(state, newUrl));
  for (const b of state.browser.bookmarks) assert.equal(resolveBrowse(world, b.url, DATE).artifact, b.artifact);
  const saved = state.evidence.find(e => e.artifact === id);
  assert.ok(saved, "evidence survives");
  const g2 = new Game(world, { seed: 1, state });
  const again = g2.open(saved.artifact, saved.version ?? undefined).view;
  assert.equal(again.versionId, opened.versionId);
  assert.equal(again.body, opened.body);
});

test("history: back and forward over a redirect keep the post and its new address", () => {
  const sess = newBrowseSession();
  const [oldUrl, newUrl] = MOVED["W-eastfieldnotes-0016"];
  const r = resolveBrowse(world, oldUrl, DATE);
  sessionPush(sess, { kind: "page", id: r.artifact, url: r.url });
  sessionPush(sess, { kind: "page", id: "W-eastfieldnotes-0018", url: world.artifacts.get("W-eastfieldnotes-0018").url });
  assert.equal(sess.stack.length, 3, "the redirect is one history entry, not two");
  assert.ok(sessionBack(sess));
  assert.deepEqual(sess.stack.at(-1), { kind: "page", id: "W-eastfieldnotes-0016", url: newUrl });
  assert.ok(sessionForward(sess));
  assert.equal(sess.stack.at(-1).id, "W-eastfieldnotes-0018");
  assert.ok(sessionBack(sess) && sessionBack(sess));
  assert.equal(sess.stack.at(-1).kind, "home");
  assert.equal(sessionBack(sess), false);
});

test("Seeker, the blog archive and every page link use the new address; nothing else names the old one", () => {
  const g = started();
  const posts = listedPages(g, "eastfieldnotes", { page: "post" });
  for (const [id, [oldUrl, newUrl]] of Object.entries(MOVED)) {
    assert.equal(posts.find(p => p.id === id)?.url, newUrl, `${id} in the archive`);
    const hits = g.search(newUrl.split("/").pop().replace(/-/g, " ")).results || [];
    for (const h of hits.filter(x => x.artifact === id)) assert.equal(h.url, newUrl);
  }
  const olds = Object.values(MOVED).map(([o]) => o);
  for (const a of world.artifacts.values()) {
    const { urlAliases, ...rest } = a;
    const text = JSON.stringify(rest);
    for (const o of olds) assert.ok(!text.includes(o), `${a.id} still names ${o}`);
  }
});

test("the validator rejects an alias that belongs to another page or another host", async () => {
  const raw = await loadRaw();
  const post = raw.artifacts.find(a => a.id === "W-eastfieldnotes-0016");
  post.urlAliases = [...post.urlAliases, "eastfieldnotes.blog/2019/08/fog-this-morning", "otherblog.example/2021/07/x"];
  const msgs = validateWorld(raw, { reachability: false, knockout: false }).issues.filter(i => i.level === "ERROR").map(i => i.msg);
  assert.ok(msgs.some(m => m.includes("already the address of W-eastfieldnotes-0004")), msgs.join("\n"));
  assert.ok(msgs.some(m => m.includes("on another host")), msgs.join("\n"));
});
