// Tests on the real world: The Quiet Account.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { validateWorld } from "../tools/lib/validate-world.mjs";
import { validateGraphics } from "../tools/lib/graphics.mjs";
import { SCENARIOS } from "../tools/lib/scenarios.mjs";
import { explore } from "../tools/lib/explorer.mjs";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";

const world = await loadWorld();

test("content validates with no errors (including reachability and single points of failure)", async () => {
  const raw = await loadRaw();
  const { issues } = validateWorld(raw, {});
  issues.push(...(await validateGraphics(raw)));
  const bad = issues.filter(i => i.level !== "INFO");
  assert.deepEqual(bad.map(i => `${i.level} ${i.where}: ${i.msg}`), []);
});

for (const sc of SCENARIOS) {
  test(`scenario: ${sc.title}`, () => {
    const g = new Game(world, { seed: 1 });
    sc.run(g);
    for (const [label, ok] of sc.expect(g)) assert.ok(ok, label);
  });
}

test("a cautious automatic player can expose the case through the Daily Record", () => {
  const { game } = explore(world, { mode: "cautious", publishOnDay: 6 });
  assert.ok(game.s.endings.includes("quiet_account:lights_out"));
});

test("no published report ever reveals truth in the casebook view", () => {
  const g = new Game(world, { seed: 1 });
  SCENARIOS.find(s => s.id === "lights_out").run(g);
  const text = JSON.stringify(g.casebook());
  for (const word of ['"truth"', '"strength"', '"claim"', "S2", "S3"]) assert.ok(!text.includes(word), word);
});

test("save in the middle of the case, load, and continue identically", () => {
  const g = new Game(world, { seed: 3, playerName: "Robin" });
  g.start(); g.search("Mara Quinn obituary"); g.open("A11"); g.open("A02"); g.ask("persona_mara", "evt_mara_death"); g.sleep();
  const { state } = deserialize(world, serialize(g.s));
  const a = new Game(world, { state }), b = g;
  for (const x of [a, b]) { x.search("Theo Quinn"); x.open("A06"); x.sleep(); }
  assert.deepEqual(JSON.parse(JSON.stringify(a.s)), JSON.parse(JSON.stringify(b.s)));
  assert.ok(a.view("A45").error == null, "the persona's reply post appeared on day 2");
});

test("replaying the action log reproduces the state exactly", () => {
  const g = new Game(world, { seed: 5 });
  SCENARIOS.find(s => s.id === "who_paid_whom").run(g);
  const r = replay(world, { seed: 5 }, g.s.log);
  assert.deepEqual(r.s, g.s);
});

test("free search: any query works and precise queries are rewarded", () => {
  const g = new Game(world); g.start();
  const ids = q => g.search(q).results.map(r => r.artifact);
  assert.ok(ids("chowder").length > 0, "background content answers everyday queries");
  assert.ok(ids("xylophone quantum").length === 0);
  assert.ok(!ids("persona brief").includes("A22"), "the leaked brief is not found by vague words");
  assert.ok(ids("MARA_Q").includes("A22"), "…but the exact code finds it");
  assert.ok(ids("bl-ops.net").includes("A19"));
  assert.ok(ids("Save the Mill").includes("A15"), "the deleted post is in the cache");
  assert.ok(!ids("Renee Okafor").some(id => !["A10", "A20"].includes(id) && !world.artifacts.get(id).filler),
    "Renee barely exists outside Brightline's own pages");
});

test("notes can be added, edited and deleted; empty notes are refused", () => {
  const g = new Game(world); g.start();
  assert.ok(g.note("   ").error);
  const { id } = g.note("bl-ops.net = Brightline?");
  assert.ok(g.editNote(id, "bl-ops.net is Brightline's portal").ok);
  assert.equal(g.s.notes[0].text, "bl-ops.net is Brightline's portal");
  assert.ok(g.editNote(id, "").error);
  assert.ok(g.deleteNote(id).ok);
  assert.equal(g.s.notes.length, 0);
  assert.ok(g.deleteNote(id).error);
  const r = replay(world, {}, g.s.log);
  assert.deepEqual(r.s.notes, g.s.notes);
});

test("topics and evidence views give names, kinds and sources, never claims", () => {
  const g = new Game(world); g.start();
  g.open("A05");
  const e = g.save({ artifact: "A05" }).id;
  const t = g.topics();
  assert.ok(t.some(x => x.id === "acc_maraquinn" && x.kind === "account"));
  assert.ok(t.some(x => x.id === "mara" && x.kind === "person"));
  assert.ok(!t.some(x => world.entities.get(x.id)?.secret), "secret entities are never topics");
  const about = g.evidenceAbout(e);
  assert.ok(about.about.includes("acc_maraquinn"));
  assert.equal(typeof about.source, "string");
  assert.ok(!JSON.stringify(about).includes("S8"), "no claim ids leak");
});

