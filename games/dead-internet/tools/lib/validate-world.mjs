// Content validator for an investigation world. Pure function over raw content, so tests
// can call it directly. See tools/validate.mjs for the command line.
//
// ERROR = the game will misbehave or the investigation can block. WARN = probably a mistake.
// INFO = worth a look.

import { buildWorld, imageRoot } from "../../core/world.js";
import { hostOf, siteIdOf, resolveHref, NAV_STATES, EMAIL_ONLY_DOMAINS } from "../../core/sites.js";
import { CONDITION_KEYS } from "../../core/conditions.js";
import { EFFECT_KEYS } from "../../core/rules.js";
import { explore } from "./explorer.mjs";

const EVENTS = new Set(["game.start", "day.start", "search", "artifact.open", "message.send", "evidence.save", "image.search", "login", "report.published",
  "case.start", "video.view", "video.like", "feed.scroll"]);
// Watching, liking and scrolling cost nothing and change nothing that matters (proposal §6.6).
const FEED_EVENTS = new Set(["video.view", "video.like", "feed.scroll"]);
const MOOD_EFFECTS = new Set(["message", "notify", "later"]);
const FEED_MATCH = new Set(["platform", "tab"]);
const PROGRESS_CONDS = new Set(["seen", "notSeen", "saved", "visible", "live", "known", "exposed", "published"]);
const VIDEO_TRANSFORMS = new Set(["reupload", "crop", "mirror", "speed", "reencode", "trim", "overlay"]);
const INDEX = new Set(["full", "weak", "exact", "none", "cache"]);
const TRANSFORMS = new Set(["crop", "mirror", "recolor", "compress", "composite", "resize"]);
// Fields "Image info" shows (app/phone.js).
const META_KEYS = new Set(["taken", "device", "location", "software", "note"]);
const TRUTH = new Set(["facts", "operatedBy", "notHuman", "relation"]);
const ON_KEYS = new Set(["any", "ask", "show", "showSupports", "reply"]);

