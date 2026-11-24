// An automatic player that tries everything a curious player could try, without knowing
// the answers. Used by the validator (reachability, single points of failure) and the
// simulator. It only uses what it has seen: names of things it knows, codes and addresses
// that appear in texts it has read, and a few seed queries a new player would type.
//
// Modes:
//   cautious – never logs in with someone else's password, never shows a character evidence
//              that only backs false claims, answers prompts honestly
//   reckless – does everything, including the portal login

import { Game } from "../../core/game.js";
import { truthOf } from "../../core/casebook.js";

const CODE_RE = /[A-Za-z0-9]+(?:[._@-][A-Za-z0-9]+)+/g;

export function explore(world, opts = {}) {
  const mode = opts.mode ?? "cautious";
  const maxDays = opts.maxDays ?? world.meta.testing?.maxDays ?? 9;
  const g = new Game(world, { seed: opts.seed ?? 1, playerName: "Explorer" });
  g.start();

  const done = new Set();
  const texts = [];
  const once = key => (done.has(key) ? false : (done.add(key), true));
  const claimTruth = new Map([...world.claims.values()].map(c => [c.id, c.truth]));

  const openAndSave = (id, version) => {
    if (!once(`open:${id}:${version ?? "live"}`)) return;
    const r = g.open(id, version);
    if (!r.ok && !version && r.view?.cachedVersions?.length) { for (const v of r.view.cachedVersions) openAndSave(id, v); return; }
    if (!r.ok || !r.view || r.view.locked) return;
    texts.push(`${r.view.title} ${r.view.body}`);
    if (r.view.supports?.length) g.save({ artifact: id, version: r.view.versionId });
    for (const img of r.view.images || []) {
      if (world.disabled?.has(img)) continue;
      if ((world.images.get(img)?.supports || []).length) g.save({ artifact: id, image: img });
    }
  };

  const queries = () => {
    const out = new Set(world.meta.testing?.seedQueries || []);
    // A player reads names in what they open and searches for them: that is how they investigate.
    for (const id of new Set([...g.known(), ...g.encountered()])) {
      const e = world.entities.get(id), a = world.accounts.get(id);
      if (e) { out.add(e.name); for (const al of e.aliases || []) out.add(al); }
      if (a) { out.add(a.handle.replace(/^@/, "")); out.add(a.displayName); }
    }
    for (const t of texts) for (const m of t.match(CODE_RE) || []) if (m.length >= 5 && /[._@-]/.test(m)) out.add(m.replace(/[.,]+$/, ""));
    for (const m of g.s.messages) for (const c of m.text.match(CODE_RE) || []) if (c.length >= 5) out.add(c.replace(/[.,]+$/, ""));
    return [...out];
  };

  const useful = (artifact, version) => {
    const v = g.view(artifact, version);
    const sup = v.supports || [];
    if (!sup.length) return false;
    if (mode === "reckless") return true;
    return sup.every(c => claimTruth.get(c) === "true");
  };

  const fingerprint = () => [Object.keys(g.s.seen).length, g.s.messages.length, Object.keys(g.s.known).length, g.s.evidence.length,
    Object.keys(g.s.flags).length, g.s.pending.length].join(",");

  for (let day = g.s.day; day <= maxDays; day++) {
    for (let round = 0; round < 40; round++) {
      const before = fingerprint();

      // Everything handed over: attachments and notification links
      for (const m of g.s.messages) {
        for (const id of m.attach) openAndSave(id);
        if (m.from !== "player" && (m.supports || []).length && once(`savemsg:${m.id}`)) g.save({ message: m.id });
        texts.push(m.text);
      }
      for (const n of g.s.notifications) if (n.ref?.artifact) openAndSave(n.ref.artifact);

      // Search
      for (const q of queries()) {
        if (!once(`q:${q.toLowerCase()}`)) continue;
        for (const res of g.search(q).results) {
          if (res.locked) continue;
          openAndSave(res.artifact, res.cached ? res.versionId : undefined);
        }
      }

      // Images (both ways)
      for (const id of Object.keys(g.s.seen)) {
        const v = g.view(id);
        for (const img of v.images || []) for (const flip of [false, true]) {
          if (!once(`img:${img}:${flip}`)) continue;
          const r = g.searchImage(img, flip);
          for (const res of r.results || []) openAndSave(res.artifact, res.cached ? res.versionId : undefined);
        }
      }

      // Talk to everyone about everything
      for (const c of g.contacts()) {
        // Re-try a conversation whenever the relationship or the world has moved on.
        const st = `${g.s.trust[c] ?? 0}/${Object.keys(g.s.flags).length}/${Object.values(g.s.counters).reduce((a, b) => a + b, 0)}`;
        for (const p of g.prompts(c)) {
          const choice = mode === "cautious" ? (p.id === "yes" ? p : null) : p;
          if (choice && once(`reply:${c}:${p.id}`)) g.reply(c, p.id);
        }
        for (const topic of g.known()) if (once(`ask:${c}:${topic}:${st}`)) g.ask(c, topic);
        for (const e of g.s.evidence) {
          if (!e.artifact || e.image) continue;
          if (!useful(e.artifact, e.version ?? undefined)) continue;
          if (once(`show:${c}:${e.artifact}:${e.version}:${st}`)) g.show(c, e.artifact, e.version ?? undefined);
        }
      }

      // Logins
      if (mode === "reckless") {
        for (const l of world.meta.logins || []) {
          if (!g.s.flags.iris_gave_login && l.site === "brightline_portal") continue;
          if (!g.s.loggedIn[l.site] && once(`login:${l.site}`)) {
            g.login(l.site, l.user, l.pass);
            for (const a of world.artifacts.values()) if (a.loginSite === l.site) openAndSave(a.id);
          }
        }
      }

      if (fingerprint() === before) break;
    }
    if (opts.publishOnDay === g.s.day) publishBest(g, opts.channel ?? "daily_record", opts.claims);
    if (g.s.day >= maxDays) break;
    g.sleep();
  }
  return { game: g, coverage: coverage(g) };
}

