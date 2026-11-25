// Point 9 (Anders, 25.11.2026): names in evidence count only when they are visibly established for
// the player. Hidden `mentions`, secret entities and people the player has never visibly met never
// decide a name. Casebook "About" shows the same names, and only names in the item itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { namesIn, visibleRefsOfArtifact, apparentSource } from "../core/provenance.js";

async function game() {
  const w = await loadWorld();
  const g = new Game(w, { seed: 7 });
  g.start();
  g.s.loggedIn ??= {}; g.s.loggedIn.brightline_portal = true;
  return { w, g };
}
const save = (g, a) => { g.s.artifacts[a] = { ...g.s.artifacts[a], visible: true }; const o = g.open(a); g.save({ artifact: a, version: o.view?.versionId }); return g.s.evidence.at(-1).id; };
const fresh = w => { delete w._names; delete w._lexicon; delete w._handles; };

test("full names, handles and unambiguous short forms count; a loose 'Pat' in text is not read as the account", async () => {
  const { g } = await game();
  assert.deepEqual([...namesIn(g, "Mara Quinn and @maraquinn")].sort(), ["acc_maraquinn", "mara"]);
  assert.ok(namesIn(g, "Brightline said so").has("brightline"));
  assert.ok(namesIn(g, "down at the Mill").has("calder_mill"));
  assert.equal(namesIn(g, "Pat said so").size, 0, "Pat stays ambiguous");
  assert.ok(namesIn(g, "posted by @harborwalkerpat").has("acc_pat"));
});

test("hidden mentions never decide a name", async () => {
  const { w, g } = await game();
  const id = save(g, "A17");
  const before = g.evidenceAbout(id).about;
  for (const a of w.artifacts.values()) for (const v of a.versions) v.mentions = [];
  assert.deepEqual(g.evidenceAbout(id).about, before);
  for (const a of w.artifacts.values()) for (const v of a.versions) v.mentions = [...w.entities.keys()];
  assert.deepEqual(g.evidenceAbout(id).about, before);
});

test("'M. Quinn' is Mara unless another visible candidate fits; hidden people never decide", async () => {
  const { w, g } = await game();
  g.s.known.mara = true;
  assert.ok(namesIn(g, "rider M. Quinn, pronounced dead").has("mara"));
  // A secret person, and one the player has never visibly met, with the same initials: no effect.
  w.entities.set("zz_secret", { id: "zz_secret", kind: "person", name: "Mona Quinn", secret: true });
  w.entities.set("zz_unmet", { id: "zz_unmet", kind: "person", name: "Milo Quinn" });
  fresh(w);
  assert.ok(namesIn(g, "rider M. Quinn, pronounced dead").has("mara"));
  // Once Milo Quinn is a visible candidate (a topic the player investigated), the form is ambiguous.
  g.s.known.zz_unmet = true;
  assert.ok(!namesIn(g, "rider M. Quinn, pronounced dead").has("mara"));
  assert.ok(!namesIn(g, "rider M. Quinn, pronounced dead").has("zz_unmet"));
});

test("an event is named by its name or a form of it, case-insensitively", async () => {
  const { g } = await game();
  g.s.known.mara = true;
  for (const t of ["Stop using Mara's death for clicks.", "I have mara's death certificate", "Mara Quinn's death", "the death of M. Quinn"])
    assert.ok(namesIn(g, t).has("evt_mara_death"), t);
  assert.ok(!namesIn(g, "my sister's death").has("evt_mara_death"));
});

test("a nickname counts once a saved piece introduces it, with a visible explanation; set aside keeps it, removal drops it", async () => {
  const { g } = await game();
  const dash = save(g, "A23");
  assert.ok(!g.evidenceAbout(dash).about.includes("northgate"), "NGD alone names nobody");
  g.investigate("northgate");
  const portal = save(g, "A24");
  const about = g.evidenceAbout(dash);
  assert.ok(about.about.includes("northgate"));
  assert.deepEqual(about.aliases, [{ text: "NGD", id: "northgate", name: "Northgate Development", evidence: portal }]);
  assert.ok(g.editEvidence(portal, { shelf: "finished" }).ok, "set aside");
  assert.ok(g.evidenceAbout(dash).about.includes("northgate"), "set aside keeps the basis");
  g.dispatch({ type: "removeEvidence", id: portal });
  assert.ok(!g.evidenceAbout(dash).about.includes("northgate"), "removal drops it");
  assert.deepEqual(g.evidenceAbout(dash).aliases, []);
});

test("a published report stays as it was when the evidence that introduced a nickname is removed later", async () => {
  const { g } = await game();
  g.s.trust.dana = 99;
  for (const id of ["mara", "northgate", "acc_maraquinn"]) g.s.known[id] = true;
  const notice = save(g, "A11"), report = save(g, "A28");
  const dash = save(g, "A23"), portal = save(g, "A24");
  const dead = g.hypothesize({ subject: "mara", predicate: "is_dead", evidence: [notice, report] }).id;
  const linked = g.hypothesize({ subject: "northgate", predicate: "connected_to", object: "acc_maraquinn", evidence: [dash] }).id;
  const r = g.publish("daily_record", [dead, linked]);
  assert.ok(r.ok, JSON.stringify(r));
  assert.deepEqual(r.report.cut, [linked], "one visible origin: cut");
  const before = structuredClone(g.casebook().reports.at(-1));
  g.dispatch({ type: "removeEvidence", id: portal });
  assert.ok(!g.evidenceAbout(dash).about.includes("northgate"));
  assert.deepEqual(g.casebook().reports.at(-1), before);
});

