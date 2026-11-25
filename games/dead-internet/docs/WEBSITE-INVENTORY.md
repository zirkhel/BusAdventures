# Dead Internet: website inventory

_25. November 2026. Every domain or website reference in playable content (`content/`), and how it is represented in the W1 site model. The validator (`site-ref`) fails if a new domain appears in content without a matching site or an email-only exception._

## Rule

Every referenced website must exist in-game as a site, or as a site that used to exist (`gone`, `parked`, `maintenance`, or cache-only), per `docs/WEBSITES.md`. Names of organisations without any claim that they have a website are listed under «Not a website reference» and do not get a site invented for them.

## Sites in the model

| Site id | Domain | Status | In-game pages (W1) | Why it is here |
|---|---|---|---|---|
| `seeker` | seeker.search | live | Browser search (app-owned) | Seeker is the in-phone search engine |
| `connect` | connect.social | live | profiles and posts (Connect app) | Social network URLs |
| `threadline` | threadline.net | live | existing threads (A16, A17 page 4, A62, B13–B15, B24, BG-THR-01/02) plus W5 index, 5 boards, 12 new threads, 9 profiles (`W-threadline-*`) | Forum. Template `forum` / `classic`. Existing wording unchanged |
| `dailyrecord` | dailyrecord-pc.com | live | articles + archive (news app) | Newspaper URLs |
| `unfiltered` | unfiltered.news | live | articles (news app) | Newspaper URLs |
| `eastfieldnotes` | eastfieldnotes.blog | live | A14 front (2 versions), A15 (cache-only), A33, A34, A36, About + 36 W4 posts (`W-eastfieldnotes-*`) | Mara's blog; theme change 22 Oct 2025. New posts are single-version; last post remains A33 (14 May 2025) |
| `brightline` | brightlinemedia.co | live | A19, A20, A21, A42 (hidden), 19 W4 pages plus W7 Insights post (`W-brightline-0020`). A20 has a 2024 cached team list | Agency site (`corporate` / `agency`). Footer credits Lumen by Pixelfold. Case studies stay anonymous. No cache before 2023 |
| `brightline_portal` | portal.bl-ops.net | live (login) | A24 | Client portal |
| `northgate` | northgatedev.com | live | A40 project, A41 statement (hidden until shown), plus 18 W4 pages (`W-northgate-*`) | Paul's «our website». Projects, leadership, newsroom, sustainability, investors |
| `kestrel` | kestrel-logistics.com | live | A38 plus 16 W4 pages (`W-kestrel-*`) | Client list, fleet, careers, news (Biscuit retold, late-delivery note without a fire cause). Lou Adair is never named |
| `city` | portcalder.gov | live | A53, B16, BG-CITY-01, A26, A27, A28, plus 32 W4 pages (`W-city-*`) | City portal. City Hall at 40 Civic Center; Mayor Denise Harlan and 11 members (Ana Ruiz kept on her existing page) |
| `spillcheck` | spillcheck.io | live | A30 (exact lookup, unlinked from home/nav) plus W5 home, breaches, how we verify, FAQ, privacy (`W-spillcheck-*`) | Breach *checker*, not a leak portal. Template `anonymous` / `terminal` |
| `facelessstock` | facelessstock.com | live | A31, A31B (public samples) plus W5 home, pricing, license, how it works, library wall (`W-faceless-*`) | Synthetic portraits. Template `landing` / `saas`. Library is a sign-in wall without `meta.logins` |
| `docshare` | docshare.link | live | existing documents (A18, A22, DS-UF-*, DS-UF-02 hidden) plus W5 marketing home, 4 public filler docs, 3 expired links (`W-docshare-*`) | File links. Template `document` / `viewer`. Home does not catalogue evidence/leaks |
| `calderpedia` | calderpedia.org | live | B17, A66 plus W5 main page, 22 new articles, 5 history, 3 talk (`W-calderpedia-*`; 24 articles in total) | Wiki. Template `wiki` / `standard`. British spelling. No IMG02 |
| `harbordesk` | harbordesk.co | live | B18 plus W6 Pricing and Locations, W7 Testimonials and Who's here (`W-harbordesk-*`) | Virtual office. Testimonials use stock portrait IMG06A (Faceless #44812). Who's here lists four innocent firms at 18 Harbor Street |
| `saltys` | saltys-portcalder.com | live | B19 plus W6 Menu, Hours, Our story (`W-saltys-*`) | Fish bar. Template `legacy` / `2008`. New banner tagline from 1 March 2026; B19 wording unchanged |
| `eastfieldgarden` | eastfieldgarden.org | live | B20 plus W6 Plots, Work days, Committee (`W-eastfieldgarden-*`) | Garden. Template `personal` / `club`. IMG05O on the plots page |
| `aiwriterpro` | aiwriterpro.app | live | B23 plus W6 Pricing and FAQ (`W-aiwriterpro-*`) | Landing. Template `landing` / `saas` |
| `static_channel` | static.channel | live | A44 | Raw text, no template |
| `corp_registries` | openfilings.org (alias: corp-registries.example) | live | A63 plus W6 home (`W-corpregistries-0001`) | Renamed in W6 from the placeholder domain. Old host still resolves. Template `government` / `registry`. Meridian is not in the public nav |
| `harbordental` | harbordental.com | live | W-harbordental-0001 plus W6 Services, Team, Hours, Parking, Contact (`W-harbordental-0002`–`0006`) | Connect post promised team and parking. Template `landing` / `saas`. Footer credits «Lumen by Pixelfold». Team names, hours and parking are canon |
| `caldertransit` | caldertransit.gov | live | W-caldertransit-0001 plus W6 Routes, Route 14, Fares, Alerts, About, Live map (`W-caldertransit-0002`–`0007`) | Government / `transit`. The live map page is «temporarily unavailable», not a working map. No brake-fault leak on the official site |
| `harbor_authority` | harbor.portcalder.gov | live | W-harbor-authority-0001 (minimal home) | Unfiltered comment: memo letterhead «matches the one on their site». **Domain is not named in canon**; this municipal host is assigned so the reference can resolve. Home text is only the authority's name |
| `eastfield_neighbors` | eastfieldneighbors.net | **gone** since 2023-02-20 | none | Daily Record A60: the forum was breached and «has since shut down». **Domain is not named in canon**; assigned only so the gone site can be addressed. No invented pages or cache |
| `portcalderjazz` | portcalderjazz.com | **parked** since 2022-01-01 | W6 cached 2019 home, calendar, about (`W-portcalderjazz-*`, `live: null`) | Live address still shows the generic parking page. Cached 2019 site: Thursday nights at the Anchor, pianist Lou Benn |

