// @ts-check
// Player judgments only. No rules, scoring, truth or automatic assessment.
import { liveVersionId, savedArtifactView } from "./artifacts.js";

export function updateEvidence(g, id, patch = {}) {
  const e = g.s.evidence.find(x => x.id === id);
  if (!e) return { error: "unknown_evidence" };
  if ("shelf" in patch && ![null, "irrelevant", "finished"].includes(patch.shelf)) return { error: "bad_shelf" };
  if (patch.opened) e.opened ??= g.s.day;
  if ("note" in patch) e.note = String(patch.note);
  for (const key of ["reviewed", "important", "doubtful"]) {
    if (key in patch) e.marks[key] = key === "reviewed" ? (patch[key] ? g.s.day : null) : !!patch[key];
  }
  if ("shelf" in patch) { e.shelf = patch.shelf; e.shelvedDay = patch.shelf ? g.s.day : null; }
  return { ok: true };
}

export function migrateEvidence(s, w) {
  for (const e of s.evidence) {
    e.opened = null;
    e.marks = { reviewed: null, important: false, doubtful: false };
    e.shelf = null;
    const a = w.artifacts.get(e.artifact);
    // Old saves with no version cannot recover an unknown historical copy. Pin the
    // current version at migration; never replace an explicit saved version.
    if (a && !e.version) e.version = liveVersionId({ s }, a);
    if (a && e.version) {
      const v = savedArtifactView({ s, w }, e.id);
      if (!v.error) e.snapshot = v;
    }
  }
}
