// Twin worlds: the permanent regression test against information leaks.
//
// The same visible content is built three times. In the twins only hidden canon differs:
// where things really come from (source), who really runs an account (operatedBy), who is
// human (isHuman), what is true (claims, facts), and hidden mentions of people who are not
// named in the text. A player doing the same things in all three worlds must see exactly
// the same Casebook: evidence, who it is about, where it comes from, theories and their
// counts, the timeline, and what a reviewer (Dana) says and cuts. Only what happens after
// publishing may differ, because that is the world reacting to the truth.
//
// If this test fails, something the player can see depends on canon. Fix the view, never
// the test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { gather } from "../tools/lib/scenarios.mjs";
import { scanText } from "../core/refs.js";
import { archivePair } from "../core/archive.js";

/**
 * Rewrite hidden canon. `src(kind, id)` gives the new hidden source key for each thing.
 * @param {any} w
 * @param {(kind:string, id:string)=>string} src
 */
function twin(w, src) {
  for (const a of w.artifacts.values()) {
    a.source = src("artifact", a.id);
    for (const v of a.versions) v.source = src("version", `${a.id}/${v.id}`);
    // Hidden mentions of people and places that are not named anywhere in the text.
    const text = a.versions.map(v => `${v.title ?? a.title ?? ""} ${v.body ?? a.body ?? ""}`).join(" ");
    const named = new Set(scanText(w, text).map(s => s.id));
    a.mentions = [...new Set([...(a.mentions || []), ...[...w.entities.values()].filter(e => !e.secret && !named.has(e.id)).map(e => e.id)])];
  }
  for (const img of w.images.values()) img.source = src("image", img.id);
  for (const c of w.characters.values()) {
    c.source = src("character", c.id);
    for (const r of c.responses || []) r.source = src("response", `${c.id}/${r.id}`);
  }
  for (const r of w.rules) for (const e of r.do || []) if (e.message) e.message.source = src("rule", r.id);
  const ids = [...w.entities.keys()];
  let i = 0;
  for (const acc of w.accounts.values()) acc.operatedBy = ids[(i++ * 7) % ids.length];
  for (const e of w.entities.values()) if (typeof e.isHuman === "boolean") e.isHuman = !e.isHuman;
  for (const c of w.claims.values()) c.truth = c.truth === "true" ? "false" : "true";
  w.facts.length = 0;
  return w;
}

/** The same player in any world: the brother-and-journalist investigation, then reading and saving everything. */
function play(w) {
  const g = new Game(w, { seed: 7 });
  const r = gather(g);
  for (const a of w.artifacts.values()) {
    if (w.disabled?.has(a.id)) continue;
    g.s.artifacts[a.id] = { ...g.s.artifacts[a.id], visible: true };
    const o = g.open(a.id);
    // W8: deleted pages are reached through their cached copy, which then shows in the Archive.
    if (o.view?.error && o.view.cachedVersions?.length) { const vid = o.view.cachedVersions.at(-1); g.open(a.id, vid); g.save({ artifact: a.id, version: vid }); continue; }
    if (!o.ok || o.view?.locked) continue;
    g.save({ artifact: a.id, version: o.view.versionId });
    for (const im of o.view.images || []) g.save({ artifact: a.id, image: im });
  }
  for (const m of g.s.messages) if (m.from !== "player") g.save({ message: m.id });
  // Theories that link everything, including the three "friends" and both of Owen's accounts.
  for (const id of ["mara", "acc_maraquinn", "calvin", "acc_calvinmarsh", "acc_junopark", "owen"]) g.investigate(id);
  const all = g.s.evidence.map(e => e.id);
  const extra = [
    g.hypothesize({ subject: "mara", predicate: "is_dead" }).id,
    g.hypothesize({ subject: "acc_maraquinn", predicate: "not_real" }).id,
    g.hypothesize({ subject: "calvin", predicate: "not_real" }).id,
    g.hypothesize({ subject: "owen", predicate: "connected_to", object: "mara" }).id,
  ];
  for (const h of extra) for (const e of all) g.link(h, e);
  const t = g.addEvent({ title: "Mara dies", date: { kind: "exact", value: "2025-07-02" },
    evidence: all.slice(0, 6).map((id, k) => ({ id, stance: k % 2 ? "contradicts" : "supports" })) });
  g.linkEventTheory(t.id, extra[0]);
  // Step 2: theories in the player's own words, evidence against, status, alternatives, questions.
  const own = [g.hypothesize({ title: "The obituary was planted" }).id,
    g.hypothesize({ title: "Owen is behind the forum posts", subject: "owen", predicate: "connected_to", object: "mara" }).id];
  all.forEach((e, k) => g.link(own[k % 2], e, true, k % 3 ? "contradicts" : "supports"));
  all.slice(0, 40).forEach(e => g.link(extra[1], e, true, "contradicts"));
  g.setTheoryStatus(own[0], "convinced"); g.setTheoryStatus(extra[2], "rejected");
  g.linkAlternative(own[0], extra[0]); g.linkAlternative(extra[3], own[1]);
  g.visibleSources().forEach((s, k) => g.addQuestion({ text: `Who is behind ${s.label}?`,
    links: { sources: [s.key], evidence: [all[k % all.length]], topics: ["mara", "calvin", "owen"].slice(0, 1 + k % 3), theories: [own[k % 2], extra[k % 4]] } }));
  g.s.questions.forEach((q, k) => g.editQuestion(q.id, { status: ["open", "answered", "dropped"][k % 3], answer: k % 3 === 1 ? "My answer" : "" }));
  // Step 3: connections of every kind between two pieces of evidence, including the three "friends" (one hidden source).
  const kinds = ["supports", "contradicts", "related", "same_origin", "manipulated", "unrelated"];
  for (let i = 0; i + 1 < all.length; i += 2) g.addLink({ a: all[i], b: all[i + 1], kind: kinds[i / 2 % 6], note: i % 4 ? "Because" : "" });
  // Both directions of the directed kinds, and links seen from either end.
  for (let i = 0; i + 1 < all.length; i += 5) g.addLink({ a: all[i + 1], b: all[i], kind: ["supports", "manipulated"][i % 2] });
  g.s.trust.dana = 99;
  return { g, hyps: [r.h2, r.h3, ...extra] };
}

