// W6: Legacy, Personal, remaining Landing templates, background sites, cached designs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { resolveBrowse } from "../core/browser.js";
import { officialSitesForQuery } from "../core/sites.js";
import { search } from "../core/search.js";
import { viewArtifact } from "../core/artifacts.js";
import { canRenderSite } from "../app/sites/index.js";

const world = await loadWorld();
const raw = await loadRaw();

const textOf = a =>
  [a.title, ...(a.versions || []).map(v => `${v.title || ""}\n${v.body || ""}\n${JSON.stringify(v.blocks || [])}`)].join("\n");

const ofSite = site => [...world.artifacts.values()].filter(a => a.site === site || (a.url && a.url.split("/")[0] === world.sites.get(site)?.domain));
const prefix = site => `W-${site === "corp_registries" ? "corpregistries" : site}-`;
const preexisting = new Set(["W-harbordental-0001", "W-caldertransit-0001"]);
const laterThanW6 = new Set(["W-harbordesk-0003", "W-harbordesk-0004"]);
const newOf = site => ofSite(site).filter(a => String(a.id).startsWith(prefix(site)) && !preexisting.has(a.id) && !laterThanW6.has(a.id));

test("existing Quiet Account wording, ids and thin-site homes are unchanged", () => {
  const expect = {
    B18: { url: "harbordesk.co", v1: /prestigious address at 18 Harbor Street from \$29\/month/ },
    B19: { url: "saltys-portcalder.com", v1: /Open daily 11–21\. Cod, haddock, and the famous harbor chowder\. We did NOT change the oil in 2019\./ },
    B20: { url: "eastfieldgarden.org", v1: /42 plots, a tool shed and too many zucchini/ },
    B23: { url: "aiwriterpro.app", v1: /Schedule 30 days of authentic-sounding posts in 30 seconds/ },
    "W-harbordental-0001": { url: "harbordental.com", v1: /Harbor Dental\.\n\nBook online\./ },
    "W-caldertransit-0001": { url: "caldertransit.gov", v1: /Calder Transit\.\n\nService information for Port Calder\./ },
    A63: { url: "openfilings.org/meridian-holdings-ltd", v1: /Meridian Holdings Ltd\. Jurisdiction: undisclosed/ },
  };
  for (const [id, exp] of Object.entries(expect)) {
    const a = world.artifacts.get(id);
    assert.ok(a, id);
    assert.equal(a.url, exp.url, `${id} url`);
    const v1 = a.versions.find(v => v.id === "v1") || a.versions[0];
    assert.match(`${v1.title || a.title}\n${v1.body}`, exp.v1, `${id} v1`);
  }
});

test("W6 templates render legacy, personal, landing, library, transit and new background sites", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const phone = { g };
  for (const id of [
    "B19", "W-saltys-0001",
    "B20", "W-eastfieldgarden-0001", "W-walts-0001", "W-walts-0002",
    "B18", "W-harbordesk-0001", "B23", "W-aiwriterpro-0001", "W-harbordental-0003",
    "W-caldertransit-0003", "W-pclibrary-0001", "W-calderpower-0001", "W-caldercu-0001",
    "W-harborpa-0001", "W-corpregistries-0001", "A63", "W-kestrel-0001",
  ]) {
    assert.equal(canRenderSite(phone, viewArtifact(g, id)), true, id);
  }
});

test("W6 added a bounded set of new pages, without padding", () => {
  const counts = {
    saltys: 3, harbordesk: 2, eastfieldgarden: 3, aiwriterpro: 2,
    harbordental: 5, caldertransit: 6, corp_registries: 1,
    pclibrary: 8, calderpower: 6, caldercu: 5, walts: 5, harborpa: 1, portcalderjazz: 3,
  };
  let total = 0;
  for (const [site, n] of Object.entries(counts)) {
    const got = newOf(site).length;
    assert.equal(got, n, `${site} ${got}`);
    total += got;
  }
  assert.equal(total, 50);
  assert.ok(total >= 40 && total <= 80);
});

test("the lighthouse of existing pages and hidden records stay put", () => {
  assert.equal(world.artifacts.get("DS-UF-02").hidden, true);
  assert.equal(world.artifacts.get("A41")?.hidden ?? true, true);
  const kestrelHome = world.artifacts.get("W-kestrel-0001");
  const live = kestrelHome.versions.find(v => v.id === "v1");
  assert.match(live.body, /One hundred and forty vans are on the road every day/);
  const old = kestrelHome.versions.find(v => v.id === "v2014");
  assert.ok(old);
  assert.match(old.body, /since 1998/);
  assert.equal(/140|Dock Road|same-day/i.test(old.body), false);
  assert.equal(kestrelHome.live, "v1");
});

test("library staff: 2024 cache lists Mara and Priya; the live page does not add facts about Mara", () => {
  const staff = world.artifacts.get("W-pclibrary-0008");
  assert.ok(staff);
  assert.equal(staff.url, "pclibrary.org/staff");
  assert.equal(staff.live, "v2");
  const v1 = staff.versions.find(v => v.id === "v1");
  const v2 = staff.versions.find(v => v.id === "v2");
  assert.match(v1.body, /Mara Quinn/);
  assert.match(v1.body, /Priya Shah/);
  assert.match(v2.body, /Priya Shah/);
  assert.equal(/Mara Quinn/.test(v2.body), false);
  assert.equal(/@|born|died|Route 9|bicycle|Theo/i.test(textOf(staff)), false);
  const g = new Game(world, { seed: 1 });
  g.start();
  const live = viewArtifact(g, "W-pclibrary-0008");
  assert.equal(/Mara Quinn/.test(`${live.title}\n${live.body || ""}`), false);
  assert.match(`${live.title}\n${live.body || ""}`, /Priya Shah/);
});

