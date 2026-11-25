// @ts-check
// Browser's Archive (W8): every copy of one address the player can reach, oldest first.
// Built only from what the player can already open: the current page, Seeker's cached copies
// (viewArtifact's `cachedVersions`) and the player's own saved copies (savedArtifactView).
// Never reads hidden canon (source, supports, mentions, truth); tests/twin.test.mjs checks it.

import { viewArtifact, savedArtifactView } from "./artifacts.js";

const dateKey = d => String(d ?? "");

/**
 * The Archive for an artifact the player has seen.
 * entries: { ref, kind: "cached"|"current"|"saved", version, date, title, saved: evidence ids }
 *   ref is what phone.compare() takes: {artifact, version} for a cached copy, {artifact} for the
 *   current page, {evidence} for a saved copy that is no longer available any other way.
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
  // A page behind a sign-in shows nothing of itself, not even how many copies Seeker kept.
  if (!now.locked) {
    for (const vid of now.cachedVersions || []) {
      const v = viewArtifact(g, id, { version: vid });
      if (!v.error) entries.push({ ref: { artifact: id, version: vid }, kind: "cached", version: vid, date: v.date ?? null, title: v.title ?? "" });
    }
    if (!now.error) entries.push({ ref: { artifact: id }, kind: "current", version: now.versionId, date: now.date ?? null, title: now.title ?? "" });
  }
  // The player's whole-page saved copies. A saved version that is still listed is only marked.
  for (const e of s.evidence) {
    if (e.artifact !== id || e.quote || e.image || e.message) continue;
    const listed = entries.find(x => x.version === e.version);
    if (listed) { (listed.saved ??= []).push(e.id); continue; }
    const v = savedArtifactView(g, e.id);
    if (v.error) continue;
    entries.push({ ref: { evidence: e.id }, kind: "saved", version: e.version ?? v.versionId, date: v.date ?? null, title: v.title ?? "", saved: [e.id] });
  }
  for (const x of entries) x.saved ??= [];
  const order = { saved: 0, cached: 1, current: 2 };
  entries.sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)) || order[a.kind] - order[b.kind]);
  const latest = entries.at(-1);
  return {
    id, url: now.url ?? null, type: now.type,
    title: (!now.error && !now.locked ? now.title : latest?.title) || "",
    status: now.locked ? "locked" : now.error ?? "live",
    entries,
    canCompare: entries.length >= 2,
  };
}

/** Compare refs for two Archive entries, oldest first so "Changes from A to B" reads forwards. */
export function archivePair(view, i, j) {
  const [a, b] = [view.entries[i], view.entries[j]].sort((x, y) => view.entries.indexOf(x) - view.entries.indexOf(y));
  return [a.ref, b.ref];
}