/** Step 3: comparisons of evidence pairs, images, messages, three items, and two copies of the same page. */
function comparisons(g) {
  const ev = g.s.evidence;
  const refs = [];
  for (let i = 0; i + 1 < ev.length; i += 3) refs.push([{ evidence: ev[i].id }, { evidence: ev[i + 1].id }]);
  const imgs = ev.filter(e => e.image), msgs = ev.filter(e => e.message);
  for (let i = 0; i + 1 < imgs.length; i += 2) refs.push([{ evidence: imgs[i].id }, { evidence: imgs[i + 1].id }]);
  for (let i = 0; i < msgs.length; i++) refs.push([{ evidence: msgs[i].id }, { evidence: ev[i * 5 % ev.length].id }]);
  for (let i = 0; i + 2 < ev.length; i += 11) refs.push(ev.slice(i, i + 3).map(e => ({ evidence: e.id })));
  for (const id of Object.keys(g.s.seen)) {
    const v = g.view(id); if (!v?.cachedVersions?.length || v.error) continue;
    for (const ver of v.cachedVersions) refs.push([{ artifact: id, version: ver }, { artifact: id }]);
  }
  for (const m of g.s.messages.filter(m => m.from !== "player").slice(0, 10)) refs.push([{ message: m.id }, { evidence: ev[0].id }]);
  return refs.map(r => g.compare(r));
}

/** W8: Browser's Archive for every page the player has seen, and the comparisons it hands over. */
function archives(g) {
  return Object.keys(g.s.seen).sort().map(id => {
    const ar = g.archive(id);
    const pairs = ar.error ? [] : ar.entries.slice(1).map((_, i) => g.compare(archivePair(ar, i, i + 1)));
    return { id, ar, pairs };
  });
}

/** Everything the player can see in the Casebook, plus the reviewer. */
function snapshot({ g, hyps }) {
  const strip = v => { const { source, supports, mentions, ...rest } = v; return rest; };
  return {
    casebook: g.casebook(),
    evidence: g.s.evidence.map(e => ({ id: e.id, about: g.evidenceAbout(e.id),
      view: e.artifact ? g.view(e.artifact, e.version ?? undefined) : null })),
    timeline: g.timeline(),
    topics: g.topics(),
    sources: g.visibleSources(),
    review: g.review("daily_record", hyps),
    compare: comparisons(g),
    archive: archives(g),
    _hiddenInViews: g.s.evidence.filter(e => e.artifact).map(e => g.view(e.artifact, e.version ?? undefined))
      .filter(v => JSON.stringify(v) !== JSON.stringify(strip(v))).map(v => v.id),
  };
}

test("twin worlds: the Casebook and the reviewer see only what the player can see", async () => {
  const base = play(await loadWorld());
  const merged = play(twin(await loadWorld(), () => "one-source"));
  const split = play(twin(await loadWorld(), (kind, id) => `${kind}:${id}`));
  const a = snapshot(base), b = snapshot(merged), c = snapshot(split);
  assert.deepEqual(a._hiddenInViews, [], "artifact views carry no hidden source, supports or mentions");
  assert.ok(a.evidence.length > 100, "the player saved enough to make the comparison meaningful");
  assert.ok(a.casebook.links.length > 300 && a.casebook.links.some(l => l.directed) && a.compare.length > 250 && a.compare.some(c => c.samePage && c.changes?.text.some(x => x.op !== "same")), "step 3 links and comparisons are part of the comparison");
  assert.ok(a.archive.filter(x => x.ar.canCompare).length >= 12 && a.archive.some(x => x.ar.status === "deleted"), "W8 Archive views are part of the comparison");
  assert.deepEqual(a.archive.flatMap(x => x.pairs).filter(c => c.error || c.items.some(i => i.error)), [], "every Archive pair compares");
  assert.deepEqual(a.compare.filter(c => c.error || c.items.some(x => x.error)), [], "every comparison in the twin test is valid");
  assert.ok(a.compare.every(c => c.items.every(x => !("supports" in x) && !("mentions" in x) && !("source" in x && typeof x.source !== "string"))), "comparison items carry no hidden fields");
  assert.ok(a.casebook.questions.length > 20 && a.casebook.hypotheses.some(h => h.againstCount > 0 && !h.structured), "step 2 views are part of the comparison");
  assert.deepEqual(b, a, "a world where everything has one hidden source looks the same");
  assert.deepEqual(c, a, "a world where everything has its own hidden source looks the same");
});