test("a conversation started from the phone: ask, show saved evidence, get a reply option", () => {
  const g = new Game(world); g.start();
  g.search("Theo Quinn"); g.open("A06");
  assert.ok(g.contacts().includes("theo"));
  assert.equal(g.ask("theo", "calder_mill").error, "unknown_topic", "you can only ask about what you know");
  g.open("A05");                                   // the post mentions the Mill
  assert.equal(g.discovery("calder_mill"), "encountered");
  assert.equal(g.ask("theo", "calder_mill").error, "unknown_topic", "reading a name is not investigating it");
  assert.ok(g.investigate("calder_mill", "Calder Mill").ok);   // tapped in the post
  assert.ok(g.ask("theo", "calder_mill").ok); g.ask("theo", "calder_mill");
  g.searchImage("IMG01"); g.open("A33");
  const ev = g.save({ artifact: "A33" }).id;
  const e = g.s.evidence.find(x => x.id === ev);
  const before = g.thread("theo").length;
  g.show("theo", e.artifact, e.version ?? undefined);
  const th = g.thread("theo");
  assert.ok(th.length > before + 1, "Theo answered");
  assert.ok(th.some(m => m.attach?.includes("A32")), "Theo forwarded his emails");
});

// ── Discovery and knowledge boundaries ─────────────────────────────────────

import { scanText, buildLexicon, suggest } from "../core/refs.js";

const SECRET = [...world.entities.values()].filter(e => e.secret);
const publicName = id => world.entities.get(id)?.name ?? world.accounts.get(id)?.handle;

test("a new game exposes only the starting premise, not the database", () => {
  const g = new Game(world); g.start();
  assert.deepEqual(g.known().sort(), [...world.meta.startKnown].sort());
  assert.ok(g.topics().length <= world.meta.startKnown.length);
  const premise = [...world.characters.values()].filter(c => world.meta.startKnown.includes(c.account)).map(c => c.id);
  assert.deepEqual(g.contacts(), premise, "no contacts beyond the account the case starts with");
  assert.deepEqual(g.s.evidence, []); assert.deepEqual(g.s.notes, []);
});

test("opening an article encounters names but fills no tools", () => {
  const g = new Game(world); g.start();
  const before = new Set(g.known());
  g.open("A11");                                   // obituary: Dana, Theo, Kestrel, Lou…
  assert.deepEqual(new Set(g.known()), before, "topics unchanged");
  for (const id of ["theo", "kestrel", "acc_danareyes"]) assert.equal(g.discovery(id), "encountered", id);
  assert.deepEqual(g.s.evidence, [], "nothing saved without an explicit save");
  assert.ok(!g.contacts().includes("dana"), "a byline is not a contact");
  assert.ok(!suggest(g, "Kes").some(x => /kestrel/i.test(x.text)), "no suggestion for a name only read");
});

test("investigating one person does not reveal related people", () => {
  const g = new Game(world); g.start();
  g.search("Theo Quinn"); g.open("A06");
  assert.equal(g.discovery("theo"), "investigated");
  const k = g.known();
  for (const id of ["owen", "iris", "acc_irisbell", "acc_truthseeker", "brightline", "northgate"]) assert.ok(!k.includes(id), id);
});

test("investigate needs the name to have been met, and never reaches secrets", () => {
  const g = new Game(world); g.start();
  assert.equal(g.investigate("brightline").error, "not_encountered");
  for (const e of SECRET) assert.equal(g.investigate(e.id, e.name).error, "unknown_ref", e.id);
  assert.ok(g.investigate("northgate", "Northgate Development").ok, "the player can act on a name spelled out in front of them");
});

test("typed searches reward guesses, but aliases never tell whose they are", () => {
  const g = new Game(world); g.start();
  g.search("Northgate Development");               // a real guess with results
  assert.equal(g.discovery("northgate"), "investigated");
  g.search("truthseeker_88");                      // a handle: the account, never Owen
  assert.ok(!g.known().includes("owen"), "the alias is not resolved to the person");
  g.search("the old girl");                        // an alias of something not met
  assert.ok(!g.known().includes("calder_mill"));
  g.search("Zebediah Fakename");                   // nothing in the world
  assert.equal(g.known().filter(id => !world.meta.startKnown.includes(id)).every(id => world.entities.has(id) || world.accounts.has(id)), true);
});