export function validateWorld(raw, opts = {}) {
  const issues = [];
  const err = (where, msg) => issues.push({ level: "ERROR", where, msg });
  const warn = (where, msg) => issues.push({ level: "WARN", where, msg });
  const info = (where, msg) => issues.push({ level: "INFO", where, msg });

  let w;
  try { w = buildWorld(raw); } catch (e) { err("world", e.message); return { issues }; }

  const isEntity = id => w.entities.has(id);
  const isAccount = id => w.accounts.has(id);
  const isRef = id => isEntity(id) || isAccount(id);
  const arr = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const allLogins = [...arr(w.meta.logins), ...[...w.mysteries.values()].flatMap(m => arr(m.start?.logins))];

  // ── Conditions and effects ────────────────────────────────────────────────
  const checkCond = (where, c) => {
    if (c == null) return;
    if (Array.isArray(c)) { c.forEach(x => checkCond(where, x)); return; }
    if (typeof c !== "object") { err(where, `condition is not an object: ${JSON.stringify(c)}`); return; }
    for (const [k, v] of Object.entries(c)) {
      if (!CONDITION_KEYS.has(k)) { err(where, `unknown condition "${k}"`); continue; }
      if (k === "all" || k === "any") arr(v).forEach(x => checkCond(where, x));
      if (k === "not") checkCond(where, v);
      if (["seen", "notSeen", "saved", "visible", "live"].includes(k)) for (const id of arr(v)) if (!w.artifacts.has(id)) err(where, `${k}: unknown artifact ${id}`);
      if (k === "trustGte" || k === "trustLt") if (!w.characters.has(v.id)) err(where, `${k}: unknown character ${v.id}`);
      if (k === "accountActive") for (const id of arr(v)) if (!isAccount(id)) err(where, `accountActive: unknown account ${id}`);
      if (k === "known") for (const id of arr(v)) if (!isRef(id)) err(where, `known: unknown id ${id}`);
      if (k === "exposed") { const cl = typeof v === "string" ? v : v.claim; if (!w.claims.has(cl)) err(where, `exposed: unknown claim ${cl}`); }
      if (k === "published") for (const cl of arr(v)) if (!w.claims.has(cl)) err(where, `published: unknown claim ${cl}`);
      if (k === "loggedIn" && !allLogins.some(l => l.site === v)) err(where, `loggedIn: unknown site ${v}`);
      if (["caseActive", "caseClosed", "caseStarted"].includes(k)) for (const id of arr(v)) if (!w.mysteries.has(id)) err(where, `${k}: unknown mystery ${id}`);
    }
  };
  const checkEffects = (where, effs, ctx = {}) => {
    for (const e of arr(effs)) {
      for (const [k, v] of Object.entries(e)) {
        if (!EFFECT_KEYS.has(k)) { err(where, `unknown effect "${k}"`); continue; }
        if (k === "show" || k === "hide") for (const id of arr(v)) if (!w.artifacts.has(id)) err(where, `${k}: unknown artifact ${id}`);
        if (k === "setLive") {
          const a = w.artifacts.get(v.artifact);
          if (!a) err(where, `setLive: unknown artifact ${v.artifact}`);
          else if (v.version != null && !a.versions.some(x => x.id === v.version)) err(where, `setLive: ${v.artifact} has no version ${v.version}`);
          else if (v.version == null && !a.versions.some(x => x.cached)) warn(where, `setLive null on ${v.artifact}: no cached version, it will vanish completely`);
        }
        if (k === "deleteAccount" || k === "restoreAccount") for (const id of arr(v)) if (!isAccount(id)) err(where, `${k}: unknown account ${id}`);
        if (k === "trust" && !w.characters.has(v.id)) err(where, `trust: unknown character ${v.id}`);
        if (k === "know") for (const id of arr(v)) if (!isRef(id)) err(where, `know: unknown id ${id}`);
        if (k === "message") {
          if (v.from && !w.characters.has(v.from)) err(where, `message: unknown character ${v.from}`);
          if (v.fromAccount && !isAccount(v.fromAccount)) err(where, `message: unknown account ${v.fromAccount}`);
          if (!v.from && !v.fromAccount) err(where, "message without sender");
          for (const id of arr(v.attach)) if (!w.artifacts.has(id)) err(where, `message attaches unknown artifact ${id}`);
          for (const c of arr(v.supports)) if (!w.claims.has(c)) err(where, `message supports unknown claim ${c}`);
          for (const id of arr(v.mentions)) if (!isRef(id)) err(where, `message mentions unknown id ${id}`);
          if (arr(v.supports).length && !v.source) warn(where, "message with supports but no source");
        }
        if (k === "notify") {
          const n = typeof v === "string" ? { text: v } : v;
          if (n.ref?.artifact && !w.artifacts.has(n.ref.artifact)) err(where, `notify: unknown artifact ${n.ref.artifact}`);
          // Every notification says who it is from: what it opens (ref) or the platform it came from.
          if (!n.ref && !n.from) err(where, "notify without ref or from: the player would not know who sent it");
          if (n.from && !w.platforms.has(n.from)) err(where, `notify: unknown platform ${n.from}`);
        }
        if (k === "later") checkEffects(where, v.do, ctx);
      }
    }
  };
  const revealed = new Set(); // artifacts that some effect or attachment can make visible
  const collectReveals = effs => {
    for (const e of arr(effs)) for (const [k, v] of Object.entries(e)) {
      if (k === "show") arr(v).forEach(id => revealed.add(id));
      if (k === "message") arr(v.attach).forEach(id => revealed.add(id));
      if (k === "later") collectReveals(v.do);
    }
  };

  // ── Meta ──────────────────────────────────────────────────────────────────
  for (const id of arr(w.meta.startKnown)) if (!isRef(id)) err("meta.startKnown", `unknown id ${id}`);
  // ── Mysteries (packs in one universe) ─────────────────────────────────────
  const claimOwner = new Map();
  for (const m of w.mysteries.values()) {
    const where = `mystery ${m.id}`;
    for (const c of arr(m.claims)) { if (claimOwner.has(c)) err(where, `claim ${c} also belongs to ${claimOwner.get(c)}`); claimOwner.set(c, m.id); }
    if (m.status === "seed") continue;
    for (const id of arr(m.start?.known)) if (!isRef(id)) err(where, `start.known: unknown id ${id}`);
    for (const id of arr(m.start?.artifacts)) if (!w.artifacts.has(id)) err(where, `start.artifacts: unknown artifact ${id}`);
    checkCond(`${where} requires`, m.requires); checkCond(`${where} start.discover`, m.start?.discover);
    if (!m.start?.menu && !m.start?.discover) warn(where, "neither start.menu nor start.discover: the player can never start it");
    for (const id of arr(m.evidence)) if (!w.artifacts.has(id) && !w.images.has(id)) err(where, `evidence: unknown artifact or image ${id}`);
    for (const d of arr(m.deadlines)) {
      const dw = `${where} deadline ${d.id}`;
      if (!d.id || !d.label) err(dw, "needs id and label");
      if ((d.caseDay == null) === (d.day == null)) err(dw, "needs exactly one of caseDay or day");
      checkCond(`${dw} knownIf`, d.knownIf); checkCond(`${dw} until`, d.until);
    }
    const L = m.layers;
    if (L) for (const k of ["reveal", "hint", "background"]) for (const n of arr(L[k])) if (!(n >= 1 && n <= 7)) err(where, `layers.${k}: ${n} is not a layer 1–7`);
  }
  const ownerOf = c => w.mysteries.get(claimOwner.get(c));
  // Narrative layers are set per mystery (layers.reveal / hint / background). Nothing is global.
  const layerOk = (where, layer, pack, supports) => {
    if (layer == null) return;
    if (!(layer >= 1 && layer <= 7)) { err(where, `layer ${layer} is not 1–7`); return; }
    const m = pack && pack !== "universe" ? w.mysteries.get(pack) : null;
    if (m) {
      const L = m.layers || {};
      if (![...arr(L.reveal), ...arr(L.hint), ...arr(L.background)].includes(layer)) err(where, `layer ${layer} is outside what ${m.id} may touch`);
    }
    for (const c of supports) {
      const o = ownerOf(c);
      if (o && !arr(o.layers?.reveal).includes(layer)) err(where, `layer ${layer} supports ${c}, but ${o.id} may not reveal layer ${layer}`);
    }
  };
  for (const ch of w.channels.values()) {
    if (ch.reviewer && !w.characters.has(ch.reviewer)) err(`channel ${ch.id}`, `unknown reviewer ${ch.reviewer}`);
    if (ch.reviewer) for (const k of ["noTrust", "strong", "weak", "none", "bold"]) if (w.strings?.review?.[ch.reviewer]?.[k] == null) err(`channel ${ch.id}`, `missing string review.${ch.reviewer}.${k}`);
    checkCond(`channel ${ch.id}`, ch.if); checkEffects(`channel ${ch.id}`, ch.onPublish); collectReveals(ch.onPublish);
  }
  for (const k of ["ask", "show"]) if (w.strings?.messages?.[k] == null) err("strings", `missing messages.${k}`);

  // ── Predicates and canon ──────────────────────────────────────────────────
  for (const p of w.predicates.values()) {
    if (!TRUTH.has(p.truth)) err(`predicate ${p.id}`, `unknown truth rule "${p.truth}"`);
    if (![1, 2].includes(p.arity)) err(`predicate ${p.id}`, "arity must be 1 or 2");
  }
  const checkTriple = (where, t) => {
    const p = w.predicates.get(t.predicate);
    if (!p) { err(where, `unknown predicate ${t.predicate}`); return; }
    if (!isRef(t.subject)) err(where, `unknown subject ${t.subject}`);
    if (p.arity === 2 && !isRef(t.object)) err(where, `unknown object ${t.object}`);
    if (p.arity === 1 && t.object != null) err(where, `${t.predicate} takes no object`);
  };
  for (const c of w.claims.values()) {
    if (!["true", "false", "partial"].includes(c.truth)) err(`claim ${c.id}`, `truth must be "true", "false" or "partial"`);
    arr(c.match || c).forEach(t => checkTriple(`claim ${c.id}`, t));
  }
  w.facts.forEach((f, i) => checkTriple(`fact #${i}`, f));
  // A claim marked true must not contradict a derived truth, and vice versa.
  for (const c of w.claims.values()) {
    for (const t of arr(c.match)) {
      const p = w.predicates.get(t.predicate);
      if (p?.truth === "facts") {
        const inFacts = w.facts.some(f => f.subject === t.subject && f.predicate === t.predicate && (f.object ?? null) === (t.object ?? null));
        if (c.truth === "true" && !inFacts) warn(`claim ${c.id}`, `true, but ${t.subject} ${t.predicate} ${t.object ?? ""} is not in canon facts`);
        if (c.truth === "false" && inFacts) err(`claim ${c.id}`, `false, but canon facts say ${t.subject} ${t.predicate} ${t.object ?? ""}`);
      }
      if (p?.truth === "operatedBy") {
        const acc = w.accounts.get(t.object);
        const actual = acc?.operatedBy === t.subject;
        if (c.truth === "true" && !actual) err(`claim ${c.id}`, `true, but ${t.object} is operated by ${acc?.operatedBy}`);
        if (c.truth === "false" && actual) err(`claim ${c.id}`, `false, but ${t.object} is operated by ${t.subject}`);
      }
    }
  }

  // Unresolved canon (no operatedBy, isHuman null) stays open: no claim of a playable mystery may rest on it.
  for (const c of w.claims.values()) {
    const o = ownerOf(c.id);
    if (!o || o.status === "seed") continue;
    for (const t of arr(c.match)) {
      const p = w.predicates.get(t.predicate);
      const acc = w.accounts.get(p?.truth === "operatedBy" ? t.object : t.subject);
      if ((p?.truth === "operatedBy" || p?.truth === "notHuman") && acc && acc.operatedBy === undefined)
        err(`claim ${c.id}`, `depends on unresolved canon: nobody is said to operate ${acc.id}`);
      const ent = w.entities.get(t.subject);
      if (p?.truth === "notHuman" && !acc && ent && ent.isHuman == null)
        err(`claim ${c.id}`, `depends on unresolved canon: ${ent.id} has isHuman null`);
    }
  }

  // ── Entities and accounts ─────────────────────────────────────────────────
  for (const e of w.entities.values()) for (const r of arr(e.relations)) if (!isRef(r.to)) err(`entity ${e.id}`, `relation to unknown ${r.to}`);
  for (const a of w.accounts.values()) {
    if (!w.platforms.has(a.platform)) err(`account ${a.id}`, `unknown platform ${a.platform}`);
    // A light account (pool) has no history and may leave claimsToBe/operatedBy out: unresolved canon.
    const light = a.pool != null;
    if (!(light && a.claimsToBe == null) && !isEntity(a.claimsToBe)) err(`account ${a.id}`, `claimsToBe unknown ${a.claimsToBe}`);
    if (!(light && a.operatedBy === undefined) && !isEntity(a.operatedBy)) err(`account ${a.id}`, `operatedBy unknown ${a.operatedBy}`);
    if (light && !a.handle) err(`account ${a.id}`, "light account without handle");
    if (a.avatar && !w.images.has(a.avatar)) err(`account ${a.id}`, `unknown avatar ${a.avatar}`);
    for (const h of arr(a.history)) if (h.by != null && !isEntity(h.by)) err(`account ${a.id}`, `history: unknown ${h.by}`);
  }
  const operatorAt = (acc, date) => {
    for (const h of arr(acc.history)) if (date <= h.until) return h.by;
    return acc.operatedBy;
  };

  // ── Images ────────────────────────────────────────────────────────────────
  for (const img of w.images.values()) {
    if (img.derivedFrom && !w.images.has(img.derivedFrom)) err(`image ${img.id}`, `derivedFrom unknown ${img.derivedFrom}`);
    for (const t of arr(img.transforms)) if (!TRANSFORMS.has(t)) err(`image ${img.id}`, `unknown transform ${t}`);
    for (const c of arr(img.supports)) if (!w.claims.has(c)) err(`image ${img.id}`, `supports unknown claim ${c}`);
    for (const d of arr(img.depicts)) if (!isRef(d)) err(`image ${img.id}`, `depicts unknown ${d}`);
    // Every image has a metadata decision: an object (fictional EXIF) or null (stripped from this copy).
    // Video frames and posters are part of their clip, whose own meta is the "Video info".
    if (img.kind !== "frame" && !("meta" in img)) err(`image ${img.id}`, "no meta: give fictional EXIF or null for stripped");
    else if (img.meta != null) {
      if (typeof img.meta !== "object") err(`image ${img.id}`, "meta must be an object or null");
      else {
        for (const k of Object.keys(img.meta)) if (!META_KEYS.has(k)) err(`image ${img.id}`, `unknown meta field ${k}`);
        if (img.meta.taken != null && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(img.meta.taken)) err(`image ${img.id}`, `meta.taken must be "YYYY-MM-DD HH:MM", not ${img.meta.taken}`);
      }
    }
    let cur = img, seen = new Set();
    while (cur?.derivedFrom) { if (seen.has(cur.id)) { err(`image ${img.id}`, "derivation cycle"); break; } seen.add(cur.id); cur = w.images.get(cur.derivedFrom); }
    if (!w.imageUse.has(img.id) && !arr([...w.accounts.values()].map(a => a.avatar)).includes(img.id)) warn(`image ${img.id}`, "not used by any artifact or account");
    layerOk(`image ${img.id}`, img.layer, null, arr(img.supports));
  }

  // ── Videos and transcripts ────────────────────────────────────────────────
  for (const v of w.videos.values()) {
    const where = `video ${v.id}`;
    if (v.poster && !w.images.has(v.poster)) err(where, `unknown poster ${v.poster}`);
    if (v.derivedFrom && !w.videos.has(v.derivedFrom)) err(where, `derivedFrom unknown ${v.derivedFrom}`);
    for (const t of arr(v.transforms)) if (!VIDEO_TRANSFORMS.has(t)) err(where, `unknown transform ${t}`);
    if (v.script && !w.scripts.has(v.script)) err(where, `unknown script ${v.script}`);
    if (!v.script && v.transcript == null) warn(where, "no script or transcript: Show transcript will be empty");
    for (const f of arr(v.frames)) {
      if (!w.images.has(f.image)) err(where, `frame at ${f.t}s: unknown image ${f.image}`);
      if (v.duration != null && !(f.t >= 0 && f.t <= v.duration)) err(where, `frame at ${f.t}s is outside the clip (${v.duration}s)`);
    }
    for (const sc of arr(v.scenes)) for (const d of arr(sc.depicts)) if (!isRef(d)) err(where, `scene depicts unknown ${d}`);
    let cur = v, seen = new Set();
    while (cur?.derivedFrom) { if (seen.has(cur.id)) { err(where, "derivation cycle"); break; } seen.add(cur.id); cur = w.videos.get(cur.derivedFrom); }
  }
  for (const sc of w.scripts.values()) if (typeof sc.text !== "string" || !sc.text.trim()) err(`script ${sc.id}`, "no text");

  // ── Media fields on artifacts (articles, posts, clips) ───────────────────
  const referenced = new Set(); // artifacts linked from other content (related, refs)
  for (const a of w.artifacts.values()) for (const x of [a, ...a.versions]) for (const id of [...arr(x.related), ...arr(x.refs)]) if (typeof id === "string" && w.artifacts.has(id)) referenced.add(id);
  const checkMedia = (where, a, x) => {
    if (x.video && !w.videos.has(x.video)) err(where, `unknown video ${x.video}`);
    for (const id of arr(x.related)) if (!w.artifacts.has(id)) err(where, `related: unknown artifact ${id}`);
    for (const b of arr(x.byline)) if (/^acc_/.test(b) && !isAccount(b)) err(where, `byline: unknown account ${b}`);
    for (const c of arr(x.corrections)) if (!c?.text) err(where, "correction without text");
    if (x.sponsored && !isEntity(x.sponsored.by)) err(where, `sponsored by unknown ${x.sponsored.by}`);
    for (const id of arr(x.covers)) if (!isRef(id)) err(where, `covers unknown ${id}`);
    const sections = w.platforms.get(a.platform)?.app?.sections;
    if (x.section && sections && !sections.includes(x.section)) err(where, `section ${x.section} is not a section of ${a.platform}`);
    const cids = new Set(arr(x.comments).map(c => c.id));
    if (cids.size !== arr(x.comments).length) err(where, "duplicate comment id");
    for (const c of arr(x.comments)) {
      if (!isAccount(c.account)) err(where, `comment ${c.id}: unknown account ${c.account}`);
      if (c.replyTo && !cids.has(c.replyTo)) err(where, `comment ${c.id}: reply to unknown comment ${c.replyTo}`);
      if (c.deletedIn && !a.versions.some(v => v.id === c.deletedIn)) err(where, `comment ${c.id}: deletedIn unknown version ${c.deletedIn}`);
    }
  };

  // ── Artifacts ─────────────────────────────────────────────────────────────
  const start = w.meta.startDate;
  for (const a of w.artifacts.values()) {
    const where = `artifact ${a.id}`;
    if (!w.platforms.has(a.platform)) err(where, `unknown platform ${a.platform}`);
    if (a.author && !isAccount(a.author)) err(where, `unknown author ${a.author}`);
    if (!a.source) warn(where, "no source (needed for source independence)");
    if (a.index && !INDEX.has(a.index)) err(where, `unknown index level ${a.index}`);
    if (!Array.isArray(a.versions) || !a.versions.length) { err(where, "no versions"); continue; }
    const vids = new Set();
    for (const v of a.versions) {
      if (vids.has(v.id)) err(where, `duplicate version ${v.id}`);
      vids.add(v.id);
      for (const c of arr(v.supports)) if (!w.claims.has(c)) err(where, `version ${v.id} supports unknown claim ${c}`);
      for (const i of arr(v.images)) if (!w.images.has(i)) err(where, `version ${v.id} unknown image ${i}`);
    }
    if ("live" in a && a.live != null && !vids.has(a.live)) err(where, `live version ${a.live} does not exist`);
    if (a.live === null && !a.versions.some(v => v.cached)) err(where, "deleted (live: null) and nothing cached: unreachable");
    // A story dated the day a rule shows it must start hidden, or it would have no day.
    if (a.datedOnShow && !a.hidden) err(where, "datedOnShow needs hidden: true (a rule shows it and gives it its day)");
    if (a.versions[0]?.silent) err(where, "the first version cannot be a silent edit");
    for (const c of arr(a.supports)) if (!w.claims.has(c)) err(where, `supports unknown claim ${c}`);
    for (const i of arr(a.images)) if (!w.images.has(i)) err(where, `unknown image ${i}`);
    for (const m of [...arr(a.mentions), ...a.versions.flatMap(v => arr(v.mentions))]) if (!isRef(m)) err(where, `mentions unknown ${m}`);
    checkCond(where, a.visibleIf); checkCond(where, a.access);
    checkMedia(where, a, a); for (const v of a.versions) checkMedia(`${where} version ${v.id}`, a, v);
    if (a.access && !a.loginSite) warn(where, "access condition but no loginSite");
    // Universe content (background, filler) may become evidence, but only when the mystery says so.
    const sup = [...new Set([...arr(a.supports), ...a.versions.flatMap(v => arr(v.supports))])];
    // (Only for worlds loaded as universe + packs; a flat world has no packs.)
    if (w.packOf.get(a.id) === "universe") for (const c of sup) {
      const o = ownerOf(c);
      if (o && !arr(o.evidence).includes(a.id)) err(where, `universe content supports ${c}, but ${o.id} does not list it in evidence`);
    }
    layerOk(where, a.layer, w.packOf.get(a.id), sup);
    if ((a.index || "full") === "exact" && !arr(a.keywords).length) err(where, "index exact needs keywords");
    // Timeline
    const dates = a.versions.map(v => v.date).filter(Boolean);
    for (let i = 1; i < dates.length; i++) if (dates[i] < dates[i - 1]) err(where, `versions out of date order (${dates[i - 1]} → ${dates[i]})`);
    if (!a.hidden && !a.visibleIf && a.date > start) warn(where, `dated ${a.date}, after the game starts (${start}), but visible from the start`);
    if (a.author) {
      const acc = w.accounts.get(a.author);
      for (const v of a.versions) {
        const d = v.date ?? a.date;
        if (!acc || !d || a.type === "profile") continue;
        if (d < acc.created) err(where, `${d}: before ${acc.handle} was created (${acc.created})`);
        const op = operatorAt(acc, d);
        if (op === null) err(where, `${d}: ${acc.handle} was dormant then, nobody could have posted`);
        const ent = w.entities.get(op);
        if (ent?.died && d > ent.died) err(where, `${d}: written by ${ent.name}, who died ${ent.died}`);
      }
    }
    // A photo cannot be taken after the page first showed it: the earliest version that shows it.
    const firstShown = new Map();
    for (const v of a.versions) {
      const d = (v.date ?? a.date)?.slice(0, 10);
      if (!d) continue;
      for (const i of arr(v.images ?? a.images)) if (!firstShown.has(i) || d < firstShown.get(i)) firstShown.set(i, d);
    }
    for (const [i, d] of firstShown) {
      const taken = w.images.get(i)?.meta?.taken?.slice(0, 10);
      if (taken && taken > d) err(where, `image ${i} taken ${taken}, after this page first showed it (${d})`);
    }
  }
  // Copies cannot be older than their originals.
  const firstUse = id => (w.imageUse.get(id) || []).map(aid => w.artifacts.get(aid).date).sort()[0];
  for (const img of w.images.values()) {
    if (!img.derivedFrom) continue;
    const mine = firstUse(img.id), orig = firstUse(imageRoot(w, img.id));
    if (mine && orig && mine < orig) warn(`image ${img.id}`, `copy appears (${mine}) before its original (${orig})`);
  }

  // ── Characters ────────────────────────────────────────────────────────────
  for (const c of w.characters.values()) {
    const where = `character ${c.id}`;
    if (!isEntity(c.entity)) err(where, `unknown entity ${c.entity}`);
    if (c.account && !isAccount(c.account)) err(where, `unknown account ${c.account}`);
    for (const id of arr(c.has)) if (!w.artifacts.has(id)) err(where, `has unknown artifact ${id}`);
    const canSay = new Set([...arr(c.knows), ...arr(c.believes), ...arr(c.observed)]);
    for (const k of [...arr(c.knows), ...arr(c.believes), ...arr(c.observed)]) if (!w.claims.has(k)) err(where, `knowledge of unknown claim ${k}`);
    for (const k of arr(c.knows)) if (w.claims.get(k)?.truth === "false") err(where, `"knows" false claim ${k} (use believes)`);
    checkCond(where, c.contactIf); checkCond(where, c.silentIf);
    for (const p of arr(c.prompts)) checkCond(`${where} prompt ${p.id}`, p.if);
    const ids = new Set();
    for (const r of arr(c.responses)) {
      const rw = `${where} response ${r.id}`;
      if (ids.has(r.id)) err(rw, "duplicate response id");
      ids.add(r.id);
      const keys = Object.keys(r.on || {});
      if (keys.length !== 1 || !ON_KEYS.has(keys[0])) err(rw, `"on" must have exactly one of ${[...ON_KEYS].join(", ")}`);
      if (r.on?.ask) for (const t of arr(r.on.ask)) if (!isRef(t)) err(rw, `asks about unknown ${t}`);
      if (r.on?.show) for (const t of arr(r.on.show)) if (!w.artifacts.has(t)) err(rw, `show of unknown artifact ${t}`);
      if (r.on?.showSupports) for (const t of arr(r.on.showSupports)) if (!w.claims.has(t)) err(rw, `showSupports unknown claim ${t}`);
      if (r.on?.reply && !arr(c.prompts).some(p => arr(r.on.reply).includes(p.id))) err(rw, `reply to unknown prompt ${r.on.reply}`);
      for (const id of arr(r.attach)) {
        if (!w.artifacts.has(id)) err(rw, `attaches unknown artifact ${id}`);
        else if (!arr(c.has).includes(id)) err(rw, `attaches ${id}, which ${c.id} does not have`);
        revealed.add(id);
      }
      for (const s of arr(r.supports)) {
        if (!w.claims.has(s)) err(rw, `supports unknown claim ${s}`);
        else if (!canSay.has(s)) err(rw, `supports ${s}, which ${c.id} neither knows, believes nor observed`);
      }
      for (const m of arr(r.mentions)) if (!isRef(m)) err(rw, `mentions unknown ${m}`);
      checkCond(rw, r.if); checkEffects(rw, r.effects); collectReveals(r.effects);
    }
    for (const f of [...arr(c.fallback?.ask), ...arr(c.fallback?.show), ...arr(c.fallback?.reply), ...arr(c.fallback?.any)]) checkCond(`${where} fallback`, f.if);
  }

  // ── Rules and mysteries ───────────────────────────────────────────────────
  const ruleIds = new Set();
  for (const r of w.rules) {
    const where = `rule ${r.id}`;
    if (ruleIds.has(r.id)) err(where, "duplicate rule id");
    ruleIds.add(r.id);
    if (!EVENTS.has(r.when?.event)) err(where, `unknown event ${r.when?.event}`);
    if (FEED_EVENTS.has(r.when?.event)) {
      const bad = [];
      const scan = effs => { for (const e of arr(effs)) for (const [k, v] of Object.entries(e)) { if (!MOOD_EFFECTS.has(k)) bad.push(k); if (k === "later") scan(v.do); if (k === "message" && (arr(v.attach).length || arr(v.supports).length)) bad.push("message with attach/supports"); } };
      scan(r.do);
      if (bad.length) err(where, `${r.when.event} may only send messages and notifications, not ${[...new Set(bad)].join(", ")}`);
      // A reaction to watching or scrolling must not single out a clip, a creator or the
      // player's progress, or it becomes a hint that the clip matters.
      const named = Object.keys(r.when.match || {}).filter(k => !FEED_MATCH.has(k));
      if (named.length) err(where, `${r.when.event} may only match on ${[...FEED_MATCH].join(", ")}, not ${named.join(", ")}`);
      const progress = [];
      const scanCond = c => { if (c == null || typeof c !== "object") return; if (Array.isArray(c)) return c.forEach(scanCond);
        for (const [k, v] of Object.entries(c)) { if (PROGRESS_CONDS.has(k)) progress.push(k); if (k === "all" || k === "any" || k === "not") scanCond(v); } };
      scanCond(r.if);
      if (progress.length) err(where, `${r.when.event} may not depend on what the player has found (${[...new Set(progress)].join(", ")})`);
    }
    if (r.when?.match?.to && !arr(r.when.match.to).every(id => w.characters.has(id))) err(where, `match.to: unknown character ${r.when.match.to}`);
    checkCond(where, r.if); checkEffects(where, r.do); collectReveals(r.do);
  }
  for (const m of w.mysteries.values()) {
    for (const c of arr(m.claims)) if (!w.claims.has(c)) err(`mystery ${m.id}`, `unknown claim ${c}`);
    for (const e of arr(m.endings)) {
      checkCond(`mystery ${m.id} ending ${e.id}`, e.if); checkEffects(`mystery ${m.id} ending ${e.id}`, e.effects); collectReveals(e.effects);
      for (const r of arr(e.requiresEnding)) if (!arr(m.endings).some(x => x.id === r)) err(`mystery ${m.id} ending ${e.id}`, `requiresEnding unknown ${r}`);
      if (!e.title || !e.epilogue) warn(`mystery ${m.id} ending ${e.id}`, "no title or epilogue: the Casebook will show it without one");
    }
  }
  for (const a of w.artifacts.values()) if (a.hidden && !revealed.has(a.id)) err(`artifact ${a.id}`, "hidden, and nothing ever reveals it");
  // No evidence only by scrolling: everything that supports a claim of a playable mystery must also
  // be reachable by search, through its author's profile, a link from other content, or being given.
  const given = new Set([...revealed, ...arr(w.meta.startArtifacts), ...[...w.mysteries.values()].flatMap(m => arr(m.start?.artifacts)),
    ...[...w.characters.values()].flatMap(c => arr(c.has))]);
  for (const a of w.artifacts.values()) {
    const sup = [...new Set([...arr(a.supports), ...a.versions.flatMap(v => arr(v.supports))])].filter(c => { const o = ownerOf(c); return o && o.status !== "seed"; });
    if (!sup.length) continue;
    const profile = a.author && w.profileOf.get(a.author);
    const viaProfile = profile && (w.artifacts.get(profile).index || "full") !== "none";
    if ((a.index || "full") !== "none" || viaProfile || referenced.has(a.id) || given.has(a.id)) continue;
    err(`artifact ${a.id}`, `supports ${sup.join(", ")} but can only be found in a feed (no search, profile, link or giver)`);
  }
  // Searchable is not the same as findable: a clip that is evidence and can only be found by
  // search needs a lead elsewhere in the content (its creator named, or one of its keywords or
  // its creator's handle written somewhere the player can read). Content testing does the rest.
  const corpus = [];
  for (const x of w.artifacts.values()) for (const v of x.versions) corpus.push({ id: x.id, text: `${v.title ?? x.title ?? ""} ${v.body ?? x.body ?? ""}`, mentions: [...arr(x.mentions), ...arr(v.mentions)] });
  for (const c of w.characters.values()) for (const r of arr(c.responses)) corpus.push({ id: c.id, text: JSON.stringify(r.text ?? ""), mentions: arr(r.mentions) });
  for (const r of w.rules) for (const e of arr(r.do)) if (e.message) corpus.push({ id: r.id, text: String(e.message.text ?? ""), mentions: arr(e.message.mentions) });
  for (const a of w.artifacts.values()) {
    if (!(a.video || a.versions.some(v => v.video))) continue;
    const sup = [...new Set([...arr(a.supports), ...a.versions.flatMap(v => arr(v.supports))])].filter(c => { const o = ownerOf(c); return o && o.status !== "seed"; });
    if (!sup.length || referenced.has(a.id) || given.has(a.id)) continue;
    const acc = w.accounts.get(a.author);
    const words = [...arr(a.keywords), acc?.handle, acc?.handle?.replace(/^@/, "")].filter(Boolean).map(x => String(x).toLowerCase());
    const others = corpus.filter(c => c.id !== a.id && c.id !== w.profileOf.get(a.author));
    const lead = others.some(c => (a.author && c.mentions.includes(a.author)) || words.some(k => c.text.toLowerCase().includes(k)));
    if (!lead) warn(`artifact ${a.id}`, `clip supports ${sup.join(", ")} and can be searched, but nothing else in the content leads to it (creator or keywords)`);
  }
  for (const m of w.mysteries.values()) for (const p of arr(m.platforms)) if (!w.platforms.has(p)) err(`mystery ${m.id}`, `platforms: unknown platform ${p}`);

  // ── Per mystery: source independence, reachability, blocking ─────────────
  const allRuns = {};
  // A world without per-mystery testing (an older or minimal world) uses meta.testing for its first case.
  let tested = [...w.mysteries.values()].filter(x => x.status !== "seed" && x.testing).map(m => ({ m, testing: m.testing }));
  if (!tested.length && w.meta.testing) { const m = [...w.mysteries.values()].find(x => x.status !== "seed"); if (m) tested = [{ m, testing: w.meta.testing }]; }
  for (const { m, testing } of tested) {
    const core = new Set(testing.coreClaims || []), important = new Set(testing.importantClaims || []);
    const sourcesFor = new Map([...w.claims.keys()].map(k => [k, new Set()]));
    for (const a of w.artifacts.values()) for (const v of a.versions) for (const c of arr(v.supports ?? a.supports)) sourcesFor.get(c)?.add(v.source ?? a.source);
    for (const img of w.images.values()) for (const c of arr(img.supports)) sourcesFor.get(c)?.add(img.source);
    for (const ch of w.characters.values()) for (const r of arr(ch.responses)) for (const c of arr(r.supports)) sourcesFor.get(c)?.add(r.source ?? ch.source ?? ch.id);
    for (const [c, set] of sourcesFor) {
      const n = set.size;
      if (core.has(c) && n < 3) (n < 2 ? err : warn)(`claim ${c}`, `core claim has ${n} independent source(s) in the content; the rule is at least 3`);
      else if (important.has(c) && n < 2) warn(`claim ${c}`, `has only ${n} independent source(s)`);
      info(`claim ${c}`, `${n} sources in content: ${[...set].join(", ")}`);
    }

    // ── Reachability and blocking (simulated players) ─────────────────────────
    if (opts.reachability !== false && !issues.some(i => i.level === "ERROR")) {
      const runs = {}; allRuns[m.id] = runs;
      for (const mode of ["cautious", "reckless"]) {
        const r = explore(w, { mode, case: m.id });
        runs[mode] = r;
        for (const c of [...core, ...important]) {
          const n = r.coverage[c]?.sources.size ?? 0;
          if (core.has(c) && n < 2) err(`reach ${c}`, `${mode} player can only reach ${n} independent source(s)`);
          else if (important.has(c) && n < 2 && mode === "reckless") warn(`reach ${c}`, `reckless player reaches only ${n} source(s)`);
          info(`reach ${c}`, `${mode}: ${n} sources (${[...(r.coverage[c]?.sources || [])].join(", ")})`);
        }
        const unseen = [...w.artifacts.values()].filter(a => !a.filler && !(a.id in r.game.s.seen)).map(a => a.id);
        if (unseen.length) info(`reach ${mode}`, `never opened: ${unseen.join(" ")}`);
      }
      // Knock out each piece of core evidence in turn: no single artifact, image or person may block a core claim.
      if (opts.knockout !== false) {
        const contributors = new Set();
        for (const a of w.artifacts.values()) if (a.versions.some(v => arr(v.supports ?? a.supports).some(c => core.has(c)))) contributors.add(a.id);
        for (const img of w.images.values()) if (arr(img.supports).some(c => core.has(c))) contributors.add(img.id);
        for (const ch of w.characters.values()) if (arr(ch.responses).some(r => arr(r.supports).some(c => core.has(c)) || arr(r.attach).length)) contributors.add(ch.id);
        for (const id of contributors) {
          const kw = buildWorld(raw);
          kw.disabled = new Set([id]);
          const r = explore(kw, { mode: "cautious", case: m.id });
          for (const c of core) {
            const n = r.coverage[c]?.sources.size ?? 0;
            if (n < 2) err(`blocking ${id}`, `without ${id}, a cautious player reaches only ${n} source(s) for ${c}`);
          }
        }
        info("blocking", `knocked out ${contributors.size} contributors one at a time`);
      }

    }
  }
  checkSites(w, raw, err, warn);
  checkClueImageShare(w, warn);
  checkBackgroundFacts(w, raw, err, warn);
  return { issues, runs: allRuns[[...w.mysteries.values()].find(x => x.testing)?.id] };
}