test("twin worlds: the editor cuts the same claims; only the consequences differ", async () => {
  const cutIn = async w => {
    const p = play(w);
    const r = p.g.publish("daily_record", p.hyps);
    return { cut: r.ok ? r.report.cut : null, refused: !!r.refused, lines: r.lines ?? null };
  };
  const base = await cutIn(await loadWorld());
  assert.deepEqual(await cutIn(twin(await loadWorld(), () => "one-source")), base);
  assert.deepEqual(await cutIn(twin(await loadWorld(), (kind, id) => `${kind}:${id}`)), base);
});

test("sources are counted as they look: three persona accounts are three sources", async () => {
  const w = await loadWorld();
  const g = new Game(w, { seed: 1 }); g.start();
  const ids = ["A54", "A55", "A56"];   // Mike, Pat, Lindsay: one hidden source in canon
  assert.equal(new Set(ids.map(id => w.artifacts.get(id).source)).size, 1, "fixture: they share a hidden source");
  for (const id of ids) { g.s.artifacts[id] = { visible: true }; g.open(id); }
  const ev = ids.map(id => g.save({ artifact: id }).id);
  g.investigate("mara");
  const h = g.hypothesize({ subject: "mara", predicate: "is_dead" }).id;
  ev.forEach(e => g.link(h, e));
  const v = g.casebook().hypotheses.find(x => x.id === h);
  assert.deepEqual([v.evidenceCount, v.sourceCount], [3, 3]);
  assert.deepEqual(ev.map(e => g.evidenceAbout(e).sourceLabel), ids.map(id => w.accounts.get(w.artifacts.get(id).author).displayName));
});

test("the presentation layer and provenance never touch canon helpers", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const files = ["core/provenance.js", "core/workbench.js", "core/compare.js", "core/archive.js", ...(await readdir(join(root, "app"))).filter(f => f.endsWith(".js")).map(f => `app/${f}`),
    ...(await readdir(join(root, "app/apps"))).filter(f => f.endsWith(".js")).map(f => `app/apps/${f}`)];
  const banned = /\b(supportOf|truthOf|matchClaim|evidenceFacts|supportsOf|operatedBy|isHuman)\b|\.(claims|facts)\b|import[^;]*\bsourceOf\b/;
  for (const f of files) {
    const code = (await readFile(join(root, f), "utf8")).split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    assert.doesNotMatch(code, banned, `${f} reads hidden canon`);
  }
  // The Casebook views live next to scoring in core/casebook.js: each view function must stay clean.
  const cb = await readFile(join(root, "core/casebook.js"), "utf8");
  const views = ["evidenceAbout", "hypothesisLabel", "theoryLabel", "counts", "visibleSources", "casebookView", "alternativesOf", "isStructured",
    "createHypothesis", "updateHypothesis", "deleteHypothesis", "linkEvidence", "setTheoryStatus", "linkAlternative"];
  for (const name of views) {
    const start = cb.search(new RegExp(`^(export )?function ${name}\\b`, "m"));
    assert.ok(start >= 0, `core/casebook.js has ${name}`);
    const body = cb.slice(start, cb.indexOf("\n}\n", start) + 2);
    assert.doesNotMatch(body.replace(/\/\/.*$/gm, ""), /\b(supportOf|apparentSupportOf|truthOf|matchClaim|evidenceFacts|supportsOf|mentionsOf|sourceOf|operatedBy|isHuman)\b|\.(claims|facts)\b|\.source\b/, `${name} reads hidden canon`);
  }
});


test("twin worlds: saved copies, excerpts and player judgments remain identical", async () => {
  const workbench = w => {
    const { g } = play(w);
    for (const [i, e] of [...g.s.evidence].entries()) {
      g.editEvidence(e.id, { opened: true, reviewed: i % 2 === 0, important: i % 3 === 0,
        doubtful: i % 4 === 0, shelf: i % 5 === 0 ? "irrelevant" : null, note: "My interpretation" });
      if (e.artifact && !e.image) {
        const v = g.evidenceView(e.id);
        if (v.body) g.save({ artifact: e.artifact, version: e.version, quote: { text: v.body.slice(0, 40) } });
      }
    }
    return { evidence: g.s.evidence, copies: g.s.evidence.filter(e => e.artifact).map(e => g.evidenceView(e.id)), casebook: g.casebook() };
  };
  const base = workbench(await loadWorld());
  assert.deepEqual(workbench(twin(await loadWorld(), () => "one-source")), base);
  assert.deepEqual(workbench(twin(await loadWorld(), (kind, id) => `${kind}:${id}`)), base);
});
