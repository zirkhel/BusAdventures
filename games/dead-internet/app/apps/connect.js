// @ts-check
// Connect, the social network. Screens: home (search + recently viewed) · page {id, view} · results

import { h, icon, fmtDate } from "../ui.js";
import { suggestBox } from "../suggest.js";
import { avatar } from "../media.js";
import { renderArtifact, renderGone } from "../render.js";

export function connectApp(phone) {
  const g = phone.g, w = g.w;

  function bar(title, canBack, extra) {
    return h("div.topbar.connect-bar",
      phone.backButton(),
      h("div.bar-title", title), extra || null);
  }

  function home() {
    const input = /** @type {HTMLInputElement} */ (h("input.seek-input", { type: "search", enterkeyhint: "search", placeholder: "Search Connect", autocapitalize: "off", autocomplete: "off" }));
    const form = h("form.seek-form", { onsubmit: e => { e.preventDefault(); input.blur(); search(input.value); } }, icon("search", "addr-ico"), input);
    suggestBox(phone, input, form, q => { input.blur(); search(q); });
    const seen = Object.entries(g.s.seen).filter(([id]) => w.artifacts.get(id)?.platform === "connect")
      .sort((a, b) => b[1] - a[1]).map(([id]) => id);
    const people = seen.filter(id => w.artifacts.get(id).type === "profile");
    const posts = seen.filter(id => w.artifacts.get(id).type === "post").slice(0, 12);
    return h("div.connect-home",
      form,
      people.length ? h("div.section-title", "People you've looked at") : null,
      h("div.people-row", people.map(id => {
        const a = w.artifacts.get(id), acc = w.accounts.get(a.author);
        return h("button.person", { onclick: () => phone.openArtifact(id, undefined, "connect") }, avatar(w, a.author, 54), h("span", acc?.displayName || a.title));
      })),
      posts.length ? h("div.section-title", "Posts you've seen") : null,
      posts.map(id => postCard(id)),
      !seen.length ? h("div.empty", h("b", "Nothing here yet."), h("div.muted", "Search for someone, or follow a link to a profile.")) : null);
  }

  function search(q) {
    if (!q.trim()) return;
    const r = g.search(q);
    phone.push("connect", { kind: "results", q, results: (r.results || []).filter(x => x.platform === "connect") });
  }

  function postCard(id, versionId) {
    const a = w.artifacts.get(id);
    const v = versionId ? g.view(id, versionId) : g.view(id);
    const acc = w.accounts.get(a.author);
    const text = v.error ? "This post is no longer available." : String(v.body || "").split("\n")[0];
    return h("button.post-card", { onclick: () => phone.openArtifact(id, versionId, "connect") },
      avatar(w, a.author, 34),
      h("div", h("div.pc-head", h("b", acc?.displayName || ""), h("span.muted", ` ${acc?.handle || ""} · ${fmtDate(v.date || a.date, false)}`)),
        h("div.pc-text", text)));
  }

  function postsBy(accId) {
    return [...w.artifacts.values()].filter(a => a.author === accId && a.type === "post" && g.ctx.isLive(a.id))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  function page(desc) {
    const v = desc.view;
    if (!v) return h("div.empty", "Nothing here.");
    if (v.error) return renderGone(phone, v, ver => phone.openArtifact(desc.id, ver, "browser"), phone.archiveOpener(desc.id));
    const art = renderArtifact(phone, v);
    if (v.cached) art.prepend(h("div.cache-banner", h("b", "Archive copy"), ` Copy from ${fmtDate(v.date)}.`));
    if (v.type === "profile" && !v.cached && v.author) {
      const posts = postsBy(v.author);
      if (posts.length) art.append(h("div.section-title", "Posts"), ...posts.map(p => postCard(p.id)));
    }
    return art;
  }

  // A public account card, not a generated biography or a view of its hidden operator.
  function accountCard(id) {
    const acc = w.accounts.get(id);
    if (!acc) return h("div.empty", "Account unavailable.");
    if (g.s.accounts[id]?.deleted) return h("div.empty", "This account is no longer available.");
    const contact = g.contacts().find(cid => w.characters.get(cid)?.account === id);
    const posts = [...w.artifacts.values()]
      .filter(a => a.author === id && ["post", "article", "thread"].includes(a.type) && g.ctx.isLive(a.id))
      .map(a => ({ a, v: g.view(a.id) }))
      .filter(({ v }) => !v.error && !v.locked)
      .sort((a, b) => String(b.v.date || "").localeCompare(String(a.v.date || "")));
    return h("div.connect-home",
      h("header.soc-head.profile",
        acc.avatar ? h("button.avatar-open", { "aria-label": "View profile picture", onclick: () => phone.viewImage(acc.avatar) }, avatar(w, id, 84)) : avatar(w, id, 84),
        h("div.soc-names", h("b", acc.displayName || acc.handle), h("span.handle", acc.handle), h("span.muted", w.platforms.get(acc.platform)?.name || ""))),
      acc.bio ? h("p", acc.bio) : null,
      contact ? h("button.btn", { onclick: () => phone.push("messages", { kind: "thread", id: contact }) }, "Send message")
        : h("p.muted", "Direct messages are unavailable for this account."),
      h("button.btn", { onclick: () => phone.search(acc.handle || acc.displayName) }, "Search for this account"),
      h("details", h("summary.section-title", "View posts"),
        posts.length ? posts.map(({ a, v }) => h("button.post-card", { onclick: () => phone.openArtifact(a.id) },
          h("div", h("b", v.title || "Post"), v.date ? h("div.muted", fmtDate(v.date)) : null)))
          : h("p.muted", "No public posts available here.")));
  }

  function results(desc) {
    return h("div.results", desc.results.length ? desc.results.map(r => postCard(r.artifact, r.cached ? r.versionId : undefined)) :
      h("div.empty", h("b", `Nothing on Connect for “${desc.q}”.`)));
  }

  return {
    id: "connect",
    root: () => ({ kind: "home" }),
    render(desc, canBack) {
      if (desc.kind === "account") return [bar("Profile", canBack), h("div.scroll", accountCard(desc.id))];
      if (desc.kind === "page") {
        const v = desc.view;
        const ref = v && !v.error ? { artifact: desc.id, version: v.versionId } : null;
        const save = ref ? h("button.icon-btn", { "aria-label": "Save as evidence", onclick: () => phone.saveEvidence(ref) }, icon(phone.isSaved(ref) ? "bookmarked" : "bookmark")) : null;
        return [bar(v?.type === "profile" ? "Profile" : "Post", canBack, save), h("div.scroll", page(desc))];
      }
      if (desc.kind === "results") return [bar(`“${desc.q}”`, canBack), h("div.scroll", results(desc))];
      return [bar("Connect", canBack), h("div.scroll", home())];
    },
  };
}