const SITE_HOST_RE = /\b(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.(?:com|org|net|gov|io|co|app|blog|news|social|search|link|example|mail|edu|info|biz|us|uk|channel))\b/gi;

function collectHosts(node, into) {
  if (typeof node === "string") {
    SITE_HOST_RE.lastIndex = 0;
    let m;
    while ((m = SITE_HOST_RE.exec(node))) into.add(m[1].toLowerCase());
  } else if (Array.isArray(node)) node.forEach(x => collectHosts(x, into));
  else if (node && typeof node === "object") Object.values(node).forEach(x => collectHosts(x, into));
}

function checkSites(w, raw, err, warn) {
  const sites = raw.sites || [];
  for (const s of sites) {
    const where = `site ${s.id || "?"}`;
    if (!s.id) err("sites", "site without id");
    if (!s.domain) err(where, "missing domain");
    if (s.platform && !w.platforms.has(s.platform)) err(where, `unknown platform ${s.platform}`);
    if (s.org && !w.entities.has(s.org)) err(where, `unknown org ${s.org}`);
    if (!Array.isArray(s.designs) || !s.designs.length) err(where, "needs at least one design");
    for (const d of s.designs || []) {
      const dw = `${where} design ${d.id || "?"}`;
      if (!d.id) err(dw, "missing id");
      if (!d.from) err(dw, "missing from date");
      if (!d.template) err(dw, "missing template");
      for (const link of d.nav || []) {
        const lw = `${dw} nav "${link.label || link.href}"`;
        if (!link.href) { err(lw, "nav link without href"); continue; }
        if (link.state && !NAV_STATES.has(link.state)) err(lw, `unknown nav state "${link.state}"`);
        const r = resolveHref(w, s, link.href);
        if (!r.artifact && !link.state && r.state === "dead") err(lw, `href ${link.href} does not resolve to a page (use state: login, maintenance, dead or external)`);
      }
    }
    for (const st of s.status || []) {
      if (!st.from) err(where, "status entry without from date");
      if (st.state && !["live", "parked", "gone", "maintenance"].includes(st.state)) err(where, `unknown status "${st.state}"`);
    }
  }
  for (const a of w.artifacts.values()) {
    if (a.site && !w.sites.has(a.site)) err(`artifact ${a.id}`, `unknown site ${a.site}`);
  }
  if (!sites.length) return;
  if (w.meta?.id !== "dead-internet") return;
  const hosts = new Set();
  collectHosts(raw, hosts);
  for (const host of [...hosts].sort()) {
    if (EMAIL_ONLY_DOMAINS.has(host)) continue;
    if (w.siteByDomain.has(host)) continue;
    err("site-ref", `content references ${host}, but no site is registered for that domain`);
  }
}



