// Site model and public-view tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { publicView, isHiddenViewKey, PUBLIC_VIEW_KEYS } from "../core/site-view.js";

const dir = dirname(fileURLToPath(import.meta.url));

test("publicView keeps display fields and drops hidden canon", () => {
  const v = publicView({
    id: "A40", type: "page", platform: "northgate_site", url: "northgatedev.com/waterfront",
    title: "Eastfield Waterfront", body: "1,200 new homes.", date: "2026-02-01",
    images: ["IMG12"], versionId: "v1", cached: true, author: null,
    supports: ["S3"], mentions: ["northgate"], source: "northgate",
    filler: true, hidden: true, covers: ["x"], pool: "news", keywords: ["secret"],
  });
  assert.equal(v.id, "A40");
  assert.equal(v.title, "Eastfield Waterfront");
  assert.equal(v.body, "1,200 new homes.");
  assert.equal(v.url, "northgatedev.com/waterfront");
  assert.equal(v.versionId, "v1");
  assert.equal(v.cached, true);
  assert.deepEqual(v.images, ["IMG12"]);
  for (const k of ["supports", "mentions", "source", "filler", "hidden", "covers", "pool", "keywords"]) {
    assert.equal(k in v, false, k);
  }
});

test("publicView drops unknown keys and never invents fields", () => {
  const v = publicView({ id: "X", inventedCanon: "nope", truth: "true" });
  assert.deepEqual(Object.keys(v), ["id"]);
});

test("hidden key list covers the WEBSITES.md §6.5 names", () => {
  for (const k of ["supports", "mentions", "source", "filler", "hidden", "covers", "pool"]) {
    assert.equal(isHiddenViewKey(k), true, k);
  }
  assert.ok(PUBLIC_VIEW_KEYS.includes("title"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("blocks"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("body"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("url"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("versionId"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("cached"));
});

test("renderers and future site templates import publicView", () => {
  const render = readFileSync(join(dir, "../app/render.js"), "utf8");
  assert.match(render, /import \{ publicView \} from "\.\.\/core\/site-view\.js"/);
  assert.match(render, /v = publicView\(v\)/);
});
