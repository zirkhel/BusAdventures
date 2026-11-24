// Media overview for authors: what each platform holds, and whether evidence stands out.
// Pure function over a built world, so tests can call it. See tools/media-report.mjs.
//
// No quota: the true/false/partial split of claims supported on a platform is shown, never
// required (Anders' decision, §0). The only warning is about evidence that looks different
// from its neighbours, because that would be a visible hint (proposal §6.4).

const arr = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/** @returns {{platforms: any[], outliers: {artifact:string, platform:string, category:string|null, views:number, median:number}[]}} */
export function mediaReport(w) {
  const platforms = new Map();
  const row = id => {
    if (!platforms.has(id)) platforms.set(id, { id, name: w.platforms.get(id)?.name ?? id, artifacts: 0, clips: 0, filler: 0, evidence: 0, comments: 0, truth: { true: 0, false: 0, partial: 0 } });
    return platforms.get(id);
  };
  const supportsOf = a => [...new Set([...arr(a.supports), ...a.versions.flatMap(v => arr(v.supports))])];
  const byCategory = new Map();
  for (const a of w.artifacts.values()) {
    const r = row(a.platform);
    r.artifacts++;
    if (a.video || a.versions.some(v => v.video)) r.clips++;
    if (a.filler) r.filler++;
    r.comments += arr(a.comments).length + a.versions.reduce((n, v) => n + arr(v.comments).length, 0);
    const sup = supportsOf(a);
    if (sup.length) r.evidence++;
    for (const c of sup) { const t = w.claims.get(c)?.truth; if (t in r.truth) r.truth[t]++; }
    const views = a.stats?.views ?? a.versions.at(-1)?.stats?.views;
    if (views != null) {
      const k = `${a.platform}|${a.category ?? a.section ?? ""}`;
      if (!byCategory.has(k)) byCategory.set(k, []);
      byCategory.get(k).push({ a, views, evidence: sup.length > 0 });
    }
  }
  const outliers = [];
  for (const [k, list] of byCategory) {
    const m = median(list.filter(x => !x.evidence).map(x => x.views));
    if (!m) continue;
    for (const x of list) if (x.evidence && !x.a.outlier && (x.views < m / 4 || x.views > m * 4)) {
      const [platform, category] = k.split("|");
      outliers.push({ artifact: x.a.id, platform, category: category || null, views: x.views, median: m });
    }
  }
  return { platforms: [...platforms.values()].sort((x, y) => x.id.localeCompare(y.id)), outliers };
}
