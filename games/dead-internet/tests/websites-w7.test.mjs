import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { search } from "../core/search.js";

const world = await loadWorld();
const raw = await loadRaw();

const NEW_PAGES = [
  "W-harbordesk-0003", "W-harbordesk-0004",
  "W-havenmutual-0001", "W-havenmutual-0002", "W-havenmutual-0003",
  "W-quayledger-0001", "W-quayledger-0002",
  "W-northlamp-0001", "W-northlamp-0002",
  "W-brightline-0020",
  "W-garden-0001", "W-garden-0002",
];

const HIDDEN_ORGS = new Set(["brightline", "meridian"]);

test("existing Quiet Account wording, ids and thin-site homes are unchanged", () => {
  const w = world;
  const a20 = w.artifacts.get("A20");
  assert.equal(a20.url, "brightlinemedia.co/team");
  const live = a20.versions.find(v => v.id === (a20.live || "v1"));
  assert.match(live.body, /Calvin has spent fifteen years helping brands find their voice/);
  assert.match(live.body, /our amazing community team/);
  assert.doesNotMatch(live.body, /Samira Holt/);
  const b18 = w.artifacts.get("B18");
  assert.match(b18.versions[0].body, /Get a prestigious address at 18 Harbor Street from \$29\/month/);
  const a31 = w.artifacts.get("A31");
  assert.equal(a31.url, "facelessstock.com/portrait/44812");
  assert.match(a31.versions[0].body, /Purchased 37 times/);
});

test("W7 added a bounded set of new pages, without padding", () => {
  const w = world;
  for (const id of NEW_PAGES) assert.ok(w.artifacts.has(id), id);
  assert.equal(NEW_PAGES.length, 12);
});

test("Brightline's 2024 team cache lists three community leads who are gone today", () => {
  const w = world;
  const a20 = w.artifacts.get("A20");
  assert.equal(a20.live, "v1");
  const v2024 = a20.versions.find(v => v.id === "v2024");
  assert.ok(v2024);
  assert.match(v2024.body, /Samira Holt/);
  assert.match(v2024.body, /Jonah Ellison/);
  assert.match(v2024.body, /Tamsin Roe/);
  const live = a20.versions.find(v => v.id === "v1");
  assert.doesNotMatch(live.body, /Samira Holt|Jonah Ellison|Tamsin Roe/);
});

test("Calvin claims fifteen years, Brightline has no cache before 2023, and Kestrel has a 2014 cache", () => {
  const w = world;
  const a20 = w.artifacts.get("A20");
  assert.match(a20.versions.find(v => v.id === "v1").body, /fifteen years/);
  for (const a of w.artifacts.values()) {
    if (a.site !== "brightline") continue;
    for (const v of a.versions || []) {
      const d = v.date || a.date;
      if (d) assert.ok(d >= "2023-01-01", `${a.id} ${v.id} is dated ${d}`);
    }
  }
  const site = [...w.sites.values()].find(s => s.id === "brightline");
  for (const d of site.designs) assert.ok(d.from >= "2023-01-01", `design ${d.id} from ${d.from}`);
  const k = w.artifacts.get("W-kestrel-0001");
  assert.ok(k.versions.some(v => v.id === "v2014" && (v.date || "").startsWith("2014")));
});

test("image search on a HarborDesk stock portrait finds Faceless #44812 and other independent uses", () => {
  const w = world;
  const g = new Game(w, { seed: 1, playerName: "Tester" });
  g.start();
  const opened = g.open("W-harbordesk-0003");
  assert.ok(opened.ok, "testimonials page opens");
  const r = g.searchImage("IMG06A");
  const ids = (r.results || []).map(x => x.artifact);
  assert.ok(ids.includes("A31"), `Faceless #44812 missing, got ${ids.join(",")}`);
  assert.ok(ids.includes("W-havenmutual-0001"), `Haven Mutual missing, got ${ids.join(",")}`);
  assert.ok(ids.includes("A09"), `Calvin profile missing, got ${ids.join(",")}`);
  const independent = ids.filter(id => w.artifacts.get(id)?.site !== "brightline" && id !== "A09");
  assert.ok(independent.includes("A31") && independent.includes("W-havenmutual-0001"));
  // IMG01 / IMG02 behaviour is unchanged: the cropped mill photo still leads to the Notes original.
  g.open("A05");
  const mill = g.searchImage("IMG01");
  const millIds = (mill.results || []).map(x => x.artifact);
  assert.ok(millIds.includes("A33"), `IMG01 should still find A33, got ${millIds.join(",")}`);
});