test("saving a name marks it saved; the Casebook only holds what was saved", () => {
  const g = new Game(world); g.start();
  g.open("A11");
  const r = g.note("Kestrel Logistics", { artifact: "A11" }, "kestrel");
  assert.ok(r.ok);
  assert.equal(g.discovery("kestrel"), "saved");
  assert.ok(g.topics().some(t => t.id === "kestrel"));
  assert.equal(g.s.evidence.length, 0);
  // An id the text does not name and the player has not met is not attached.
  g.note("hello", undefined, "iris");
  assert.ok(!g.known().includes("iris"));
});

test("the lexicon and the scanner never contain secrets or identity aliases", () => {
  const lex = buildLexicon(world);
  for (const e of SECRET) assert.ok(!lex.some(x => x.id === e.id), e.id);
  assert.ok(!lex.some(x => x.text === "truthseeker_88" && x.type === "person"));
  const spans = scanText(world, "truthseeker_88 wrote to mara.quinn@calder-mail.com about Brightline on Jan 20, 2026 (#44812)");
  assert.deepEqual(spans.map(s => s.type), ["handle", "email", "org", "date", "refnum"]);
  assert.equal(spans[0].id, "acc_truthseeker");
});

test("suggestions only come from earlier searches and investigated names", () => {
  const g = new Game(world); g.start();
  g.open("A11"); g.open("A02");
  for (const q of ["Th", "Da", "Kes", "Iris", "Bright"]) assert.deepEqual(suggest(g, q), [], q);
  g.search("Theo Quinn");
  assert.ok(suggest(g, "Th").some(x => x.text === "Theo Quinn"));
  assert.ok(suggest(g, "").some(x => x.kind === "history"));
});

test("version 1 saves are migrated: mentions become encountered, not known", async () => {
  const { serialize, deserialize } = await import("../core/save.js");
  const g = new Game(world); g.start();
  g.search("Theo Quinn"); g.open("A06"); g.open("A11");
  // Make it look like an old save: everything mentioned was known.
  const old = structuredClone(g.s);
  old.saveVersion = 1; delete old.encountered; delete old.saved;
  for (const id of ["dana", "acc_danareyes", "kestrel", "lou"]) old.known[id] = true;
  const { state } = deserialize(world, serialize(old));
  assert.equal(state.saveVersion, 3);
  assert.deepEqual(state.timeline, [], "old saves get an empty timeline");
  assert.ok(state.known.theo && state.known.acc_theoquinn, "the profile the player opened is still investigated");
  assert.ok(!state.known.kestrel && state.encountered.kestrel != null, "a name only read is now encountered");
});

// ── Timeline ───────────────────────────────────────────────────────────────

test("the timeline starts empty and is only filled by the player", () => {
  const g = new Game(world); g.start();
  assert.deepEqual(g.timeline(), []);
  // Reading, searching, saving and talking never create events.
  g.search("Mara Quinn obituary"); g.open("A11"); g.save({ artifact: "A11" });
  g.search("Theo Quinn"); g.open("A06"); g.ask("theo", "mara");
  g.sleep();
  assert.deepEqual(g.timeline(), []);
});

test("events: exact, approximate, range and unknown dates; wrong and contradictory events are allowed", () => {
  const g = new Game(world); g.start();
  g.open("A11");
  const a = g.addEvent({ title: "Mara dies on Route 9", date: { kind: "exact", value: "2025-07-02", time: "08:15" } });
  const b = g.addEvent({ title: "Mara dies (my guess)", date: { kind: "exact", value: "2024-01-01" } });   // wrong on purpose
  const c = g.addEvent({ title: "Account taken over", date: { kind: "approx", value: "2025-08" } });
  const d = g.addEvent({ title: "Something happened", date: { kind: "range", from: "2025-10-01", to: "2025-09-01" } }); // reversed range kept
  const e = g.addEvent({ title: "Who knows", date: { kind: "unknown" } });
  for (const r of [a, b, c, d, e]) assert.ok(r.ok, JSON.stringify(r));
  assert.equal(g.addEvent({ title: "Bad", date: { kind: "exact", value: "2025-02-30" } }).error, "bad_date");
  assert.equal(g.addEvent({ title: "", date: { kind: "unknown" } }).error, "empty_title");
  assert.deepEqual(g.timeline().map(x => x.title), ["Mara dies (my guess)", "Mara dies on Route 9", "Account taken over", "Something happened", "Who knows"],
    "sorted by the player's dates only, unknown last");
  const r = g.timeline().find(x => x.id === d.id);
  assert.equal(r.date.from, "2025-10-01", "never corrected");
  // Edit everything, then delete.
  assert.ok(g.editEvent(b.id, { title: "Mara dies?", date: { kind: "approx", value: "2025" }, description: "not sure", note: "check" }).ok);
  assert.equal(g.timeline().find(x => x.id === b.id).title, "Mara dies?");
  assert.ok(g.deleteEvent(e.id).ok);
  assert.equal(g.timeline().length, 4);
});