const QA_PEOPLE = new Set(["mara", "theo", "dana", "owen", "iris", "calvin", "renee", "juno", "paul", "hal", "gerald", "lou", "ana", "priya", "mike_p", "pat_p", "lindsay"]);

/**
 * New names, dates and figures in background content are registered in
 * universe/background-facts.json. Only status:canon is treated as world fact.
 * Entries must not contradict existing canon triples, and must not invent new
 * facts about the people of The Quiet Account.
 */

/**
 * A site must not put images only on its clue pages. Background pages on the
 * same site should also carry pictures, or the images become a tell.
 */
function checkClueImageShare(w, warn) {
  const pages = new Map();
  for (const a of w.artifacts.values()) {
    if (!a.site || a.hidden) continue;
    if (a.type && !["page", "post", "article", "job"].includes(a.type) && a.type !== undefined) {
      // still count typical site pages; skip profiles/threads without a site home
    }
    if (!pages.has(a.site)) pages.set(a.site, []);
    const imgs = [...(a.images || [])];
    for (const v of a.versions || []) for (const id of v.images || []) imgs.push(id);
    pages.get(a.site).push({
      id: a.id,
      clue: Array.isArray(a.supports) && a.supports.length > 0,
      background: a.filler === true,
      hasImage: imgs.length > 0,
    });
  }
  for (const [site, list] of pages) {
    const clue = list.filter(p => p.clue);
    const bg = list.filter(p => p.background);
    if (!clue.length || bg.length < 2) continue;
    const clueWith = clue.filter(p => p.hasImage).length;
    const bgWith = bg.filter(p => p.hasImage).length;
    if (clueWith > 0 && bgWith === 0) {
      warn(`site ${site}`, `images appear on clue pages (${clue.filter(p => p.hasImage).map(p => p.id).join(", ")}) but on none of ${bg.length} background pages`);
    }
  }
}

