// @ts-check
// The phone: status bar, lock screen, home screen, apps with their own back stacks,
// notification banners, the image viewer and toasts. Talks to the game only through
// its public methods (dispatch wrappers and queries).

import { h, icon, clock, fmtDate, weekday, fmtEventDate } from "./ui.js";
import { img, avatar } from "./media.js";
import { browserApp } from "./apps/browser.js";
import { connectApp } from "./apps/connect.js";
import { messagesApp } from "./apps/messages.js";
import { casebookApp } from "./apps/casebook.js";
import { settingsApp } from "./apps/settings.js";
import { newsApp } from "./apps/news.js";
import { Tips } from "./tips.js";
import { ContextSystem, registerDefaultActions } from "./context.js";
import { resolveBrowse, toggleBookmark, isBookmarked, stepTextSize, migrateBrowser } from "../core/browser.js";
import { canonicalUrl } from "../core/sites.js";

export class Phone {
  /**
   * @param {HTMLElement} root
   * @param {any} game
   * @param {{restart:()=>void, exportSave:()=>void, importSave:(f:File)=>void, store?:any}} host
   */
  constructor(root, game, host) {
    this.root = root;
    this.g = game;
    this.host = host;
    const w = game.w;
    /** url (lowercase, no protocol) → artifact id */
    this.urls = new Map();
    for (const a of w.artifacts.values()) if (a.url) this.urls.set(normUrl(a.url), a.id);
    for (const [old, id] of w.urlAlias || []) if (!this.urls.has(old)) this.urls.set(old, id);
    /** handle (lowercase, with and without @) → account id */
    this.handles = new Map();
    for (const acc of w.accounts.values()) {
      const k = String(acc.handle).toLowerCase();
      this.handles.set(k, acc.id); this.handles.set(k.replace(/^@/, ""), acc.id);
    }

    this.apps = Object.fromEntries([browserApp, connectApp, messagesApp, casebookApp, settingsApp].map(f => { const a = f(this); return [a.id, a]; }));
    /** Apps made from platform data (news template): platform id → app id. A new paper is only content. */
    this.platformApp = new Map();
    for (const pf of w.platforms.values()) if (pf.app?.template === "news") {
      const a = newsApp(this, pf);
      this.apps[a.id] = a; this.platformApp.set(pf.id, a.id);
    }
    /** @type {Record<string, any[]>} */
    this.stacks = {};
    /** Browser screens popped by Back, session-only (not saved). */
    this.browserForward = [];
    /** "lock" | "home" | app id */
    this.where = "lock";

    this.status = h("div.status");
    this.screen = h("div.screen");
    this.bannerBox = h("div.banners");
    this.overlay = h("div.overlay");
    this.toastBox = h("div.toasts");
    // Always-visible home button in every app: one tap to the home screen, however deep you are.
    this.homeBar = h("div.homebar", h("button.hb-pill", { "aria-label": "Home screen", onclick: () => this.goHome() }, icon("home"), h("span", "Home")));
    /** Introduction and first-use tips. */
    this.tips = new Tips(this);
    root.replaceChildren(this.status, this.screen, this.bannerBox, this.tips.box, this.overlay, this.toastBox, this.homeBar);
    /** The shared context action system (tappable words, action sheets, text selection). */
    this.ctx = new ContextSystem(this);
    registerDefaultActions(this.ctx);
    /** Recently visited pages, conversations and searches, newest first. Per game (keyed by seed). */
    this.recentKey = `ba_deadinternet_recent_${game.w.meta.id}_${game.s.seed}`;
    this.recent = this.#loadRecent();
    /** The screen descriptor currently on screen (to remember its scroll position). */
    this.shown = null;

    this.#gestures();
    game.on("notify", n => { if (n.ref?.case) this.pendingTip = "outcome"; this.#banner(n); });
    game.on("state", () => { this.#statusBar(); this.#badges(); });
    this.#statusBar();
    setInterval(() => this.#statusBar(), 15000);
    this.#historyTrap();
  }

  str(key) { const v = key.split(".").reduce((o, k) => o?.[k], this.g.w.strings); return v ?? key; }

  // ── Navigation ────────────────────────────────────────────────────────────

  lock() { this.where = "lock"; this.#render(); }
  unlock() { this.woke = false; this.goHome(); this.tips.intro(); }
  goHome() { this.closeOverlay(); this.where = "home"; this.#render(); }

  openApp(id) {
    if (!this.stacks[id]?.length) this.stacks[id] = [this.apps[id].root()];
    // Opened on purpose from the home screen: it no longer "returns" to where a link came from.
    for (const d of this.stacks[id]) delete d.returnTo;
    this.where = id;
    this.closeOverlay();
    this.#render();
  }

  /**
   * Push a screen on an app's stack and show it. Coming from another app, the screen remembers
   * where it came from, so Back (and the link in the status bar) returns straight there with
   * that app's page and scroll position intact.
   */
  push(appId, desc, opts = {}) {
    if (!this.stacks[appId]?.length) this.stacks[appId] = [this.apps[appId].root()];
    if (appId !== this.where && this.apps[this.where] && this.top) desc.returnTo = { app: this.where, title: this.titleOf(this.where, this.top) };
    if (appId === "browser" && !opts.keepForward) this.browserForward = [];
    this.stacks[appId].push(desc);
    this.#remember(appId, desc);
    this.where = appId;
    this.closeOverlay();
    this.#render(true);
  }

  /** Replace the top screen of the current app (used after a sign-in or a search). */
  replaceTop(desc) {
    if (this.where === "browser") this.browserForward = [];
    const st = this.stacks[this.where];
    if (st?.length) {
      const old = st[st.length - 1];
      if (old?.returnTo && !("returnTo" in desc)) desc.returnTo = old.returnTo;
      if (!("scroll" in desc) || desc === old) desc.scroll = this.screen.querySelector(".scroll")?.scrollTop ?? 0;
      st[st.length - 1] = desc;
      this.shown = desc;
    }
    this.#render();
  }

  /** Back inside the phone: close an overlay, pop the app's stack, or go to the home screen. */
  back() {
    if (this.overlay.childElementCount) { this.closeOverlay(); return; }
    const st = this.stacks[this.where];
    if (!st) { if (this.where === "lock") this.unlock(); return; }
    const ret = this.top?.returnTo;
    if (ret && this.stacks[ret.app]?.length) { st.pop(); this.where = ret.app; this.#render(false, true); return; }
    if (st.length > 1) {
      const popped = st.pop();
      if (this.where === "browser") this.browserForward.push(popped);
      this.#render(false, true);
    }
    else this.goHome();
  }

  /** Browser forward: restore a screen popped by Back. No-op in other apps. */
  forward() {
    if (!this.canForward()) return;
    const desc = this.browserForward.pop();
    this.push("browser", desc, { keepForward: true });
  }

  canForward() { return this.where === "browser" && this.browserForward.length > 0; }

  /** Short title of a screen, for the "return to" link and the recent list. */
  titleOf(appId, desc) {
    if (!desc) return this.str(`apps.${appId}`);
    const own = this.apps[appId]?.title?.(desc);
    if (own) return own;
    if (desc.kind === "page") return desc.view?.title || desc.url || "Page";
    if (desc.kind === "thread") return this.contactName(desc.id);
    if (desc.kind === "results") return desc.title || `“${desc.q}”`;
    if (desc.kind === "hyp") return "Theory";
    if (desc.kind === "question") return "Question";
    if (desc.kind === "compare") return "Compare";
    if (desc.kind === "link") return "Connection";
    if (desc.kind === "event") return this.g.s.timeline.find(e => e.id === desc.id)?.title || "Event";
    if (desc.kind === "eventEdit") return "Event";
    if (desc.kind === "reports" || desc.kind === "report" || desc.kind === "reportDone") return "Reports";
    const name = this.str(`apps.${appId}`);
    return name.startsWith("apps.") ? appId[0].toUpperCase() + appId.slice(1) : name;
  }

  /** The top-left button of every app: back while there is somewhere to go back to, otherwise home. */
  backButton() {
    const atRoot = (this.stacks[this.where]?.length ?? 1) <= 1 && !this.overlay.childElementCount && !this.top?.returnTo;
    return h("button.icon-btn.nav-btn", { "aria-label": atRoot ? "Home" : "Back", onclick: () => this.back() },
      icon(atRoot ? "home" : "back"), atRoot ? h("span.nav-label", "Home") : null);
  }

  /**
   * The browser's own back button (Android back, iOS swipe, desktop Back) stays inside the game.
   * One extra history entry is kept on top. Every back press lands on it, is undone, and is handled
   * as an in-game back. Only on the home screen does a second press within 2 seconds leave the game.
   */
  #historyTrap() {
    let exitArmed = 0;
    history.replaceState({ di: "base" }, "");
    history.pushState({ di: "top" }, "");
    window.addEventListener("popstate", () => {
      const atHome = this.where === "home" || this.where === "lock";
      if (atHome && !this.overlay.childElementCount) {
        if (Date.now() - exitArmed < 2000) { history.back(); return; }
        exitArmed = Date.now();
        this.toast("Press back again to leave the game.");
      } else {
        this.back();
      }
      history.pushState({ di: "top" }, "");
    });
  }

  get top() { const st = this.stacks[this.where]; return st?.[st.length - 1]; }
  refresh() { this.#render(); }

  // ── Opening things ────────────────────────────────────────────────────────

  /** Which app shows an artifact: Connect for Connect, the current app for private items, the Browser for the web. */
  appFor(id) {
    const a = this.g.w.artifacts.get(id);
    if (a?.platform === "connect") return "connect";
    if (a && this.platformApp.has(a.platform)) return /** @type {string} */ (this.platformApp.get(a.platform));
    if (a?.platform === "messages") return this.apps[this.where] ? this.where : "messages";
    return "browser";
  }

  /** Open an artifact (dispatches `open`, so it counts as read) and show it. */
  openArtifact(id, version, appId) {
    const r = this.g.open(id, version);
    this.push(appId || this.appFor(id), { kind: "page", id, version: version ?? null, view: r.view, url: r.view?.url || "" });
  }

  openAccount(accId) {
    const pid = this.g.w.profileOf.get(accId);
    if (pid) this.openArtifact(pid, undefined, "connect");
    else this.toast("No profile found.");
  }

  /** News apps where an account has a byline: [{app, name}]. */
  bylineApps(accId) {
    const out = [];
    for (const [pf, app] of this.platformApp) if (this.g.news(pf, { author: accId, limit: 1 }).total) out.push({ app, name: this.apps[app].name });
    return out;
  }

  /** Author page in a news app. */
  openAuthor(accId, appId) { const a = this.apps[appId]; if (a?.openAuthor) a.openAuthor(accId); }

  accountByHandle(handle) { return this.handles.get(String(handle).toLowerCase()) || null; }

  /** Address bar / tapped link: open a known address, a site-status page, or search Seeker. */
  browse(text) {
    let t = String(text || "").trim();
    if (!t) return;
    if (t.includes("•") && t.includes("@")) t = t.split("@").pop() || t; // masked email: follow the domain
    const date = String(this.g.date || "").slice(0, 10);
    const r = resolveBrowse(this.g.w, t, date);
    if (r.kind === "empty") return;
    if (r.kind === "page") {
      this.openArtifact(r.artifact, undefined, this.appFor(r.artifact) === "connect" ? "connect" : "browser");
      return;
    }
    if (r.kind === "search") { this.search(r.q); return; }
    this.push("browser", { kind: r.kind, site: r.site, url: r.url });
  }

  /** Bookmark the current Browser address (separate from saving evidence to the Casebook). */
  toggleBookmark(desc) {
    if (!this.g.s.browser) migrateBrowser(this.g.s);
    const url = bookmarkUrlOf(desc);
    if (!url) return false;
    const on = toggleBookmark(this.g.s, {
      url,
      title: desc.view?.title || desc.title || url,
      artifact: desc.id || desc.artifact || null,
      version: desc.view?.versionId ?? desc.version ?? null,
      day: this.g.s.day,
    });
    this.g.emit("state", { action: "bookmark" });
    this.toast(on ? "Bookmarked." : "Bookmark removed.");
    this.refresh();
    return on;
  }

  isBookmarked(desc) {
    const url = bookmarkUrlOf(desc);
    return url ? isBookmarked(this.g.s, url) : false;
  }

  stepTextSize(delta) {
    if (!this.g.s.browser) migrateBrowser(this.g.s);
    stepTextSize(this.g.s, delta);
    this.g.emit("state", { action: "textSize" });
    this.refresh();
  }

  search(q, appId = "browser") {
    const t = String(q || "").trim();
    if (!t) return;
    const r = this.g.search(t);
    this.push(appId, { kind: "results", q: t, results: r.results || [] });
  }

  /** "Find Connect profile": a Connect search. Opens the profile directly when the search finds exactly one profile (or one whose name or handle is the text). */
  findProfile(text) {
    const w = this.g.w;
    const t = String(text || "").trim();
    if (!t) return;
    const r = this.g.search(t);
    const res = (r.results || []).filter(x => x.platform === "connect");
    const norm = x => String(x || "").toLowerCase().replace(/^@/, "");
    const exact = res.filter(x => {
      if (x.cached) return false;
      const a = w.artifacts.get(x.artifact);
      const acc = a?.type === "profile" ? w.accounts.get(a.author) : null;
      return acc && (norm(acc.handle) === norm(t) || norm(acc.displayName) === norm(t));
    });
    const profiles = res.filter(x => !x.cached && w.artifacts.get(x.artifact)?.type === "profile");
    const one = exact.length === 1 ? exact[0] : profiles.length === 1 ? profiles[0] : null;
    if (one) this.openArtifact(one.artifact, undefined, "connect");
    else this.push("connect", { kind: "results", q: t, results: res });
  }

  /** A look-up tool in the world (platform with `lookup`), such as a breach checker. */
  lookup(platformId, text) {
    const pf = this.g.w.platforms.get(platformId);
    if (!pf?.lookup) return;
    const q = String(text).trim();
    const url = pf.lookup.url.replace("{q}", q);
    const id = this.urls.get(normUrl(url));
    if (id && !this.g.view(id).error) { this.openArtifact(id, undefined, "browser"); return; }
    this.push("browser", { kind: "lookup", platform: platformId, q, url });
  }

  /** Seeker's cached copies of pages at an address. Found the same way a search finds them. */
  cachedFor(text) {
    const addr = canonicalUrl(this.g.w, text);
    const r = this.g.search(addr);
    const results = (r.results || []).filter(x => x.cached && normUrl(x.url || "").startsWith(addr));
    this.push("browser", { kind: "results", q: addr, results, title: `Cached: ${addr}`, cacheOnly: true });
  }

  /** The versions of a document the player can reach: the live one and Seeker's cached copies. */
  versions(id) {
    const v = this.g.view(id);
    const items = [];
    if (!v.error && !v.locked) items.push({ label: `Current version${v.date ? ` · ${fmtDate(v.date)}` : ""}`, icon: "globe", run: () => this.openArtifact(id, undefined, this.appFor(id)) });
    for (const vid of v.cachedVersions || []) {
      const c = this.g.view(id, vid);
      if (!c.error) items.push({ label: `Cached copy${c.date ? ` · ${fmtDate(c.date)}` : ""}`, icon: "clock", run: () => this.openArtifact(id, vid, "browser") });
    }
    if (!items.length) { this.toast("No versions are available."); return; }
    this.actionSheet(v.title || this.g.w.artifacts.get(id)?.title || "Versions", items);
  }

  /**
   * Compare items side by side in Casebook, from any app. refs: {evidence} or reachable
   * {artifact, version?, image?} / {message}. Browser's Archive ("Compare with…", W8) uses this.
   */
  compare(refs) { this.push("casebook", { kind: "compare", items: refs.map(r => ({ ...r })) }); }

  imageSearch(imageId, flip) {
    const r = this.g.searchImage(imageId, flip);
    if (r.error) { this.toast(this.str(`errors.${r.error}`)); return; }
    this.push("browser", { kind: "imageResults", image: imageId, flip, results: r.results });
  }

  /** Save a sourced selection as evidence; unsourced player text stays a note. */
  saveText(ref, origin = {}) {
    if (origin.artifact || origin.message) {
      return this.saveEvidence({ artifact: origin.artifact, version: origin.version, message: origin.artifact ? undefined : origin.message, quote: { text: ref.text } });
    }
    const about = ref.id && !ref.alias ? ref.id : undefined;
    const from = origin.artifact || origin.message ? { artifact: origin.artifact, version: origin.version, message: origin.message } : undefined;
    const r = this.g.note(ref.text, from, about);
    this.toast(r.error ? "Nothing to save." : "Saved to Casebook notes.");
  }

  copy(text) {
    const done = () => this.toast("Copied.");
    const fallback = () => {
      const t = h("textarea", { style: { position: "fixed", opacity: "0" } });
      /** @type {HTMLTextAreaElement} */ (t).value = text;
      document.body.append(t); /** @type {HTMLTextAreaElement} */ (t).select();
      try { document.execCommand("copy"); done(); } catch { this.toast("Couldn't copy."); }
      t.remove();
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch { fallback(); }
  }

  /** Pick a contact and ask them about a topic (context menu "Ask someone about this…"). */
  askAbout(topic) {
    const w = this.g.w;
    if (!this.g.known().includes(topic)) { this.toast("Look into it first."); return; }
    this.picker({ title: `Ask about ${w.entities.get(topic)?.name ?? w.accounts.get(topic)?.handle ?? topic}`, empty: "Nobody to ask yet.",
      groups: [{ title: "", items: this.g.contacts().map(id => ({ id, label: this.contactName(id), thumb: avatar(w, w.characters.get(id)?.account, 32) })) }],
      onPick: id => {
        const before = this.g.thread(id).length;
        const r = this.g.ask(id, topic);
        if (r?.error) { this.toast(this.str(`errors.${r.error}`)); return; }
        const th = this.g.thread(id);
        const first = th.findIndex((m, i) => i >= before && m.from !== "player");
        this.push("messages", { kind: "thread", id, typingFrom: first < 0 ? Infinity : first });
      } });
  }

  // ── Timeline helpers (used by the context menu and the Casebook) ─────────

  /** Where something was found, as a Timeline source. */
  sourceOf(origin) {
    if (origin?.message) return { message: origin.message };
    if (origin?.artifact) return { artifact: origin.artifact, version: origin.version ?? null };
    return null;
  }

  /** Saved evidence that is exactly this source, if any (used to offer it as supporting). */
  evidenceFor(src) {
    if (!src) return null;
    const ev = this.g.s.evidence;
    if (src.message) return ev.find(e => e.message === src.message) || null;
    if (src.image) return ev.find(e => e.artifact === src.artifact && e.image === src.image) || null;
    if (src.artifact) return ev.find(e => e.artifact === src.artifact && !e.image && !e.message && (!src.version || !e.version || e.version === src.version)) || null;
    return null;
  }

  /** Open the event editor with a draft. Nothing is created until the player saves. */
  newEvent(draft) {
    const e = this.evidenceFor(draft.source);
    this.push("casebook", { kind: "eventEdit", draft: { title: "", description: "", note: "", date: { kind: "unknown" }, about: [], evidence: e ? [{ id: e.id, stance: "supports" }] : [], ...draft } });
  }

  /** "Add to Timeline" on a date in text. */
  eventFromDate(ref, origin) {
    const src = this.sourceOf(origin);
    const year = String((src?.artifact && this.g.view(src.artifact, src.version || undefined).date) || this.g.date).slice(0, 4);
    const parsed = this.g.parseDate(ref.text, year);
    this.newEvent({ description: ref.context || "", date: parsed?.date || { kind: "unknown" }, dateSource: "in text", guessedYear: !!parsed?.guessedYear, source: src });
  }

  /** "Create event" from selected text. */
  eventFromText(text, origin) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    const src = this.sourceOf(origin);
    const year = String((src?.artifact && this.g.view(src.artifact, src.version || undefined).date) || this.g.date).slice(0, 4);
    const ds = this.g.scan(t).find(x => x.type === "date");
    const parsed = ds ? this.g.parseDate(ds.text, year) : null;
    this.newEvent({ title: t.length <= 90 ? t : t.slice(0, 80).replace(/\s\S*$/, "") + "…", description: t.length > 90 ? t : "",
      date: parsed?.date || { kind: "unknown" }, dateSource: parsed ? "in text" : "", guessedYear: !!parsed?.guessedYear, source: src });
  }

  /** "Add to Timeline" on an image, a document or a piece of evidence. */
  eventFromSource(source, title = "") { this.newEvent({ title, source }); }

  /** Attach saved evidence to an event the player already made. */
  attachToEvent(evId) {
    const events = this.g.timeline();
    this.picker({ title: "Attach to event", empty: "No events yet.",
      groups: [{ title: "", items: events.map(ev => ({ id: ev.id, label: ev.title, sub: fmtEventDate(ev.date) + (ev.evidence.some(x => x.id === evId) ? " · attached" : "") })) }],
      onPick: id => this.actionSheet("This evidence…", [
        { label: "Supports the event", icon: "check", run: () => { this.g.linkEvent(id, evId, "supports"); this.toast("Attached."); this.refresh(); } },
        { label: "Contradicts the event", icon: "close", run: () => { this.g.linkEvent(id, evId, "contradicts"); this.toast("Attached."); this.refresh(); } }]) });
  }

  /** Reopen something from the recent list. */
  openRecent(r) {
    if (r.kind === "page") this.openArtifact(r.id, r.version ?? undefined, r.app);
    else if (r.kind === "thread") this.push("messages", { kind: "thread", id: r.id });
    else if (r.kind === "results") this.search(r.q, "browser");
  }

  #loadRecent() {
    try { return JSON.parse(localStorage.getItem(this.recentKey) || "[]"); } catch { return []; }
  }

  #remember(appId, desc) {
    let r = null;
    if (desc.kind === "page" && desc.view && !desc.view.error && !desc.view.locked) r = { kind: "page", app: appId, id: desc.id, version: desc.view.cached ? desc.view.versionId : null, title: desc.view.title || desc.url, sub: desc.url || "" };
    else if (desc.kind === "thread") r = { kind: "thread", app: "messages", id: desc.id, title: this.contactName(desc.id), sub: "Messages" };
    else if (desc.kind === "results" && appId === "browser" && !desc.cacheOnly) r = { kind: "results", app: "browser", q: desc.q, title: desc.q, sub: "Seeker search" };
    if (!r) return;
    const key = `${r.kind}:${r.id ?? r.q}:${r.version ?? ""}`;
    this.recent = [{ ...r, key, day: this.g.s.day }, ...this.recent.filter(x => x.key !== key)].slice(0, 40);
    try { localStorage.setItem(this.recentKey, JSON.stringify(this.recent)); } catch { /* storage blocked: keep in memory */ }
  }

  saveEvidence(ref) {
    const r = this.g.save(ref);
    if (r.error) this.toast(this.str(`errors.${r.error}`));
    else this.toast(r.duplicate ? "Already in your Casebook." : "Saved to Casebook.");
    this.refresh();
    if (!r.error) this.tips.trigger("save");
    return r;
  }

  isSaved(ref) {
    const version = ref.artifact ? ref.version ?? this.g.view(ref.artifact).versionId ?? null : null;
    return this.g.s.evidence.some(e => !e.quote && e.artifact === (ref.artifact ?? null) && (e.version ?? null) === version &&
      (e.image ?? null) === (ref.image ?? null) && (e.message ?? null) === (ref.message ?? null));
  }

  openNotification(n) {
    if (!n.read) this.g.dispatch({ type: "readNotification", id: n.id });
    if (n.ref?.thread) this.push("messages", { kind: "thread", id: n.ref.thread });
    else if (n.ref?.artifact) this.openArtifact(n.ref.artifact);
    else if (n.ref?.case) { this.goHome(); this.openApp("casebook"); this.push("casebook", { kind: "reports" }); }
    else if (n.from) this.#openFrom(n.from);
    else this.goHome();
  }

  /** The app a platform lives in: its own (Connect, a paper), or the browser for a website. */
  #fromApp(pf) { return this.platformApp.get(pf) || (this.apps[pf] ? pf : null); }
  #fromName(pf) { const a = this.#fromApp(pf); return a ? (this.apps[a].name || this.str(`apps.${a}`)) : (this.g.w.platforms.get(pf)?.name || pf); }
  #openFrom(pf) {
    const a = this.#fromApp(pf);
    if (a) { this.goHome(); this.openApp(a); return; }
    const d = this.g.w.platforms.get(pf)?.domain;
    if (d) this.browse(d); else this.goHome();
  }

  // ── Image viewer ──────────────────────────────────────────────────────────

  viewImage(imageId, ctx, o = {}) {
    const g = this.g;
    const im = img(imageId, { cls: "zoom-img", eager: true });
    const stage = h("div.zoom-stage", im);
    const info = h("div.img-info");
    const saved = () => !!ctx?.artifact && this.isSaved({ artifact: ctx.artifact, version: ctx.version, image: imageId });
    const saveBtn = h("button", { onclick: () => { if (ctx?.artifact) { this.saveEvidence({ artifact: ctx.artifact, version: ctx.version, image: imageId }); saveBtn.replaceChildren(icon(saved() ? "bookmarked" : "bookmark"), h("span", "Save")); } } },
      icon(saved() ? "bookmarked" : "bookmark"), h("span", "Save"));
    const searchBy = flip => this.imageSearch(imageId, flip);
    const box = h("div.viewer",
      h("div.viewer-top", h("button.icon-btn", { "aria-label": "Close", onclick: () => this.closeOverlay() }, icon("close")),
        h("span.viewer-cap", g.w.images.get(imageId)?.caption || "")),
      stage, info,
      h("div.viewer-actions",
        h("button", { onclick: () => toggleInfo() }, icon("info"), h("span", "Image info")),
        h("button", { onclick: () => searchBy(false) }, icon("search"), h("span", "Search by image")),
        h("button", { onclick: () => searchBy(true) }, icon("flip"), h("span", "Flip & search")),
        ctx?.artifact ? saveBtn : null));
    const toggleInfo = () => {
      if (info.childElementCount) { info.replaceChildren(); return; }
      const rows = imageInfoRows(g.imageInfo(imageId), imageId);
      info.replaceChildren(h("dl", rows.map(([k, v]) => [h("dt", k), h("dd", v)])));
    };
    zoomable(stage, im);
    this.tips.trigger("image");
    if (o.info) toggleInfo();
    this.overlay.replaceChildren(box);
    this.overlay.classList.add("open");
  }

  /** Bottom sheet with actions. @param {{label:string, run:()=>void, danger?:boolean}[]} items */
  sheet(title, items) {
    const box = h("div.sheet", h("div.sheet-title", title),
      items.map(it => h("button.sheet-item", { class: it.danger ? "danger" : "", onclick: () => { this.closeOverlay(); it.run(); } }, it.label)),
      h("button.sheet-item.cancel", { onclick: () => this.closeOverlay() }, "Cancel"));
    const bg = h("div.sheet-bg", { onclick: e => { if (e.target === bg) this.closeOverlay(); } }, box);
    this.overlay.replaceChildren(bg);
    this.overlay.classList.add("open");
  }

  /**
   * Context action sheet: a title (the text that was tapped) and large buttons with icons.
   * @param {string} title
   * @param {{label:string, icon?:string, run:()=>void, secondary?:boolean}[]} items
   */
  actionSheet(title, items) {
    const t = String(title || "");
    const box = h("div.sheet.ctx-sheet", { role: "dialog", "aria-label": t },
      h("div.sheet-grab"),
      t ? h("div.ctx-title", t.length > 70 ? t.slice(0, 69) + "…" : t) : null,
      items.map(it => h("button.sheet-item.ctx-item", { class: it.secondary ? "secondary" : "", onclick: () => { this.closeOverlay(); it.run(); } },
        it.icon ? icon(it.icon) : null, h("span", it.label))),
      h("button.sheet-item.cancel", { onclick: () => this.closeOverlay() }, "Cancel"));
    const bg = h("div.sheet-bg", { onclick: e => { if (e.target === bg) this.closeOverlay(); } }, box);
    // Swipe the sheet down to dismiss it.
    let y0 = null;
    box.addEventListener("touchstart", e => { y0 = e.touches[0].clientY; }, { passive: true });
    box.addEventListener("touchend", e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 80) this.closeOverlay(); y0 = null; });
    this.overlay.replaceChildren(bg);
    this.overlay.classList.add("open");
  }

  /**
   * Full-height list picker with search.
   * search: always show the search field (otherwise only for more than 7 items). keywords: extra searchable text.
   * @param {{title:string, groups:{title:string, items:{id:string, label:string, sub?:string, keywords?:string, thumb?:Node}[]}[], empty?:string, note?:string, search?:boolean, searchLabel?:string, onPick:(id:string)=>void}} o
   */
  picker(o) {
    const q = /** @type {HTMLInputElement} */ (h("input.seek-input", { type: "search", placeholder: o.search ? "Search" : "Filter", "aria-label": o.searchLabel || "Filter", autocapitalize: "off", autocomplete: "off" }));
    const list = h("div.picker-list");
    const draw = () => {
      const f = q.value.trim().toLowerCase();
      const groups = o.groups.map(g => ({ ...g, items: g.items.filter(i => !f || `${i.label} ${i.sub || ""} ${i.keywords || ""}`.toLowerCase().includes(f)) })).filter(g => g.items.length);
      list.replaceChildren(...(groups.length ? groups.map(g => h("div.picker-group", g.title ? h("div.section-title", g.title) : null,
        g.items.map(i => h("button.picker-item", { onclick: () => { this.closeOverlay(); o.onPick(i.id); } }, i.thumb || null,
          h("div.pi-main", h("b", i.label), i.sub ? h("div.muted", i.sub) : null))))) : [h("div.empty.muted", o.empty || "Nothing here yet.")]));
    };
    q.addEventListener("input", draw);
    draw();
    const total = o.groups.reduce((n, g) => n + g.items.length, 0);
    const panel = h("div.picker",
      h("div.picker-head", h("div.bar-title", o.title), h("button.icon-btn", { "aria-label": "Close", onclick: () => this.closeOverlay() }, icon("close"))),
      o.search || total > 7 ? h("div.picker-search", q) : null, h("div.scroll", list, o.note ? h("div.picker-note.muted", o.note) : null));
    const bg = h("div.sheet-bg.picker-bg", { onclick: e => { if (e.target === bg) this.closeOverlay(); } }, panel);
    this.overlay.replaceChildren(bg);
    this.overlay.classList.add("open");
  }

  /** Where a piece of evidence visibly came from (core/provenance.js). Never its hidden source. */
  sourceLabel(e) {
    return this.g.evidenceAbout(e.id)?.sourceLabel || "Unknown";
  }

  /** Title of a piece of evidence. */
  evidenceTitle(e) {
    const w = this.g.w;
    if (e.quote) return `“${e.quote.text}”`;
    if (e.message) { const m = this.g.s.messages.find(x => x.id === e.message); return `Message from ${this.contactName(m?.thread)}`; }
    if (e.image) return w.images.get(e.image)?.caption || "Image";
    const v = this.g.evidenceView(e.id);
    return v.title || w.artifacts.get(e.artifact)?.title || e.artifact;
  }

  /** Fill a string from content/strings with {placeholders}. */
  fstr(key, vars = {}) { return this.str(key).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)); }

  /** "today", "tomorrow" or "in 3 days" for a known deadline. */
  #when(d) {
    return d.daysLeft === 0 ? this.str("time.deadlineToday") : d.daysLeft === 1 ? this.str("time.deadlineTomorrow") : this.fstr("time.deadlineIn", { n: d.daysLeft });
  }

