// @ts-check
// The world: everything authored, read-only during play.
// buildWorld() takes plain JSON (see content/manifest.json) and adds indexes.
// Nothing here knows about a specific story: Dead Internet is the first world, not the only one.

import { indexById, asArray } from "./util.js";

/**
 * @param {any} raw  merged content: { meta, entities, accounts, platforms, images, artifacts,
 *                   characters, rules, predicates, canon, mysteries, strings }
 */
export function buildWorld(raw) {
  const w = {
    raw,
    meta: raw.meta,
    strings: raw.strings || {},
    entities: indexById(raw.entities, "entities"),
    accounts: indexById(raw.accounts, "accounts"),
    platforms: indexById(raw.platforms, "platforms"),
    images: indexById(raw.images, "images"),
    artifacts: indexById(raw.artifacts, "artifacts"),
    characters: indexById(raw.characters, "characters"),
    predicates: indexById(raw.predicates, "predicates"),
    claims: indexById(raw.canon?.claims, "canon.claims"),
    facts: raw.canon?.facts || [],
    rules: raw.rules || [],
    mysteries: indexById(raw.mysteries, "mysteries"),
    channels: indexById(raw.meta?.publishing?.channels, "meta.publishing.channels"),
    /** @type {Map<string,string>} account id → character id */
    characterByAccount: new Map(),
    /** @type {Map<string,string[]>} image id → artifact ids that show it */
    imageUse: new Map(),
    /** @type {Map<string,string>} account id → profile artifact id */
    profileOf: new Map(),
  };

  for (const c of w.characters.values()) if (c.account) w.characterByAccount.set(c.account, c.id);
  for (const a of w.artifacts.values()) {
    const imgs = new Set([...asArray(a.images), ...a.versions.flatMap(v => asArray(v.images))]);
    for (const i of imgs) {
      if (!w.imageUse.has(i)) w.imageUse.set(i, []);
      w.imageUse.get(i).push(a.id);
    }
    if (a.type === "profile" && a.author) w.profileOf.set(a.author, a.id);
  }
  return w;
}

/** First image in the derivation chain (the original). */
export function imageRoot(w, id) {
  let cur = w.images.get(id), guard = 0;
  while (cur && cur.derivedFrom && guard++ < 50) cur = w.images.get(cur.derivedFrom);
  return cur ? cur.id : id;
}

/** 1 if the image is mirrored relative to its root, else 0. */
export function mirrorParity(w, id) {
  let p = 0, cur = w.images.get(id), guard = 0;
  while (cur && guard++ < 50) {
    if (asArray(cur.transforms).includes("mirror")) p ^= 1;
    cur = cur.derivedFrom ? w.images.get(cur.derivedFrom) : null;
  }
  return p;
}

/** Display name for an entity, account or artifact id. */
export function nameOf(w, id) {
  if (id == null) return "";
  const e = w.entities.get(id); if (e) return e.name;
  const acc = w.accounts.get(id); if (acc) return acc.handle;
  const a = w.artifacts.get(id); if (a) return a.title || a.id;
  return id;
}

/** UI string lookup with a visible fallback so missing keys are easy to spot. */
export function str(w, key) {
  const v = key.split(".").reduce((o, k) => (o == null ? o : o[k]), w.strings);
  return v == null ? `[${key}]` : v;
}
