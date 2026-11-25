// Engine tests on a tiny made-up world, so they test the engine and not the story.
//   node --test games/dead-internet/tests/

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWorld } from "../core/world.js";
import { Game, replay } from "../core/game.js";
import { tokenize } from "../core/search.js";
import { serialize, deserialize, saveTo, loadFrom } from "../core/save.js";
import { validateWorld } from "../tools/lib/validate-world.mjs";

function miniRaw() {
  return {
    meta: {
      id: "mini", contentVersion: "1", startDay: 1, startDate: "2030-01-01", credibilityStart: 50,
      startKnown: ["ann", "acc_ann"], logins: [{ site: "vault", user: "u", pass: "p" }],
      publishing: { scoring: { true_strong: 8, true_weak: 3, true_none: -2, partial: -3, false: -10 },
        channels: [{ id: "paper", reviewer: "ed", minTrust: 1, requiresStrong: true }, { id: "blog" }] },
      testing: { seedQueries: ["Ann"], coreClaims: ["C1"], maxDays: 3 },
    },
    strings: { messages: { ask: "About {name}?", show: "See {title}" },
      review: { ed: { noTrust: "Who?", strong: "Solid: {claim}", weak: "Thin: {claim}", none: "Nothing: {claim}", bold: "Bold: {claim}" } } },
    predicates: [
      { id: "is_dead", arity: 1, label: "is dead", template: "{subject} is dead", subjectKinds: ["person"], truth: "facts" },
      { id: "operates", arity: 2, label: "operates", template: "{subject} operates {object}", subjectKinds: ["person", "org"], objectKinds: ["account"], truth: "operatedBy" },
      { id: "not_real", arity: 1, label: "is not real", template: "{subject} is not real", subjectKinds: ["person", "account"], truth: "notHuman" },
    ],
    platforms: [{ id: "web", name: "Web" }, { id: "social", name: "Social" }],
    entities: [
      { id: "ann", kind: "person", name: "Ann Lee", isHuman: true, died: "2029-06-01" },
      { id: "ed", kind: "person", name: "Ed", isHuman: true },
      { id: "corp", kind: "org", name: "Corp", aliases: ["CorpCo"] },
      { id: "bot", kind: "person", name: "Bot Person", isHuman: false },
    ],
    accounts: [
      { id: "acc_ann", platform: "social", handle: "@ann", displayName: "Ann Lee", claimsToBe: "ann", operatedBy: "corp", created: "2020-01-01",
        history: [{ by: "ann", until: "2029-06-01" }] },
      { id: "acc_ed", platform: "social", handle: "@ed", displayName: "Ed", claimsToBe: "ed", operatedBy: "ed", created: "2020-01-01" },
    ],
    images: [
      { id: "I1", kind: "photo", source: "ann-blog", meta: null },
      { id: "I2", kind: "photo", derivedFrom: "I1", transforms: ["mirror"], source: "fake", supports: ["C2"], meta: null },
    ],
    artifacts: [
      { id: "P1", type: "profile", platform: "social", author: "acc_ann", title: "Ann Lee (@ann)", date: "2029-12-01", source: "acc", mentions: ["ann"],
        versions: [{ id: "v1", body: "Hello from Ann" }] },
      { id: "N1", type: "article", platform: "web", url: "news.example/ann-lee", title: "Ann Lee has died", date: "2029-06-02", source: "news", mentions: ["ann"], supports: ["C1"],
        versions: [{ id: "v1", body: "Local woman Ann Lee died on Tuesday." }] },
      { id: "N2", type: "record", platform: "web", url: "registry.example/42", title: "Death record 42", date: "2029-06-10", source: "registry", index: "weak", supports: ["C1"], mentions: ["ann"],
        versions: [{ id: "v1", body: "Record of death for Ann Lee, case 42." }] },
      { id: "X1", type: "document", platform: "web", title: "Secret plan", date: "2029-09-01", source: "leak", index: "exact", keywords: ["PLAN-7"], supports: ["C2"],
        versions: [{ id: "v1", body: "Corp runs the account." }] },
      { id: "D1", type: "page", platform: "web", title: "Old page", date: "2029-01-01", source: "ann-blog", live: null, supports: ["C2"],
        versions: [{ id: "v1", cached: true, body: "Ann's original words about the harbour." }] },
      { id: "E1", type: "page", platform: "web", title: "Edited page", date: "2029-01-01", source: "ann-blog",
        versions: [{ id: "v1", cached: true, body: "We must fight the towers." }, { id: "v2", body: "Let's keep listening about the towers." }] },
      { id: "G1", type: "post", platform: "social", author: "acc_ann", title: "Ann's photo", date: "2029-12-02", source: "acc", images: ["I2"], versions: [{ id: "v1", body: "Morning!" }] },
      { id: "G0", type: "post", platform: "web", title: "Original photo", date: "2028-05-01", source: "ann-blog", images: ["I1"], versions: [{ id: "v1", body: "Sunrise" }] },
      { id: "H1", type: "document", platform: "web", title: "Hidden memo", date: "2029-09-01", source: "ed", hidden: true, index: "none", supports: ["C2"], versions: [{ id: "v1", body: "memo" }] },
      { id: "L1", type: "page", platform: "web", title: "Vault contents", lockedTitle: "Vault sign in", loginSite: "vault", access: { loggedIn: "vault" }, date: "2029-09-01", source: "vault",
        versions: [{ id: "v1", body: "the vault" }] },
    ],
    characters: [
      { id: "ed", entity: "ed", account: "acc_ed", kind: "person", source: "ed", trust: { start: 0, min: -5, max: 5 }, knows: ["C1", "C2"], has: ["H1"],
        contactIf: { seen: "N1" },
        responses: [
          { id: "hello", on: { any: true }, once: true, text: "Hi." },
          { id: "ann", on: { ask: "ann" }, text: "Ann died.", supports: ["C1"], effects: [{ trust: { id: "ed", delta: 1 } }] },
          { id: "memo", on: { showSupports: "C1" }, once: true, if: { trustGte: { id: "ed", n: 1 } }, text: "Take this.", attach: ["H1"] },
        ],
        fallback: { any: [{ text: "Hm." }] } },
    ],
    canon: {
      claims: [
        { id: "C1", truth: "true", match: [{ subject: "ann", predicate: "is_dead" }] },
        { id: "C2", truth: "true", match: [{ subject: "corp", predicate: "operates", object: "acc_ann" }] },
        { id: "F1", truth: "false", match: [{ subject: "ed", predicate: "operates", object: "acc_ann" }] },
      ],
      facts: [{ subject: "ann", predicate: "is_dead" }],
    },
    rules: [
      { id: "day2", when: { event: "day.start", match: { day: 2 } }, do: [{ setFlag: "d2" }] },
      { id: "searchPlan", when: { event: "search", match: { terms: "towers" } }, do: [{ incCounter: { id: "towers" } }] },
      { id: "again", when: { event: "search", match: { terms: "again" } }, once: false, do: [{ incCounter: { id: "again" } }] },
      { id: "later", when: { event: "message.send", match: { to: "ed" } }, do: [{ later: { days: 1, do: [{ setLive: { artifact: "E1", version: null } }] } }] },
    ],
    mysteries: [{ id: "m", title: "M", claims: ["C1", "C2", "F1"], endings: [
      { id: "exposed", if: { exposed: "C1" }, effects: [{ setFlag: "end_exposed" }] },
      { id: "wrong", if: { published: "F1" }, effects: [{ setFlag: "end_wrong" }] },
    ] }],
  };
}

