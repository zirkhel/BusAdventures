import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { searchImage } from "../core/search.js";
import { imageRoot } from "../core/world.js";

const here = fileURLToPath(new URL("../", import.meta.url));
const world = await loadWorld();
const catalog = JSON.parse(await readFile(here + "graphics/catalog.json", "utf8"));
const byId = new Map(catalog.images.map(e => [e.id, e]));

// Planned website photos (docs/WEBSITES.md §10) plus the former SVG stand-ins now photographed.
const NEW = ["WEB0001", "WEB0002", "WEB0003", "WEB0004", "WEB0006", "WEB0008", "WEB0009", "WEB0011", "WEB0012",
  "WEB0013", "WEB0014", "WEB0015", "WEB0016", "WEB0017", "WEB0018", "WEB0019", "WEB0021", "WEB0022", "WEB0023", "WEB0024"];
const PHOTOGRAPHED = ["WEB0028", "WEB0029", "WEB0031", "WEB0032", "WEB0033", "WEB0034", "WEB0035", "WEB0037", "WEB0038"];

function webpSize(buf) {
  // RIFF....WEBPVP8X / VP8  / VP8L
  const kind = buf.toString("ascii", 12, 16);
  if (kind === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (kind === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
  throw new Error("not a webp: " + kind);
}

test("every planned WEB photo and every photographed stand-in is a final webp of the catalogued size", async () => {
  for (const id of [...NEW, ...PHOTOGRAPHED]) {
    const e = byId.get(id);
    assert.ok(e, `${id} in catalogue`);
    assert.equal(e.status, "final", id);
    assert.match(e.file, /\.webp$/, id);
    const buf = await readFile(here + e.file);
    assert.deepEqual(webpSize(buf), { w: e.width, h: e.height }, id);
    assert.ok(world.images.has(id), `${id} in the world`);
    assert.ok((world.imageUse.get(id) || []).length > 0, `${id} is used by a page`);
  }
});

test("WEB0030 and WEB0036 stay SVG illustrations, and retired SVG files are gone", async () => {
  assert.match(byId.get("WEB0030").file, /\.svg$/);
  assert.match(byId.get("WEB0036").file, /\.svg$/);
  for (const f of ["web0028-harbordesk-hero.svg", "web0031-pclibrary-hero.svg", "web0037-notes-fog.svg", "web0038-haven-hero.svg"]) {
    await assert.rejects(stat(here + "assets/images/" + f), `${f} retired`);
  }
});

test("new photos are originals: no new image joins the IMG01/IMG02/IMG06S/IMG04S/NIMG chains", () => {
  for (const id of [...NEW, ...PHOTOGRAPHED]) {
    assert.equal(imageRoot(world, id), id, `${id} is its own original`);
    assert.equal(world.images.get(id).derivedFrom, undefined, id);
  }
  const g = new Game(world, { seed: 7 }); g.start();
  for (const evidence of ["IMG01", "IMG02", "IMG06S", "IMG06", "IMG04S", "IMG05O", "NIMG0003", "NIMG0005"]) {
    for (const flip of [false, true]) {
      const hits = searchImage(g, evidence, { flip });
      assert.ok(hits.every(h => !/^WEB00(0[1-9]|1\d|2[0-4]|28|29|3[1-578])$/.test(h.image)), `${evidence}${flip ? " (flip)" : ""} has no new WEB hit`);
    }
  }
});

test("Kestrel's 2014 photo is only on the cached 2014 versions", () => {
  for (const aid of ["W-kestrel-0001", "W-kestrel-0005"]) {
    const a = world.artifacts.get(aid);
    for (const v of a.versions) {
      const imgs = v.images ?? a.images ?? [];
      if (v.id === "v2014") assert.deepEqual(imgs, ["WEB0009"], aid);
      else assert.ok(!imgs.includes("WEB0009"), `${aid} ${v.id}`);
    }
  }
});

test("photo pages keep their ids, URLs and wording", () => {
  const pages = {
    "W-northgate-0003": "northgatedev.com/projects/foundry-lofts", "W-northgate-0004": "northgatedev.com/projects/heights-commons",
    "W-northgate-0005": "northgatedev.com/projects/northpoint-landing", "W-calderpedia-0006": "calderpedia.org/Port_Calder_lighthouse",
    "W-pclibrary-0004": "pclibrary.org/branches/eastfield", "W-walts-0001": "waltbrennan.calderweb.net", "W-faceless-0004": "facelessstock.com/how-it-works",
  };
  for (const [id, url] of Object.entries(pages)) assert.equal(world.artifacts.get(id).url, url);
  assert.match(world.artifacts.get("W-faceless-0005").versions[0].body, /The library is for account holders/);
  assert.match(world.artifacts.get("W-faceless-0004").versions[0].body, /We have not published a complete public grid of every face/);
});
