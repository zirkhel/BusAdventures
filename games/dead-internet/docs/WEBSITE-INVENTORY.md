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
| `brightline` | brightlinemedia.co | live | A19, A20, A21, A42 (hidden), plus 19 W4 pages in the mystery pack (`W-brightline-*`) | Agency site. Public nav omits Statement. Case studies stay anonymous |
| `brightline_portal` | portal.bl-ops.net | live (login) | A24 | Client portal |
| `northgate` | northgatedev.com | live | A40 project, A41 statement (hidden until shown), plus 18 W4 pages (`W-northgate-*`) | Paul's «our website». Projects, leadership, newsroom, sustainability, investors |
| `kestrel` | kestrel-logistics.com | live | A38 plus 16 W4 pages (`W-kestrel-*`) | Client list, fleet, careers, news (Biscuit retold, late-delivery note without a fire cause). Lou Adair is never named |
| `city` | portcalder.gov | live | A53, B16, BG-CITY-01, A26, A27, A28, plus 32 W4 pages (`W-city-*`) | City portal. City Hall at 40 Civic Center; Mayor Denise Harlan and 11 members (Ana Ruiz kept on her existing page) |
| `spillcheck` | spillcheck.io | live | A30 (exact lookup, unlinked from home/nav) plus W5 home, breaches, how we verify, FAQ, privacy (`W-spillcheck-*`) | Breach *checker*, not a leak portal. Template `anonymous` / `terminal` |
| `facelessstock` | facelessstock.com | live | A31, A31B (public samples) plus W5 home, pricing, license, how it works, library wall (`W-faceless-*`) | Synthetic portraits. Template `landing` / `saas`. Library is a sign-in wall without `meta.logins` |
| `docshare` | docshare.link | live | existing documents (A18, A22, DS-UF-*, DS-UF-02 hidden) plus W5 marketing home, 4 public filler docs, 3 expired links (`W-docshare-*`) | File links. Template `document` / `viewer`. Home does not catalogue evidence/leaks |
| `calderpedia` | calderpedia.org | live | B17, A66 plus W5 main page, 22 new articles, 5 history, 3 talk (`W-calderpedia-*`; 24 articles in total) | Wiki. Template `wiki` / `standard`. British spelling. No IMG02 |
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

26 site configs (25 from W1, plus parked `portcalderjazz.com` in W3), 196 artifacts (three new minimal pages). Existing page ids, URLs and wording are unchanged. Presentation for Northgate, the City portal and Eastfield Notes was updated in W2; the same engine also covers other sites already tagged corporate, government or blog. A later graphics step (branch `websites-w2-graphics`) gave every configured site an SVG logo and a favicon, and added hero images on existing pages without changing wording. W2 corporate/government/blog chrome and the later graphics step still apply. W5 replaces the remaining thin chrome on wiki, forum, document and anonymous sites, and adds saas landing chrome (Faceless; also Harbor Dental and AIWriterPro). Legacy, personal, smallbiz and parked stay on the thin chrome. See [GRAPHICS.md](../graphics/GRAPHICS.md).

## Background pages (W4)

Round 1 (merged as PR #78, `24a20c3`) added 122 new pages on five sites, plus `content/universe/background-facts.json` (24 entries, `status: canon | claim`, checked by the validator). The 122 pages are kept; once written, they are not removed. Existing page ids, URLs and wording are unchanged. A15 stays off the live blog; A41 and A42 stay hidden. Brightline background lives in the Quiet Account mystery pack. New Eastfield Notes posts are the same in cache and live; comments (0–6) use light neighbour accounts, occasionally Priya, and two spam accounts. No `pclibrary.org` domain was invented. No new photographs: official homes reuse IMG12, WEB0010, WEB0005 and WEB0007. Evidence photos were not used as decoration.

Approved new canon from this round: Mayor Denise Harlan and 11 council members (Ana Ruiz plus ten new names); City Hall at 40 Civic Center, Port Calder, public desk weekdays 8:30–16:30. Other universe-binding facts include the three completed Northgate projects, Helen March and Marcus Veld, Kestrel's two trucks and EV pilot, and the Harbor Street water-main dates. Brightline homepage statistics and case-study figures remain `claim`, not canon.


## Wiki, forum, documents and anonymous sites (W5)

Merged as PR #79 (`9b6ce40`). New pages: Calderpedia 31, Threadline 27, Docshare 8, SpillCheck 5, Faceless Stock 5 (76 in total). Existing ids, URLs and wording are unchanged, including A16/A17, A18/A22, A30, A31/A31B, B17, A66 and the DS-UF / BG-THR set. Hidden pages stay hidden.

Calderpedia has a main page, table of contents, infobox/tools, numbered references, history on five articles (path suffix `/Title/history`), talk on three (including «Is the chowder claim sourced?»), and a Random article button. Threadline lists boards and threads (page 4 of A16 is paginated, not listed as a separate first page). Docshare viewer chrome shows the filename, «Shared via link · View only», and an expired state; evidence documents are reachable only by URL. SpillCheck is terminal-styled and is not a leak portal. Faceless Stock is a saas landing; the library is a sign-in wall with no working login, and the two public sample listings remain the practical path.

Approved new canon from this round: the Port Calder lighthouse was automated in 1998 and its last keeper was Samuel Okoro; Harbor Festival has had volunteers since at least 1979; the breaches HarborFit (March 2021), Slice of Calder (November 2022) and CalderLearn (August 2024) are universe fact, in addition to the already canonical Eastfield Neighbors breach (February 2023). A Threadline post names the 6:10 ferry captain «Dennis»; that remains a forum claim, not canon.

## Test-only domains

The media test pool in `tests/media.test.mjs` injects a virtual TokTok app (`toktok.app`). It is not part of the playable universe. The pool registers a site config so the site-reference validator still holds when that pool is loaded on top of the real world.

## Logos and images (25 November 2026)

Every site in this inventory now has a catalog logo (`theme.logo`, SVG). Wide wordmarks (Daily Record, Unfiltered, Eastfield Notes) also have a square `theme.icon` for the Browser address bar; other sites reuse the square mark as the favicon.

Hero photographs and illustrations were attached to existing artifacts only, with no wording changes. Evidence photographs were not reused as decoration (in particular NIMG0003 and NIMG0005). Planned WEB0001–WEB0024 images that have no existing page to live on were left unproduced.

Test-only `toktok.app` is described in the previous section; it is not a playable-universe site.

## Parked domain (W3)

`portcalderjazz.com` is registered so the Browser can show a parked state. The date and the «for sale» wording follow WEBSITES.md §4. The planned 2019 cached page is not authored here (that would be new content, for a later step). Because the domain changed hands, the parked view is a generic parking page, not a jazz-club theme, and the site has no catalog logo.
