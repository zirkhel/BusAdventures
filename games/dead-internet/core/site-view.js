// @ts-check
// Public view object for site templates and page rendering. Hidden canon never
// leaves this whitelist: supports, mentions, source, filler, hidden, covers, pool
// and other authoring fields are dropped even if a caller passes a raw artifact.

/** Fields a template or page renderer may read. */
export const PUBLIC_VIEW_KEYS = [
  "id", "type", "platform", "url", "author",
  "title", "body", "blocks", "date", "publishedDate", "silent", "images",
  "section", "byline", "corrections", "related", "refs", "sponsored",
  "comments", "video", "transcript", "stats", "breaking",
  "versionId", "cached", "cachedVersions", "saved",
  "locked", "loginSite", "error",
  "site", "page", "design",
];

const HIDDEN = ["supports", "mentions", "source", "filler", "hidden", "covers", "pool",
  "keywords", "index", "live", "access", "visibleIf", "datedOnShow", "pack", "listed", "feed"];

/**
 * A shallow public copy of an artifact view. Unknown and hidden keys are dropped.
 * @param {any} v
 */
export function publicView(v) {
  if (v == null || typeof v !== "object") return v;
  /** @type {any} */
  const out = {};
  for (const k of PUBLIC_VIEW_KEYS) {
    if (v[k] !== undefined) out[k] = v[k];
  }
  return out;
}

/** @param {string} key */
export function isHiddenViewKey(key) {
  return HIDDEN.includes(key);
}