/** Independent sources per claim among everything the explorer saved. */
export function coverage(g) {
  const out = {};
  for (const c of g.w.claims.values()) out[c.id] = { sources: new Set(), items: 0 };
  for (const e of g.s.evidence) {
    let supports, source;
    if (e.message) { const m = g.s.messages.find(m => m.id === e.message); supports = m?.supports || []; source = m?.source; }
    else if (e.image) { const img = g.w.images.get(e.image); supports = img?.supports || []; source = img?.source; }
    else { const v = g.view(e.artifact, e.version ?? undefined); supports = v.supports || []; source = v.source ?? g.w.artifacts.get(e.artifact).source; }
    for (const c of supports) if (out[c]) { out[c].sources.add(source); out[c].items++; }
  }
  return out;
}

/** Build one hypothesis per claim from the claim's first phrasing and link all backing evidence. */
export function hypothesisFor(g, claimId) {
  const c = g.w.claims.get(claimId);
  const m = (c.match || [c])[0];
  const r = g.hypothesize({ subject: m.subject, predicate: m.predicate, object: m.object ?? null });
  if (!r.ok) return null;
  for (const e of g.s.evidence) {
    let supports;
    if (e.message) supports = g.s.messages.find(x => x.id === e.message)?.supports || [];
    else if (e.image) supports = g.w.images.get(e.image)?.supports || [];
    else supports = g.view(e.artifact, e.version ?? undefined).supports || [];
    if (supports.includes(claimId)) g.link(r.id, e.id);
  }
  return r.id;
}

export function publishBest(g, channel, claims) {
  const ids = (claims || g.w.meta.testing?.coreClaims || []).map(c => hypothesisFor(g, c)).filter(Boolean);
  return g.publish(channel, ids);
}

export { truthOf };
