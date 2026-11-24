const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  await p.goto("file://" + __dirname + "/avatar-brightline.html"); await p.screenshot({ path: __dirname + "/avatar-brightline.png" }); await b.close(); })();
