// @ts-check
// The game facade. Everything the presentation layer (or a test) does goes through here.
// No DOM. Every state-changing call is also available as dispatch({type, ...}) and is
// logged, so a session can be replayed exactly from the world, the seed and the log.

import { createState } from "./state.js";
import { check } from "./conditions.js";
import { isVisible, isLive, accountActive, viewArtifact, mentionsOf } from "./artifacts.js";
import { search, searchImage, imageInfo } from "./search.js";
import { fire, applyEffects, runPending, text } from "./rules.js";
import { sendMessage, canContact, contacts, thread, availablePrompts } from "./dialogue.js";
import * as CB from "./casebook.js";
import { asArray, addDays, deepClone } from "./util.js";
import { nameOf } from "./world.js";
import { scanText, suggest } from "./refs.js";
import { encounter, markInvestigated, investigate, investigateQuery, discoveryState } from "./discovery.js";

export class Game {
  /**
   * @param {any} world  from buildWorld()
   * @param {{state?:any, seed?:number, playerName?:string}} [opts]
   */
  constructor(world, opts = {}) {
    this.w = world;
    this.s = opts.state ?? createState(world, opts);
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
    const g = this;
    this.ctx = {
      get s() { return g.s; },
      trust: id => g.s.trust[id] ?? 0,
      isVisible: id => isVisible(g, id),
      isLive: id => isLive(g, id),
      accountActive: id => accountActive(g, id),
    };
  }

