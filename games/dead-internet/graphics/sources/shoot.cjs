const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
 await p.goto('file://' + __dirname + '/dashboard.html'); await p.screenshot({ path: __dirname + '/dashboard.png' });
 await p.setViewportSize({ width: 1240, height: 1754 }); await p.goto('file://' + __dirname + '/invoice.html'); await p.screenshot({ path: __dirname + '/invoice.png' });
 await b.close(); })();
