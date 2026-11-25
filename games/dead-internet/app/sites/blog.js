// @ts-check
// Blog template. classic ≈ 2012 free theme; minimal is the post-takeover look.

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages } from "./chrome.js";
import { listedPages } from "../../core/sites.js";

/**
 * @param {any} phone
 * @param {{ v: any, a: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderBlog(phone, o) {
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const header = h("header.site-head",
    h("div.site-brand", logoOf(phone, design, site),
      design.header?.tagline ? h("div.site-tagline", design.header.tagline) : null),
    items.length ? h("nav.site-nav", items.map(it => navLink(phone, it))) : null);

  const used = { ...ctx, images: [...(ctx.images || [])] };
  const body = blocks.map(b => renderBlock(phone, b, used));
  body.push(...leftoverImages(phone, used));

  const asOf = v.cached ? v.date : null;
  const posts = listedPages(phone.g, site.id, { page: "post", asOf: asOf || undefined, cached: !!v.cached });
  const archive = h("aside.site-side",
    h("h2", "Archive"),
    posts.length ? archiveList(phone, site, posts) : h("div.muted", "No posts yet."));

  return h("div.site-shell",
    header,
    h("div.site-layout",
      h("div.site-main",
        h("h1", phone.ctx.text(v.title)),
        v.date ? h("div.muted.site-date", fmtDate(v.date)) : null,
        h("div.page-body", body),
        page === "post" ? commentList(phone, v) : null),
      archive),
    footerOf(design, "Eastfield Notes"));
}

/** Blog comment field: name, date, text. No avatars — period-typical for a 2012 theme. */
function commentList(phone, v) {
  const comments = v.comments || [];
  if (!comments.length) {
    return h("section.site-comments", h("div.muted", "No comments yet."));
  }
  const w = phone.g.w;
  return h("section.site-comments",
    h("h2", `${comments.length} comment${comments.length === 1 ? "" : "s"}`),
    comments.map(c => {
      const acc = w.accounts.get(c.account);
      const name = acc?.displayName || acc?.handle || c.account;
      return h("div.site-comment",
        h("div.cm-head",
          acc ? h("b", phone.ctx.span(name, { type: "handle", id: c.account })) : h("b", name),
          c.date ? h("span.muted", ` · ${fmtDate(c.date)}`) : null),
        h("div.cm-text", phone.ctx.text(c.text || "")));
    }));
}

function archiveList(phone, site, posts) {
  const groups = new Map();
  for (const a of posts) {
    const d = String(a.date || "").slice(0, 7) || "undated";
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d).push(a);
  }
  const months = [...groups.keys()].sort().reverse();
  return months.map(month => h("div.site-arch-month",
    h("b", month === "undated" ? "Undated" : labelMonth(month)),
    groups.get(month).map(a => {
      const ver = a.versions[a.versions.length - 1];
      const title = ver?.title || a.title;
      return h("button.site-arch-link", { type: "button", onclick: () => a.url && phone.browse(a.url) }, title);
    })));
}

function labelMonth(ym) {
  const [y, m] = ym.split("-");
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${names[Number(m) - 1] || ym} ${y}`;
}

