// @ts-check
// Browser's Archive (W8): every copy of one address the player can reach, oldest first.
// Built only from what the player can already open: the current page, Seeker's cached copies
// (viewArtifact's `cachedVersions`) and the player's own saved copies (savedArtifactView).
// Never reads hidden canon (source, supports, mentions, truth); tests/twin.test.mjs checks it.

import { viewArtifact, savedArtifactView } from "./artifacts.js";

const dateKey = d => String(d ?? "");

/**
 * The Archive for an artifact the player has seen.
 * entries: { ref, kind: "cached"|"current"|"saved", version, date, title, evidence?, withCurrent, sameAsCurrent }
 *   ref is what phone.compare() takes: {artifact, version} for Seeker's copy, {artifact} for the
 *   current (live) page, {evidence} for the player's own saved copy.
 * current: index of the live page, or -1; noCurrent: "locked"|"deleted"|"gone"|"unavailable"|null.
 * @param {any} g
 * @param {string} id
 */
export function archiveView(g, id) {
  const s = g.s;
  if (!g.w.artifacts.has(id)) return { error: "unknown" };
  const now = viewArtifact(g, id);
  // A page the player has opened, or a gone page whose "not available" screen already offers
  // Seeker's copies. Anything else stays unknown: the Archive is not a way to discover pages.
  const goneWithCopies = (now.error === "gone" || now.error === "deleted") && (now.cachedVersions || []).length > 0;
  if (s.seen[id] == null && !goneWithCopies) return { error: "not_seen" };
  const entries = [];
  // Locking or deleting blocks new content; it never takes away what the player already saved.
  // A page behind a sign-in shows nothing of itself (not even how many copies Seeker kept), only
  // the player's own saved copies.
  if (!now.locked) {
    for (const vid of now.cachedVersions || []) {
      const v = viewArtifact(g, id, { version: vid });
      if (!v.error) entries.push({ ref: { artifact: id, version: vid }, kind: "cached", version: vid, date: v.date ?? null, title: v.title ?? "" });
    }
    if (!now.error) entries.push({ ref: { artifact: id }, kind: "current", version: now.versionId, date: now.date ?? null, title: now.title ?? "" });
  }
  // The player's whole-page saved copies, always as their own rows: "Your saved copy" is never
  // folded into Seeker's copy of the same version. Excerpts, images and messages stay in Casebook.
  for (const e of s.evidence) {
    if (e.artifact !== id || e.quote || e.image || e.message) continue;
    const v = savedArtifactView(g, e.id);
    if (v.error) continue;
    entries.push({ ref: { evidence: e.id }, kind: "saved", version: e.version ?? v.versionId, date: v.date ?? null, title: v.title ?? "", evidence: e.id });
  }
  const order = { cached: 0, saved: 1, current: 2 };
  entries.sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)) || order[a.kind] - order[b.kind]);
  // "Compare with current" only from an older, different copy, and only when the current page can
  // be read. Without one, nothing stands in for it: no other copy is ever offered as "current".
  const current = entries.findIndex(x => x.kind === "current");
  for (const [i, x] of entries.entries()) {
    x.withCurrent = current >= 0 && i < current && x.version !== entries[current].version;
    x.sameAsCurrent = current >= 0 && i !== current && x.version === entries[current].version;
  }
  const latest = entries.at(-1);
  const status = now.locked ? "locked" : now.error ?? "live";
  return {
    id, url: now.url ?? null, type: now.type,
    title: (!now.error && !now.locked ? now.title : latest?.title) || "",
    status,
    entries,
    current,
    // Why there is no "Compare with current": the page is locked, deleted or gone. Neutral, never why.
    noCurrent: current >= 0 ? null : status === "live" ? "unavailable" : status,
    canCompare: entries.length >= 2,
  };
}

/** Compare refs for two Archive entries, oldest first so "Changes from A to B" reads forwards. */
export function archivePair(view, i, j) {
  const [a, b] = [view.entries[i], view.entries[j]].sort((x, y) => view.entries.indexOf(x) - view.entries.indexOf(y));
  return [a.ref, b.ref];
}