test("Theme: Lumen by Pixelfold appears on independent sites as well as Brightline and Harbor Dental", () => {
  const footers = new Map();
  for (const s of raw.sites || []) {
    const live = (s.designs || [])[s.designs.length - 1];
    const text = typeof live?.footer === "string" ? live.footer : live?.footer?.text || "";
    if (/Lumen by Pixelfold/i.test(text)) footers.set(s.id, text);
  }
  assert.ok(footers.has("harbordental"), "Harbor Dental");
  assert.ok(footers.has("brightline"), "Brightline");
  assert.ok(footers.has("aiwriterpro"), "AIWriterPro");
  assert.ok(footers.has("havenmutual"), "Haven Mutual");
  assert.ok(footers.has("northlamp"), "North Lamp");
  const hidden = [...footers.keys()].filter(id => {
    const s = (raw.sites || []).find(x => x.id === id);
    return HIDDEN_ORGS.has(s?.org);
  });
  assert.ok(footers.size - hidden.length >= 3, "Lumen must appear on several independent sites");
});

test("no template or variant is used only by sites that belong to the same hidden actor", () => {
  const w = world;
  const groups = new Map();
  for (const s of w.sites.values()) {
    const d = (s.designs || [])[s.designs.length - 1];
    if (!d?.template) continue;
    const key = `${d.template}/${d.variant || ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  for (const [key, list] of groups) {
    const hidden = list.filter(s => HIDDEN_ORGS.has(s.org));
    assert.ok(
      hidden.length === 0 || hidden.length < list.length,
      `${key} is used only by hidden-actor sites (${hidden.map(s => s.id).join(", ")})`
    );
  }
});

test("Seeker still ranks a named official site first, including new W7 sites", () => {
  const w = world;
  const g = new Game(w, { seed: 1, playerName: "Tester" });
  g.start();
  const cases = [
    ["Haven Mutual", "havenmutual.com", "havenmutual"],
    ["Quay Ledger", "quayledger.com", "quayledger"],
    ["North Lamp Studio", "northlamp.studio", "northlamp"],
    ["HarborDesk", "harbordesk.co", "harbordesk"],
  ];
  for (const [q, url, site] of cases) {
    const r = search(g, q)[0];
    assert.ok(r, q);
    assert.equal(r.official, true, q);
    assert.equal(r.site, site, q);
    assert.equal(r.url === url || r.url.startsWith(url), true, `${q} → ${r.url}`);
  }
});

test("the same phrasing appears in Brightline Insights, two Garden personas, and Eastfield Notes v2", () => {
  const w = world;
  const phrase = /keep listening[\s\S]*change can be scary|change can be scary[\s\S]*keep listening/i;
  const insights = w.artifacts.get("W-brightline-0020");
  assert.match(insights.versions[0].body, phrase);
  const juno = w.artifacts.get("W-garden-0001");
  const mike = w.artifacts.get("W-garden-0002");
  assert.match(juno.versions[0].body, phrase);
  assert.match(mike.versions[0].body, phrase);
  const a34 = w.artifacts.get("A34");
  const v2 = a34.versions.find(v => v.id === "v2");
  assert.match(v2.body, phrase);
});

test("18 Harbor Street is used by Brightline and four innocent firms", () => {
  const w = world;
  const who = w.artifacts.get("W-harbordesk-0004");
  for (const name of ["Quay Ledger", "Amber Fern Tutoring", "North Lamp Studio", "Gull Wing Surveys"]) {
    assert.match(who.versions[0].body, new RegExp(name));
  }
  assert.match(who.versions[0].body, /18 Harbor Street/);
  assert.doesNotMatch(who.versions[0].body, /Brightline/);
  const bl = w.artifacts.get("W-brightline-0001");
  assert.match(bl.versions[0].body, /Suite 400, 18 Harbor Street/);
  assert.match(w.artifacts.get("W-quayledger-0001").versions[0].body, /Suite 110, 18 Harbor Street/);
  assert.match(w.artifacts.get("W-northlamp-0001").versions[0].body, /Suite 210, 18 Harbor Street/);
});

test("background facts record the W7 address, tenants and 2024 community leads as canon", () => {
  const byId = new Map((raw.backgroundFacts || []).map(f => [f.id, f]));
  for (const id of ["bf-harbordesk-tenants", "bf-havenmutual-office", "bf-bl-community-leads-2024"]) {
    const f = byId.get(id);
    assert.ok(f, id);
    assert.equal(f.status, "canon", id);
  }
});
