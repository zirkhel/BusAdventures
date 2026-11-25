// W4 background round 1: new pages, facts file, and Quiet Account guardrails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { listedPages } from "../core/sites.js";

const raw = await loadRaw();
const world = await loadWorld();

const bodyOf = (id, versionId = "v1") => {
  const a = world.artifacts.get(id);
  assert.ok(a, `missing artifact ${id}`);
  const v = a.versions.find(x => x.id === versionId) || a.versions[0];
  return `${a.title}\n${v.title || ""}\n${v.body || ""}`;
};

const textOf = a =>
  [a.title, ...(a.versions || []).map(v => `${v.title || ""}\n${v.body || ""}`)].join("\n");

const siteArts = site => [...world.artifacts.values()].filter(a => a.site === site);
const newOf = site => siteArts(site).filter(a => String(a.id).startsWith(`W-${site}-`));

test("existing Quiet Account page wording, ids and URLs are unchanged", () => {
  const expect = {
    A14: { url: "eastfieldnotes.blog", v1: /a librarian's notes on the old girl and her neighbours/, v2: /growing together/ },
    A15: { url: "eastfieldnotes.blog/2024/04/save-the-mill", v1: /4,100 signatures/ },
    A33: { url: "eastfieldnotes.blog/2025/05/the-old-girl", v1: /138 years and she's still standing/ },
    A34: { url: "eastfieldnotes.blog/2024/06/waterfront", v1: /Why I'm fighting the Waterfront/, v2: /keep listening/ },
    A36: { url: "eastfieldnotes.blog/2024/06/garden", v1: /Plot 12 finally has tomatoes/ },
    A19: { url: "brightlinemedia.co/services", v1: /community engagement/i },
    A20: { url: "brightlinemedia.co/team", v1: /Calvin Marsh/ },
    A21: { url: "brightlinemedia.co/careers/community-writer", v1: /Community Writer/ },
    A42: { url: "brightlinemedia.co/statement", v1: /statement/i },
    A40: { url: "northgatedev.com/waterfront", v1: /1,200 new homes/ },
    A41: { url: "northgatedev.com/news/community-partners", v1: /community partners/i },
    A38: { url: "kestrel-logistics.com/clients", v1: /Who we deliver for|we deliver/i },
    A26: { url: "portcalder.gov/lobbying/2025/northgate", v1: /Lobbying/i },
    A27: { url: "portcalder.gov/business/brightline-media-llc", v1: /Brightline Media/ },
    A28: { url: "portcalder.gov/records/pd-2025-07-0211", v1: /PD-2025-07-0211/ },
    A53: { url: "portcalder.gov/council/ana-ruiz", v1: /Ana Ruiz represents Eastfield/ },
    B16: { url: "portcalder.gov/council/calendar", v1: /Council/i },
    "BG-CITY-01": { url: "portcalder.gov/council/ordinances/26-031", v1: /26-031/ },
  };
  for (const [id, exp] of Object.entries(expect)) {
    const a = world.artifacts.get(id);
    assert.ok(a, id);
    assert.equal(a.url, exp.url, `${id} url`);
    const v1 = a.versions.find(v => v.id === "v1");
    assert.match(`${v1.title || a.title}\n${v1.body}`, exp.v1, `${id} v1`);
    if (exp.v2) {
      const v2 = a.versions.find(v => v.id === "v2");
      assert.ok(v2, `${id} missing v2`);
      assert.match(`${v2.title || a.title}\n${v2.body}`, exp.v2, `${id} v2`);
    }
  }
  assert.equal(world.artifacts.get("A15").live, null);
  assert.equal(world.artifacts.get("A41").hidden, true);
  assert.equal(world.artifacts.get("A42").hidden, true);
});

test("A15, A41 and A42 stay off live listed pages; A42 is off Brightline's public nav", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const posts = listedPages(g, "eastfieldnotes", { page: "post" });
  assert.equal(posts.some(a => a.id === "A15"), false);
  assert.ok(posts.some(a => a.id === "A33"));
  assert.equal(listedPages(g, "northgate").some(a => a.id === "A41"), false);
  assert.equal(listedPages(g, "brightline").some(a => a.id === "A42"), false);
  const nav = world.sites.get("brightline").designs[0].nav.map(n => n.href);
  assert.equal(nav.includes("/statement"), false);
  assert.ok(nav.includes("/careers"));
  assert.equal(nav.includes("/careers/community-writer"), false);
});

test("the last Eastfield Notes post is still A33 on 14 May 2025", () => {
  const posts = siteArts("eastfieldnotes").filter(a => (a.page || a.type) === "post");
  const latest = [...posts].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  assert.equal(latest.id, "A33");
  assert.equal(latest.date.slice(0, 10), "2025-05-14");
  for (const a of newOf("eastfieldnotes")) {
    if ((a.page || a.type) === "post") assert.ok(a.date < "2025-05-14", `${a.id} ${a.date}`);
    assert.equal(a.versions.length, 1, `${a.id} should be unchanged after the takeover`);
    assert.equal(a.author, "acc_eastfieldnotes");
    assert.match(a.source, /mara-blog|blog-cache/);
  }
  assert.ok(world.artifacts.get("W-eastfieldnotes-0001")?.url.endsWith("/about"));
  assert.ok(newOf("eastfieldnotes").filter(a => a.page === "post").length >= 30);
});

test("new Notes posts do not mention Waterfront, Northgate, Brightline or family beyond 'my brother'", () => {
  const banned = /\b(waterfront|northgate|brightline|meridian|glownest|theo|childhood|pclibrary)\b/i;
  for (const a of newOf("eastfieldnotes")) {
    assert.equal(banned.test(textOf(a)), false, a.id);
    const n = (a.comments || []).length;
    assert.ok(n >= 0 && n <= 6, `${a.id} has ${n} comments`);
  }
});

test("Northgate background pages never mention Brightline or Meridian", () => {
  for (const a of newOf("northgate")) {
    assert.equal(/\b(brightline|meridian)\b/i.test(textOf(a)), false, a.id);
  }
  assert.ok(world.artifacts.get("W-northgate-0003"), "Foundry Lofts");
  assert.ok(world.artifacts.get("W-northgate-0004"), "Heights Commons");
  assert.ok(world.artifacts.get("W-northgate-0005"), "Northpoint Landing");
  assert.match(bodyOf("W-northgate-0007"), /Helen March/);
  assert.match(bodyOf("W-northgate-0007"), /Marcus Veld/);
  assert.match(bodyOf("W-northgate-0008"), /net-zero ready/);
  assert.match(bodyOf("W-northgate-0008"), /has not been planted/);
  assert.match(bodyOf("W-northgate-0009"), /by appointment/);
  assert.match(bodyOf("W-northgate-0013"), /weren't afraid of the future/);
  assert.ok(newOf("northgate").length >= 16);
});

test("Kestrel background pages never mention Lou Adair or a fire cause", () => {
  for (const a of newOf("kestrel")) {
    const t = textOf(a);
    assert.equal(/\blou\b/i.test(t), false, a.id);
    assert.equal(/\bfire\b/i.test(t), false, a.id);
  }
  assert.match(bodyOf("W-kestrel-0003"), /two trucks/);
  assert.match(bodyOf("W-kestrel-0003"), /electric-van pilot|electric van pilot/i);
  assert.match(bodyOf("W-kestrel-0011"), /Biscuit/);
  assert.match(bodyOf("W-kestrel-0011"), /asked not to be named/);
  assert.match(bodyOf("W-kestrel-0012"), /Some Eastfield deliveries may arrive a day or two late this week/);
  assert.ok(newOf("kestrel").length >= 12);
});

test("Brightline cases stay anonymous and the new pages live in the mystery pack", () => {
  const pack = world.packOf.get("W-brightline-0001");
  assert.equal(pack, "quiet_account");
  assert.ok(newOf("brightline").length >= 18);
  for (const a of newOf("brightline")) {
    const t = textOf(a);
    assert.equal(/\b(glownest|glow nest)\b/i.test(t), false, a.id);
    // "the client is not named" is the rule; do not introduce a named business as a client.
    assert.equal(/\b(Salty'?s|HarborDesk|Northgate|Eastfield Notes|Kestrel|Calder Credit Union)\b/i.test(t), false, a.id);
  }
  assert.match(bodyOf("W-brightline-0001"), /98\s*% client retention/);
  assert.ok(world.artifacts.get("W-brightline-0010")); // Account Manager
  assert.ok(world.artifacts.get("W-brightline-0014")); // Insights
});

test("City Hall, the mayor and the council roster are on the portal", () => {
  assert.match(bodyOf("W-city-0001"), /40 Civic Center/);
  assert.match(bodyOf("W-city-0032"), /40 Civic Center/);
  assert.match(bodyOf("W-city-0011"), /Denise Harlan/);
  assert.match(bodyOf("W-city-0010"), /eleven voting members|11 voting members/i);
  assert.match(bodyOf("W-city-0004"), /Tuesday/);
  assert.equal(/pclibrary\.org/i.test(bodyOf("W-city-0008")), false);
  assert.match(bodyOf("W-city-0008"), /library's own (website|site)/);
  assert.ok(world.artifacts.get("A53"), "Ana Ruiz page left in place");
  assert.ok(newOf("city").length >= 24);
});

test("background-facts.json is loaded and only uses canon or claim", () => {
  const facts = raw.backgroundFacts || [];
  assert.ok(facts.length >= 20, `expected facts, got ${facts.length}`);
  const ids = new Set();
  for (const f of facts) {
    assert.ok(f.id, "fact without id");
    assert.equal(ids.has(f.id), false, f.id);
    ids.add(f.id);
    assert.ok(world.sites.has(f.introducedBy), f.id);
    assert.ok(["none", "universe"].includes(f.binds), f.id);
    assert.ok(["canon", "claim"].includes(f.status), f.id);
  }
  const byId = Object.fromEntries(facts.map(f => [f.id, f]));
  assert.equal(byId["bf-city-hall-address"].status, "canon");
  assert.match(byId["bf-city-hall-address"].object, /40 Civic Center/);
  assert.equal(byId["bf-bl-retention"].status, "claim");
  assert.equal(byId["bf-ng-pollinator"].status, "claim");
  assert.equal(byId["bf-kestrel-trucks"].object, "2");
});