test("portcalderjazz.com is parked live, with a 2019 cached site", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const day = "2026-03-09";
  const live = resolveBrowse(world, "portcalderjazz.com", day);
  assert.equal(live.kind, "parked");
  const pages = ofSite("portcalderjazz");
  assert.equal(pages.length, 3);
  for (const a of pages) {
    assert.equal(a.live == null, true, a.id);
    assert.ok(a.date < "2022-01-01", a.id);
  }
  assert.match(textOf(world.artifacts.get("W-portcalderjazz-0001")), /Thursday nights at the Anchor/);
  assert.match(textOf(world.artifacts.get("W-portcalderjazz-0001")), /Lou Benn/);
});

test("corp-registries.example was renamed to openfilings.org, and old searches, addresses and records still work", () => {
  const site = world.sites.get("corp_registries");
  assert.equal(site.domain, "openfilings.org");
  assert.ok(site.domains.includes("corp-registries.example"));
  const a63 = world.artifacts.get("A63");
  assert.equal(a63.url, "openfilings.org/meridian-holdings-ltd");
  assert.match(a63.versions[0].body, /Subsidiaries known: 212/);
  const day = "2026-03-09";
  for (const addr of [
    "openfilings.org/meridian-holdings-ltd",
    "corp-registries.example/meridian-holdings-ltd",
    "https://corp-registries.example/meridian-holdings-ltd",
  ]) {
    const r = resolveBrowse(world, addr, day);
    assert.equal(r.kind, "page", addr);
    assert.equal(r.artifact, "A63", addr);
  }
  const homeOld = resolveBrowse(world, "corp-registries.example", day);
  assert.equal(homeOld.kind, "page");
  assert.equal(homeOld.artifact, "W-corpregistries-0001");
  const g = new Game(world, { seed: 1 });
  g.start();
  const byOld = search(g, "corp-registries.example");
  assert.ok(byOld.length, "old domain is searchable");
  assert.equal(byOld[0].official, true);
  assert.equal(byOld[0].site, "corp_registries");
  const byName = search(g, "Meridian Holdings");
  assert.ok(byName.some(r => r.artifact === "A63"));
  const nav = (site.designs[0].nav || []).map(n => n.href).join(" ");
  assert.equal(/meridian/i.test(nav), false);
});

test("Seeker still ranks a named official site first, including new W6 sites", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const cases = [
    ["pclibrary.org", "pclibrary.org", "pclibrary"],
    ["Port Calder Public Library", "pclibrary.org", "pclibrary"],
    ["Calder Power", "calderpower.com", "calderpower"],
    ["calderpower.com", "calderpower.com", "calderpower"],
    ["Calder Credit Union", "caldercu.com", "caldercu"],
    ["Harbor Dental", "harbordental.com", "harbordental"],
    ["HarborDesk", "harbordesk.co", "harbordesk"],
    ["openfilings.org", "openfilings.org", "corp_registries"],
    ["Walt Brennan", "waltbrennan.calderweb.net", "walts"],
  ];
  for (const [q, url, site] of cases) {
    const r = search(g, q)[0];
    assert.ok(r, q);
    assert.equal(r.official, true, q);
    assert.equal(r.site, site, q);
    assert.equal(r.url === url || r.url.startsWith(url), true, `${q} → ${r.url}`);
  }
  assert.deepEqual(officialSitesForQuery(world, "library"), []);
});

test("W6 pages do not use evidence photographs or spoil Quiet Account clues", () => {
  const power = ofSite("calderpower");
  for (const a of power) {
    assert.equal((a.images || []).includes("NIMG0004"), false, a.id);
    assert.equal(/NIMG0004/.test(textOf(a)), false, a.id);
  }
  const dental = textOf(world.artifacts.get("W-harbordental-0001")) + ofSite("harbordental").map(textOf).join("\n");
  assert.equal(/Brightline/i.test(ofSite("harbordental").filter(a => String(a.id).startsWith("W-harbordental-000") && a.id !== "W-harbordental-0001").map(textOf).join("\n")), false);
  const home = textOf(world.artifacts.get("W-corpregistries-0001"));
  assert.equal(/Meridian/i.test(home), false);
  for (const a of newOf("caldertransit")) {
    assert.equal(/brake response|DS-UF-02|Lou Adair/i.test(textOf(a)), false, a.id);
  }
});

test("background facts record the W6 library, power, credit union and festival notes", () => {
  const facts = raw.backgroundFacts || [];
  const ids = new Set(facts.map(f => f.id));
  for (const id of ["bf-library-hours-cut", "bf-library-ereaders", "bf-power-outage-2026-02-17", "bf-cu-since-1952", "bf-walter-brennan"]) {
    assert.ok(ids.has(id), id);
  }
});
