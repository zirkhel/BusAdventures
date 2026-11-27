// @ts-check
// Connect, the social network. Screens: home (search + recently viewed) · page {id, view} · results

import { h, icon, fmtDate } from "../ui.js";
import { suggestBox } from "../suggest.js";
import { avatar, img } from "../media.js";
import { renderArtifact, renderGone } from "../render.js";

export function connectApp(phone) {
  const g = phone.g, w = g.w;

  function bar(title, canBack, extra) {
    return h("div.topbar.connect-bar",
      phone.backButton(),
      h("div.bar-title", title), extra || null);
  }

  function home(desc) {
    const input = /** @type {HTMLInputElement} */ (h("input.seek-input", { type: "search", enterkeyhint: "search", placeholder: "Search Connect", autocapitalize: "off", autocomplete: "off" }));
    const form = h("form.seek-form", { onsubmit: e => { e.preventDefault(); input.blur(); search(input.value); } }, icon("search", "addr-ico"), input);
    suggestBox(phone, input, form, q => { input.blur(); search(q); });
    const friends = (g.s.friends || []).filter(id => w.accounts.has(id));
    const limit = desc.limit || 12;
    const posts = g.feed("connect", "forYou", 0, w.artifacts.size).items.filter(id => {
      const a = w.artifacts.get(id), v = g.view(id);
      return a.type === "post" && !v.error && !v.locked && (!v.date || String(v.date).slice(0, 10) <= g.date);
    });
    return h("div.connect-home", form,
      h("div.sources", ["feed", "friends"].map(tab => h("button.chip", { class: (desc.tab || "feed") === tab ? "on" : "",
        onclick: () => phone.replaceTop({ kind: "home", tab }) }, tab === "feed" ? "News Feed" : "Friends"))),
      desc.tab === "friends" ? [h("p.pad.muted", "Your own list, across apps. Adding a friend does not send a request."),
        friends.length ? friends.map(id => {
          const a = w.accounts.get(id);
          const contact = g.contacts().find(cid => w.characters.get(cid)?.account === id);
          return h("div.friend-card", h("button.person", { onclick: () => phone.openAccount(id) }, avatar(w, id, 44), h("span", a.displayName || a.handle)),
            h("div.muted", a.handle), phone.friendButton(id), contact ? h("button.btn", { onclick: () => phone.push("messages", { kind: "thread", id: contact }) }, "Message") : null);
        }) : h("div.empty", "Add friends from a profile or by tapping an account name in any app.")]
      : [posts.slice(0, limit).map(id => feedCard(id)),
        posts.length > limit ? h("button.btn.wide", { onclick: () => phone.replaceTop({ ...desc, limit: limit + 12 }) }, "Show more") : null,
        !posts.length ? h("div.empty", "No public posts available right now.") : null]);
  }

  function feedCard(id) {
    const v = g.view(id), a = w.accounts.get(v.author);
    return h("article.connect-feed-card",
      h("button.feed-author", { onclick: () => phone.openAccount(v.author) }, avatar(w, v.author, 44),
        h("div", h("b", a?.displayName || a?.handle || "Account"), h("div.muted", `${a?.handle || ""} · ${fmtDate(v.date, false)}`))),
      h("button.feed-content", { onclick: () => phone.openArtifact(id, undefined, "connect") },
        h("p", String(v.body || "")), (v.images || []).slice(0, 1).map(id => img(id, { cls: "feed-image" }))),
      h("button.bar-link", { onclick: () => phone.openArtifact(id, undefined, "connect") }, "Open post"));
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
      art.append(phone.friendButton(v.author));
      const contact = g.contacts().find(id => w.characters.get(id)?.account === v.author);
      if (contact) art.append(h("button.btn", { onclick: () => phone.push("messages", { kind: "thread", id: contact }) }, "Send message"));
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
      phone.friendButton(id),
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
      return [bar("Connect", canBack), h("div.scroll", home(desc))];
    },
  };
}
