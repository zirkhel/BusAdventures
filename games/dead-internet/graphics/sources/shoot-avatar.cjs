// Renders the logo-based Connect avatars to 512×512 PNG (post step converts to webp).
//   node graphics/sources/shoot-avatar.cjs
const { chromium } = require("playwright");
const jobs = [
  { page: "avatar-brightline.html", out: "avatar-brightline.png" },
  { page: "logos/logo-northgate.svg", out: "avatar-northgate.png" },
];
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  for (const j of jobs) {
    if (j.page.endsWith(".svg")) await p.setContent(`<html><body style="margin:0"><img src="file://${__dirname}/${j.page}" style="width:512px;height:512px;display:block"></body></html>`);
    else await p.goto("file://" + __dirname + "/" + j.page);
    await p.waitForTimeout(200); await p.screenshot({ path: __dirname + "/" + j.out });
  }
  await b.close(); })();
