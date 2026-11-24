// @ts-check
// The phone: status bar, lock screen, home screen, apps with their own back stacks,
// notification banners, the image viewer and toasts. Talks to the game only through
// its public methods (dispatch wrappers and queries).

import { h, icon, clock, fmtDate, weekday } from "./ui.js";
import { img } from "./media.js";
import { browserApp } from "./apps/browser.js";
import { connectApp } from "./apps/connect.js";
import { messagesApp } from "./apps/messages.js";
import { casebookApp } from "./apps/casebook.js";
import { settingsApp } from "./apps/settings.js";

export class Phone {
  /**
   * @param {HTMLElement} root
   * @param {any} game
   * @param {{restart:()=>void, exportSave:()=>void, importSave:(f:File)=>void}} host
   */
  constructor(root, game, host) {
    this.root = root;
    this.g = game;
    this.host = host;
    const w = game.w;
    /** url (lowercase, no protocol) → artifact id */
    this.urls = new Map();
    for (const a of w.artifacts.values()) if (a.url) this.urls.set(normUrl(a.url), a.id);
    /** handle (lowercase, with and without @) → account id */
    this.handles = new Map();
    for (const acc of w.accounts.values()) {
      const k = String(acc.handle).toLowerCase();
      this.handles.set(k, acc.id); this.handles.set(k.replace(/^@/, ""), acc.id);
    }

    this.apps = Object.fromEntries([browserApp, connectApp, messagesApp, casebookApp, settingsApp].map(f => { const a = f(this); return [a.id, a]; }));
    /** @type {Record<string, any[]>} */
    this.stacks = {};
    /** "lock" | "home" | app id */
    this.where = "lock";

    this.status = h("div.status");
    this.screen = h("div.screen");
    this.bannerBox = h("div.banners");
    this.overlay = h("div.overlay");
    this.toastBox = h("div.toasts");
    this.homeBar = h("button.homebar", { "aria-label": "Home", onclick: () => this.goHome() }, h("span"));
    root.replaceChildren(this.status, this.screen, this.bannerBox, this.overlay, this.toastBox, this.homeBar);

    this.#gestures();
    game.on("notify", n => this.#banner(n));
    game.on("state", () => { this.#statusBar(); this.#badges(); });
    this.#statusBar();
    setInterval(() => this.#statusBar(), 15000);
    this.#historyTrap();
  }

  str(key) { const v = key.split(".").reduce((o, k) => o?.[k], this.g.w.strings); return v ?? key; }

  // ── Navigation ────────────────────────────────────────────────────────────

  lock() { this.where = "lock"; this.#render(); }
  unlock() { this.goHome(); }
  goHome() { this.closeOverlay(); this.where = "home"; this.#render(); }

  openApp(id) {
    if (!this.stacks[id]?.length) this.stacks[id] = [this.apps[id].root()];
    this.where = id;
    this.closeOverlay();
    this.#render();
  }

  /** Push a screen on an app's stack and show it. */
  push(appId, desc) {
    if (!this.stacks[appId]?.length) this.stacks[appId] = [this.apps[appId].root()];
    this.stacks[appId].push(desc);
    this.where = appId;
    this.closeOverlay();
    this.#render(true);
  }

  /** Replace the top screen of the current app (used after a sign-in or a search). */
  replaceTop(desc) {
    const st = this.stacks[this.where];
    if (st?.length) st[st.length - 1] = desc;
    this.#render();
  }

  /** Back inside the phone: close an overlay, pop the app's stack, or go to the home screen. */
  back() {
    if (this.overlay.childElementCount) { this.closeOverlay(); return; }
    const st = this.stacks[this.where];
    if (!st) { if (this.where === "lock") this.unlock(); return; }
    if (st.length > 1) { st.pop(); this.#render(false, true); }
    else this.goHome();
  }

  /** The top-left button of every app: back while there is somewhere to go back to, otherwise home. */
  backButton() {
    const atRoot = (this.stacks[this.where]?.length ?? 1) <= 1 && !this.overlay.childElementCount;
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

  accountByHandle(handle) { return this.handles.get(String(handle).toLowerCase()) || null; }

  /** Address bar / tapped link: open a known address, otherwise search Seeker for it. */
  browse(text) {
    let t = String(text || "").trim();
    if (!t) return;
    if (t.includes("•") && t.includes("@")) t = t.split("@").pop() || t; // masked email: follow the domain
    const id = this.urls.get(normUrl(t));
    if (id) { this.openArtifact(id, undefined, this.appFor(id) === "connect" ? "connect" : "browser"); return; }
    this.search(t);
  }

  search(q, appId = "browser") {
    const r = this.g.search(q);
    this.push(appId, { kind: "results", q, results: r.results || [] });
  }

  saveEvidence(ref) {
    const r = this.g.save(ref);
    if (r.error) this.toast(this.str(`errors.${r.error}`));
    else this.toast(r.duplicate ? "Already in your Casebook." : "Saved to Casebook.");
    this.refresh();
    return r;
  }

  isSaved(ref) {
    return this.g.s.evidence.some(e => e.artifact === (ref.artifact ?? null) && (e.version ?? null) === (ref.version ?? null) &&
      (e.image ?? null) === (ref.image ?? null) && (e.message ?? null) === (ref.message ?? null));
  }

  openNotification(n) {
    if (!n.read) this.g.dispatch({ type: "readNotification", id: n.id });
    if (n.ref?.thread) this.push("messages", { kind: "thread", id: n.ref.thread });
    else if (n.ref?.artifact) this.openArtifact(n.ref.artifact);
    else this.goHome();
  }

  // ── Image viewer ──────────────────────────────────────────────────────────

  viewImage(imageId, ctx) {
    const g = this.g;
    const im = img(imageId, { cls: "zoom-img", eager: true });
    const stage = h("div.zoom-stage", im);
    const info = h("div.img-info");
    const saved = () => !!ctx?.artifact && this.isSaved({ artifact: ctx.artifact, version: null, image: imageId });
    const saveBtn = h("button", { onclick: () => { if (ctx?.artifact) { this.saveEvidence({ artifact: ctx.artifact, image: imageId }); saveBtn.replaceChildren(icon(saved() ? "bookmarked" : "bookmark"), h("span", "Save")); } } },
      icon(saved() ? "bookmarked" : "bookmark"), h("span", "Save"));
    const searchBy = flip => {
      const r = g.searchImage(imageId, flip);
      if (r.error) { this.toast(this.str(`errors.${r.error}`)); return; }
      this.push("browser", { kind: "imageResults", image: imageId, flip, results: r.results });
    };
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
      const d = g.imageInfo(imageId);
      let hash = 7; for (const c of imageId) hash = (hash * 131 + c.charCodeAt(0)) % 9000;
      const rows = [["File", `IMG_${1000 + hash}.jpg`]];
      const m = d?.meta || {};
      if (m.taken) rows.push(["Taken", m.taken]);
      if (m.device) rows.push(["Camera", m.device]);
      if ("location" in m) rows.push(["Location", m.location || "—"]);
      if (m.software) rows.push(["Software", m.software]);
      if (m.note) rows.push(["Note", m.note]);
      if (!d?.meta) rows.push(["Metadata", "None. It was stripped from this copy."]);
      info.replaceChildren(h("dl", rows.map(([k, v]) => [h("dt", k), h("dd", v)])));
    };
    zoomable(stage, im);
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
   * Full-height list picker with search.
   * @param {{title:string, groups:{title:string, items:{id:string, label:string, sub?:string, thumb?:Node}[]}[], empty?:string, onPick:(id:string)=>void}} o
   */
  picker(o) {
    const q = /** @type {HTMLInputElement} */ (h("input.seek-input", { type: "search", placeholder: "Filter", autocapitalize: "off", autocomplete: "off" }));
    const list = h("div.picker-list");
    const draw = () => {
      const f = q.value.trim().toLowerCase();
      const groups = o.groups.map(g => ({ ...g, items: g.items.filter(i => !f || `${i.label} ${i.sub || ""}`.toLowerCase().includes(f)) })).filter(g => g.items.length);
      list.replaceChildren(...(groups.length ? groups.map(g => h("div.picker-group", g.title ? h("div.section-title", g.title) : null,
        g.items.map(i => h("button.picker-item", { onclick: () => { this.closeOverlay(); o.onPick(i.id); } }, i.thumb || null,
          h("div.pi-main", h("b", i.label), i.sub ? h("div.muted", i.sub) : null))))) : [h("div.empty.muted", o.empty || "Nothing here yet.")]));
    };
    q.addEventListener("input", draw);
    draw();
    const total = o.groups.reduce((n, g) => n + g.items.length, 0);
    const panel = h("div.picker",
      h("div.picker-head", h("div.bar-title", o.title), h("button.icon-btn", { "aria-label": "Close", onclick: () => this.closeOverlay() }, icon("close"))),
      total > 7 ? h("div.picker-search", q) : null, h("div.scroll", list));
    const bg = h("div.sheet-bg.picker-bg", { onclick: e => { if (e.target === bg) this.closeOverlay(); } }, panel);
    this.overlay.replaceChildren(bg);
    this.overlay.classList.add("open");
  }

  /** Where a piece of evidence came from, in words the player recognises. */
  sourceLabel(e) {
    const w = this.g.w;
    if (e.message) { const m = this.g.s.messages.find(x => x.id === e.message); return this.contactName(m?.thread); }
    const a = w.artifacts.get(e.artifact);
    const acc = a?.author ? w.accounts.get(a.author) : null;
    if (acc) return acc.displayName || acc.handle;
    // A private document (forwarded email, leaked file) comes from the person who gave it to you.
    const giver = [...w.characters.values()].find(c => (c.source ?? c.id) === a?.source || c.id === a?.source);
    if (giver) return this.contactName(giver.id);
    return w.platforms.get(a?.platform)?.name || a?.url?.split("/")[0] || "Unknown";
  }

  /** Title of a piece of evidence. */
  evidenceTitle(e) {
    const w = this.g.w;
    if (e.message) { const m = this.g.s.messages.find(x => x.id === e.message); return `Message from ${this.contactName(m?.thread)}`; }
    if (e.image) return w.images.get(e.image)?.caption || "Image";
    const v = this.g.view(e.artifact, e.version || undefined);
    return v.title || w.artifacts.get(e.artifact)?.title || e.artifact;
  }

  /** Go to sleep: the day ends, night events run, and the phone shows the lock screen in the morning. */
  sleep() {
    this.sheet(`End day ${this.g.s.day}? Whatever was going to happen tonight will happen.`, [{ label: "Sleep", run: () => {
      this.root.classList.add("night");
      setTimeout(() => {
        this.g.sleep();
        this.stacks = {};
        this.lock();
        this.root.classList.remove("night");
      }, 650);
    } }]);
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
    this.#statusBar();
  }

  #statusBar() {
    const g = this.g;
    const d = g.date;
    this.status.replaceChildren(
      h("span.sb-time", clock()),
      h("span.sb-day", `${weekday(d).slice(0, 3)} ${fmtDate(d, false)} · Day ${g.s.day}`),
      h("span.sb-icons", icon("signal"), icon("battery")));
  }

  #lockScreen() {
    const g = this.g;
    const unread = g.s.notifications.filter(n => !n.read).slice(-6).reverse();
    const scr = h("div.lock",
      h("div.lock-clock", h("div.lock-date", `${weekday(g.date)}, ${fmtDate(g.date, false)}`), h("div.lock-time", clock())),
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
    const app = thread ? "Messages" : n.ref?.artifact ? (this.appFor(n.ref.artifact) === "connect" ? "Connect" : "Browser") : "News";
    const title = c ? this.contactName(thread) : app;
    return h("button.note", { onclick: onOpen },
      h("div.note-head", h("span.note-app", app), h("span.muted", n.day === this.g.s.day ? "now" : `Day ${n.day}`)),
      thread ? h("b", title) : null,
      h("div.note-text", n.text));
  }

  #homeScreen() {
    const appIcon = (id, label, ico) => h("button.app-icon", { "data-app": id, onclick: () => this.openApp(id) },
      h("span.app-tile", { class: `tile-${id}` }, icon(ico)), h("span.app-label", label), h("span.badge"));
    const scr = h("div.home",
      h("div.home-widget", h("div.hw-day", `Day ${this.g.s.day}`), h("div.hw-date", `${weekday(this.g.date)}, ${fmtDate(this.g.date)}`),
        h("div.hw-row", h("div.hw-name", this.g.s.playerName),
          h("button.hw-sleep", { onclick: () => this.sleep() }, icon("moon"), this.str("apps.sleep")))),
      h("div.home-grid", appIcon("settings", "Settings", "gear")),
      h("div.dock",
        appIcon("browser", this.str("apps.browser"), "globe"),
        appIcon("connect", this.str("apps.connect"), "people"),
        appIcon("messages", this.str("apps.messages"), "chat"),
        appIcon("casebook", this.str("apps.casebook"), "book")));
    queueMicrotask(() => this.#badges());
    return scr;
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