test("events link several pieces of evidence (supporting or contradicting) and theories; links follow removals", () => {
  const g = new Game(world); g.start();
  g.open("A11"); g.open("A02");
  const e1 = g.save({ artifact: "A11" }).id, e2 = g.save({ artifact: "A02" }).id;
  g.investigate("brightline", "Brightline Media");
  const h = g.hypothesize({ subject: "brightline", predicate: "operates", object: "acc_maraquinn" }).id;
  const t = g.addEvent({ title: "Last post by Mara herself", date: { kind: "unknown" }, evidence: [{ id: e1, stance: "supports" }] }).id;
  assert.ok(g.linkEvent(t, e2, "contradicts").ok);
  assert.ok(g.linkEventTheory(t, h).ok);
  let ev = g.timeline()[0];
  assert.equal(ev.supports, 1); assert.equal(ev.contradicts, 1); assert.deepEqual(ev.theories, [h]);
  g.dispatch({ type: "removeEvidence", id: e2 });
  g.dispatch({ type: "deleteHypothesis", id: h });
  ev = g.timeline()[0];
  assert.equal(ev.contradicts, 0); assert.deepEqual(ev.theories, []);
  assert.equal(g.linkEvent(t, "E999", "supports").error, "unknown_evidence");
});

test("events can only name what the player has investigated, and never carry canon", () => {
  const g = new Game(world); g.start();
  g.open("A11");                                   // Kestrel only encountered
  assert.equal(g.addEvent({ title: "x", date: { kind: "unknown" }, about: ["kestrel"] }).error, "unknown_ref");
  for (const s of SECRET) assert.equal(g.addEvent({ title: "x", date: { kind: "unknown" }, about: [s.id] }).error, "unknown_ref");
  g.search("Kestrel Logistics");
  assert.ok(g.addEvent({ title: "Van", date: { kind: "unknown" }, about: ["kestrel"] }).ok);
  const json = JSON.stringify(g.timeline());
  for (const c of world.claims.keys()) assert.ok(!json.includes(`"${c}"`), `claim ${c} leaked`);
  assert.ok(!/truth|correct|canon|claim/i.test(Object.keys(g.timeline()[0]).join(" ")));
});

test("date suggestions come only from what the player can see on the source", () => {
  const g = new Game(world); g.start();
  g.open("A11");
  const c = g.dateCandidates({ artifact: "A11" });
  assert.ok(c.some(x => x.from === "published" && x.date.value === "2025-07-04"));
  // A photo: its metadata time is offered as one choice among others, never chosen for the player.
  g.open("A05");
  const p = g.dateCandidates({ artifact: "A05", image: "IMG01" });
  assert.ok(p.some(x => x.from === "metadata"));
  assert.ok(p.some(x => x.from === "published"));
  // Something not visible gives nothing.
  assert.deepEqual(g.dateCandidates({ artifact: "A24" }), []);
  assert.deepEqual(g.parseDate("Jan 20, 2026").date, { kind: "exact", value: "2026-01-20" });
  assert.deepEqual(g.parseDate("July 2025").date, { kind: "approx", value: "2025-07" });
  assert.equal(g.parseDate("Mar 10", "2026").guessedYear, true);
});

test("timeline actions replay exactly", () => {
  const g = new Game(world, { seed: 3 }); g.start();
  g.open("A11"); const e = g.save({ artifact: "A11" }).id;
  const t = g.addEvent({ title: "A", date: { kind: "exact", value: "2025-07-02" }, evidence: [{ id: e, stance: "supports" }], source: { artifact: "A11" } }).id;
  g.editEvent(t, { note: "n" });
  g.addEvent({ title: "B", date: { kind: "approx", value: "2025" } });
  const r = replay(world, { seed: 3 }, g.s.log);
  assert.deepEqual(r.s.timeline, g.s.timeline);
});
