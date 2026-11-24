// @ts-check
// News app template (The Daily Record, Unfiltered, any later paper). One app per platform with
// `app: { template: "news", … }` in platforms.json: the home screen reads them from the data.
// Screens:
//   front {section?, more?} · page {id, version, view} · author {account} · results {q, results}
//
// Lists come from game.news(): newest first, never ranked, never by relevance. Articles are the
// same objects the Browser shows on the paper's website, rendered by render.js.

import { h, icon, fmtDate } from "../ui.js";
import { img, avatar } from "../media.js";
import { renderArtifact, renderLogin, renderGone } from "../render.js";

/** Label of a section id: the app's own label, or the id in title case. */
export function sectionLabel(pf, id) {
  return pf?.app?.sectionLabels?.[id] ?? String(id || "").replace(/(^|[-_ ])(\w)/g, (m, s, c) => (s ? " " : "") + c.toUpperCase());
}

/** Display names of a byline: account names, or the free text as written. */
export function bylineNames(w, byline) {
  return (byline || []).map(b => w.accounts.get(b)?.displayName || b);
}

export function newsApp(phone, pf) {
  const g = phone.g, w = g.w;
  const app = pf.app;
  const id = app.id || pf.id;
  const sections = app.sections || [];
  const PAGE = 20;

  const logo = () => h("div.np-logo", { class: `np-${app.theme || pf.id}` }, app.logo || pf.name);

  function topbar(desc) {
    const title = desc.kind === "front" ? logo() : h("div.np-title", { class: `np-${app.theme || pf.id}` }, app.short || pf.name);
    return h("div.topbar.np-bar", { class: `np-${app.theme || pf.id}` },
      phone.backButton(), title,
      desc.kind === "page" ? shareButton(desc) : h("button.icon-btn", { "aria-label": `Search ${pf.name}`, onclick: () => phone.push(id, { kind: "results", q: "", results: [] }) }, icon("search")));
  }

  function shareButton(desc) {
    const v = desc.view;
    if (!v || v.error || v.locked) return null;
    return h("button.icon-btn", { "aria-label": "Share", onclick: () => share(desc) }, icon("more"));
  }

  /** Copy link, open in Browser, save, send to a contact. */
  function share(desc) {
    const v = desc.view, ref = { artifact: desc.id, version: v.versionId };
    phone.actionSheet(v.title || pf.name, [
      { label: "Copy link", icon: "copy", run: () => phone.copy(v.url || "") },
      { label: "Open in Browser", icon: "globe", run: () => phone.openArtifact(desc.id, v.cached ? v.versionId : undefined, "browser") },
      { label: phone.isSaved(ref) ? "Saved to Casebook" : "Save to Casebook", icon: phone.isSaved(ref) ? "bookmarked" : "bookmark", run: () => phone.saveEvidence(ref) },
      { label: "Send to…", icon: "chat", run: () => sendTo(desc) },
      { label: "Other versions", icon: "clock", run: () => phone.versions(desc.id) },
    ]);
  }

  function sendTo(desc) {
    const people = g.contacts();
    phone.picker({ title: "Send to…", empty: "Nobody to send it to yet.",
      groups: [{ title: "", items: people.map(p => ({ id: p, label: phone.contactName(p), thumb: avatar(w, w.characters.get(p)?.account, 32) })) }],
      onPick: to => {
        const r = g.dispatch({ type: "message", to, msg: { kind: "show", artifact: desc.id, version: desc.view.cached ? desc.view.versionId : undefined } });
        if (r?.error) { phone.toast(phone.str(`errors.${r.error}`)); return; }
        phone.push("messages", { kind: "thread", id: to, typingFrom: Math.max(0, g.thread(to).length - 1) });
      } });
  }

  // ── Lists ────────────────────────────────────────────────────────────────

  function item(aid, big = false) {
    const v = g.view(aid);
    const names = bylineNames(w, v.byline);
    const pic = (v.images || [])[0];
    return h("button.np-item", { class: big ? "top" : "", onclick: () => phone.openArtifact(aid, undefined, id) },
      big && pic ? img(pic, { cls: "np-hero" }) : null,
      h("div.np-item-main",
        h("div.np-kicker", v.sponsored ? h("span.np-sponsored", "Sponsored") : null, v.section ? sectionLabel(pf, v.section) : null),
        h(big ? "h2.np-head" : "div.np-head", v.title),
        h("div.np-meta.muted", [names.length ? `${names.join(", ")} · ` : "", v.date ? fmtDate(v.date) : ""])),
      !big && pic ? img(pic, { cls: "np-thumb" }) : null);
  }

  function front(desc) {
    const section = desc.section ?? null;
    const limit = desc.more ?? PAGE;
    const { items, total } = g.news(pf.id, { section, limit });
    const breaking = section ? null : items.map(x => g.view(x)).find(v => v.breaking && v.date && v.date.slice(0, 10) >= g.date);
    const tabs = h("div.np-sections", h("button.np-sec", { class: section ? "" : "on", onclick: () => phone.replaceTop({ kind: "front", section: null }) }, app.frontLabel || "Top"),
      sections.map(s => h("button.np-sec", { class: s === section ? "on" : "", onclick: () => phone.replaceTop({ kind: "front", section: s, scroll: 0 }) }, sectionLabel(pf, s))));
    if (!items.length) return [tabs, h("div.empty.muted", "No stories here yet.")];
    return h("div.np-front", { class: `np-${app.theme || pf.id}` },
      tabs,
      breaking ? h("button.np-breaking", { onclick: () => phone.openArtifact(breaking.id, undefined, id) }, h("b", app.breakingLabel || "Breaking"), h("span", breaking.title)) : null,
      item(items[0], !section),
      app.tagline && !section ? h("div.np-tagline", app.tagline) : null,
      items.slice(1).map(x => item(x)),
      total > items.length ? h("button.btn.np-more", { onclick: () => phone.replaceTop({ ...desc, more: limit + PAGE }) }, "More stories") : null);
  }

  /** Author page: who they say they are and everything under their name. */
  function author(desc) {
    const acc = w.accounts.get(desc.account);
    const { items, total } = g.news(pf.id, { author: desc.account, limit: desc.more ?? 50 });
    return h("div.np-author", { class: `np-${app.theme || pf.id}` },
      h("div.np-author-head", avatar(w, desc.account, 72),
        h("div", h("h1", phone.ctx.span(acc?.displayName || desc.account, { type: "account", id: desc.account })),
          acc?.role ? h("div.muted", acc.role) : null,
          h("div.muted", `${total} article${total === 1 ? "" : "s"} in ${pf.name}`))),
      acc?.bio ? h("p.np-bio", phone.ctx.text(acc.bio)) : null,
      items.map(x => item(x)),
      total > items.length ? h("button.btn.np-more", { onclick: () => phone.replaceTop({ ...desc, more: (desc.more ?? 50) + 50 }) }, "More") : null);
  }

  function results(desc) {
    const input = /** @type {HTMLInputElement} */ (h("input.np-search", { type: "search", enterkeyhint: "search", placeholder: `Search ${pf.name}`, value: desc.q || "", autocapitalize: "off", autocomplete: "off" }));
    const form = h("form.np-search-form", { onsubmit: e => { e.preventDefault(); input.blur(); runSearch(input.value, true); } }, icon("search", "addr-ico"), input);
    if (!desc.q) queueMicrotask(() => input.focus());
    const seen = new Set();
    const list = (desc.results || []).filter(r => !r.cached && !seen.has(r.artifact) && seen.add(r.artifact));
    return [form, desc.q ? h("div.results",
      h("div.results-count.muted", list.length ? `${list.length} stor${list.length === 1 ? "y" : "ies"}` : ""),
      list[0]?.partial ? h("div.results-partial.muted", "No story has all of these words. Showing stories with some of them.") : null,
      list.length ? list.map(r => item(r.artifact)) : h("div.empty", h("b", `No stories match “${desc.q}”.`), h("div.muted", "Older or removed stories may still be in Seeker's cache."))) : null];
  }

  function runSearch(q, replace = false) {
    const t = String(q || "").trim();
    if (!t) return;
    const r = g.search(t, { platform: pf.id });
    const desc = { kind: "results", q: t, results: r.results || [] };
    if (replace && phone.where === id && phone.top?.kind === "results") phone.replaceTop(desc); else phone.push(id, desc);
  }

  function page(desc) {
    const v = desc.view;
    if (!v) return h("div.empty", "Nothing here.");
    if (v.locked) return renderLogin(phone, v, () => { const r = g.open(desc.id); phone.replaceTop({ ...desc, view: r.view }); });
    if (v.error) return renderGone(phone, v, ver => phone.openArtifact(desc.id, ver, "browser"));
    const art = renderArtifact(phone, v, { app: id });
    if (v.cached) art.prepend(h("div.cache-banner", h("b", "Seeker cache"), ` A copy as it appeared on ${fmtDate(v.date)}.`));
    return art;
  }

  return {
    id,
    platform: pf.id,
    name: pf.name,
    root: () => ({ kind: "front", section: null }),
    /** Open an author's page (context menu "Author profile"). */
    openAuthor: accId => phone.push(id, { kind: "author", account: accId }),
    search: q => runSearch(q),
    title(desc) {
      if (desc.kind === "author") return w.accounts.get(desc.account)?.displayName || "Author";
      if (desc.kind === "results") return desc.q ? `“${desc.q}”` : `Search ${pf.name}`;
      if (desc.kind === "front") return desc.section ? sectionLabel(pf, desc.section) : pf.name;
      return null;
    },
    render(desc) {
      const body = desc.kind === "front" ? front(desc) : desc.kind === "author" ? author(desc) : desc.kind === "results" ? results(desc) : page(desc);
      return [topbar(desc), h("div.scroll", { class: `np-scroll np-${app.theme || pf.id}` }, body)];
    },
  };
}