| `pclibrary` | pclibrary.org | live | W6 home, hours, branches, Eastfield, Northpoint, e-readers, tax help, staff (`W-pclibrary-*`; staff has a 2024 cached version) | Port Calder Public Library. Template `government` / `library`. Cached 2024 staff lists Mara Quinn and Priya Shah; the live page does not. Domain from the approved plan |
| `calderpower` | calderpower.com | live | W6 home, outages, 17 Feb incident, smart meters, billing, about (`W-calderpower-*`) | Utility. Template `corporate` / `utility`. February 2026 outage follows the Daily Record correction (transformer, about 14,000 homes). NIMG0004 is not used. The 14 March outage is after game start and is not on the live site |
| `caldercu` | caldercu.com | live | W6 home, about, 4th Street, accounts, contact (`W-caldercu-*`) | Credit union since 1952, Eastfield branch on 4th Street (already in a sponsored article). Template `corporate` / `classic-2015` |
| `walts` | waltbrennan.calderweb.net | live (last updated 2009) | W6 home, guestbook, duck race, Festival 2008, links (`W-walts-*`) | Walt Brennan's Harbor Festival page on an assigned free host. Template `personal` / `geocities`. Frozen 12 June 2009. Does not mention his 2025 death |
| `harborpa` | harborpa.com | live | W6 home (`W-harborpa-0001`) | Harbor Public Affairs, named in the lobby register. Template `corporate` / `consultancy`. One simple page, no client list |
| `havenmutual` | havenmutual.com | live | W7 home, cover, contact (`W-havenmutual-*`) | Insurance firm in Old Town. Template `corporate` / `agency`. Leaflet uses stock portrait IMG06B (Faceless #44812). Office at 9 Market Row, Old Town, since 2009 is canon |
| `quayledger` | quayledger.com | live | W7 home, contact (`W-quayledger-*`) | Bookkeeping firm, Suite 110, 18 Harbor Street. Template `landing` / `smallbiz`. Tenant listing is canon |
| `northlamp` | northlamp.studio | live | W7 home, work (`W-northlamp-*`) | Sign and type studio, Suite 210, 18 Harbor Street. Template `landing` / `smallbiz`. Footer credits Lumen by Pixelfold. Tenant listing is canon |

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
| Harbor Public Affairs | Named as a lobbying vendor on A26 | W6 adds the planned one-page site at `harborpa.com`. The company page does not list Northgate or other clients |

## Character line

Paul Navarro's fallback, «I'd refer you to our website,» points at the existing Northgate site (`northgatedev.com`).

## Assumptions (no new canon)

- `harbordental.com` and `caldertransit.gov` follow the already approved names in `docs/WEBSITES.md`.
- `harbor.portcalder.gov` and `eastfieldneighbors.net` are assigned identifiers because canon never states those domains. They can be renamed later without changing story facts.
- Minimal pages contain only names and phrases already implied (Harbor Dental: «Book online»; Calder Transit: «Service information for Port Calder»; Harbor Authority: the organisation's name). Nothing about teams, parking, routes, or engineering was added.
- The Eastfield Neighbors shutdown date is the date of the article that reports the breach and that the forum has since shut down (20 Feb 2023). No cached forum pages were invented.

## Coverage at W1

26 site configs (25 from W1, plus parked `portcalderjazz.com` in W3), 196 artifacts (three new minimal pages). Existing page ids, URLs and wording are unchanged. Presentation for Northgate, the City portal and Eastfield Notes was updated in W2; the same engine also covers other sites already tagged corporate, government or blog. A later graphics step (branch `websites-w2-graphics`) gave every configured site an SVG logo and a favicon, and added hero images on existing pages without changing wording. W2 corporate/government/blog chrome and the later graphics step still apply. W5 replaced the remaining thin chrome on wiki, forum, document and anonymous sites, and added saas landing chrome (Faceless; also Harbor Dental and AIWriterPro). W6 replaces the thin chrome on legacy, personal and smallbiz landing. Parked live views stay Browser-owned. See [GRAPHICS.md](../graphics/GRAPHICS.md).

## Background pages (W4)

Round 1 (merged as PR #78, `24a20c3`) added 122 new pages on five sites, plus `content/universe/background-facts.json` (24 entries, `status: canon | claim`, checked by the validator). The 122 pages are kept; once written, they are not removed. Existing page ids, URLs and wording are unchanged. A15 stays off the live blog; A41 and A42 stay hidden. Brightline background lives in the Quiet Account mystery pack. New Eastfield Notes posts are the same in cache and live; comments (0–6) use light neighbour accounts, occasionally Priya, and two spam accounts. No `pclibrary.org` domain was invented. No new photographs: official homes reuse IMG12, WEB0010, WEB0005 and WEB0007. Evidence photos were not used as decoration.

Approved new canon from this round: Mayor Denise Harlan and 11 council members (Ana Ruiz plus ten new names); City Hall at 40 Civic Center, Port Calder, public desk weekdays 8:30–16:30. Other universe-binding facts include the three completed Northgate projects, Helen March and Marcus Veld, Kestrel's two trucks and EV pilot, and the Harbor Street water-main dates. Brightline homepage statistics and case-study figures remain `claim`, not canon.


## Wiki, forum, documents and anonymous sites (W5)

Merged as PR #79 (`9b6ce40`). New pages: Calderpedia 31, Threadline 27, Docshare 8, SpillCheck 5, Faceless Stock 5 (76 in total). Existing ids, URLs and wording are unchanged, including A16/A17, A18/A22, A30, A31/A31B, B17, A66 and the DS-UF / BG-THR set. Hidden pages stay hidden.

Calderpedia has a main page, table of contents, infobox/tools, numbered references, history on five articles (path suffix `/Title/history`), talk on three (including «Is the chowder claim sourced?»), and a Random article button. Threadline lists boards and threads (page 4 of A16 is paginated, not listed as a separate first page). Docshare viewer chrome shows the filename, «Shared via link · View only», and an expired state; evidence documents are reachable only by URL. SpillCheck is terminal-styled and is not a leak portal. Faceless Stock is a saas landing; the library is a sign-in wall with no working login, and the two public sample listings remain the practical path.

Approved new canon from this round: the Port Calder lighthouse was automated in 1998 and its last keeper was Samuel Okoro; Harbor Festival has had volunteers since at least 1979; the breaches HarborFit (March 2021), Slice of Calder (November 2022) and CalderLearn (August 2024) are universe fact, in addition to the already canonical Eastfield Neighbors breach (February 2023). A Threadline post names the 6:10 ferry captain «Dennis»; that remains a forum claim, not canon.


## Legacy, personal, landing and background sites (W6)

Merged as [PR #80](https://github.com/zirkhel/BusAdventures/pull/80) (`4e5bff8`). New pages: Salty's 3, HarborDesk 2, Eastfield Community Garden 3, AIWriterPro 2, Harbor Dental 5, Calder Transit 6, Open Filings 1, Port Calder Public Library 8, Calder Power 6, Calder Credit Union 5, Walt's page 5, Harbor Public Affairs 1, portcalderjazz.com cache 3 (50 in total). Existing ids, URLs and wording are unchanged, except the approved rename of `corp-registries.example` to `openfilings.org`. Hidden pages stay hidden.

New sites from the approved §4 list: `pclibrary.org`, `calderpower.com`, `caldercu.com`, `harborpa.com`, and Walt's page on the assigned free host `waltbrennan.calderweb.net`. The library staff page is the approved alternative path in: a 2024 cached version lists Mara Quinn and Priya Shah, with no new personal facts; the live 2026 page does not list Mara. Kestrel has a cached 2014 home and About (live wording unchanged). Salty's live design from 1 March 2026 shows a new banner tagline. The jazz domain remains parked when visited live.

`corp-registries.example` is now an alias of `openfilings.org`. Typing or searching the old host still opens Open Filings / A63. Meridian is not linked from the public nav.

W6 invented names, hours and prices were approved on 25 November 2026 and are now canon: library weekday hours and additional staff (Tomás Rinaldi, Helen Cho, June Ellery), the Harbor Dental team, hours and parking, HarborDesk Dock Road rooms and Plus/Studio prices, and the Open Filings domain. Facts already in the papers (library cut, e-readers, tax help, the February outage, smart meters, the credit union since 1952, Walter Brennan's death, Lou Benn) were already recorded as `canon`.

## Design as a clue (W7)

Merged as PR #81 (`9190200`). Anders approved the step on 25 November 2026. New pages: HarborDesk 2, Haven Mutual 3, Quay Ledger 2, North Lamp Studio 2, Brightline Insights 1, two Garden persona posts (12 in total). Existing ids, URLs and live wording are unchanged, including A20 v1, B18, A31 and A34 v2. Hidden pages stay hidden.

New independent sites: `havenmutual.com` (corporate / `agency`, so that variant is not unique to Brightline), `quayledger.com` and `northlamp.studio`. Two further 18 Harbor Street firms, Amber Fern Tutoring and Gull Wing Surveys, are named on HarborDesk without a URL. Brightline remains at Suite 400.

IMG06A and IMG06B are purchased copies of IMG06S. Image search from the HarborDesk testimonial reaches Faceless #44812, Haven Mutual and Calvin's profile. IMG01/IMG02 image search is unchanged. The mill photograph on Calderpedia stays deferred. Brightline customer cases stay anonymous.

The W7 invented names and addresses were approved on 25 November 2026 and are now canon: the four HarborDesk tenants at 18 Harbor Street, Haven Mutual's office at 9 Market Row since 2009, and the 2024 community leads Samira Holt, Jonah Ellison and Tamsin Roe. The Lumen footer is the approved red herring from §9.3.

## Test-only domains

The media test pool in `tests/media.test.mjs` injects a virtual TokTok app (`toktok.app`). It is not part of the playable universe. The pool registers a site config so the site-reference validator still holds when that pool is loaded on top of the real world.

## Logos and images (25 November 2026)

Every site in this inventory now has a catalog logo (`theme.logo`, SVG). Wide wordmarks (Daily Record, Unfiltered, Eastfield Notes) also have a square `theme.icon` for the Browser address bar; other sites reuse the square mark as the favicon.

Hero photographs and illustrations were attached to existing artifacts only, with no wording changes. Evidence photographs were not reused as decoration (in particular NIMG0003 and NIMG0005). Planned WEB0001–WEB0024 images that have no existing page to live on were left unproduced. (Superseded: see «Website photos» below.)

Test-only `toktok.app` is described in the previous section; it is not a playable-universe site.

### Website photos (PR #83, `websites-photos`, merged `b2a7f76`)

The 20 remaining planned photos from WEBSITES.md §10 now exist (WEB0001–WEB0004, WEB0006, WEB0008, WEB0009, WEB0011–WEB0019, WEB0021–WEB0024), and the SVG stand-in heroes WEB0028, WEB0029, WEB0031–WEB0035, WEB0037 and WEB0038 are photographs under the same ids. WEB0030 (AIWriterPro dashboard) and WEB0036 (Faceless abstract) stay SVG. They were made with the image generator, not ComfyUI, from one shared style prompt (`graphics/sources/web-photos/STYLE.md`) with the existing photos as references. Only `images` fields changed: no ids, URLs or wording. New pictures sit on background pages of Northgate (three project pages, two news items, About), Brightline (Work), Kestrel (Warehouse job, Sixty jobs, and the cached 2014 home and About only), the library (Eastfield branch, Hours), the city (Waste), Calderpedia (lighthouse, Old Town, Calder Creek), Eastfield Notes (four posts 2019–2022), Calder CU (4th Street), Calder Power (Smart meters), Walt's page (home and Festival 2008) and Faceless (How it works). Every new image is its own original, so image search from IMG01, IMG02, IMG06S and the other evidence photos finds nothing new. Northgate's home and A40 keep IMG12. No new canon.

## Parked domain (W3)

`portcalderjazz.com` is registered so the Browser can show a parked state. The date and the «for sale» wording follow WEBSITES.md §4. W6 adds a cached 2019 site (home, calendar, about), with `live: null`. Because the domain changed hands, the live parked view is still a generic parking page, not a jazz-club theme, and the live parked design has no catalog logo. The 2019 design uses a text wordmark.

### Fixes after the photos (PR #84, `fixes-after-photos`, not merged)

- **Threadline:** profiles (`threadline.net/u/*`) show the account name and "Threads started" again. truthseeker_88 lists A16 and A62.
- **Approved device names, now canon in `background-facts.json`:**
  - Orrin D7, a professional camera (Northgate WEB0001–WEB0004)
  - Orrin S20 (Kestrel 2014, WEB0009)
  - Orrin S5 (Walt 2008, WEB0034)
  - Halden PhotoScan 2400 (Walt's 1987 scan, scanned 2007, WEB0023)
  - Lumen 6 (Calderpedia WEB0013–WEB0015, Salty's WEB0020)
- **Mara's Lumen 5 (2019–2022):** approved, but recorded only in image meta and the handover, because no new background canon may be about a Quiet Account person.
- **Harbor Festival is in October (decided):** Eastfield Notes `W-eastfieldnotes-0016` is now dated 9 Oct 2021 and `W-eastfieldnotes-0022` 8 Oct 2022, each with its comments. WEB0018 is now taken 8 Oct 2022 and WEB0034 11 Oct 2008. The URLs keep `/2021/07/` and `/2022/07/`. No text describes a move.
- **2025 duck race:** won by duck number 3,117 (Mila from Northpoint) in both B06 and DR-2025-0322.
- **Intended crack:** Walter Brennan is quoted in DR-2026-0051 (12 Feb 2026) after his death on 31 Oct 2025. Keep it.