function checkBackgroundFacts(w, raw, err, warn) {
  const facts = raw.backgroundFacts || [];
  const canon = [];
  for (const f of (raw.canon && raw.canon.facts) || []) {
    canon.push(`${f.subject}\t${f.predicate}\t${f.object ?? ""}`);
  }
  const canonBySP = new Map();
  for (const f of (raw.canon && raw.canon.facts) || []) {
    canonBySP.set(`${f.subject}\t${f.predicate}`, f.object ?? "");
  }
  const seen = new Set();
  for (const f of facts) {
    const where = `background-fact ${f.id || "?"}`;
    if (!f.id) { err("background-facts", "entry without id"); continue; }
    if (seen.has(f.id)) err(where, "duplicate id");
    seen.add(f.id);
    if (!f.introducedBy || !w.sites.has(f.introducedBy)) err(where, `introducedBy is not a registered site (${f.introducedBy || "missing"})`);
    if (f.binds !== "none" && f.binds !== "universe") err(where, `binds must be "none" or "universe"`);
    if (f.status !== "canon" && f.status !== "claim") err(where, `status must be "canon" or "claim"`);
    if (f.entity && !w.entities.has(f.entity)) err(where, `unknown entity ${f.entity}`);
    if (f.entity && f.name && w.entities.get(f.entity).name !== f.name) {
      err(where, `name "${f.name}" does not match entity ${f.entity} (${w.entities.get(f.entity).name})`);
    }
    if (f.status === "canon" && f.subject && f.predicate) {
      const key = `${f.subject}\t${f.predicate}`;
      if (canonBySP.has(key) && (canonBySP.get(key) ?? "") !== (f.object ?? "")) {
        err(where, `contradicts canon: ${f.subject} ${f.predicate} ${canonBySP.get(key)} vs ${f.object ?? ""}`);
      }
      if (QA_PEOPLE.has(f.subject) && !canonBySP.has(key)) {
        err(where, `new canon fact about Quiet Account person ${f.subject} is not allowed`);
      }
    }
  }
}
