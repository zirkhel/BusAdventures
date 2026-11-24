// @ts-check
// Browser with the Seeker search engine. Screens:
//   home · results {q, results, title?, cacheOnly?} · page {id, version, view} · imageResults {image, flip, results}
//   lookup {platform, q, url} (a tool page with no record for q) · history (recent pages and searches)

import { h, icon, fmtDate } from "../ui.js";
import { suggestBox } from "../suggest.js";
import { img } from "../media.js";
import { renderArtifact, renderLogin, renderGone } from "../render.js";

export function browserApp(phone) {
  const g = phone.g;

  function addressBar(desc, canBack) {
    const input = /** @type {HTMLInputElement} */ (h("input.addr", { type: "search", enterkeyhint: "go", autocapitalize: "off", autocomplete: "off", spellcheck: "false",
      placeholder: "Search Seeker or type an address", value: desc.kind === "page" ? desc.url || "" : desc.kind === "results" ? desc.q : desc.kind === "lookup" ? desc.url : "" }));
    input.addEventListener("focus", () => input.select());
    const form = h("form.addr-form", { onsubmit: e => { e.preventDefault(); input.blur(); phone.browse(input.value); } },
      desc.kind === "page" && desc.view?.cached ? h("span.addr-tag", "cached") : desc.kind === "page" && desc.view?.locked ? icon("lock", "addr-ico") : icon("search", "addr-ico"),
      input);
    suggestBox(phone, input, form, q => { input.blur(); phone.browse(q); }, desc.kind === "page" ? desc.url : desc.kind === "results" ? desc.q : "");
    return h("div.topbar.browser-bar",
      phone.backButton(),
      form,
      desc.kind === "page" ? saveButton(desc) : null);
  }

  function saveButton(desc) {
    const v = desc.view;
    if (!v || v.error || v.locked) return null;
    const ref = { artifact: desc.id, version: v.versionId };
    return h("button.icon-btn", { "aria-label": "Save as evidence", onclick: () => phone.saveEvidence(ref) },
      icon(phone.isSaved(ref) ? "bookmarked" : "bookmark"));
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
      h("button.link-btn", { onclick: () => phone.push("browser", { kind: "history" }) }, icon("history"), "History"));
  }

  /** One tap repeats a recent search. */
  function recent() {
    const qs = [...new Set(g.s.searches.map(s => s.q).reverse())].slice(0, 8);
    if (!qs.length) return null;
    return h("div.seek-recent", h("div.section-title", "Recent searches"),
      qs.map(q => h("button.chip", { onclick: () => phone.search(q) }, icon("clock"), q)));
  }

  /** Everything the player has visited, and every search, newest first. */
  function history(desc) {
    const tab = desc.tab || "visited";
    const seg = h("div.seg.tabs", [["visited", "Visited"], ["searches", "Searches"]].map(([id, label]) =>
      h("button", { class: tab === id ? "on" : "", onclick: () => phone.replaceTop({ ...desc, tab: id }) }, label)));
    if (tab === "searches") {
      const list = [...g.s.searches].reverse();
      return [seg, list.length ? list.map(s => h("button.hist-row", { onclick: () => phone.search(s.q) }, icon("search"),
        h("div.pi-main", h("b", s.q), h("div.muted", `Day ${s.day}`)))) : h("div.empty.muted", "No searches yet.")];
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
    const open = () => phone.openArtifact(r.artifact, r.cached ? r.versionId : undefined, phone.appFor(r.artifact) === "connect" && !r.cached ? "connect" : "browser");
    return h("div.result", h("button.result-main", { onclick: open },
      h("div.result-site", h("span.site-name", g.w.platforms.get(r.platform)?.name || domainOf(r.url, r.platform)), h("span.muted", r.url || "")),
      h("div.result-title", r.title),
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
    if (v.locked) return renderLogin(phone, v, () => {
      const r = g.open(desc.id);
      phone.replaceTop({ ...desc, view: r.view });
      phone.toast("Signed in.");
    });
    if (v.error) return renderGone(phone, v, ver => phone.openArtifact(desc.id, ver, "browser"));
    const art = renderArtifact(phone, v);
    if (v.cached) art.prepend(h("div.cache-banner", h("b", "Seeker cache"), ` This is a copy of ${v.url || "the page"} as it appeared on ${fmtDate(v.date)}. The current page may have changed or been removed.`));
    return art;
  }

  return {
    id: "browser",
    root: () => ({ kind: "home" }),
    render(desc, canBack) {
      const body = desc.kind === "home" ? home() : desc.kind === "results" ? results(desc) :
        desc.kind === "imageResults" ? imageResults(desc) : desc.kind === "history" ? history(desc) : desc.kind === "lookup" ? lookup(desc) : page(desc);
      return [addressBar(desc, canBack), h("div.scroll", body)];
    },
  };
}
