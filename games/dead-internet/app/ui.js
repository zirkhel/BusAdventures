// @ts-check
// Small DOM helpers for the phone UI. No framework: h() builds elements.

/**
 * h("div.card#id", {onclick, class, style, ...attrs}, ...children)
 * @param {string} sel
 * @param {any} [props]
 * @param {...any} kids
 * @returns {HTMLElement}
 */
export function h(sel, props, ...kids) {
  if (props == null || typeof props !== "object" || props instanceof Node || Array.isArray(props)) { if (props != null) kids.unshift(props); props = {}; }
  const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement(m?.[1] || "div");
  for (const part of (m?.[2] || "").match(/[.#][\w-]+/g) || []) {
    if (part[0] === ".") el.classList.add(part.slice(1)); else el.id = part.slice(1);
  }
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") el.className += (el.className ? " " : "") + v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k === "html") el.innerHTML = v;
    else if (k in el && typeof v !== "string") /** @type {any} */ (el)[k] = v;
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  append(el, kids);
  return el;
}

function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

/** Inline SVG icons (24×24, stroke = currentColor). */
const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  home: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  bookmark: '<path d="M7 4h10v16l-5-4-5 4z"/>',
  bookmarked: '<path d="M7 4h10v16l-5-4-5 4z" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  flip: '<path d="M12 3v18"/><path d="M8 7L3 12l5 5z"/><path d="M16 7l5 5-5 5z" fill="currentColor"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  people: '<circle cx="9" cy="9" r="3.5"/><path d="M2.5 20c.8-4 3.4-6 6.5-6s5.7 2 6.5 6"/><circle cx="17" cy="8" r="2.5"/><path d="M16 13.2c2.8 0 4.8 1.8 5.5 5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  book: '<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
  paperclip: '<path d="M20 11l-8 8a5 5 0 01-7-7l8-8a3.5 3.5 0 015 5l-8 8a2 2 0 01-3-3l7-7"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  battery: '<rect x="2" y="7" width="18" height="10" rx="2.5"/><rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor" stroke="none"/><path d="M22 10.5v3"/>',
  signal: '<path d="M4 18v-2M9 18v-5M14 18v-8M19 18V7" stroke-width="2.6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  history: '<path d="M4 12a8 8 0 102.3-5.6"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
  reload: '<path d="M19 12a7 7 0 11-2.1-5"/><path d="M19 4v4h-4"/>',
};

/** @param {keyof typeof ICONS | string} name */
export function icon(name, cls = "") {
  const span = document.createElement("span");
  span.className = `ico ${cls}`;
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  return span;
}

/** Long press (touch or mouse). Calls fn(event) after `ms`. Movement cancels. */
export function onLongPress(el, fn, ms = 520) {
  let timer = 0, x = 0, y = 0;
  const cancel = () => { clearTimeout(timer); timer = 0; };
  el.addEventListener("pointerdown", e => {
    if (e.button > 0) return;
    x = e.clientX; y = e.clientY;
    cancel();
    timer = window.setTimeout(() => { timer = 0; fn(e); }, ms);
  });
  el.addEventListener("pointermove", e => { if (timer && Math.hypot(e.clientX - x, e.clientY - y) > 10) cancel(); });
  for (const t of ["pointerup", "pointercancel", "pointerleave"]) el.addEventListener(t, cancel);
  el.addEventListener("contextmenu", e => { e.preventDefault(); });
}

/** Format an ISO date as "Mar 9, 2026". */
export function fmtDate(iso, withYear = true) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return withYear ? `${mon} ${d}, ${y}` : `${mon} ${d}`;
}

export function weekday(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function clock() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A Timeline date as the player entered it. */
export function fmtEventDate(d) {
  if (!d || d.kind === "unknown") return "Date unknown";
  if (d.kind === "exact") return fmtDate(d.value) + (d.time ? ` · ${d.time}` : "");
  if (d.kind === "range") return `${fmtDate(d.from)} – ${fmtDate(d.to)}`;
  const [y, m, day] = String(d.value).split("-");
  if (day) return `around ${fmtDate(d.value)}`;
  if (m) return `around ${MONTH_NAMES[+m - 1]} ${y}`;
  return `around ${y}`;
}
