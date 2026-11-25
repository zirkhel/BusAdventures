# Dead Internet: website inventory

_25. November 2026. Every domain or website reference in playable content (`content/`), and how it is represented in the W1 site model. The validator (`site-ref`) fails if a new domain appears in content without a matching site or an email-only exception._

## Rule

Every referenced website must exist in-game as a site, or as a site that used to exist (`gone`, `parked`, `maintenance`, or cache-only), per `docs/WEBSITES.md`. Names of organisations without any claim that they have a website are listed under «Not a website reference» and do not get a site invented for them.

## Sites in the model

| Site id | Domain | Status | In-game pages (W1) | Why it is here |
|---|---|---|---|---|
| `seeker` | seeker.search | live | Browser search (app-owned) | Seeker is the in-phone search engine |
| `connect` | connect.social | live | profiles and posts (Connect app) | Social network URLs |
| `threadline` | threadline.net | live | existing threads | Forum URLs |
| `dailyrecord` | dailyrecord-pc.com | live | articles + archive (news app) | Newspaper URLs |
| `unfiltered` | unfiltered.news | live | articles (news app) | Newspaper URLs |
| `eastfieldnotes` | eastfieldnotes.blog | live | A14 front (2 versions), A15, A33, A34, A36 | Mara's blog; theme change 22 Oct 2025 |
| `brightline` | brightlinemedia.co | live | A19, A20, A21, A42 | Agency site |
| `brightline_portal` | portal.bl-ops.net | live (login) | A24 | Client portal |
| `northgate` | northgatedev.com | live | A40 project, A41 statement (hidden until shown) | Paul's «our website»; project + statement |
| `kestrel` | kestrel-logistics.com | live | A38 | Client list |
| `city` | portcalder.gov | live | A53, B16, BG-CITY-01, A26, A27, A28 | City portal |
| `spillcheck` | spillcheck.io | live | A30 + lookup | Breach checker |
| `facelessstock` | facelessstock.com | live | A31, A31B | Stock portraits |
| `docshare` | docshare.link | live | existing shared documents | File links |
| `calderpedia` | calderpedia.org | live | A66, B17 | Wiki |
| `harbordesk` | harbordesk.co | live | B18 | Virtual office page |
| `saltys` | saltys-portcalder.com | live | B19 | Fish bar page |
| `eastfieldgarden` | eastfieldgarden.org | live | B20 | Garden page |
| `aiwriterpro` | aiwriterpro.app | live | B23 | Landing page |
| `static_channel` | static.channel | live | A44 | Raw text, no template |
| `corp_registries` | corp-registries.example | live | A63 | Placeholder domain (not renamed in W1) |
| `harbordental` | harbordental.com | live | W-harbordental-0001 (minimal home) | Connect post BG-CON-01: «New website is live». Domain from the approved websites plan. No new team or parking facts |
| `caldertransit` | caldertransit.gov | live | W-caldertransit-0001 (minimal home) | Daily Record article on ghost buses refers to «the transit authority's website». Domain from the approved plan. The live map is not built |
| `harbor_authority` | harbor.portcalder.gov | live | W-harbor-authority-0001 (minimal home) | Unfiltered comment: memo letterhead «matches the one on their site». **Domain is not named in canon**; this municipal host is assigned so the reference can resolve. Home text is only the authority's name |
| `eastfield_neighbors` | eastfieldneighbors.net | **gone** since 2023-02-20 | none | Daily Record A60: the forum was breached and «has since shut down». **Domain is not named in canon**; assigned only so the gone site can be addressed. No invented pages or cache |
| `portcalderjazz` | portcalderjazz.com | **parked** since 2022-01-01 | none | Already listed in WEBSITES.md §4 as a parked domain (changed hands in 2022, «This domain may be for sale»). Added in W3 so the parked state can be visited. No 2019 cache and no new story facts |

## Email-only domains (not websites)

These hosts appear as email addresses (and sometimes as the host part of those addresses). They are not public websites, and no site is invented for them. The validator allows them via `EMAIL_ONLY_DOMAINS` in `core/sites.js`.

| Domain | Where | Notes |
|---|---|---|
| `calder-mail.com` | Mara's contact address, SpillCheck query, forwarded mail | Consumer mail host |
| `bl-ops.net` | Renee's mail, careers@, recovery@ | Brightline ops/email host. The public portal is the separate site `portal.bl-ops.net` |

## Explicitly not a website

| Name | Where | Treatment |
|---|---|---|
| Friends of Eastfield | Background Daily Record piece: mailers have «no address on them and no website» | No site. Do not create one |
| «the site» / Calder Mill | Calderpedia A66 («The site is the subject of the proposed Eastfield Waterfront») | Physical site, not a URL |
| Harbor Public Affairs | Named as a lobbying vendor on A26 | Organisation name only; no website is referenced. A site is planned later (`harborpa.com` in WEBSITES.md §4) and is not added here |

## Character line

Paul Navarro's fallback, «I'd refer you to our website,» points at the existing Northgate site (`northgatedev.com`).

## Assumptions (no new canon)

- `harbordental.com` and `caldertransit.gov` follow the already approved names in `docs/WEBSITES.md`.
- `harbor.portcalder.gov` and `eastfieldneighbors.net` are assigned identifiers because canon never states those domains. They can be renamed later without changing story facts.
- Minimal pages contain only names and phrases already implied (Harbor Dental: «Book online»; Calder Transit: «Service information for Port Calder»; Harbor Authority: the organisation's name). Nothing about teams, parking, routes, or engineering was added.
- The Eastfield Neighbors shutdown date is the date of the article that reports the breach and that the forum has since shut down (20 Feb 2023). No cached forum pages were invented.

## Coverage at W1

26 site configs (25 from W1, plus parked `portcalderjazz.com` in W3), 196 artifacts (three new minimal pages). Existing page ids, URLs and wording are unchanged. Presentation for Northgate, the City portal and Eastfield Notes was updated in W2; the same engine also covers other sites already tagged corporate, government or blog. A later graphics step (branch `websites-w2-graphics`) gave every configured site an SVG logo and a favicon, and added hero images on existing pages without changing wording. Thin chrome (not the full W5 templates) shows logo and hero on landing, legacy, personal, wiki and document sites. See [GRAPHICS.md](../graphics/GRAPHICS.md).

## Test-only domains

The media test pool in `tests/media.test.mjs` injects a virtual TokTok app (`toktok.app`). It is not part of the playable universe. The pool registers a site config so the site-reference validator still holds when that pool is loaded on top of the real world.

## Logos and images (25 November 2026)

Every site in this inventory now has a catalog logo (`theme.logo`, SVG). Wide wordmarks (Daily Record, Unfiltered, Eastfield Notes) also have a square `theme.icon` for the Browser address bar; other sites reuse the square mark as the favicon.

Hero photographs and illustrations were attached to existing artifacts only, with no wording changes. Evidence photographs were not reused as decoration (in particular NIMG0003 and NIMG0005). Planned WEB0001–WEB0024 images that have no existing page to live on were left unproduced.

Test-only `toktok.app` is described in the previous section; it is not a playable-universe site.

## Parked domain (W3)

`portcalderjazz.com` is registered so the Browser can show a parked state. The date and the «for sale» wording follow WEBSITES.md §4. The planned 2019 cached page is not authored here (that would be new content, for a later step). Because the domain changed hands, the parked view is a generic parking page, not a jazz-club theme, and the site has no catalog logo.