const newGame = (opts) => { const g = new Game(buildWorld(miniRaw()), opts); g.start(); return g; };
const ids = r => r.results.map(x => x.artifact + (x.cached ? `@${x.versionId}` : ""));

test("tokenize keeps compound tokens and their parts", () => {
  const t = tokenize("Mail careers@bl-ops.net about MARA_Q's posts");
  for (const x of ["careers@bl-ops.net", "bl-ops.net", "bl", "ops", "net", "mara_q", "mara", "posts", "post"]) assert.ok(t.has(x), x);
});

test("search: full, weak, exact and cached levels", () => {
  const g = newGame();
  assert.ok(ids(g.search("Ann Lee")).includes("N1"));
  assert.ok(!ids(g.search("Ann")).includes("N2"), "weak needs every word of a 2+ word query");
  assert.ok(ids(g.search("death record")).includes("N2"));
  assert.ok(!ids(g.search("secret plan")).includes("X1"), "exact needs the keyword");
  assert.ok(ids(g.search("PLAN-7")).includes("X1"));
  assert.ok(!ids(g.search("harbour towers")).includes("D1@v1"), "a cached copy needs every query word to match");
  assert.ok(ids(g.search("original words harbour")).includes("D1@v1"));
  assert.ok(ids(g.search("fight the towers")).includes("E1@v1"), "old version of an edited page is in the cache");
  assert.ok(!ids(g.search("hidden memo")).includes("H1"));
  assert.deepEqual(g.search("vault").results.map(r => [r.artifact, r.locked]), [["L1", true]]);
  assert.deepEqual(g.search("   ").results, []);
});

test("versions, deletion and cache", () => {
  const g = newGame();
  assert.equal(g.view("E1").versionId, "v2");
  assert.deepEqual(g.view("E1").cachedVersions, ["v1"]);
  assert.equal(g.view("D1").error, "deleted");
  assert.equal(g.open("D1", "v1").view.body, "Ann's original words about the harbour.");
  assert.equal(g.view("X1", "nope").error, "not_available");
});

