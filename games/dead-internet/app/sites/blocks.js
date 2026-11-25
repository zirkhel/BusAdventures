// @ts-check
// Shared content blocks. Appearance comes from the template/theme CSS, never from importance.

import { h, fmtDate } from "../ui.js";
import { img } from "../media.js";

export function richText(phone, text) { return phone.ctx.text(text); }

export function figure(phone, imageId, ctx) {
  const el = h("figure.fig", img(imageId, { alt: phone.g.w.images.get(imageId)?.caption || "" }));
  el.addEventListener("click", () => phone.ctx.open({ type: "image", text: "", image: imageId, artifact: ctx?.artifact }, ctx));
  return el;
}

export function para(phone, text, cls = "p") {
  const lines = String(text).split("\n");
  return h(`p.${cls}`, lines.map((l, i) => [richText(phone, l), i < lines.length - 1 ? h("br") : null]));
}

/**
 * @param {any} phone
 * @param {any} block
 * @param {{ artifact?: string, version?: string, images?: string[] }} ctx
 */
export function renderBlock(phone, block, ctx = {}) {
  const t = block?.t || "text";
  if (t === "hero") return hero(phone, block, ctx);
  if (t === "text") return textBlock(phone, block, ctx);
  if (t === "people") return listBlock(phone, block, "people", item => [
    item.image ? figure(phone, item.image, ctx) : null,
    item.name ? h("b", richText(phone, item.name)) : null,
    item.role ? h("div.muted", richText(phone, item.role)) : null,
    item.text ? para(phone, item.text) : null,
  ]);
  if (t === "cards") return listBlock(phone, block, "cards", item => [
    item.image ? figure(phone, item.image, ctx) : null,
    item.title ? h("b", richText(phone, item.title)) : null,
    item.text ? para(phone, item.text) : null,
  ]);
  if (t === "jobs") return listBlock(phone, block, "jobs", item => [
    item.title ? h("b", richText(phone, item.title)) : null,
    item.where ? h("div.muted", richText(phone, item.where)) : null,
    item.text ? para(phone, item.text) : null,
  ]);
  if (t === "list") return listBlock(phone, block, "list", item => [
    typeof item === "string" ? para(phone, item) : [item.title ? h("b", richText(phone, item.title)) : null, item.text ? para(phone, item.text) : null],
  ]);
  if (t === "stats") return listBlock(phone, block, "stats", item => [
    h("div.stat-n", item.value || item.n || ""),
    h("div.muted", richText(phone, item.label || item.text || "")),
  ]);
  if (t === "notice") return h("div.site-notice", block.title ? h("b", richText(phone, block.title)) : null, block.text ? para(phone, block.text) : null);
  if (t === "comments" && block.items) {
    return h("section.comments", block.items.map(c => h("div.comment", h("b", c.author || ""), c.date ? h("span.muted", fmtDate(c.date)) : null, para(phone, c.text || ""))));
  }
  return textBlock(phone, block, ctx);
}

function listBlock(phone, block, cls, renderItem) {
  const items = block.items || [];
  return h(`div.site-${cls}`,
    block.title ? h("h2", richText(phone, block.title)) : null,
    items.map(item => h(`div.site-${cls}-item`, renderItem(item))));
}

function hero(phone, block, ctx) {
  const image = block.image || (ctx.images || []).shift();
  return h("div.site-hero",
    image ? figure(phone, image, ctx) : null,
    block.title ? h("h2", richText(phone, block.title)) : null,
    block.text ? para(phone, block.text) : null);
}

function textBlock(phone, block, ctx) {
  const text = block.text || block.body || "";
  const image = block.image;
  return h("div.site-text",
    block.title ? h("h2", richText(phone, block.title)) : null,
    image ? figure(phone, image, ctx) : null,
    text ? para(phone, text) : null);
}
