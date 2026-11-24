// @ts-check
// Loads a world from content/manifest.json. File reading is injected, so the same code
// runs with fetch() in the browser and fs in Node.
//
//   const raw = await loadContent(path => fetch(base + path).then(r => r.json()));
//   const world = buildWorld(raw);

/** @param {(path:string)=>Promise<any>} readJson  path is relative to the content folder */
export async function loadContent(readJson) {
  const manifest = await readJson("manifest.json");
  const raw = { meta: null, strings: {}, entities: [], accounts: [], platforms: [], images: [], artifacts: [],
    characters: [], rules: [], predicates: [], canon: { claims: [], facts: [] }, mysteries: [], terms: [] };
  for (const [key, files] of Object.entries(manifest.files)) {
    for (const f of [].concat(files)) {
      const data = await readJson(f);
      if (key === "meta") raw.meta = data;
      else if (key === "strings") Object.assign(raw.strings, data);
      else if (key === "canon") { raw.canon.claims.push(...(data.claims || [])); raw.canon.facts.push(...(data.facts || [])); }
      else if (Array.isArray(raw[key])) raw[key].push(...data);
      else throw new Error(`manifest: unknown section "${key}"`);
    }
  }
  return raw;
}