test("image search finds mirrored copies only with flip", () => {
  const g = newGame();
  g.open("G0");
  assert.equal(g.searchImage("I2").error, "not_seen");
  assert.deepEqual(g.searchImage("I1").results, []);
  assert.deepEqual(g.searchImage("I1", true).results.map(r => r.artifact), ["G1"]);
});

test("dialogue: contact gating, once, conditions, attachments, trust", () => {
  const g = newGame();
  assert.equal(g.ask("ed", "ann").error, "cannot_contact");
  g.open("N1");
  assert.equal(g.ask("ed", "corp").error, "unknown_topic");
  assert.equal(g.ask("ed", "ann").reply.text, "Hi.");
  assert.equal(g.ask("ed", "ann").reply.text, "Ann died.");
  assert.equal(g.s.trust.ed, 1);
  assert.equal(g.show("ed", "N1").reply.text, "Take this.");
  assert.equal(g.view("H1").error, undefined, "attachment became visible");
  assert.equal(g.show("ed", "N1").reply.text, "Hm.", "once-only response falls back");
  assert.equal(g.show("ed", "X1").error, "not_seen");
});

test("rules: once, once:false, later and day start", () => {
  const g = newGame();
  g.search("towers"); g.search("towers"); g.search("again"); g.search("again");
  assert.equal(g.s.counters.towers, 1);
  assert.equal(g.s.counters.again, 2);
  g.open("N1"); g.ask("ed", "ann");
  assert.equal(g.view("E1").versionId, "v2");
  g.sleep();
  assert.equal(g.s.flags.d2, true);
  assert.equal(g.view("E1").error, "deleted", "the scheduled edit ran the next day");
});

test("login and locked artifacts", () => {
  const g = newGame();
  assert.equal(g.open("L1").view.locked, true);
  assert.equal(g.login("vault", "u", "wrong").error, "login_failed");
  assert.equal(g.login("vault", "U", "p").ok, true);
  assert.equal(g.open("L1").view.body, "the vault");
});

test("casebook shows counts only; truth and support are used when publishing", () => {
  const g = newGame();
  g.open("N1"); g.search("death record"); g.open("N2"); g.open("P1");
  const e1 = g.save({ artifact: "N1" }).id, e2 = g.save({ artifact: "N2" }).id, e3 = g.save({ artifact: "P1" }).id;
  assert.equal(g.save({ artifact: "N1" }).duplicate, true);
  const h = g.hypothesize({ subject: "ann", predicate: "is_dead", evidence: [e1, e3] }).id;
  const view = g.casebook().hypotheses[0];
  assert.deepEqual([view.evidenceCount, view.sourceCount, view.label], [2, 2, "Ann Lee is dead"]);
  assert.equal("truth" in view, false);
  assert.equal(g.hypothesize({ subject: "corp", predicate: "is_dead" }).error, "unknown_subject");
  assert.equal(g.hypothesize({ subject: "ann", predicate: "operates", object: "ann" }).error, "bad_object");
  assert.equal(g.hypothesize({ subject: "acc_ann", predicate: "is_dead" }).error, "bad_subject");

  // Reviewer needs trust and comments on sources, not truth
  assert.equal(g.review("paper", [h]).lines[0].text, "Who?");
  g.s.trust.ed = 1;
  assert.match(g.review("paper", [h]).lines[0].text, /^Thin/);   // P1 does not back C1: one source
  g.link(h, e2);
  assert.match(g.review("paper", [h]).lines[0].text, /^Solid/);

  const r = g.publish("paper", [h]);
  assert.ok(r.ok);
  assert.equal(g.s.exposed.C1.strength, "strong");
  assert.equal(g.s.credibility, 58);
  assert.ok(g.s.endings.includes("m:exposed"));
});

test("publishing: weak claims are cut by a strict channel, false claims cost credibility", () => {
  const g = newGame();
  g.s.trust.ed = 1;
  g.open("N1");
  const e = g.save({ artifact: "N1" }).id;
  g.s.known.ed = true;
  const weak = g.hypothesize({ subject: "ann", predicate: "is_dead", evidence: [e] }).id;
  assert.equal(g.publish("paper", [weak]).refused, true);
  const wrong = g.hypothesize({ subject: "ed", predicate: "operates", object: "acc_ann" }).id;
  g.publish("blog", [wrong]);
  assert.equal(g.s.credibility, 40);
  assert.ok("F1" in g.s.published);
  assert.ok(g.s.endings.includes("m:wrong"));
});