  /** Known deadlines as a list. Only dates the player has already met in the world. */
  #deadlineList(cls) {
    const list = this.g.deadlines();
    if (!list.length) return null;
    return h(`div.${cls}`, h("div.dl-head", this.str("time.deadlinesHead")),
      list.map(d => h("div.dl-item", icon("clock"),
        h("div.dl-main", h("b", d.label), h("span.dl-when", `${weekday(d.date)}, ${fmtDate(d.date, false)} · ${this.#when(d)}`),
          this.g.cases().length > 1 ? h("span.dl-case", d.caseTitle) : null))));
  }

  /**
   * Go to sleep. Time never moves by itself: only this does. The dialog shows the date now
   * and the date the player will wake to, and says the world may change overnight,
   * without saying how. In the morning the phone shows the lock screen with the new date.
   */
  sleep() {
    const t = this.g.dayInfo();
    const dayLine = (lbl, day, date) => h("div.sl-day", h("span.sl-lbl", `${lbl} · ${this.fstr("time.day", { day })}`),
      h("b", `${weekday(date)}, ${fmtDate(date)}`));
    const box = h("div.sheet.sleep-sheet", { role: "dialog", "aria-modal": "true", "aria-label": this.str("time.sleepTitle") },
      h("div.sl-body",
        h("div.sl-icon", icon("moon")),
        h("h2.sl-title", this.str("time.sleepTitle")),
        h("div.sl-days", dayLine(this.str("time.today"), t.day, t.date), h("div.sl-arrow", "↓"), dayLine(this.str("time.tomorrow"), t.nextDay, t.nextDate)),
        h("p.sl-text", this.str("time.sleepExplain")),
        this.#deadlineList("sl-deadlines"),
        h("p.sl-note.muted", this.str("time.sleepStay"))),
      h("button.sheet-item.sl-go", { onclick: () => { this.closeOverlay(); this.#doSleep(); } }, icon("moon"), this.str("time.sleepConfirm")),
      h("button.sheet-item.cancel", { onclick: () => this.closeOverlay() }, this.str("time.stayAwake")));
    const bg = h("div.sheet-bg", { onclick: e => { if (e.target === bg) this.closeOverlay(); } }, box);
    this.overlay.replaceChildren(bg);
    this.overlay.classList.add("open");
  }

  #doSleep() {
    this.root.classList.add("night");
    setTimeout(() => {
      this.g.sleep();
      this.stacks = {};
      this.woke = true;
      this.lock();
      this.root.classList.remove("night");
    }, 650);
  }

  closeOverlay() { this.overlay.replaceChildren(); this.overlay.classList.remove("open"); }

  toast(msg) {
    const t = h("div.toast", msg);
    this.toastBox.append(t);
    setTimeout(() => t.classList.add("out"), 1800);
    setTimeout(() => t.remove(), 2300);
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  #render(forward = false, backward = false) {
    // Remember where the screen we are leaving was scrolled to.
    const sc = this.screen.querySelector(".scroll");
    if (this.shown && sc) this.shown.scroll = sc.scrollTop;
    this.shown = null;
    this.root.dataset.where = this.where;
    let view;
    if (this.where === "lock") view = this.#lockScreen();
    else if (this.where === "home") view = this.#homeScreen();
    else {
      const app = this.apps[this.where];
      const desc = this.top;
      view = h("div.app", { class: `app-${app.id}` }, app.render(desc, this.stacks[this.where].length > 1));
      if (forward) view.classList.add("in-fwd");
      if (backward) view.classList.add("in-back");
    }
    this.screen.replaceChildren(view);
    if (this.apps[this.where]) {
      const desc = this.top;
      this.shown = desc;
      const box = this.screen.querySelector(".scroll");
      if (box && desc?.scroll) box.scrollTop = desc.scroll;
    }
    this.#statusBar();
    this.#tipFor(this.where === "home" || this.where === "lock" ? null : this.top);
  }

  /** The first-use tip for the screen now shown, if any. */
  #tipFor(desc) {
    if (this.where === "lock") return;
    const anchor = this.where === "home" ? "home" : desc;
    this.tips.follow(anchor);
    const trigger = k => this.tips.trigger(k, anchor);
    if (this.pendingTip) { const k = this.pendingTip; this.pendingTip = null; trigger(k); return; }
    if (this.where === "home") { if (this.tips.p.seen.length) trigger("sleep"); return; }
    const k = desc?.kind;
    const key = this.where === "messages" ? (k === "thread" ? "message" : null)
      : this.where === "casebook" ? (k === "builder" ? "theory" : k === "report" ? "report" : null)
      : this.where === "settings" ? null
      : k === "results" ? "search"
      : k === "home" || k === "history" || k === "lookup" || k === "imageResults" ? null : "read";
    if (key) trigger(key);
  }

  #statusBar() {
    const g = this.g;
    const d = g.date;
    const ret = this.apps[this.where] ? this.top?.returnTo : null;
    this.status.replaceChildren(
      ret ? h("button.sb-return", { onclick: () => this.back(), "aria-label": `Back to ${ret.title}` }, "◂ ", h("span", ret.title)) : h("span.sb-time", clock()),
      h("span.sb-day", `${weekday(d).slice(0, 3)} ${fmtDate(d, false)} · Day ${g.s.day}`),
      h("span.sb-icons", icon("signal"), icon("battery")));
  }

  #lockScreen() {
    const g = this.g;
    const unread = g.s.notifications.filter(n => !n.read).slice(-6).reverse();
    const scr = h("div.lock",
      h("div.lock-clock", h("div.lock-date", `${weekday(g.date)}, ${fmtDate(g.date, false)}`), h("div.lock-time", clock())),
      this.woke ? h("div.wake", { role: "status" }, h("div.wake-hello", this.str("time.wakeHello")),
        h("div.wake-day", this.fstr("time.day", { day: g.s.day })),
        h("div.wake-date", `${weekday(g.date)}, ${fmtDate(g.date)}`)) : null,
      h("div.lock-notes", unread.map(n => this.#noteCard(n, () => { this.where = "home"; this.openNotification(n); }))),
      h("button.lock-unlock", { onclick: () => this.unlock() }, h("span.bar"), "Swipe up to unlock"));
    let y0 = null;
    scr.addEventListener("pointerdown", e => { y0 = e.clientY; });
    scr.addEventListener("pointerup", e => { if (y0 != null && y0 - e.clientY > 70) this.unlock(); y0 = null; });
    return scr;
  }

  #noteCard(n, onOpen) {
    const thread = n.ref?.thread;
    const c = thread ? this.g.w.characters.get(thread) : null;
    const target = n.ref?.artifact ? this.appFor(n.ref.artifact) : null;
    const app = thread ? "Messages" : target ? (this.apps[target]?.name || this.str(`apps.${target}`)) : n.ref?.case ? this.str("apps.casebook")
      : n.from ? this.#fromName(n.from) : this.str("apps.notification");
    const title = c ? this.contactName(thread) : app;
    return h("button.note", { onclick: onOpen },
      h("div.note-head", h("span.note-app", app), h("span.muted", n.day === this.g.s.day ? "now" : `Day ${n.day}`)),
      thread ? h("b", title) : null,
      h("div.note-text", n.text));
  }

  #homeScreen() {
    // A paper's icon is its own logo (from platform data), not a generic glyph.
    const newsIcon = id => { const a = this.apps[id], pf = this.g.w.platforms.get(a.platform);
      return h("button.app-icon", { "data-app": id, onclick: () => this.openApp(id) },
        h("span.app-tile.np-tile", { class: `np-${pf.app.theme || pf.id}` }, h("span", pf.app.icon || pf.name.slice(0, 2))), h("span.app-label", pf.app.short || pf.name), h("span.badge")); };
    const appIcon = (id, label, ico) => h("button.app-icon", { "data-app": id, onclick: () => this.openApp(id) },
      h("span.app-tile", { class: `tile-${id}` }, icon(ico)), h("span.app-label", label), h("span.badge"));
    const scr = h("div.home",
      h("div.home-widget", h("div.hw-day", this.fstr("time.day", { day: this.g.s.day })), h("div.hw-date", `${weekday(this.g.date)}, ${fmtDate(this.g.date)}`),
        this.#deadlineList("hw-deadlines"),
        h("div.hw-row", h("div.hw-name", this.g.s.playerName),
          h("button.hw-sleep", { onclick: () => this.sleep() }, icon("moon"), this.str("apps.sleep")))),
      this.#recentWidget(),
      h("div.home-grid",
        [...this.platformApp.values()].map(id => newsIcon(id)),
        appIcon("settings", "Settings", "gear")),
      h("div.dock",
        appIcon("browser", this.str("apps.browser"), "globe"),
        appIcon("connect", this.str("apps.connect"), "people"),
        appIcon("messages", this.str("apps.messages"), "chat"),
        appIcon("casebook", this.str("apps.casebook"), "book")));
    queueMicrotask(() => this.#badges());
    return scr;
  }

  #recentWidget() {
    const items = this.recent.slice(0, 4);
    if (!items.length) return null;
    const ico = { page: "globe", thread: "chat", results: "search" };
    return h("div.home-recent",
      h("div.hr-head", h("span", "Recently visited"), h("button.hr-all", { onclick: () => { this.openApp("browser"); this.push("browser", { kind: "history" }); } }, "See all")),
      items.map(r => h("button.hr-item", { onclick: () => this.openRecent(r) }, icon(r.app === "connect" ? "people" : ico[r.kind] || "globe"),
        h("span.hr-title", r.title), h("span.hr-sub.muted", r.app === "connect" ? "Connect" : r.sub))));
  }

  #badges() {
    const n = this.g.s.notifications.filter(x => !x.read && x.ref?.thread).length;
    const b = this.screen.querySelector('[data-app="messages"] .badge');
    if (b) { b.textContent = n ? String(n) : ""; b.classList.toggle("on", n > 0); }
    const ev = this.screen.querySelector('[data-app="casebook"] .badge');
    if (ev) { const k = this.g.s.evidence.length; ev.textContent = k ? String(k) : ""; ev.classList.toggle("on", k > 0); ev.classList.add("quiet"); }
  }

  #banner(n) {
    if (this.where === "lock") { this.#render(); return; }
    if (this.where === "messages" && n.ref?.thread && this.top?.kind === "thread" && this.top.id === n.ref.thread) {
      this.g.dispatch({ type: "readNotification", id: n.id });
      this.refresh();
      return;
    }
    const card = this.#noteCard(n, () => { card.remove(); this.openNotification(n); });
    card.classList.add("banner");
    this.bannerBox.append(card);
    setTimeout(() => card.classList.add("out"), 4200);
    setTimeout(() => card.remove(), 4700);
  }

  contactName(charId) {
    const w = this.g.w;
    const c = w.characters.get(charId);
    const acc = c?.account ? w.accounts.get(c.account) : w.accounts.get(charId);
    if (acc) return acc.displayName || acc.handle;
    return w.entities.get(c?.entity)?.name || charId;
  }

  // ── Gestures: swipe from the left edge goes back ─────────────────────────
  #gestures() {
    let x0 = 0, y0 = 0, edge = false;
    this.root.addEventListener("touchstart", e => {
      const t = e.touches[0], r = this.root.getBoundingClientRect();
      x0 = t.clientX; y0 = t.clientY; edge = t.clientX - r.left < 24;
    }, { passive: true });
    this.root.addEventListener("touchend", e => {
      if (!edge) return;
      const t = e.changedTouches[0];
      if (t.clientX - x0 > 70 && Math.abs(t.clientY - y0) < 60) this.back();
      edge = false;
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") this.back();
    });
  }
}

