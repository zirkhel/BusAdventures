// @ts-check
// Loads a world from content/manifest.json. File reading is injected, so the same code
// runs with fetch() in the browser and fs in Node.
//
//   const raw = await loadContent(path => fetch(base + path).then(r => r.json()));
//   const world = buildWorld(raw);
//
// One universe, many mysteries. manifest.files is the universe (people, accounts, media,
// background content, seed mysteries). manifest.mysteries lists mystery packs: each is a
// mystery.json whose `files` (relative to its folder) add artifacts, claims, rules and
// character extensions to the same world. Ids are global. A character entry with
// `extends: "<id>"` adds knowledge and responses to an existing person for that mystery.
//
// Pools (shared background media: news archives, TokTok creators, clips, transcripts) are
// ordinary universe files listed in manifest.files, e.g. "artifacts": ["universe/pools/toktok/clips.json"].

const SECTIONS = ["entities", "accounts", "platforms", "images", "videos", "scripts", "artifacts", "characters", "rules", "predicates", "mysteries", "terms"];

/** @param {(path:string)=>Promise<any>} readJson  path is relative to the content folder */
export async function loadContent(readJson) {
  const manifest = await readJson("manifest.json");
  /** @type {any} */
  const raw = { meta: null, strings: {}, entities: [], accounts: [], platforms: [], images: [], videos: [], scripts: [], artifacts: [],
    characters: [], rules: [], predicates: [], canon: { claims: [], facts: [] }, mysteries: [], terms: [],
    /** artifact id → "universe" or the mystery that brought it */
    packOf: {} };
  const extensions = [];
  const add = (key, data, pack) => {
    if (key === "meta") raw.meta = data;
    else if (key === "strings") Object.assign(raw.strings, data);
    else if (key === "canon") { raw.canon.claims.push(...(data.claims || [])); raw.canon.facts.push(...(data.facts || [])); }
    else if (key === "characters") for (const c of data) (c.extends ? extensions : raw.characters).push({ ...c, ...(c.extends ? { pack } : {}) });
    else if (key === "rules") raw.rules.push(...data.map(r => (pack === "universe" ? r : { ...r, case: pack })));
    else if (key === "artifacts") { for (const a of data) raw.packOf[a.id] = pack; raw.artifacts.push(...data); }
    else if (SECTIONS.includes(key)) raw[key].push(...data);
    else throw new Error(`manifest: unknown section "${key}"`);
  };
  for (const [key, files] of Object.entries(manifest.files)) for (const f of [].concat(files)) add(key, await readJson(f), "universe");
  for (const path of manifest.mysteries || []) {
    const m = await readJson(path);
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
    const { files, ...def } = m;
    raw.mysteries.push(def);
    for (const [key, list] of Object.entries(files || {})) {
      if (key === "meta" || key === "mysteries") throw new Error(`mystery ${def.id}: "${key}" belongs to the universe`);
      for (const f of [].concat(list)) add(key, await readJson(dir + f), def.id);
    }
  }
  for (const ext of extensions) extendCharacter(raw, ext);
  return raw;
}

/** Merge a mystery's additions into a universe character: lists are appended, objects merged. */
function extendCharacter(raw, ext) {
  const base = raw.characters.find(c => c.id === ext.extends);
  if (!base) throw new Error(`character extension: unknown character "${ext.extends}" (${ext.pack})`);
  for (const [k, v] of Object.entries(ext)) {
    if (k === "extends" || k === "pack" || k === "id") continue;
    if (Array.isArray(v)) base[k] = [...(base[k] || []), ...v];
    else if (v && typeof v === "object") base[k] = { ...(base[k] || {}), ...v };
    else base[k] = v;
  }
}