test("truth rules derived from the world model", async () => {
  const { truthOf } = await import("../core/casebook.js");
  const g = newGame();
  const t = (subject, predicate, object = null) => truthOf(g, { subject, predicate, object });
  assert.equal(t("corp", "operates", "acc_ann"), "true");
  assert.equal(t("ed", "operates", "acc_ed"), "true");
  assert.equal(t("acc_ann", "not_real"), "true", "an account run by someone else is a fake persona");
  assert.equal(t("acc_ed", "not_real"), "false");
  assert.equal(t("bot", "not_real"), "true");
  assert.equal(t("ed", "is_dead"), "false");
});

test("save, load and replay are exact", () => {
  const w = buildWorld(miniRaw());
  const g = new Game(w, { seed: 7, playerName: "Kim" }); g.start();
  g.search("Ann Lee"); g.open("N1"); g.ask("ed", "ann"); g.save({ artifact: "N1" }); g.sleep();
  const again = replay(w, { seed: 7, playerName: "Kim" }, g.s.log);
  assert.deepEqual(again.s, g.s);
  const store = new Map(); const storage = { setItem: (k, v) => store.set(k, v), getItem: k => store.get(k) ?? null, removeItem: k => store.delete(k) };
  assert.ok(saveTo(storage, w, g.s));
  const { state } = loadFrom(storage, w);
  assert.deepEqual(state, JSON.parse(JSON.stringify(g.s)));
  const g2 = new Game(w, { state }); g2.search("towers");
  assert.equal(g2.s.counters.towers, 1);
});

test("loading a save drops references to content that no longer exists", () => {
  const raw = miniRaw();
  const g = new Game(buildWorld(raw)); g.start();
  g.open("N1"); g.save({ artifact: "N1" });
  const text = serialize(g.s);
  raw.artifacts = raw.artifacts.filter(a => a.id !== "N1");
  raw.characters[0].contactIf = null;
  const { state, warnings } = deserialize(buildWorld(raw), text);
  assert.equal(state.evidence.length, 0);
  assert.ok(warnings.some(w => w.includes("N1")));
  assert.throws(() => deserialize(buildWorld(raw), JSON.stringify({ format: "other" })));
});

test("player name defaults to the world default and has no other effect", () => {
  const w = buildWorld({ ...miniRaw(), meta: { ...miniRaw().meta, player: { defaultName: "Sam" } } });
  assert.equal(new Game(w).s.playerName, "Sam");
  assert.equal(new Game(w, { playerName: "  " }).s.playerName, "Sam");
  assert.equal(new Game(w, { playerName: "Alex" }).s.playerName, "Alex");
});

test("validator catches broken references, timelines and blockers", () => {
  const raw = miniRaw();
  raw.accounts[0].history = [{ by: "ann", until: "2029-09-01" }];   // the record says Ann kept posting after she died
  raw.artifacts.push({ id: "BAD", type: "post", platform: "social", author: "acc_ann", title: "x", date: "2029-08-01", source: "acc",
    versions: [{ id: "v1", body: "posted while dormant?" }], supports: ["NOPE"], mentions: ["ghost"] });
  raw.artifacts.push({ id: "BAD2", type: "post", platform: "social", author: "acc_ann", title: "y", date: "2029-05-01", source: "acc",
    versions: [{ id: "v1", body: "fine, Ann was alive" }] });
  raw.characters[0].responses.push({ id: "leak", on: { ask: "corp" }, text: "x", attach: ["X1"], supports: ["F1"] });
  const { issues } = validateWorld(raw, { reachability: false });
  const errors = issues.filter(i => i.level === "ERROR").map(i => `${i.where}: ${i.msg}`);
  assert.ok(errors.some(e => e.includes("BAD") && e.includes("unknown claim NOPE")));
  assert.ok(errors.some(e => e.includes("BAD") && e.includes("mentions unknown ghost")));
  assert.ok(errors.some(e => e.includes("BAD") && e.includes("Ann Lee, who died")), errors.join("\n"));
  assert.ok(!errors.some(e => e.includes("BAD2")));
  assert.ok(errors.some(e => e.includes("attaches X1, which ed does not have")));
  assert.ok(errors.some(e => e.includes("supports F1, which ed neither knows")));
});

test("validator: a single source that blocks a core claim is an error", () => {
  const raw = miniRaw();
  // Only N1 and N2 support C1; remove N2 so N1 is a single point of failure.
  raw.artifacts = raw.artifacts.filter(a => a.id !== "N2");
  const { issues } = validateWorld(raw, {});
  const errors = issues.filter(i => i.level === "ERROR");
  assert.ok(errors.some(i => i.where === "blocking N1" && i.msg.includes("C1")), errors.map(i => i.where + " " + i.msg).join("\n"));
});