export function normUrl(u) {
  return String(u).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

function bookmarkUrlOf(desc) {
  return desc?.url || desc?.view?.url || "";
}

/** "Image info" rows: the made-up file name and whatever metadata the copy still has. */
export function imageInfoRows(d, imageId) {
  let hash = 7; for (const c of imageId) hash = (hash * 131 + c.charCodeAt(0)) % 9000;
  const rows = [["File", `IMG_${1000 + hash}.jpg`]];
  const m = d?.meta || {};
  if (m.taken) rows.push(["Taken", m.taken]);
  if (m.device) rows.push(["Camera", m.device]);
  if ("location" in m) rows.push(["Location", m.location || "—"]);
  if (m.software) rows.push(["Software", m.software]);
  if (m.note) rows.push(["Note", m.note]);
  if (!d?.meta) rows.push(["Metadata", "None. It was stripped from this copy."]);
  return rows;
}

/** Pinch, double tap and drag to zoom an image inside a stage. */
function zoomable(stage, el) {
  let scale = 1, tx = 0, ty = 0;
  const pts = new Map();
  let start = null, lastTap = 0;
  const apply = () => { el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; };
  const clamp = () => { scale = Math.min(5, Math.max(1, scale)); if (scale === 1) { tx = 0; ty = 0; } };
  stage.addEventListener("pointerdown", e => {
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const now = Date.now();
    if (pts.size === 1 && now - lastTap < 300) { scale = scale > 1 ? 1 : 2.5; clamp(); apply(); lastTap = 0; return; }
    lastTap = now;
    start = { scale, tx, ty, pts: new Map([...pts].map(([k, v]) => [k, { ...v }])) };
  });
  stage.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = [...pts.values()], b = [...start.pts.values()];
    if (a.length >= 2 && b.length >= 2) {
      const d1 = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), d0 = Math.hypot(b[0].x - b[1].x, b[0].y - b[1].y) || 1;
      scale = start.scale * d1 / d0;
    } else if (a.length === 1 && b.length >= 1 && start.scale > 1) {
      tx = start.tx + (a[0].x - b[0].x); ty = start.ty + (a[0].y - b[0].y);
    }
    clamp(); apply();
  });
  const end = e => { pts.delete(e.pointerId); start = pts.size ? { scale, tx, ty, pts: new Map([...pts].map(([k, v]) => [k, { ...v }])) } : null; };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  stage.addEventListener("wheel", e => { e.preventDefault(); scale *= e.deltaY < 0 ? 1.15 : 1 / 1.15; clamp(); apply(); }, { passive: false });
}
