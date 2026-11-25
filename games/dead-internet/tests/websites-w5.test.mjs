// W5: Wiki, Forum, Document, Anonymous templates and site content.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { listedPages, pathOf } from "../core/sites.js";
import { viewArtifact } from "../core/artifacts.js";
import { canRenderSite } from "../app/sites/index.js";

const world = await loadWorld();

const bodyOf = id => {
  const a = world.artifacts.get(id);
  assert.ok(a, `missing artifact ${id}`);
  const v = a.versions[0];
  return `${a.title}\n${v.title || ""}\n${v.body || ""}`;
};

const textOf = a =>
  [a.title, ...(a.versions || []).map(v => `${v.title || ""}\n${v.body || ""}`)].join("\n");

const ofSite = site => [...world.artifacts.values()].filter(a => a.site === site || (a.url && a.url.split("/")[0] === world.sites.get(site)?.domain));
const newOf = site => ofSite(site).filter(a => String(a.id).startsWith(`W-${site === "facelessstock" ? "faceless" : site}-`));

test("existing Quiet Account wording, ids and URLs on W5 sites are unchanged", () => {
  const expect = {
    A16: { url: "threadline.net/t/port-calder/who-is-posting-as-mara-quinn", v1: /truthseeker_88 \(OP\): Mara Quinn died July 2/ },
    A17: { url: "threadline.net/t/port-calder/who-is-posting-as-mara-quinn?page=4", v1: /theo_q: I'm her brother/ },
    A18: { url: "docshare.link/d/owen-dossier-mara", v1: /Lou Adair bowls with a Northgate site engineer/ },
    A22: { url: "docshare.link/d/7Hq2-persona-brief", v1: /Persona: MARA_Q/ },
    A30: { url: "spillcheck.io/?q=mara.quinn@calder-mail.com", v1: /this address was found in 1 breach/ },
    A31: { url: "facelessstock.com/portrait/44812", v1: /Synthetic portrait #44812/ },
    A31B: { url: "facelessstock.com/portrait/51007", v1: /Synthetic portrait #51007/ },
    B17: { url: "calderpedia.org/Port_Calder", v1: /coastal city of about 210,000 people/ },
    A66: { url: "calderpedia.org/Calder_Mill", v1: /Calder Mill \(1887–2009\) was a textile mill/ },
    A62: { url: "threadline.net/t/port-calder/5g-in-the-mill", v1: /5G towers hidden in the Mill chimney|pigeons/i },
    B13: { url: "threadline.net/t/port-calder/best-fish-and-chips", v1: /harbor_hank: Salty's/ },
    B14: { url: "threadline.net/t/port-calder/lights-over-harbor", v1: /three lights, triangle/ },
    B15: { url: "threadline.net/t/port-calder/bus-drivers", v1: /Appreciation thread for the 14 bus drivers|Bernie on the 14/ },
    B24: { url: "threadline.net/t/tech/dead-internet-theory", v1: /the theory says most of the internet is bots/ },
    "BG-THR-01": { url: "threadline.net/t/port-calder/waterfront-parking", v1: /1,200 homes and 400 parking spaces/ },
    "BG-THR-02": { url: "threadline.net/t/port-calder/anyone-used-brightline", v1: /4thstreetbakes: they did our logo/ },
    "DS-UF-01": { url: "docshare.link/uf/harbor-memo-n4", v1: /pylon N-4/ },
  };
  for (const [id, exp] of Object.entries(expect)) {
    const a = world.artifacts.get(id);
    assert.ok(a, id);
    assert.equal(a.url, exp.url, `${id} url`);
    const v1 = a.versions.find(v => v.id === "v1") || a.versions[0];
    assert.match(`${v1.title || a.title}\n${v1.body}`, exp.v1, `${id} v1`);
  }
  assert.equal(world.artifacts.get("DS-UF-02").hidden, true);
  assert.equal(world.artifacts.get("A30").index, "exact");
});

test("W5 templates render wiki, forum, document and anonymous pages, including existing ones", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const phone = { g };
  for (const id of ["B17", "A66", "W-calderpedia-0001", "A16", "A17", "W-threadline-0001", "A18", "A22", "W-docshare-0001", "A30", "W-spillcheck-0001", "W-faceless-0001", "A31"]) {
    assert.equal(canRenderSite(phone, viewArtifact(g, id)), true, id);
  }
});

test("Calderpedia has a main page, about 25 articles, history and talk tools", () => {
  const arts = ofSite("calderpedia").filter(a => (a.page || a.type) === "article");
  assert.ok(arts.length >= 24 && arts.length <= 28, `article count ${arts.length}`);
  assert.ok(world.artifacts.get("W-calderpedia-0001"));
  assert.equal(world.artifacts.get("W-calderpedia-0001").url, "calderpedia.org");
  const hist = ofSite("calderpedia").filter(a => a.page === "history");
  const talk = ofSite("calderpedia").filter(a => a.page === "talk");
  assert.equal(hist.length, 5);
  assert.equal(talk.length, 3);
  const talkText = talk.map(textOf).join("\n");
  assert.match(talkText, /Is the chowder claim sourced/i);
  const titles = arts.map(a => a.url).join("\n");
  for (const slug of ["Eastfield", "Northpoint", "Old_Town", "The_Heights", "Port_Calder_lighthouse", "Harbor_Festival", "Calder_Creek", "Route_14", "The_Daily_Record", "Saltys_Fish_Bar", "Calder_Credit_Union", "Denise_Harlan", "Kestrel_Logistics", "Chowder_competitions", "Dead_internet_theory"]) {
    assert.match(titles, new RegExp(slug), slug);
  }
});

test("new Calderpedia pages do not use IMG02, name Lou, or invent a library domain", () => {
  for (const a of newOf("calderpedia")) {
    const t = textOf(a) + JSON.stringify(a.images || []);
    assert.equal(/IMG02\b/.test(t), false, a.id);
    assert.equal(/\bLou\b/.test(t), false, a.id);
    assert.equal(/pclibrary\.org/.test(t), false, a.id);
  }
  const kestrel = [...world.artifacts.values()].find(a => a.url === "calderpedia.org/Kestrel_Logistics");
  assert.ok(kestrel);
  assert.equal(/\bLou\b/.test(textOf(kestrel)), false);
});

test("Threadline has an index, five boards, new threads in the existing body format, and profiles", () => {
  assert.equal(world.artifacts.get("W-threadline-0001").url, "threadline.net");
  const boards = newOf("threadline").filter(a => a.page === "board");
  assert.equal(boards.length, 5);
  const hrefs = boards.map(a => a.url).sort();
  assert.deepEqual(hrefs, [
    "threadline.net/r/fishing",
    "threadline.net/r/gaming",
    "threadline.net/r/port-calder",
    "threadline.net/r/tech",
    "threadline.net/r/transit",
  ]);
  const threads = newOf("threadline").filter(a => a.page === "thread");
  assert.ok(threads.length >= 10 && threads.length <= 15, `new threads ${threads.length}`);
  for (const t of threads) {
    assert.match(t.versions[0].body, /^[\w.\-]{2,30}( \(OP\))?: /m, t.id);
  }
  assert.ok(threads.some(t => /6:10 ferry captain/i.test(t.title) || /6:10 ferry captain/i.test(t.versions[0].body)));
  const profiles = newOf("threadline").filter(a => a.page === "profile");
  assert.ok(profiles.length >= 5);
  const g = new Game(world, { seed: 1 });
  g.start();
  const listed = listedPages(g, "threadline").filter(t => (t.page === "thread" || t.type === "thread") && !/\?page=/.test(t.url || ""));
  assert.ok(listed.some(t => t.id === "A16"));
  assert.equal(listed.some(t => t.id === "A17"), false);
});

test("Docshare home lists only new public filler documents, not evidence or leaks", () => {
  const home = textOf(world.artifacts.get("W-docshare-0001"));
  for (const needle of ["owen-dossier", "7Hq2", "MARA_Q", "harbor-memo-n4", "route14-maintenance", "A18", "A22", "DS-UF"]) {
    assert.equal(home.includes(needle), false, needle);
  }
  assert.match(home, /share a file|send a link/i);
  const docs = newOf("docshare").filter(a => a.page === "document");
  const expired = newOf("docshare").filter(a => a.page === "expired");
  assert.ok(docs.length >= 4);
  assert.equal(expired.length, 3);
  const g = new Game(world, { seed: 1 });
  g.start();
  // Home body plus official nav should not name evidence URLs.
  const nav = world.sites.get("docshare").designs[0].nav.map(n => n.href).join(" ");
  assert.equal(/owen-dossier|7Hq2|uf\//.test(nav), false);
});

test("SpillCheck is not a leak portal and does not feature Mara's lookup on the home or nav", () => {
  const home = textOf(world.artifacts.get("W-spillcheck-0001"));
  const nav = world.sites.get("spillcheck").designs[0].nav.map(n => `${n.label} ${n.href}`).join("\n");
  assert.match(home, /not a leak portal/i);
  assert.equal(/mara\.quinn@calder-mail\.com/i.test(home + "\n" + nav), false);
  assert.equal(/\?q=/.test(nav), false);
  const breaches = textOf(world.artifacts.get("W-spillcheck-0002"));
  assert.match(breaches, /Eastfield Neighbors forum — February 2023/);
  assert.match(breaches, /HarborFit — March 2021/);
  assert.match(breaches, /Slice of Calder/);
  assert.match(breaches, /CalderLearn/);
  const items = breaches.split("\n").filter(l => / — /.test(l));
  assert.ok(items.length >= 20 && items.length <= 30, `breach rows ${items.length}`);
  assert.ok(world.artifacts.get("W-spillcheck-0004"));
  assert.match(textOf(world.artifacts.get("W-spillcheck-0004")), /not a leak portal/i);
});

test("Faceless Stock has a marketing landing, and the library is behind a login", () => {
  assert.equal(world.artifacts.get("W-faceless-0001").url, "facelessstock.com");
  const home = textOf(world.artifacts.get("W-faceless-0001"));
  assert.match(home, /portrait\/44812/);
  assert.match(home, /portrait\/51007/);
  for (const path of ["/pricing", "/license", "/how-it-works", "/gallery"]) {
    assert.ok([...ofSite("facelessstock")].some(a => pathOf(a.url) === path), path);
  }
  const gal = [...world.artifacts.values()].find(a => a.url === "facelessstock.com/gallery");
  assert.ok(gal);
  assert.equal(gal.access, undefined);
  assert.match(textOf(gal), /Sign in to browse the full catalogue/i);
  assert.equal(/IMG\d|WEB00/.test(JSON.stringify(gal.images || [])), false);
  const g = new Game(world, { seed: 1 });
  g.start();
  const wall = viewArtifact(g, gal.id);
  assert.equal(wall.locked, undefined);
  assert.equal(wall.error, undefined);
  assert.match(wall.body || wall.title || "", /Sign in/i);
  const sample = viewArtifact(g, "A31");
  assert.equal(sample.locked, undefined);
  assert.match(sample.body || sample.title || "", /44812/);
});

const raw = await loadRaw();

test("background facts record the W5 lighthouse, festival and breach dates", () => {
  const facts = raw.backgroundFacts || [];
  const ids = new Set(facts.map(f => f.id));
  for (const id of ["bf-lighthouse-automated", "bf-samuel-okoro", "bf-festival-volunteers-1979", "bf-breach-harborfit", "bf-breach-slice", "bf-breach-calderlearn"]) {
    assert.ok(ids.has(id), id);
  }
  const light = textOf([...world.artifacts.values()].find(a => a.url === "calderpedia.org/Port_Calder_lighthouse"));
  assert.match(light, /automated in 1998/);
  assert.match(light, /Samuel Okoro/);
});

test("playtest: early official searches still include background pages", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  for (const q of ["Brightline", "Northgate", "Waterfront"]) {
    const ids = [];
    for (const r of g.search(q).results) {
      if (!ids.includes(r.artifact)) ids.push(r.artifact);
      if (ids.length === 10) break;
    }
    const bg = ids.filter(id => {
      const a = world.artifacts.get(id);
      return a && (a.pool === "background-qa" || /^(B\d|DR-|UF-)/.test(id) || String(id).startsWith("BG-") || String(id).startsWith("W-"));
    });
    assert.ok(bg.length >= 3, `${q} background in first 10: ${ids.join(",")} (bg ${bg.join(",")})`);
  }
});
