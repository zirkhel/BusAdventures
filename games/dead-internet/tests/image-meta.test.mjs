// Fictional EXIF ("Image info"): every image has a metadata decision, and no photo is taken
// after the page that first shows it. The WEB decisions are listed in graphics/GRAPHICS.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { validateWorld } from "../tools/lib/validate-world.mjs";

const world = await loadWorld();
const webIds = [...world.images.keys()].filter(id => /^WEB\d{4}$/.test(id)).sort();

// WEB images that keep fictional EXIF. Everything else from WEB0001–WEB0038 is stripped (meta: null).
const EXIF = {
  WEB0001: "Orrin D7", WEB0002: "Orrin D7", WEB0003: "Orrin D7", WEB0004: "Orrin D7",
  WEB0009: "Orrin S20", WEB0034: "Orrin S5",
  WEB0013: "Lumen 6", WEB0014: "Lumen 6", WEB0015: "Lumen 6", WEB0020: "Lumen 6",
  WEB0016: "Lumen 5", WEB0017: "Lumen 5", WEB0018: "Lumen 5", WEB0019: "Lumen 5", WEB0037: "Lumen 5",
};
const SOFTWARE = { WEB0023: "Halden PhotoScan 2400", WEB0024: "Faceless Stock generator v4" };

const errorsFor = raw => validateWorld(raw, { reachability: false, knockout: false }).issues.filter(i => i.level === "ERROR");

test("every image has a metadata decision: fictional EXIF or null for stripped", () => {
  for (const img of world.images.values()) {
    assert.ok("meta" in img, `${img.id} has no meta`);
    if (img.meta?.taken != null) assert.match(img.meta.taken, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, img.id);
  }
  assert.equal(webIds.length, 38);
});

test("WEB0001–WEB0038 follow the agreed metadata table", () => {
  for (const id of webIds) {
    const m = world.images.get(id).meta;
    if (EXIF[id]) { assert.equal(m?.device, EXIF[id], id); assert.ok(m.taken, `${id} has a date`); }
    else if (SOFTWARE[id]) assert.equal(m?.software, SOFTWARE[id], id);
    else assert.equal(m, null, `${id} is stripped`);
  }
  // Brightline's own pictures say nothing; Mara's phone matches IMG13 (Lumen 5, 2021) and is never Lumen 7 here.
  for (const id of ["WEB0005", "WEB0006"]) assert.equal(world.images.get(id).meta, null, id);
  assert.equal(world.images.get("IMG13").meta.device, "Lumen 5");
  const clueDevices = new Set([...world.images.values()].filter(i => !i.id.startsWith("WEB")).flatMap(i => [i.meta?.device, i.meta?.software]).filter(Boolean));
  for (const id of webIds) {
    const m = world.images.get(id).meta;
    for (const v of [m?.device, m?.software].filter(Boolean)) {
      if (["Lumen 5", "Faceless Stock generator v4"].includes(v)) continue;
      assert.ok(!clueDevices.has(v), `${id}: ${v} is already used by a story image`);
    }
  }
});

test("a photo is never taken after the page first showed it", () => {
  const first = new Map();
  for (const a of world.artifacts.values()) for (const v of a.versions) {
    const d = (v.date ?? a.date)?.slice(0, 10);
    for (const i of [].concat(v.images ?? a.images ?? [])) if (d && (!first.has(i) || d < first.get(i))) first.set(i, d);
  }
  for (const img of world.images.values()) {
    const t = img.meta?.taken?.slice(0, 10);
    if (t && first.has(img.id)) assert.ok(t <= first.get(img.id), `${img.id} taken ${t}, first shown ${first.get(img.id)}`);
  }
});

test("the validator rejects a missing meta and a photo dated after its page", async () => {
  assert.deepEqual(errorsFor(await loadRaw()), []);
  const raw = await loadRaw();
  delete raw.images.find(i => i.id === "WEB0005").meta;
  const shelf = raw.images.find(i => i.id === "WEB0016");
  shelf.meta = { ...shelf.meta, taken: "2019-06-19 09:00" };
  const k = raw.images.find(i => i.id === "WEB0009");
  k.meta = { ...k.meta, taken: "2015-01-01 09:00" }; // after the 2014 copy, before the live page
  const msgs = errorsFor(raw).map(e => `${e.where}: ${e.msg}`);
  assert.ok(msgs.some(m => m.includes("WEB0005") && m.includes("no meta")), msgs.join("\n"));
  assert.ok(msgs.some(m => m.includes("WEB0016 taken 2019-06-19")), msgs.join("\n"));
  assert.ok(msgs.some(m => m.includes("WEB0009 taken 2015-01-01")), msgs.join("\n"));
});

test("the approved camera and scanner names are canon background facts; Mara's Lumen 5 is not", async () => {
  const raw = await loadRaw();
  const byId = new Map((raw.backgroundFacts || []).map(f => [f.id, f]));
  const want = {
    "bf-device-orrin-d7": ["northgate", "Orrin D7", ["WEB0001", "WEB0002", "WEB0003", "WEB0004"]],
    "bf-device-orrin-s20": ["kestrel", "Orrin S20", ["WEB0009"]],
    "bf-device-orrin-s5": ["walts", "Orrin S5", ["WEB0034"]],
    "bf-device-halden-photoscan-2400": ["walts", "Halden PhotoScan 2400", ["WEB0023"]],
    "bf-device-lumen-6": ["calderpedia", "Lumen 6", ["WEB0013", "WEB0014", "WEB0015", "WEB0020"]],
  };
  for (const [id, [site, name, images]] of Object.entries(want)) {
    const f = byId.get(id);
    assert.ok(f, id);
    assert.equal(f.status, "canon", id);
    assert.equal(f.introducedBy, site, id);
    assert.ok(f.label.includes(name), id);
    for (const im of images) {
      const m = world.images.get(im).meta;
      assert.ok(m.device === name || m.software === name, `${im} uses ${name}`);
    }
  }
  // QA_PEOPLE: no new canon about Mara. Her Lumen 5 stays in the image meta and the handover docs.
  assert.ok(![...byId.values()].some(f => f.subject === "mara" || /Lumen 5/.test(f.label)));
});