  // ── Events for the presentation layer ─────────────────────────────────────
  on(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); return () => this.listeners.get(type).delete(fn); }
  emit(type, payload) { for (const fn of this.listeners.get(type) || []) fn(payload); for (const fn of this.listeners.get("*") || []) fn(type, payload); }

  check(cond) { return check(cond, this.ctx); }
  get date() { return addDays(this.w.meta.startDate, this.s.day - (this.w.meta.startDay ?? 1)); }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Run an action object. Unknown types throw. All actions are logged for replay. */
  dispatch(action) {
    const a = action;
    let r;
    switch (a.type) {
      case "start": r = this.#start(); break;
      case "search": r = this.#search(a.query); break;
      case "searchImage": r = this.#searchImage(a.image, a.flip); break;
      case "open": r = this.#open(a.artifact, a.version); break;
      case "login": r = this.#login(a.site, a.user, a.pass); break;
      case "message": r = sendMessage(this, a.to, a.msg); break;
      case "saveEvidence": r = CB.saveEvidence(this, a.ref); break;
      case "removeEvidence": r = CB.removeEvidence(this, a.id); break;
      case "createHypothesis": r = CB.createHypothesis(this, a.hypothesis); break;
      case "updateHypothesis": r = CB.updateHypothesis(this, a.id, a.patch); break;
      case "deleteHypothesis": r = CB.deleteHypothesis(this, a.id); break;
      case "linkEvidence": r = CB.linkEvidence(this, a.hypothesis, a.evidence, a.on ?? true); break;
      case "addNote": r = CB.addNote(this, a.text, a.from, a.about); break;
      case "updateNote": r = CB.updateNote(this, a.id, a.text); break;
      case "deleteNote": r = CB.deleteNote(this, a.id); break;
      case "review": r = CB.review(this, a.channel, a.hypotheses); break;
      case "publish": r = CB.publish(this, a.channel, a.hypotheses); break;
      case "sleep": r = this.#sleep(); break;
      case "readNotification": r = this.#readNotification(a.id); break;
      case "investigate": r = investigate(this, a.id, a.text); break;
      default: throw new Error(`Unknown action "${a.type}"`);
    }
    if (!r?.error) this.s.log.push(deepClone(action));
    this.emit("state", { action: a.type });
    return r;
  }

  // Convenience wrappers
  start() { return this.dispatch({ type: "start" }); }
  search(query) { return this.dispatch({ type: "search", query }); }
  searchImage(image, flip = false) { return this.dispatch({ type: "searchImage", image, flip }); }
  open(artifact, version) { return this.dispatch({ type: "open", artifact, version }); }
  login(site, user, pass) { return this.dispatch({ type: "login", site, user, pass }); }
  ask(to, topic) { return this.dispatch({ type: "message", to, msg: { kind: "ask", topic } }); }
  show(to, artifact, version) { return this.dispatch({ type: "message", to, msg: { kind: "show", artifact, version } }); }
  reply(to, option) { return this.dispatch({ type: "message", to, msg: { kind: "reply", option } }); }
  save(ref) { return this.dispatch({ type: "saveEvidence", ref }); }
  hypothesize(hypothesis) { return this.dispatch({ type: "createHypothesis", hypothesis }); }
  link(hypothesis, evidence, on = true) { return this.dispatch({ type: "linkEvidence", hypothesis, evidence, on }); }
  /** Free note. `from` says where it was written (artifact/message), `about` what it names. */
  note(t, from, about) { return this.dispatch({ type: "addNote", text: t, ...(from ? { from } : {}), ...(about ? { about } : {}) }); }
  editNote(id, t) { return this.dispatch({ type: "updateNote", id, text: t }); }
  deleteNote(id) { return this.dispatch({ type: "deleteNote", id }); }
  review(channel, hypotheses) { return this.dispatch({ type: "review", channel, hypotheses }); }
  publish(channel, hypotheses) { return this.dispatch({ type: "publish", channel, hypotheses }); }
  sleep() { return this.dispatch({ type: "sleep" }); }
  /** The player acts on a name they can see (context menu). */
  investigate(id, text) { return this.dispatch({ type: "investigate", id, text }); }

  #start() {
    if (this.s.started) return { ok: true, already: true };
    this.s.started = true;
    for (const id of this.w.meta.startArtifacts || []) this.s.artifacts[id] = { ...this.s.artifacts[id], visible: true, wasVisible: true };
    fire(this, "game.start", {});
    fire(this, "day.start", { day: this.s.day });
    return { ok: true };
  }

  #search(query) {
    const q = String(query || "").trim();
    if (!q) return { ok: true, results: [] };
    this.s.searches.push({ q, day: this.s.day });
    const results = search(this, q);
    investigateQuery(this, q, results.length > 0);
    fire(this, "search", { query: q.toLowerCase(), terms: q.toLowerCase().split(/\s+/) });
    return { ok: true, results };
  }

  #searchImage(image, flip) {
    const seenImage = [...this.w.imageUse.get(image) || []].some(id => this.s.seen[id] != null);
    if (!seenImage) return { error: "not_seen" };
    const results = searchImage(this, image, { flip: !!flip });
    fire(this, "image.search", { image, flip: !!flip });
    return { ok: true, results };
  }

  #open(id, version) {
    const v = viewArtifact(this, id, version ? { version } : {});
    if (v.error || v.locked) return v.error ? { error: v.error, view: v } : { ok: true, view: v };
    const first = this.s.seen[id] == null;
    if (first) this.s.seen[id] = this.s.day;
    // Reading only encounters names. A profile is looked up on purpose, so its account is investigated.
    for (const m of mentionsOf(this, id, v.versionId)) encounter(this, m);
    const a = this.w.artifacts.get(id);
    if (a.author) { if (a.type === "profile") markInvestigated(this, a.author); else encounter(this, a.author); }
    fire(this, "artifact.open", { artifact: id, version: v.versionId, cached: v.cached });
    return { ok: true, view: v, first };
  }

  #login(site, user, pass) {
    const def = asArray(this.w.meta.logins).find(l => l.site === site);
    if (!def) return { error: "unknown_site" };
    if (def.if && !this.check(def.if)) return { error: "login_failed" };
    if (String(user).trim().toLowerCase() !== def.user.toLowerCase() || String(pass) !== def.pass) return { error: "login_failed" };
    this.s.loggedIn[site] = true;
    fire(this, "login", { site });
    return { ok: true };
  }

  #sleep() {
    this.s.day += 1;
    runPending(this);
    fire(this, "day.start", { day: this.s.day });
    this.checkEndings();
    this.emit("day", { day: this.s.day });
    return { ok: true, day: this.s.day };
  }

  #readNotification(id) {
    const n = this.s.notifications.find(n => n.id === id);
    if (n) n.read = true;
    return { ok: true };
  }

  // ── Called by effects ─────────────────────────────────────────────────────

  receiveMessage(m) {
    const s = this.s;
    const thread = m.from ?? this.w.characterByAccount.get(m.fromAccount) ?? m.fromAccount;
    const msg = { id: `M${s.nextId++}`, thread, from: thread, day: s.day, text: text(this, m.text), kind: "text",
      attach: asArray(m.attach), supports: asArray(m.supports), source: m.source ?? thread, mentions: asArray(m.mentions) };
    s.messages.push(msg);
    msg.attach = msg.attach.filter(id => !this.w.disabled?.has(id));
    for (const id of msg.attach) s.artifacts[id] = { ...s.artifacts[id], visible: true, wasVisible: true };
    for (const id of msg.mentions) encounter(this, id);
    // Someone who writes to you is an established contact.
    const c = this.w.characters.get(thread);
    if (c?.account) markInvestigated(this, c.account);
    if (c?.entity) markInvestigated(this, c.entity);
    this.notify({ text: msg.text, ref: { message: msg.id, thread } });
    this.emit("message", msg);
  }

  notify(n) {
    const item = { id: `n${this.s.nextId++}`, day: this.s.day, text: text(this, n.text), ref: n.ref ?? null, read: false };
    this.s.notifications.push(item);
    this.emit("notify", item);
  }

  checkEndings() {
    for (const m of this.w.mysteries.values()) {
      for (const e of asArray(m.endings)) {
        const key = `${m.id}:${e.id}`;
        if (this.s.endings.includes(key)) continue;
        if (asArray(e.requiresEnding).some(r => !this.s.endings.includes(`${m.id}:${r}`))) continue;
        if (!this.check(e.if)) continue;
        this.s.endings.push(key);
        applyEffects(this, e.effects, { ending: key });
        this.emit("ending", { mystery: m.id, ending: e.id });
      }
    }
  }

  // ── Queries (no state change) ─────────────────────────────────────────────
  view(id, version) { return viewArtifact(this, id, version ? { version } : {}); }
  imageInfo(id) { return imageInfo(this, id); }
  contacts() { return contacts(this); }
  canContact(id) { return canContact(this, id); }
  thread(id) { return thread(this, id); }
  prompts(id) { return availablePrompts(this, id); }
  /** @returns {"unknown"|"encountered"|"investigated"|"saved"} */
  discovery(id) { return discoveryState(this, id); }
  /** Names met in opened content (not yet necessarily investigated). */
  encountered() { return Object.keys(this.s.encountered).filter(id => !this.w.entities.get(id)?.secret); }
  /** Investigated or saved: what the player's tools (topics, theories, suggestions) may show. */
  known() { return Object.keys(this.s.known).filter(id => this.w.entities.has(id) || this.w.accounts.has(id)).filter(id => !this.w.entities.get(id)?.secret); }
  /** Known people, organisations, accounts, places, events… with their kind, for topic and hypothesis pickers. */
  topics() { return this.known().map(id => ({ id, kind: CB.kindOfId(this, id), name: nameOf(this.w, id) })); }
  /** Who and what a piece of evidence is about, and its source key. Never the claims it supports. */
  evidenceAbout(evId) { const e = this.s.evidence.find(x => x.id === evId); return e ? CB.evidenceAbout(this, e) : null; }
  hypothesisLabel(h) { return CB.hypothesisLabel(this, h); }
  /** References (names, handles, addresses, dates, numbers) in a text, for tappable content. */
  scan(text) { return scanText(this.w, text); }
  /** Search suggestions from earlier searches and things already met. */
  suggest(q, limit) { return suggest(this, q, limit); }
  casebook() { return CB.casebookView(this); }
  predicates() { return [...this.w.predicates.values()]; }
  channels() { return [...this.w.channels.values()].filter(c => !c.if || this.check(c.if)); }
}

/** Rebuild a game by replaying a log. Used by tests to prove determinism. */
export function replay(world, opts, actions) {
  const g = new Game(world, opts);
  for (const a of actions) g.dispatch(a);
  return g;
}
