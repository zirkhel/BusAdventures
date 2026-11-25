// @ts-check
// Browser with the Seeker search engine. Screens:
//   home · results {q, results, title?, cacheOnly?} · page {id, version, view}
//   imageResults {image, flip, results} · lookup {platform, q, url}
//   history (recent pages, searches and bookmarks)
//   notfound · maintenance · parked · gone · sitehome  (W3 site-status pages)
//   archive {id, pick?}  (W8: every copy of one address, and "Compare with…" into Casebook)

import { h, icon, fmtDate } from "../ui.js";
import { suggestBox } from "../suggest.js";
import { img } from "../media.js";
import { renderArtifact, renderGone } from "../render.js";
import { hostOf, designFor } from "../../core/sites.js";
import { textScale, TEXT_SIZES } from "../../core/browser.js";
import { archivePair } from "../../core/archive.js";
import { renderNotFound, renderMaintenance, renderParked, renderUnreachable, renderSiteHome, renderSiteLogin } from "../sites/status.js";

export function browserApp(phone) {
  const g = phone.g;

  function addressBar(desc) {
    const addr = addressValue(desc);
    const input = /** @type {HTMLInputElement} */ (h("input.addr", { type: "search", enterkeyhint: "go", autocapitalize: "off", autocomplete: "off", spellcheck: "false",
      placeholder: "Search Seeker or type an address", value: addr }));
    input.addEventListener("focus", () => input.select());
    const form = h("form.addr-form", { onsubmit: e => { e.preventDefault(); input.blur(); phone.browse(input.value); } },
      leadIcon(desc),
      input);
    suggestBox(phone, input, form, q => { input.blur(); phone.browse(q); }, addr);
    const canFwd = phone.canForward();
    return h("div.topbar.browser-bar",
      phone.backButton(),
      h("button.icon-btn.nav-btn.fwd-btn", { type: "button", "aria-label": "Forward", disabled: canFwd ? undefined : true, onclick: () => phone.forward() }, icon("forward")),
      form,
      sizeButtons(),
      starButton(desc),
      evidenceButton(desc));
  }

  function addressValue(desc) {
    if (desc.kind === "page") return desc.url || "";
    if (desc.kind === "results") return desc.q || "";
    if (desc.kind === "archive") return desc.url || g.archive(desc.id).url || "";
    if (desc.kind === "lookup" || desc.kind === "notfound" || desc.kind === "maintenance" || desc.kind === "parked" || desc.kind === "gone" || desc.kind === "sitehome") return desc.url || "";
    return "";
  }

  function sizeButtons() {
    const i = g.s.browser?.textSize ?? 1;
    return h("div.ts-pair",
      h("button.ts-btn", { type: "button", "aria-label": "Smaller text", disabled: i <= 0 ? true : undefined, onclick: () => phone.stepTextSize(-1) }, "A−"),
      h("button.ts-btn", { type: "button", "aria-label": "Larger text", disabled: i >= TEXT_SIZES.length - 1 ? true : undefined, onclick: () => phone.stepTextSize(1) }, "A+"));
  }

  function starButton(desc) {
    const url = desc.url || desc.view?.url;
    if (!url) return null;
    const on = phone.isBookmarked(desc);
    return h("button.icon-btn.star-btn", { type: "button", "aria-label": on ? "Remove bookmark" : "Bookmark this page", onclick: () => phone.toggleBookmark(desc) },
      icon(on ? "starred" : "star"));
  }

  function leadIcon(desc) {
    if (desc.kind === "page" && desc.view?.cached) return h("span.addr-tag", "cached");
    if (desc.kind === "archive") return h("span.addr-tag", "archive");
    if (desc.kind === "page" && desc.view?.locked) return icon("lock", "addr-ico");
    if (desc.kind === "gone") return icon("globe", "addr-ico");
    if (desc.kind === "page" || desc.kind === "sitehome" || desc.kind === "notfound" || desc.kind === "maintenance" || desc.kind === "parked") {
      const fav = faviconOf(desc);
      if (fav) return fav;
    }
    return icon("search", "addr-ico");
  }

  function faviconOf(desc) {
    const host = hostOf(desc.url || desc.view?.url || "");
    const siteId = (desc.site && g.w.sites.has(desc.site) && desc.site) || (host && g.w.siteByDomain.get(host));
    const site = siteId && g.w.sites.get(siteId);
    if (!site) return null;
    const asOf = String(g.date || "").slice(0, 10);
    const design = designFor(site, desc.view || {}, desc.view?.cached ? undefined : asOf);
    const raw = design?.theme?.icon || design?.theme?.logo;
    if (!raw || String(raw).startsWith("text:")) return null;
    return h("span.addr-favicon", img(raw, { cls: "addr-favicon-img", alt: "", eager: true }));
  }

  /** Casebook save — the book icon, not the star (the star is a Browser bookmark). */
  function evidenceButton(desc) {
    const v = desc.view;
    if (!v || v.error || v.locked) return null;
    const ref = { artifact: desc.id, version: v.versionId };
    const saved = phone.isSaved(ref);
    return h("button.icon-btn.ev-btn", { type: "button", class: saved ? "is-saved" : "", "aria-label": "Save as evidence", onclick: () => phone.saveEvidence(ref) },
      icon("book"));
  }

  function home() {
    const input = /** @type {HTMLInputElement} */ (h("input.seek-input", { type: "search", enterkeyhint: "search", placeholder: "Search anything", autocapitalize: "off", autocomplete: "off" }));
    const form = h("form.seek-form", { onsubmit: e => { e.preventDefault(); input.blur(); phone.search(input.value); } }, icon("search", "addr-ico"), input);
    suggestBox(phone, input, form, q => { input.blur(); phone.search(q); });
    return h("div.seek-home",
      h("div.seek-logo", "Seeker"),
      form,
      h("div.seek-tip", "Tip: put words in \"quotes\" to search for an exact phrase."),
      recent(),
      h("div.seek-links",
        h("button.link-btn", { onclick: () => phone.push("browser", { kind: "history", tab: "visited" }) }, icon("history"), "History"),
        h("button.link-btn", { onclick: () => phone.push("browser", { kind: "history", tab: "bookmarks" }) }, icon("star"), "Bookmarks")));
  }

  /** One tap repeats a recent search. */
  function recent() {
    const qs = [...new Set(g.s.searches.map(s => s.q).reverse())].slice(0, 8);
    if (!qs.length) return null;
    return h("div.seek-recent", h("div.section-title", "Recent searches"),
      qs.map(q => h("button.chip", { onclick: () => phone.search(q) }, icon("clock"), q)));
  }

  /** Everything the player has visited, every search, and Browser bookmarks, newest first. */
  function history(desc) {
    const tab = desc.tab || "visited";
    const seg = h("div.seg.tabs", [["visited", "Visited"], ["searches", "Searches"], ["bookmarks", "Bookmarks"]].map(([id, label]) =>
      h("button", { class: tab === id ? "on" : "", onclick: () => phone.replaceTop({ ...desc, tab: id }) }, label)));
    if (tab === "searches") {
      const list = [...g.s.searches].reverse();
      return [seg, list.length ? list.map(s => h("button.hist-row", { onclick: () => phone.search(s.q) }, icon("search"),
        h("div.pi-main", h("b", s.q), h("div.muted", `Day ${s.day}`)))) : h("div.empty.muted", "No searches yet.")];
    }
    if (tab === "bookmarks") {
      const list = [...(g.s.browser?.bookmarks || [])].reverse();
      return [seg, list.length ? list.map(b => h("button.hist-row", { onclick: () => phone.browse(b.url) }, icon("star"),
        h("div.pi-main", h("b", b.title || b.url), h("div.muted", b.url + (b.day ? ` · Day ${b.day}` : ""))))) : h("div.empty.muted", "No bookmarks yet. Tap the star in the address bar.")];
    }
    const ico = { page: "globe", thread: "chat", results: "search" };
    return [seg, phone.recent.length ? phone.recent.map(r => h("button.hist-row", { onclick: () => phone.openRecent(r) }, icon(r.app === "connect" ? "people" : ico[r.kind] || "globe"),
      h("div.pi-main", h("b", r.title), h("div.muted", `${r.app === "connect" ? "Connect" : r.sub} · Day ${r.day}`)))) : h("div.empty.muted", "Nothing visited yet.")];
  }

  /** A look-up tool (a breach checker…) with no record for the query. */
  function lookup(desc) {
    const pf = g.w.platforms.get(desc.platform);
    return phone.ctx.block(h("article.page.k-site", h("header.site-head", h("div.mast", pf?.name || ""), h("h1", desc.q)),
      h("div.page-body", h("p.p", (pf?.lookup?.empty || "No results for {q}.").replace("{q}", desc.q)))), { title: pf?.name });
  }

  function domainOf(url, platform) {
    const pf = g.w.platforms.get(platform);
    return url ? url.split("/")[0] : pf?.domain || pf?.name || "";
  }

  function resultItem(r) {
    const open = () => {
      if (!r.artifact) { phone.browse(r.url); return; }
      phone.openArtifact(r.artifact, r.cached ? r.versionId : undefined, phone.appFor(r.artifact) === "connect" && !r.cached ? "connect" : "browser");
    };
    return h("div.result", h("button.result-main", { onclick: open },
      h("div.result-site", h("span.site-name", g.w.platforms.get(r.platform)?.name || domainOf(r.url, r.platform)), h("span.muted", r.url || "")),
      h("div.result-title", r.title),
      r.official ? h("span.official-tag", r.kind === "gone" || r.kind === "parked" || r.kind === "maintenance" ? "Website" : "Official site") : null,
      r.locked ? h("div.result-snip.muted", icon("lock", "inline"), " Sign-in required") :
        h("div.result-snip", r.date ? h("span.muted", fmtDate(r.date) + " — ") : null, r.snippet || ""),
      r.cached ? h("span.cached-tag", "Cached copy") : null));
  }

  function results(desc) {
    const list = desc.results;
    if (desc.cacheOnly) return h("div.results",
      h("div.results-count.muted", list.length ? `${list.length} cached cop${list.length === 1 ? "y" : "ies"} of pages at ${desc.q}` : ""),
      list.length ? list.map(resultItem) : h("div.empty", h("b", `Seeker has no cached copies of ${desc.q}.`), h("div.muted", "Only pages Seeker has seen are kept.")));
    return h("div.results",
      h("div.results-count.muted", list.length ? `About ${list.length} result${list.length === 1 ? "" : "s"}` : ""),
      list[0]?.partial ? h("div.results-partial.muted", "No page has all of these words. Showing pages with some of them.") : null,
      list.length ? list.map(resultItem) :
        h("div.empty", h("b", `No results for “${desc.q}”.`), h("div.muted", "Try fewer or different words, a name, an address or a code.")));
  }

  function imageResults(desc) {
    const list = desc.results;
    return h("div.results",
      h("div.img-query", img(desc.image, { cls: "thumb" }), h("div", h("b", desc.flip ? "Flipped image search" : "Image search"),
        h("div.muted", list.length ? `${list.length} page${list.length === 1 ? "" : "s"} with matching images` : "No other pages use this image."))),
      list.map(r => h("button.result-main.img-result", { onclick: () => phone.openArtifact(r.artifact, r.cached ? r.versionId : undefined, "browser") },
        img(r.image, { cls: "thumb" }),
        h("div", h("div.result-site", h("span.site-name", g.w.platforms.get(r.platform)?.name || ""), h("span.muted", r.url || "")),
          h("div.result-title", r.title), r.cached ? h("span.cached-tag", "Cached copy") : null))));
  }

  function page(desc) {
    const v = desc.view;
    if (!v) return h("div.empty", "Nothing here.");
    if (v.locked) {
      const form = loginForm(v, () => {
        const r = g.open(desc.id);
        phone.replaceTop({ ...desc, view: r.view });
        phone.toast("Signed in.");
      });
      const out = renderSiteLogin(phone, v, form) || form;
      // Signing out locks new content, never the player's own saved copies of the page.
      const mine = phone.archiveOpener(desc.id);
      if (mine) out.append(h("div.arch-locked-link", h("button.btn", { onclick: mine.run }, mine.label)));
      return out;
    }
    if (v.error) return renderGone(phone, v, ver => phone.openArtifact(desc.id, ver, "browser"), phone.archiveOpener(desc.id));
    const art = renderArtifact(phone, v);
    const ar = g.archive(desc.id);
    // The copy on screen, as the Archive lists it: Seeker's copy, or the player's own saved copy.
    const here = ar.error ? null : v.saved ? ar.entries.find(x => x.kind === "saved" && x.version === v.versionId)
      : v.cached ? ar.entries.find(x => x.kind === "cached" && x.version === v.versionId) : null;
    // The strip leads to the Archive; a cached or saved copy's banner already has "All copies".
    if (!ar.error && ar.entries.length >= 2 && !here) art.prepend(archiveStrip(desc, ar));
    if (v.saved) art.prepend(h("div.cache-banner.mine", icon("bookmarked"), h("b", "Your saved copy"), " This is the copy you saved to Casebook. It stays yours even if the page changes.",
      here ? copyActions(desc, ar, here) : null));
    if (v.cached) art.prepend(h("div.cache-banner", h("b", "Archive copy"), ` Seeker kept this copy of ${v.url || "the page"} as it appeared on ${fmtDate(v.date)}. The live page may have changed or been removed.`,
      here ? copyActions(desc, ar, here) : null));
    return art;
  }

  /** A thin strip on a page with more than one copy: opens the Archive. */
  function archiveStrip(desc, ar) {
    const n = ar.entries.length;
    return h("button.archive-strip", { onclick: () => phone.archive(desc.id) },
      icon("clock"), h("span", h("b", "Archive"), ` · ${n} copies of this page`), h("span.archive-go", "›"));
  }

  // Why there is no live page to compare with. Short and neutral: never why the page went.
  const NO_CURRENT = { locked: "The live page needs a sign-in.", deleted: "The live page has been deleted.", gone: "The live page isn't available.", unavailable: "The live page can't be read." };
  const COMPARE = { title: "Compare text and details", textOnly: true };
  /** From one older copy straight to the comparison with the live page (older first), or why not. */
  function copyActions(desc, ar, x) {
    const live = ar.current >= 0 ? ar.entries[ar.current] : null;
    return h("div.banner-actions",
      x.withCurrent ? h("button.banner-btn", { onclick: () => phone.compare([x.ref, live.ref], COMPARE) }, "Compare with live page")
        : ar.noCurrent ? [h("button.banner-btn", { disabled: true, "aria-describedby": "no-live" }, "Compare with live page"), h("span.banner-why#no-live", NO_CURRENT[ar.noCurrent])]
        : x.sameAsCurrent ? h("span.banner-why", "Same version as the live page.") : null,
      h("button.banner-btn", { onclick: () => phone.archive(desc.id) }, "All copies"));
  }

  // ── Archive (W8) ─────────────────────────────────────────────────────────
  // Every copy of one address the player can open: Seeker's archive copies, the live page and
  // their own saved copies, oldest first. Pick two to compare their text and details in Casebook.
  // Nothing here says what changed or why; the comparison only lines the copies up.
  const KIND_LABEL = { cached: "Archive copy", current: "Live page", saved: "Your saved copy" };
  const KIND_ICON = { cached: "clock", current: "globe", saved: "bookmarked" };
  const STATUS = {
    deleted: "The page has been deleted. Only copies remain.",
    gone: "The page isn't available now. Only copies remain.",
    locked: "The page needs a sign-in. Only copies you saved are listed.",
    lockedNone: "The page needs a sign-in. There is nothing to show here.",
  };
  function archive(desc) {
    const ar = g.archive(desc.id);
    if (ar.error) return h("div.empty", h("b", "No archive for this address."), h("div.muted", "Open the page first."));
    const pick = (desc.pick || []).filter(i => i < ar.entries.length);
    const toggle = i => phone.replaceTop({ ...desc, pick: pick.includes(i) ? pick.filter(x => x !== i) : [...pick, i].slice(-2) });
    const open = x => {
      if (x.kind === "saved") { const view = g.evidenceView(x.ref.evidence); phone.push("browser", { kind: "page", id: ar.id, version: x.version, view: { ...view, saved: true, cached: false }, url: view.url || "" }); return; }
      if (x.kind === "current") { phone.openArtifact(ar.id, undefined, phone.appFor(ar.id)); return; }
      phone.openArtifact(ar.id, x.version, "browser");
    };
    const compare = (i, j) => phone.compare(archivePair(ar, i, j), COMPARE);
    const day = x => x.evidence ? g.s.evidence.find(e => e.id === x.evidence)?.day : null;
    const sub = x => x.kind === "saved" ? `In your Casebook${day(x) != null ? ` · saved day ${day(x)}` : ""}` : x.kind === "cached" ? "Kept by Seeker" : "Open now";
    const rows = ar.entries.map((x, i) => h("div.arch-row", { class: `k-${x.kind}${pick.includes(i) ? " picked" : ""}` },
      h("button.arch-pick", { "aria-pressed": String(pick.includes(i)), "aria-label": `Select ${KIND_LABEL[x.kind]}${x.date ? `, ${fmtDate(x.date)}` : ""}`, onclick: () => toggle(i) },
        h("span.sel-box", pick.includes(i) ? "✓" : "")),
      h("button.arch-open", { onclick: () => open(x) },
        h("div.arch-date", x.date ? fmtDate(x.date) : "Undated"),
        h("div.arch-kind", icon(KIND_ICON[x.kind]), h("span.arch-type", KIND_LABEL[x.kind])),
        h("div.arch-sub", sub(x)),
        x.title && x.title !== ar.title ? h("div.arch-title.muted", `“${x.title}”`) : null),
      x.withCurrent ? h("button.arch-cmp", { "aria-label": `Compare the ${KIND_LABEL[x.kind].toLowerCase()}${x.date ? ` from ${fmtDate(x.date)}` : ""} with the live page`, onclick: () => compare(i, ar.current) }, "Compare with live")
        : x.sameAsCurrent ? h("span.arch-same.muted", "Same as live") : null));
    const bar = h("div.arch-bar",
      pick.length === 2 ? h("button.btn.primary.wide", { onclick: () => compare(pick[0], pick[1]) }, "Compare text and details")
        : h("div.muted.small", ar.canCompare ? (pick.length ? "Pick one more copy to compare." : "Tick two copies to compare their text and details.") : ar.entries.length ? "Only one copy so far. Nothing to compare yet." : "No copies to show."));
    const status = ar.status === "live" ? null : ar.status === "locked" && !ar.entries.length ? STATUS.lockedNone : STATUS[ar.status] || STATUS.gone;
    return h("div.archive",
      h("div.arch-head", icon("clock", "big"), h("div", h("h1", "Archive"), h("div.muted", ar.url || ""), ar.title ? h("div.arch-page", ar.title) : null)),
      h("div.arch-note.muted", "Copies of this address you can open: the live page, archive copies Seeker kept, and copies you saved. Compares text and details only; compare pictures on their own in Casebook."),
      status ? h("div.arch-status", status, ar.noCurrent && ar.entries.length ? h("div.arch-why", "There is no live page to compare with.") : null) : null,
      bar, rows);
  }

  function loginForm(v, onDone) {
    const user = h("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Username" });
    const pass = h("input", { type: "password", autocomplete: "off", placeholder: "Password" });
    const err = h("div.form-err");
    const submit = e => {
      e.preventDefault();
      const r = phone.g.login(v.loginSite, user.value, pass.value);
      if (r.error) { err.textContent = phone.str("errors.login_failed"); pass.value = ""; }
      else onDone();
    };
    return h("div.login-card", icon("lock", "big"), h("h1", v.title), h("div.muted", v.url || ""),
      h("form", { onsubmit: submit }, user, pass, err, h("button.btn.primary", { type: "submit" }, "Sign in")));
  }

  function bodyOf(desc) {
    if (desc.kind === "home") return home();
    if (desc.kind === "results") return results(desc);
    if (desc.kind === "imageResults") return imageResults(desc);
    if (desc.kind === "history") return history(desc);
    if (desc.kind === "lookup") return lookup(desc);
    if (desc.kind === "notfound") return renderNotFound(phone, desc);
    if (desc.kind === "maintenance") return renderMaintenance(phone, desc);
    if (desc.kind === "parked") return renderParked(phone, desc);
    if (desc.kind === "gone") return renderUnreachable(phone, desc);
    if (desc.kind === "sitehome") return renderSiteHome(phone, desc);
    if (desc.kind === "archive") return archive(desc);
    return page(desc);
  }

  function titleOf(desc) {
    if (!desc) return "Seeker";
    if (desc.kind === "home") return "Seeker";
    if (desc.kind === "results") return desc.title || `“${desc.q}”`;
    if (desc.kind === "history") return desc.tab === "bookmarks" ? "Bookmarks" : desc.tab === "searches" ? "Searches" : "History";
    if (desc.kind === "notfound") return "Page not found";
    if (desc.kind === "maintenance") return "We'll be back soon";
    if (desc.kind === "parked") return "This domain may be for sale";
    if (desc.kind === "gone") return "This site can't be reached";
    if (desc.kind === "sitehome") return desc.url || "Home";
    if (desc.kind === "page") return desc.view?.title || desc.url || "Page";
    if (desc.kind === "lookup") return desc.q || "Lookup";
    if (desc.kind === "archive") return "Archive";
    return "";
  }

  return {
    id: "browser",
    root: () => ({ kind: "home" }),
    title: titleOf,
    render(desc, canBack) {
      return [addressBar(desc), h("div.scroll", { style: { zoom: String(textScale(g.s)) } }, bodyOf(desc))];
    },
  };
}