test("'About' shows only names in the item itself, never names borrowed through a Supports link", async () => {
  const { g } = await game();
  for (const id of ["brightline", "acc_maraquinn"]) g.s.known[id] = true;
  const emails = save(g, "A32"), brief = save(g, "A22");
  const before = g.evidenceAbout(emails).about;
  assert.ok(!before.includes("brightline"));
  g.addLink({ a: emails, b: brief, kind: "supports" });
  assert.deepEqual(g.evidenceAbout(emails).about, before);
  const h = g.hypothesize({ subject: "brightline", predicate: "operates", object: "acc_maraquinn", evidence: [emails, brief] }).id;
  assert.deepEqual(g.evidenceAbout(emails).about, before);
  assert.ok(g.casebook().hypotheses.find(x => x.id === h), "theory exists");
});

test("only Supports links let a piece borrow names, one hop, supporting piece only", async () => {
  const { g } = await game();
  const { apparentSupportOf } = await import("../core/casebook.js");
  for (const id of ["brightline", "acc_maraquinn"]) g.s.known[id] = true;
  const services = save(g, "A19"), post = save(g, "A47"), emails = save(g, "A32");
  const h = () => g.s.hypotheses.find(x => x.id === hid);
  const hid = g.hypothesize({ subject: "brightline", predicate: "operates", object: "acc_maraquinn", evidence: [services, post, emails] }).id;
  assert.equal(apparentSupportOf(g, h()).n, 0, "no piece covers both");
  for (const kind of ["related", "same_origin", "manipulated", "contradicts", "unrelated"]) g.addLink({ a: services, b: post, kind });
  assert.equal(apparentSupportOf(g, h()).n, 0, "other kinds never count");
  g.addLink({ a: services, b: post, kind: "supports" });
  assert.deepEqual(apparentSupportOf(g, h()).counted, [services], "the supporting piece borrows; the supported gains nothing");
  g.addLink({ a: emails, b: services, kind: "supports" });
  assert.ok(!apparentSupportOf(g, h()).counted.includes(emails), "one hop: what services borrowed is not passed on");
  g.addLink({ a: post, b: services, kind: "supports" });
  assert.equal(apparentSupportOf(g, h()).n, 2, "mutual links: two different visible origins");
});

// Anders 25.11.2026: sender identity and a mention in the text are different things. A post visibly
// posted by @harborwalkerpat (display name "Pat") keeps that account as its visible origin and
// names the account (never the person). A loose first name in running text is not read as it.
test("sender identity is kept: posts by Pat, Mike and Lindsay, and Tom's comment, name their account", async () => {
  const { g } = await game();
  for (const [art, acc, person] of [["A55", "acc_pat", "pat_p"], ["A54", "acc_mike", null], ["W-garden-0002", "acc_mike", null], ["A56", "acc_lindsay", null]]) {
    assert.equal(g.w.artifacts.get(art).author, acc, art);
    assert.equal(apparentSource(g, { artifact: art }).key, `account:${acc}`, `${art}: the account is the visible origin`);
    const refs = visibleRefsOfArtifact(g, art);
    assert.ok(refs.includes(acc), `${art} names ${acc} through its visible sender`);
    if (person) assert.ok(!refs.includes(person), `${art} names the account, not the person`);
  }
  // A comment visibly posted by @tidepool_tom (display name "Tom") names that account too.
  assert.ok(visibleRefsOfArtifact(g, "DR-2025-0101").includes("acc_drc_tidepool_tom"));
  // In a Casebook item the sender counts toward Dana's coverage of the account.
  const e = save(g, "A55");
  g.investigate("acc_pat");
  assert.ok(g.evidenceAbout(e).about.includes("acc_pat"));
  assert.equal(g.evidenceAbout(e).source, "account:acc_pat");
});

test("a loose first name in another item's text is not read as an account or person", async () => {
  const { g } = await game();
  for (const name of ["Pat", "Mike", "Lindsay", "Tom"].flatMap(name => [name, name.toLowerCase(), name.toUpperCase()])) {
    const ids = namesIn(g, `I talked to ${name} yesterday. ${name} said it was fine.`);
    for (const id of ["acc_pat", "pat_p", "acc_mike", "acc_lindsay", "acc_drc_tidepool_tom"]) assert.ok(!ids.has(id), `${name} in text is not ${id}`);
  }
  // Tom in a council page is not the commenter @tidepool_tom.
  assert.ok(!visibleRefsOfArtifact(g, "W-city-0010").includes("acc_drc_tidepool_tom"));
  // The handles still name the accounts.
  for (const [h, acc] of [["@harborwalkerpat", "acc_pat"], ["@eastfield_dad_mike", "acc_mike"], ["@lindsay.on.4th", "acc_lindsay"], ["@tidepool_tom", "acc_drc_tidepool_tom"]])
    assert.ok(namesIn(g, `posted by ${h}`).has(acc), h);
});
