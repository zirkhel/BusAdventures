// @ts-check
// Images. The world only knows image ids. graphics/catalog.json says which file belongs to
// each id. If the file is missing (not produced yet), the placeholder SVG is shown instead,
// so finished pictures can be dropped into assets/images/ without touching code.

import { h } from "./ui.js";

/** @type {Map<string, any>} */
let catalog = new Map();
const BASE = new URL("../", import.meta.url).href;

export async function loadCatalog() {
  try {
    const res = await fetch(BASE + "graphics/catalog.json");
    const data = await res.json();
    catalog = new Map((data.images || []).map(e => [e.id, e]));
  } catch { catalog = new Map(); }
}

export function placeholderUrl(id) { return `${BASE}assets/placeholders/${id}.svg`; }

/** @param {string} id */
export function imageUrl(id) {
  const e = catalog.get(id);
  return e?.file ? BASE + e.file : placeholderUrl(id);
}

export function imageSize(id) {
  const e = catalog.get(id);
  return e ? { w: e.width, h: e.height } : { w: 1, h: 1 };
}

/**
 * <img> for an image id, falling back to the placeholder when the file is missing.
 * @param {string} id
 * @param {{cls?:string, alt?:string, eager?:boolean}} [o]
 */
export function img(id, o = {}) {
  const { w, h: ht } = imageSize(id);
  const el = /** @type {HTMLImageElement} */ (h("img", { class: o.cls || "", alt: o.alt || "", draggable: "false", decoding: "async", loading: o.eager ? "eager" : "lazy", width: w, height: ht }));
  el.dataset.image = id;
  el.addEventListener("error", () => {
    const ph = placeholderUrl(id);
    if (el.src !== ph) el.src = ph;
  });
  el.src = imageUrl(id);
  return el;
}

/** Round avatar: the account's avatar image, or initials. */
export function avatar(w, accountId, size = 40) {
  const acc = accountId ? w.accounts.get(accountId) : null;
  const style = { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.4)}px` };
  if (acc?.avatar) return h("span.avatar", { style }, img(acc.avatar, { alt: "" }));
  const name = acc?.displayName || acc?.handle || accountId || "?";
  const initials = name.replace(/^@/, "").split(/[\s_.]+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join("");
  let hash = 0; for (const c of String(accountId || name)) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return h("span.avatar.initials", { style: { ...style, background: `hsl(${hash % 360} 28% 38%)` } }, initials || "?");
}
