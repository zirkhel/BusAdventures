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
import { updateEvidence, addQuestion, updateQuestion, linkQuestion, deleteQuestion, addLink, updateLink, removeLink } from "./workbench.js";
import { compareView } from "./compare.js";
import { archiveView } from "./archive.js";
import { savedArtifactView } from "./artifacts.js";
import * as CB from "./casebook.js";
import * as TL from "./timeline.js";
import * as CS from "./cases.js";
import * as FD from "./feed.js";
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
      case "start": r = this.#start(a.case); break;
      case "search": r = this.#search(a.query, a.platform); break;
      case "searchImage": r = this.#searchImage(a.image, a.flip); break;
      case "open": r = this.#open(a.artifact, a.version); break;
      case "login": r = this.#login(a.site, a.user, a.pass); break;
      case "message": r = sendMessage(this, a.to, a.msg); break;
      case "updateEvidence": r = updateEvidence(this, a.id, a.patch); break;
      case "saveEvidence": r = CB.saveEvidence(this, a.ref); break;
      case "removeEvidence": r = CB.removeEvidence(this, a.id); TL.forgetEvidence(this, a.id); break;
      case "createHypothesis": r = CB.createHypothesis(this, a.hypothesis); break;
      case "updateHypothesis": r = CB.updateHypothesis(this, a.id, a.patch); break;
      case "deleteHypothesis": r = CB.deleteHypothesis(this, a.id); TL.forgetTheory(this, a.id); break;
      case "linkEvidence": r = CB.linkEvidence(this, a.hypothesis, a.evidence, a.on ?? true, a.stance ?? "supports"); break;
      case "setTheoryStatus": r = CB.setTheoryStatus(this, a.id, a.status); break;
      case "linkAlternative": r = CB.linkAlternative(this, a.hypothesis, a.other, a.on ?? true); break;
      case "addQuestion": r = addQuestion(this, a.question); break;
      case "updateQuestion": r = updateQuestion(this, a.id, a.patch); break;
      case "linkQuestion": r = linkQuestion(this, a.id, a.kind, a.ref, a.on ?? true); break;
      case "deleteQuestion": r = deleteQuestion(this, a.id); break;
      case "addLink": r = addLink(this, a.link); break;
      case "updateLink": r = updateLink(this, a.id, a.patch); break;
      case "removeLink": r = removeLink(this, a.id); break;
      case "addNote": r = CB.addNote(this, a.text, a.from, a.about); break;
      case "updateNote": r = CB.updateNote(this, a.id, a.text); break;
      case "deleteNote": r = CB.deleteNote(this, a.id); break;
      case "review": r = CB.review(this, a.channel, a.hypotheses, { case: a.case }); break;
      case "publish": r = CB.publish(this, a.channel, a.hypotheses, { case: a.case, events: a.events }); break;
      case "setCases": r = CS.setCases(this, a.kind, a.id, a.cases); break;
      case "sleep": r = this.#sleep(); break;
      case "readNotification": r = this.#readNotification(a.id); break;
      case "investigate": r = investigate(this, a.id, a.text); break;
      case "createEvent": r = TL.createEvent(this, a.event); break;
      case "updateEvent": r = TL.updateEvent(this, a.id, a.patch); break;
      case "deleteEvent": r = TL.deleteEvent(this, a.id); break;
      case "linkEventEvidence": r = TL.linkEventEvidence(this, a.event, a.evidence, a.stance ?? null); break;
      case "watch": r = this.#watch(a.artifact); break;
      case "scrollFeed": r = this.#scrollFeed(a.platform, a.tab, a.offset); break;
      case "follow": r = FD.follow(this, a.account, a.on ?? true); break;
      case "like": r = FD.like(this, a.artifact, a.on ?? true); if (r.ok && (a.on ?? true)) fire(this, "video.like", { artifact: a.artifact }); break;
      case "notInterested": r = FD.notInterested(this, a.artifact, a.on ?? true); break;
      case "linkEventTheory": r = TL.linkEventTheory(this, a.event, a.hypothesis, a.on ?? true); break;
      default: throw new Error(`Unknown action "${a.type}"`);
    }
    if (this.s.started && !r?.error) CS.updateCases(this);
    if (!r?.error) this.s.log.push(deepClone(action));
    this.emit("state", { action: a.type });
    return r;
  }

  // Convenience wrappers
  /** Start the game, or start another case. Without a case: the only case on the start screen. */
  start(caseId) { return this.dispatch({ type: "start", ...(caseId ? { case: caseId } : {}) }); }
  /** Free search. opts.platform: search inside one app. */
  search(query, opts = {}) { return this.dispatch({ type: "search", query, ...(opts.platform ? { platform: opts.platform } : {}) }); }
  searchImage(image, flip = false) { return this.dispatch({ type: "searchImage", image, flip }); }
  open(artifact, version) { return this.dispatch({ type: "open", artifact, version }); }
  login(site, user, pass) { return this.dispatch({ type: "login", site, user, pass }); }
  ask(to, topic) { return this.dispatch({ type: "message", to, msg: { kind: "ask", topic } }); }
  show(to, artifact, version) { return this.dispatch({ type: "message", to, msg: { kind: "show", artifact, version } }); }
  reply(to, option) { return this.dispatch({ type: "message", to, msg: { kind: "reply", option } }); }
  evidenceView(id) { return savedArtifactView(this, id); }
  editEvidence(id, patch) { return this.dispatch({ type: "updateEvidence", id, patch }); }
  save(ref) { return this.dispatch({ type: "saveEvidence", ref }); }
  hypothesize(hypothesis) { return this.dispatch({ type: "createHypothesis", hypothesis }); }
  /** Link evidence to a theory: stance "supports" (for, the default) or "contradicts" (against). */
  link(hypothesis, evidence, on = true, stance = "supports") { return this.dispatch({ type: "linkEvidence", hypothesis, evidence, on, ...(stance !== "supports" ? { stance } : {}) }); }
  /** The player's own status for a theory: open (working theory), convinced or rejected. Logged with the day. */
  setTheoryStatus(id, status) { return this.dispatch({ type: "setTheoryStatus", id, status }); }
  linkAlternative(hypothesis, other, on = true) { return this.dispatch({ type: "linkAlternative", hypothesis, other, on }); }
  /** An open question in Notes. question: { text, links?: { evidence, topics, sources, theories } }. */
  addQuestion(question) { return this.dispatch({ type: "addQuestion", question }); }
  editQuestion(id, patch) { return this.dispatch({ type: "updateQuestion", id, patch }); }
  linkQuestion(id, kind, ref, on = true) { return this.dispatch({ type: "linkQuestion", id, kind, ref, on }); }
  deleteQuestion(id) { return this.dispatch({ type: "deleteQuestion", id }); }
  /** Link evidence: link = { items: [evidence ids], kind: supports|contradicts|related|same_origin|manipulated|unrelated, note? }. */
  addLink(link) { return this.dispatch({ type: "addLink", link }); }
  editLink(id, patch) { return this.dispatch({ type: "updateLink", id, patch }); }
  removeLink(id) { return this.dispatch({ type: "removeLink", id }); }
  /** Free note. `from` says where it was written (artifact/message), `about` what it names. */
  note(t, from, about) { return this.dispatch({ type: "addNote", text: t, ...(from ? { from } : {}), ...(about ? { about } : {}) }); }
  editNote(id, t) { return this.dispatch({ type: "updateNote", id, text: t }); }
  deleteNote(id) { return this.dispatch({ type: "deleteNote", id }); }
  review(channel, hypotheses, opts = {}) { return this.dispatch({ type: "review", channel, hypotheses, ...(opts.case ? { case: opts.case } : {}) }); }
  /** Publish a report. opts.case: which case it is about; opts.events: timeline events to include. */
  publish(channel, hypotheses, opts = {}) { return this.dispatch({ type: "publish", channel, hypotheses, ...(opts.case ? { case: opts.case } : {}), ...(opts.events ? { events: opts.events } : {}) }); }
  /** Classify a Casebook item (kind: evidence | hypothesis | note | event). [] = unclassified. */
  setCases(kind, id, cases) { return this.dispatch({ type: "setCases", kind, id, cases }); }
  sleep() { return this.dispatch({ type: "sleep" }); }
  /** The player acts on a name they can see (context menu). */
  investigate(id, text) { return this.dispatch({ type: "investigate", id, text }); }
  addEvent(event) { return this.dispatch({ type: "createEvent", event }); }
  editEvent(id, patch) { return this.dispatch({ type: "updateEvent", id, patch }); }
  deleteEvent(id) { return this.dispatch({ type: "deleteEvent", id }); }
  linkEvent(event, evidence, stance) { return this.dispatch({ type: "linkEventEvidence", event, evidence, stance }); }
  linkEventTheory(event, hypothesis, on = true) { return this.dispatch({ type: "linkEventTheory", event, hypothesis, on }); }
  /** Watch a clip (or read a feed item): the same as opening it, plus a video.view event. */
  watch(artifact) { return this.dispatch({ type: "watch", artifact }); }
  /** A page of a platform's feed (tab: forYou | following). Fires feed.scroll. */
  scrollFeed(platform, tab = "forYou", offset = 0) { return this.dispatch({ type: "scrollFeed", platform, tab, offset }); }
  follow(account, on = true) { return this.dispatch({ type: "follow", account, on }); }
  like(artifact, on = true) { return this.dispatch({ type: "like", artifact, on }); }
  notInterested(artifact, on = true) { return this.dispatch({ type: "notInterested", artifact, on }); }

  #start(caseId) {
    if (this.s.started) return caseId ? CS.startCase(this, caseId) : { ok: true, already: true };
    const id = caseId ?? (() => { const l = CS.menuCases(this); return l.length ? l[0] : Object.keys(this.s.cases).find(k => this.s.cases[k].status === "available"); })();
    if (caseId && this.s.cases[caseId]?.status !== "available") return { error: this.s.cases[caseId] ? "case_locked" : "unknown_case" };
    this.s.started = true;
    for (const a of this.w.meta.startArtifacts || []) this.s.artifacts[a] = { ...this.s.artifacts[a], visible: true, wasVisible: true };
    if (id) CS.startCase(this, id);
    fire(this, "game.start", {});
    fire(this, "day.start", { day: this.s.day });
    return { ok: true, case: id ?? null };
  }

  #search(query, platform) {
    const q = String(query || "").trim();
    if (!q) return { ok: true, results: [] };
    if (platform && !this.w.platforms.has(platform)) return { error: "unknown_platform" };
    this.s.searches.push({ q, day: this.s.day, ...(platform ? { platform } : {}) });
    const results = search(this, q, platform ? { platform } : {});
    investigateQuery(this, q, results.length > 0);
    fire(this, "search", { query: q.toLowerCase(), terms: q.toLowerCase().split(/\s+/), platform: platform ?? null });
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
    // A byline is a name on the page: met, not investigated.
    for (const b of v.byline || []) if (this.w.accounts.has(b)) encounter(this, b);
    fire(this, "artifact.open", { artifact: id, version: v.versionId, cached: v.cached });
    return { ok: true, view: v, first };
  }

  #watch(id) {
    const r = this.#open(id);
    if (r.error || r.view?.locked) return r;
    fire(this, "video.view", { artifact: id, platform: this.w.artifacts.get(id).platform });
    return r;
  }

  #scrollFeed(platform, tab, offset) {
    if (!this.w.platforms.has(platform)) return { error: "unknown_platform" };
    if (tab !== "forYou" && tab !== "following") return { error: "bad_tab" };
    const page = FD.feed(this, { platform, tab, offset: offset ?? 0 });
    fire(this, "feed.scroll", { platform, tab, offset: offset ?? 0 });
    return { ok: true, ...page };
  }

  #login(site, user, pass) {
    const def = this.logins().find(l => l.site === site);
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
    const item = { id: `n${this.s.nextId++}`, day: this.s.day, text: text(this, n.text), ref: n.ref ?? null, from: n.from ?? null, read: false };
    this.s.notifications.push(item);
    this.emit("notify", item);
  }

  /** Endings of started cases only. A closing ending closes its case; the world goes on. */
  checkEndings() {
    for (const m of this.w.mysteries.values()) {
      const st = this.s.cases?.[m.id]?.status;
      if (st !== "active" && st !== "closed") continue;
      const ctx = this.caseCtx(m.id);
      for (const e of asArray(m.endings)) {
        const key = `${m.id}:${e.id}`;
        if (this.s.endings.includes(key)) continue;
        if (asArray(e.requiresEnding).some(r => !this.s.endings.includes(`${m.id}:${r}`))) continue;
        if (!check(e.if, ctx)) continue;
        this.s.endings.push(key);
        this.s.fired[`ending:${key}`] = this.s.day;   // the day the case took this turn
        if (e.closes) CS.closeCase(this, m.id);
        applyEffects(this, e.effects, { ending: key });
        this.emit("ending", { mystery: m.id, ending: e.id });
        // The player is told, wherever they are, as a development in the case (never "game over");
        // the epilogue is in the Casebook's reports, and the investigation stays open.
        this.notify({ text: `${m.title}: ${e.title ?? e.id}`, ref: { case: m.id } });
      }
    }
  }

  /** Condition context for a case's rules and endings: deadlines count from the case's start. */
  caseCtx(id) { return Object.assign(Object.create(this.ctx), { caseStart: CS.caseStart(this, id) }); }

  /** Logins the world knows: the universe's and those of started cases. */
  logins() {
    const out = [...asArray(this.w.meta.logins)];
    for (const c of CS.caseList(this)) out.push(...asArray(this.w.mysteries.get(c.id)?.start?.logins));
    return out;
  }

  // ── Queries (no state change) ─────────────────────────────────────────────
  view(id, version) { return viewArtifact(this, id, version ? { version } : {}); }
  /** Browser's Archive: every reachable copy of a page the player has seen (W8). No state changes. */
  archive(id) { return archiveView(this, id); }
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
  /** Visible sources among the saved evidence (key, label, count), for pickers. Never hidden origins. */
  visibleSources() { return CB.visibleSources(this); }
  /** Items side by side: refs are {evidence} or reachable {artifact, version?, image?} / {message}. No state change. */
  compare(refs) { return compareView(this, refs); }
  /** References (names, handles, addresses, dates, numbers) in a text, for tappable content. */
  scan(text) { return scanText(this.w, text); }
  /** Search suggestions from earlier searches and things already met. */
  suggest(q, limit) { return suggest(this, q, limit); }
  casebook() { return CB.casebookView(this); }
  /** The player's timeline, sorted by the player's own dates. */
  timeline() { return TL.timelineView(this); }
  /** Dates visible on a source, to prefill an event. */
  dateCandidates(source) { return TL.dateCandidates(this, source); }
  parseDate(text, yearHint) { return TL.parseDateText(text, yearHint); }
  predicates() { return [...this.w.predicates.values()]; }
  /** Channels open to a case (all available channels without one). */
  channels(caseId) { return caseId ? CB.channelsFor(this, caseId) : [...this.w.channels.values()].filter(c => !c.if || this.check(c.if)); }
  /** Cases the player can classify under and report on. */
  cases() { return CS.caseList(this); }
  caseStatus(id) { return CS.caseStatus(this, id); }
  /** Deadlines in active cases that the player has learnt about (never unknown ones). */
  deadlines() { return CS.knownDeadlines(this); }
  /** Today's and tomorrow's date and day, for the sleep dialog. No state change. */
  dayInfo() { return { day: this.s.day, date: this.date, nextDay: this.s.day + 1, nextDate: addDays(this.date, 1) }; }
  /** Cases that can be started from the start screen. */
  menuCases() { return CS.menuCases(this); }
  /** A feed page without side effects (for rendering). */
  feed(platform, tab = "forYou", offset = 0, limit = 10) { return FD.feed(this, { platform, tab, offset, limit }); }
  /** A newspaper's list, newest first: front page, a section (opts.section) or an author (opts.author). */
  news(platform, opts = {}) { return FD.newsList(this, { platform, ...opts }); }
  /** The player's follows, likes and "not interested". */
  media() { return FD.mediaView(this); }
  /** Endings reached, with epilogues. */
  endings() { return CS.endingsView(this); }
}

/** Rebuild a game by replaying a log. Used by tests to prove determinism. */
export function replay(world, opts, actions) {
  const g = new Game(world, opts);
  for (const a of actions) g.dispatch(a);
  return g;
}
