# Dead Internet — utviklingsplan

_Avkrysningsliste. Oppdateres når oppgaver blir ferdige. Sist oppdatert 25. november 2026 (W0–W5 merget som PR #73–#79, `origin/main` `9b6ce40`; W6 på greinen `websites-w6`, ikke merget)._

## Overlevering (25. nov 2026)

Repoet er overleveringsgrunnlaget. Les i denne rekkefølgen: denne seksjonen, «Veikart» under, `DESIGN.md` (særlig «Prinsipper», «Kanon, påstander og spillerens tro», «Casebook som deduksjonsverktøy», «Saksavslutning og konsekvenser», «Autentiske nettsteder» og «Teststrategi») og dokumentene i `docs/`.

**Status**
- Fase 0–9 er ferdige og live på https://bus-adventures.vercel.app/games/dead-internet/. Katalogen har nå 83 ferdige grafikkelementer (61 fra før, pluss logoer og nettsidebilder fra grafikksteget 25. nov).
- Casebook steg 0 (PR #68) og steg 1 (PR #71) er merget. Steg 2–5 gjenstår.
- Saksavslutning er gjennomgått ([docs/CASE-ENDINGS-REVIEW.md](docs/CASE-ENDINGS-REVIEW.md)). To feil (F-1, F-2) er funnet, men ikke rettet. Forslagene er ikke diskutert.
- Nettsteder: W0–W5 og grafikksteget er merget til `main` som PR #73–#79 (`origin/main` `9b6ce40`): #73 W0 `a3b3a63`, #74 W1 `7193fa7`, #75 W2 `05493e9`, #76 grafikk `dec0458`, #77 W3 `2c6aa9f`, #78 W4 `24a20c3`, #79 W5 `9b6ce40`. De 122 bakgrunnssidene fra W4 beholdes (når de først er skrevet, tar vi dem ikke bort). Godkjent ny kanon fra W4: ordfører Denise Harlan og 11 rådsmedlemmer (Ana Ruiz pluss 10 nye navn); rådhuset 40 Civic Center, Port Calder, skranke hverdager 8:30–16:30. Godkjent ny kanon fra W5: fyret automatisert i 1998, siste fyrmester Samuel Okoro; Harbor Festival har hatt frivillige siden minst 1979; bruddene HarborFit (mars 2021), Slice of Calder (november 2022) og CalderLearn (august 2024) er universfakta. 6:10-fergekapteinen «Dennis» er bare en forum-påstand. Inventar: [docs/WEBSITE-INVENTORY.md](docs/WEBSITE-INVENTORY.md). Design og stegstatus: [docs/WEBSITES.md](docs/WEBSITES.md). Katalogen: [graphics/GRAPHICS.md](graphics/GRAPHICS.md) (generert fra `graphics/catalog.json`).
- Åpen PR #72 (`codex/casebook-step-1`) er en etterlatt duplikat av merget PR #71 og skal lukkes, ikke merges.

**Neste steg:** W7–W8 (spor i design etter ja, Archive-kobling). Casebook steg 2 (teorier og spørsmål) kan gå parallelt. Etter Casebook steg 5 og avklaring av saksavslutning: ekstern spilltest. W6 og øvrige nye nettside-PR-er merges bare etter Anders' ja.

### Nettstedsarbeid (W0–W6 og grafikk) — greiner og beslutninger

W0–W5 og grafikksteget er merget til `main` som PR #73–#79 (`9b6ce40`). W6 implementeres på `websites-w6` fra den tippen og er ikke merget. Arbeidet er gjort i `/workspace/BusAdventures`. Windows-maskinen er ikke rørt. Casebook-filene `core/artifacts.js`, `core/casebook.js`, `core/provenance.js`, `app/apps/casebook.js` og `tests/twin.test.mjs` er ikke rørt.

| Steg | Grein | Commit / PR | Hva |
|---|---|---|---|
| W0 | `websites-w0` | merget PR #73 · `a3b3a63` | Hviteliste `publicView()` i `core/site-view.js`. `renderArtifact` / login / gone sender bare visningsfelt til malene. |
| W1 | `websites-w1` | merget PR #74 · `7193fa7` | Nettstedsmodell `core/sites.js`, 25 nettsteder i `content/universe/sites/`, inventar og `site-ref`-validator. Ingen synlig endring. |
| W2 | `websites-w2` | merget PR #75 · `05493e9` | Malverk Corporate, Government, Blog i `app/sites/`. Tekst uendret. |
| Grafikk | `websites-w2-graphics` | merget PR #76 · `dec0458` | Logo/favicon på alle konfigurerte nettsteder, heltebilder på malte sider, tynn chrome for landing/legacy/personal/wiki/document. |
| W3 | `websites-w3` | merget PR #77 · `2c6aa9f` | Frem-knapp, bokmerker adskilt fra Casebook, tekststørrelse, nettstedets 404 og vedlikehold, parkert-side, «This site can't be reached», lagring versjon 8, Seeker viser offisielt nettsted først ved merkenavn/domene. |
| W4 | `websites-w4` | merget PR #78 · `24a20c3` | Bakgrunnssider runde 1 (122 nye sider, beholdt) for Northgate, City of Port Calder, Eastfield Notes, Kestrel og Brightline, pluss `universe/background-facts.json` med validator. Godkjent kanon: 10 nye rådsnavn + ordfører Denise Harlan; rådhuset 40 Civic Center, skranke 8:30–16:30. |
| W5 | `websites-w5` | merget PR #79 · `9b6ce40` | Wiki, Forum, Document, Anonymous (og saas-Landing for Faceless). Calderpedia, Threadline, Docshare, SpillCheck og Faceless Stock flyttet over, med innhold. Godkjent kanon: fyret automatisert 1998, siste fyrmester Samuel Okoro; Harbor Festival-frivillige siden minst 1979; bruddene HarborFit (mars 2021), Slice of Calder (november 2022) og CalderLearn (august 2024). «Dennis» er bare en forum-påstand. |
| W6 | `websites-w6` | på greinen, ikke merget | Legacy, Personal, øvrig Landing (`smallbiz`; parkert er fortsatt Browser-eid). Nye bakgrunnsnettsteder (bibliotek, Calder Power, Calder CU, Walts side, Harbor PA), cachet 2019-versjon av portcalderjazz.com, cachet Kestrel 2014, omdøping av `corp-registries.example` til `openfilings.org`. |

**W0 — nye/endrede filer.** `core/site-view.js` (ny), `app/render.js`, `tests/sites.test.mjs`, oppdateringer i DEVPLAN, WEBSITES.md og DESIGN.md.

**W1 — nye/endrede filer.** `core/sites.js` (ny), `core/content.js`, `core/world.js`, `tools/lib/validate-world.mjs`, `content/manifest.json`, `content/universe/sites/*.json` (25), `content/universe/artifacts/referenced-sites.json`, kirurgiske `site`/`page`-felt på eksisterende artefakter, fem plattformer i `platforms.json`, `docs/WEBSITE-INVENTORY.md`, tester og dokumenter.

**W1 — designbeslutninger.** Hvert referert nettsted finnes i modellen, eller har eksistert (`gone`/`parked`/`maintenance`). E-postdomener `calder-mail.com` og `bl-ops.net` er unntatt (portalen `portal.bl-ops.net` er et eget nettsted). `harbordental.com` og `caldertransit.gov` følger allerede godkjente navn i WEBSITES.md, med minimale hjemmesider uten ny kanon. `harbor.portcalder.gov` og `eastfieldneighbors.net` er tildelte domener fordi kanon aldri navngir dem; de kan døpes om uten å endre historien. Eastfield Neighbors er `gone` fra 20. feb 2023, uten sider. Friends of Eastfield, «the site» på Calderpedia (mølleområdet) og Harbor Public Affairs (organisasjonsnavn, `harborpa.com` kommer senere) er ikke nettsteder. `corp-registries.example` er ikke omdøpt i W1. Medietestens virtuelle `toktok.app` er ikke i spilluniverset, men testpoolen registrerer et nettsted slik at `site-ref` fortsatt holder.

**W2 — nye/endrede filer.** `app/sites/` (index, chrome, blocks, corporate, government, blog + CSS), krok i `app/render.js`, CSS-lenker i `index.html`, tester, dokumenter. Etterkontrollen av hele testpakken avslørte at medietestpoolen måtte registrere `toktok.app`; det er tatt med i W2-committen (W1-oppfølging, ikke kanon).

**W2 — designbeslutninger.** `designFor` bruker spilldatoen på levende sider og versjonsdatoen (eller låst design) på cachete visninger: Eastfield Notes bytter til `minimal` på den levende siden etter 22. okt 2025, mens cachete kopier beholder `classic`. Registeroppslag (`page: record`) er monospaced; person- og kalendersider er det ikke. Motoren gjelder alle nettsteder som allerede hadde `template: corporate|government|blog`, ikke bare de tre navngitte (Brightline, Kestrel, Calder Transit, Harbor Authority, `corp-registries.example`). Det er en bevisst, liten utvidelse; ordlyden er uendret. Forum, nyheter og apper beholdt sine eksisterende visninger.

**Grafikk (på `websites-w2-graphics`).** Hvert konfigurert nettsted har en SVG-logo i katalogen. Nettleserens adressefelt viser favicon (`theme.icon`, ellers kvadratisk logo) på sider. Heltebilder er festet til eksisterende artefakter uten å endre brødtekst: Brightline-kontor (WEB0005 / A19), Kestrel-biler (WEB0007 / A38, intakt lager — ikke NIMG0005), rådhuset (WEB0010 / B16), Harbor Dental (WEB0025), Calder Transit (WEB0026), Harbor Authority (WEB0027), Salty's 2008-front (WEB0020, tavlen er sløret så den ikke kan leses som meny). HarborDesk, hageforeningen og AIWriterPro fikk SVG-illustrasjoner (WEB0028–WEB0030). Northgate-vannfronten beholder IMG12; WEB0001–WEB0004 er ikke laget fordi det ikke finnes prosjektsider å henge dem på uten å dikte kanon. Bevisbilder (NIMG0003, NIMG0005, IMG02 osv.) er ikke gjenbrukt som pynt. ComfyUI kjører ikke på boksen; fotografiene er laget med GenerateImage etter GRAPHICS.md-stil (ingen tekst/merkevarer, litt korn, webp), logoene er håndtegnede SVG. En tynn chrome (`app/sites/simple.js`) gjør logo og helt synlig på landing/legacy/personal/wiki/document. Dette er ikke W5 (ingen full Wiki/Forum/Document/Anonymous-mal). `static.channel` forblir rå tekst, men har favicon. Eastfield Notes 2025 bruker typografisk minimal-logo; begge epoker deler mølle-ikonet som favicon.

**W3 — nye/endrede filer.** `core/browser.js` (ny, uten DOM: `resolveBrowse`, bokmerker, tekststørrelse, frem/tilbake-stakk, `homeArtifact`), `core/state.js` (`SAVE_VERSION` 8, `s.browser`), `core/save.js` (migrering 7→8), `core/sites.js` (`normUrl` eksportert, `officialSitesForQuery` / `siteAliases`), `core/search.js` (offisielt nettsted først i Seeker), `app/phone.js` (browse via oppslaget, frem-stakk, stjerne og A−/A+), `app/apps/browser.js`, `app/sites/status.js` (ny), `app/render.js` (innlogging i nettstedsramme når nettstedet er kjent), `app/ui.js` (frem- og stjerneikon), `app/style.css`, `content/universe/sites/portcalderjazz.json` og manifest, `tests/browser.test.mjs`, evidenstestens versjonsassert, dokumenter og inventar.

**W3 — designbeslutninger.** En kjent vert med ukjent sti er nettstedets egen 404, ikke et Seeker-søk. Ukjent vert er søk, som før. Et bart domene åpner hjemmesiden hvis den finnes; ellers en tom nettstedshjem (logo, ev. tagline, nav) uten diktert brødtekst. `gone` er en Browser-eid feilside («This site can't be reached») med knapp til Seeker-cache, ikke det gamle nettstedets chrome. `parked` er en generisk «This domain may be for sale»-side, ikke det gamle merket, fordi domenet har byttet eier. `maintenance` og 404 vises i nettstedets gjeldende chrome. Innlogging vises i samme chrome når nettstedet er kjent. Bokmerker (stjerne i adressefeltet) er lagret i `s.browser.bookmarks` og er atskilt fra «Save as evidence» (bok-ikon, Casebook). Tekststørrelse A−/A+ skalerer sideinnholdet (`zoom` på `.app-browser .scroll`) i trinnene 0,85 / 1 / 1,15 / 1,3, og lagres. Frem-stakken er bare i økten (overlever ikke en reload til låseskjermen). `portcalderjazz.com` er lagt inn som parkert fra 2022, slik WEBSITES.md §4 allerede beskriver; ingen cachet 2019-side og ingen nye jazz-fakta. Ingen forfattet nettside står i `maintenance` på startdatoen 9. mars 2026; tilstanden er dekket av tester med en liten fiktiv verden. Ingen asfaltert jazz-logo: parkerte/kun-borte-domener trenger ikke kataloglogo.

**W3 — Seeker-rangering.** Når spørringen tydelig navngir et nettsted (merkenavn, alias, plattformnavn eller domene fra W1-modellen), kommer det nettstedets offisielle landing alltid først, foran avisartikler og sosiale innlegg. Landing er hjemmesiden hvis den er synlig, ellers en tom nettstedshjem (bare chrome) på domenet. `gone`/`parked`/`maintenance` vises fortsatt som treff og åpnes etter status. Treffet bruker bare eksisterende navn, ingen ny kanon. En generell eller blandet spørring («eastfield», «calder», «kestrel warehouse») blir ikke behandlet som merkenavn. Søk inne i en app (Daily Record, Connect) er uendret. Skjulte sider (f.eks. A41) vises ikke. Oppslag som bare gir et parkert/borte-treff endrer ikke undersøkelsesstatus.


**W4 — nye/endrede filer.** `content/universe/background-facts.json`, `entities-background.json`, `accounts-background.json`, `artifacts/sites-w4-northgate.json` (18), `sites-w4-city.json` (32), `sites-w4-kestrel.json` (16), `sites-w4-eastfieldnotes.json` (37: About + 36 innlegg), `mysteries/quiet-account/artifacts/brightline-background.json` (19), manifest og `mystery.json`, nav i de fem nettstedskonfigurasjonene, `core/content.js` (nøkkelen `backgroundFacts`), `tools/lib/validate-world.mjs` (`checkBackgroundFacts`), `app/sites/blog.js` og `blog.css` (kommentarfelt på innlegg), `tests/websites-w4.test.mjs`, dokumenter.

**W4 — innhold og tall.** Nye sider, i tillegg til de eksisterende som er urørt: Northgate 18 (totalt 20 inkl. A40 og skjulte A41), City of Port Calder 32 (totalt 38 inkl. A53, B16, BG-CITY-01, A26–A28), Eastfield Notes 37 (totalt 42 inkl. A14 og de fire kanoninnleggene), Kestrel 16 (totalt 17 inkl. A38), Brightline 19 i mysteriepakken (totalt 24 inkl. A19–A21, A42 og portalen er et annet nettsted). 24 bakgrunnsfakta, 16 nye entiteter, 7 lette kommentarkontoer.

**W4 — designbeslutninger.** Nye sider er bakgrunn (`filler`; de fleste `index: weak`) slik at merkenavn-søk fortsatt får minst tre bakgrunnstreff blant de første ti unike artefaktene. Eksisterende ID-er, URL-er og ordlyd er uendret. A15 forblir cache-only, A41 og A42 forblir skjulte; Statement er tatt ut av Brightlines offentlige nav. Brightlines nye sider ligger i mysteriefilen, ikke i universfilene. Nye Eastfield Notes-innlegg er like i cache og live (én versjon); siste innlegg er fortsatt A33 14. mai 2025; Brightline endret bare de fire kanoninnleggene. Theo nevnes bare som «my brother», uten navn. Ingen Lou på Kestrel (og ingenting om brannårsaken), ingen Brightline/Meridian på Northgate, ingen navngitte Brightline-kunder, ikke noe `pclibrary.org`. Rådhuset: 40 Civic Center, Port Calder, skranke hverdager 8:30–16:30 (godkjent ny kanon). Rådet: ordfører Denise Harlan og 11 medlemmer (Ana Ruiz + 10 nye navn, godkjent; §7.3 skrev «9 navn»). De 122 sidene beholdes. Hjemmesidene gjenbruker eksisterende katalogbilder (IMG12, WEB0010, WEB0005, WEB0007); ingen nye bilder i denne runden, evidensbilder er ikke brukt som pynt. Investorer og sporing er vanlige sider («by appointment» / «sign in on the app»), ikke nye `meta.logins`. Bloggmalen viser kommentarfelt på innlegg (0–6 kommentarer).


**Slik testes det** (fra repo-roten, etter deloppgave og før PR):

```text
node --test --test-concurrency=1 games/dead-internet/tests/*.test.mjs
node games/dead-internet/tools/validate.mjs
node games/dead-internet/tools/simulate.mjs
PLAYWRIGHT_MODULE=/path/to/playwright node games/dead-internet/tools/test-casebook-ui.mjs
```

Nettstedstester ligger i `tests/sites.test.mjs`. W3-tester: `tests/browser.test.mjs`. W4-tester: `tests/websites-w4.test.mjs`. W5-tester: `tests/websites-w5.test.mjs`. W6-tester: `tests/websites-w6.test.mjs`. Etter katalogendringer: `node games/dead-internet/tools/graphics-report.mjs` og `node games/dead-internet/tools/make-placeholders.mjs` (bare nye plassholdere skal sjekkes inn). Ny-spill i Playwright: case-menypunkt → `form.intro-form` submit → «Swipe up to unlock» → ev. `.it-notips` → Browser i docken → `form.addr-form`. Skjermbilder 390×844: `/workspace/dead-internet-shots/`.


**W5 — nye/endrede filer.** Malene `app/sites/wiki.js`, `forum.js`, `document.js`, `anonymous.js`, `landing.js` (kun `variant: saas`; `smallbiz`/`parked` forblir tynn chrome) og tilhørende CSS; `app/sites/index.js` og `index.html`. Innhold: `artifacts/sites-w5-calderpedia.json` (31), `sites-w5-threadline.json` (27), `sites-w5-docshare.json` (8), `sites-w5-spillcheck.json` (5), `sites-w5-faceless.json` (5), `entities-background-w5.json` (5), `accounts-background-w5.json` (9 lette kontoer), seks nye oppføringer i `background-facts.json`, kirurgisk nav og manifest. Tester: `tests/websites-w5.test.mjs`, oppdatert `tests/sites.test.mjs`. Skjermbilder: `/workspace/dead-internet-shots/w5-*.png`. Dokumenter.

**W5 — innhold og tall.** Nye sider, i tillegg til de eksisterende som er urørt: Calderpedia 31 (hovedside, 22 nye artikler, 5 historikk, 3 diskusjon; totalt 24 artikler med B17 og A66). Threadline 27 (indeks, 5 tavler, 12 nye tråder, 9 profiler; eksisterende tråder inkludert A16/A17 side 4 ligger i tavlene). Docshare 8 (markedsføringshjem, 4 offentlige fylldokumenter, 3 utløpte lenker; evidens- og lekkasjedokumenter er ikke listet på hjemmesiden). SpillCheck 5 (hjem, 29 kjente brudd, How we verify, FAQ, Privacy; A30 uendret og uten lenke fra hjem/nav). Faceless Stock 5 (hjem, Pricing, License, How it works, bibliotekvegg). Verden har nå 394 artefakter. Bakgrunnsfakta: 30 (24 fra W4 + 6).

**W5 — designbeslutninger.** Eksisterende ID-er, URL-er og ordlyd er uendret. Skjulte sider forblir skjulte (DS-UF-02). Calderpedia bruker britisk stavemåte (*harbour*) som B17. Innholdsfortegnelse fra `== overskrift ==`; historikk-URL-er er stier (`/Title/history`), ikke `?action=history`, fordi `pathOf` fjerner spørringsstrenger. Tilfeldig artikkel er en knapp, ikke en nav-href. Forummalen parser det eksisterende «handle: tekst» / «handle (OP): tekst»-formatet, inkludert A16/A17. Paginering viser søskensider (`?page=`). Docshare-hjemmet er ikke et katalog over alle filer; bare de nye `W-docshare-*`-fylldokumentene er offentlige, og evidens (A18, A22, DS-UF-*) nås bare via URL. SpillCheck er en oppslagsjeneste, ikke en lekkasjeportal, og viser ikke Mara-oppslaget på hjem/nav. Faceless-biblioteket er en innloggingsvegg uten `meta.logins` (validatoren krever en innlogging for `access.loggedIn`, og en hemmelig innlogging ville vært et spor); de to eksisterende offentlige prøveportrettene (A31, A31B) er lenket fra hjem og nav. Saas-Landing ble tatt tidlig i W5 fordi Faceless hører til der; Harbor Dental og AIWriterPro deler chrome, men ikke ordlyd. Ingen IMG02 på Calderpedia, ingen Lou på Kestrel-stubben, ikke noe `pclibrary.org`, ingen nye QA-personfakta. Lette Threadline-kontoer har `pool` og ingen `claimsToBe`/`operatedBy`.

**W5 — godkjent ny kanon.** Fyret automatisert i 1998, siste fyrmester Samuel Okoro. Harbor Festival har hatt frivillige siden minst 1979. SpillCheck-brudd som universfakta: HarborFit (mars 2021), Slice of Calder (november 2022), CalderLearn (august 2024), i tillegg til det allerede kanoniske Eastfield Neighbors (februar 2023). Øvrige navn på bruddlisten er oppdiktede lister og klubber, ikke registrert som egne entiteter. Et trådinnlegg kaller 6:10-fergekapteinen Dennis; det er en forum-påstand, ikke registrert som kanon.

**Gjenstår etter W5.** W6–W8. Cachet 2019-versjon av portcalderjazz.com (nevnt i WEBSITES.md, ikke funnet opp i W3). Prosjektsidene for Foundry Lofts, Heights Commons og Northpoint Landing finnes nå (W4), men WEB0001–WEB0004 og øvrige gjenstående WEB-bilder er fortsatt ikke produsert. Omdøping av `corp-registries.example`. Lukke PR #72. Casebook steg 2–5.

**W6 — nye/endrede filer.** Malene `app/sites/legacy.js` (varianter `2002`, `2008`) og `personal.js` (`geocities`, `club`), utvidet Landing med `smallbiz` (`parked` forblir Browser-eid i `status.js`). `blocks.js` fikk typen `quirk`. `core/sites.js` indekserer alias-URLer (`domains`). Innhold: `sites-w6-*.json` (50 nye sider), `entities-background-w6.json`, nye oppføringer i `background-facts.json`, nettsteder `pclibrary`, `calderpower`, `caldercu`, `walts`, `harborpa`, kirurgisk nav og manifest, omdøping av `corp_registries`. Grafikk: SVG-logoer og helteillustrasjoner WEB0031–WEB0035, `LOGO_KESTREL_2014`, registrert i `graphics/catalog.json`. Tester: `tests/websites-w6.test.mjs`. Skjermbilder: `/workspace/dead-internet-shots/w6-*.png`. Dokumenter.

**W6 — innhold og tall.** Nye sider, i tillegg til de eksisterende som er urørt: Salty's 3, HarborDesk 2, Eastfield Community Garden 3, AIWriterPro 2, Harbor Dental 5, Calder Transit 6, Open Filings 1, Port Calder Public Library 8, Calder Power 6, Calder Credit Union 5, Walt's Harbor Festival Page 5, Harbor Public Affairs 1, portcalderjazz.com cache 3 (50 i alt). Verden har nå 444 artefakter. Bakgrunnsfakta: 45 (30 fra W4–W5 + 15).

**W6 — designbeslutninger.** Eksisterende ID-er, URL-er og ordlyd er uendret, med ett avklart unntak: `corp-registries.example` er omdøpt til `openfilings.org`. A63 har ny kanonisk URL `openfilings.org/meridian-holdings-ltd`, uendret brødtekst; det gamle vertsnavnet ligger i `domains` og som søkeord, og `resolveBrowse` / Seeker treffer fortsatt den gamle adressen og gamle lagrede spill. Meridian ligger ikke i offentlig nav. `portcalderjazz.com` er fortsatt parkert live fra 2022; W6 legger til en cachet 2019-side (`live: null`) med natt på the Anchor og pianisten Lou Benn (allerede i DR 17. mai 2025). Kestrel fikk design `d2014` og cachete 2014-versjoner av hjem og About; v1-ordlyden er uendret, og 2014-teksten unngår senere tall (140 biler, Dock Road, same-day). Salty's fikk et 2026-03-01-design med ny tagline («New banner. Same chowder») uten å endre B19. Harbor Dental har «Theme: Lumen by Pixelfold» i footer (bevisst blindvei fra §9.3); Brightlines footer er ikke endret (W7). Bibliotekets personalside har en cachet 2024-versjon med Mara Quinn og Priya Shah, og en levende 2026-versjon uten Mara og uten nye personopplysninger. Live kart på Calder Transit er en «temporarily unavailable»-side, ikke et kart. NIMG0004 er ikke brukt. IMG05O er brukt på hagens plottside, slik §7.2 planla. Walt's side ligger på den tildelte gratisverten `waltbrennan.calderweb.net` (sist oppdatert 12. juni 2009 i designet). Ingen W7-spor (Calvins ansikt hos HarborDesk, Brightline-ansatte som forsvinner, m.m.) er lagt inn.

**W6 — ny kanon som venter på ja.** Allerede i avisene, registrert som `canon`: bibliotekkuttet fra oktober 2025; e-lesere (tre uker, 40 klassikere); skattehjelp på Eastfield tirsdag 10–14 til april; Walter Brennans død 31. oktober 2025, 81 år, ande-løp i tretti år; strømbruddet 17. februar 2026 (transformator, ca. 14 000 hus, retting av første uttalelse); smartmålere i om lag en tredel av Eastfield siden desember 2025; Calder CU siden 1952 og filial på 4th Street; Lou Benn som pianist på the Anchor. Nye, foreløpig `claim`: bibliotekets hverdagsåpningstider (ons–fre 10–18, lør 10–16, stengt søn); øvrige ansatte Tomás Rinaldi, Helen Cho og June Ellery (Priya er fortsatt på Eastfield); Harbor Dental-teamet Dr Nina Pell, Dr Omar Rahman og hygieniker Chris Vale, åpningstider og parkering bak praksisen; HarborDesk-rom på Dock Road og prisene Plus $79 / Studio $149 (Standard $29 sto allerede på B18). Domenet `openfilings.org` og navnet Open Filings er nytt.

**Gjenstår etter W6.** W7 (spor i design, bare med Anders' ja) og W8. WEB0001–WEB0004 og øvrige planlagte fotografier er fortsatt ikke produsert (W6 brukte SVG-illustrasjoner). Lukke PR #72. Casebook steg 2–5.


**Faste regler**
- Ingen merge uten Anders' eget ja. Små, avgrensede PR-er. DESIGN.md og DEVPLAN.md oppdateres i samme PR som endringen.
- Kanon og spillerkunnskap holdes strengt adskilt. Ingen visning, ingen karakter og ingen regel som reagerer på spillerens egne vurderinger, får avsløre skjulte sammenhenger. Tvillingverden-testen (`tests/twin.test.mjs`) er permanent, feiler den er det koden som skal rettes, aldri testen. Den utvides når nye Casebook- eller nettstedsfunksjoner kommer.
- Ingen visuell markering av ledetråder. Ingen poeng, stjerner eller løsningsgrad.
- Grafikk: hvert nytt bilde kontrolleres alltid mot spesifikasjonen og mot alle tidligere bilder, både for likhet og mangler (se `graphics/`).
- Spilltekst på engelsk. Anders skriver norsk, og dokumentasjonen er på norsk.
- Tester: `node --test --test-concurrency=1 games/dead-internet/tests/*.test.mjs`, `node games/dead-internet/tools/validate.mjs` og `node games/dead-internet/tools/simulate.mjs` fra repo-roten. Mobil røyktest (Playwright, 390×844) ved UI-endringer: et lagret spill kan legges i `localStorage`, telefonen låses opp med «Swipe up to unlock», introen lukkes med `.it-notips`, og Casebook er det fjerde ikonet i docken.


## Testbelastning (Anders, 25. nov 2026)

Full testdekning beholdes. Vi reduserer hyppighet og parallellitet, ikke kvaliteten på testene.

- **Under aktiv utvikling:** kjør bare tester som berører endret kode. Ikke kjør fullpakken etter små endringer. Kjør testprosesser sekvensielt som standard og bruk `node --test --test-concurrency=1` for å kjøre testfilene sekvensielt.
- **Etter fullført deloppgave:** kjør relevante regresjonstester. Tvillingverden-testen kreves ved endringer i Casebook, proveniens eller spillerens synlige informasjon. Kjør én mobil røyktest ved UI-endringer.
- **Før PR:** kjør hele testpakken én gang, deretter validator og simulator, og nødvendig Playwright-røyktest. Rapporter feil. Allerede fullførte kontroller gjentas bare dersom nye relevante endringer eller feil gjør det nødvendig.
- **Playwright:** maksimalt én worker og én nettleser om gangen som standard. Gjenbruk nettleseren gjennom kjøringen; unngå unødvendige oppstarter. `tools/test-casebook-ui.mjs` bruker én nettleser, sekvensielle sider og ingen parallelle workers.
- **Ressurser:** ingen samtidige fullpakker, ubegrenset parallellisering eller kontinuerlige bakgrunnstester. Undersøk hengende tester før ny kjøring; ikke start flere kopier. Ingen permanente endringer i globale systeminnstillinger.

Kommandoene før PR kjøres én etter én fra repo-roten:

```text
node --test --test-concurrency=1 games/dead-internet/tests/*.test.mjs
node games/dead-internet/tools/validate.mjs
node games/dead-internet/tools/simulate.mjs
node games/dead-internet/tools/test-casebook-ui.mjs
```

## Fase 0 — Design ✅
- [x] Arkitekturforslag og MVP-omfang (docs/PLAN.md)
- [x] Designbeskrivelse for The Quiet Account (docs/THE-QUIET-ACCOUNT.md)
- [x] Avklaringer fra Anders (språk, plassering, hypoteser, tid, tone, grafikk)
- [ ] Papirtest med minst én person (kan gjøres parallelt med fase 2)

## Fase 1 — Kjerne uten grensesnitt ✅
- [x] Prosjektstruktur i `games/dead-internet/`
- [x] Datamodell og verdensmodell (`core/world.js`, `content/`)
- [x] State og lagring med versjon, migrering og eksport (`core/state.js`, `core/save.js`)
- [x] Regelmotor med hendelser, betingelser, effekter og planlagte effekter (`core/rules.js`)
- [x] Fritt søk med indekseringsnivåer, cache og bildesøk (`core/search.js`)
- [x] Personkunnskap, tillit, tilgangsbetingelser og skriptet dialog (`core/dialogue.js`)
- [x] Artefakter med versjonshistorikk og cache (`core/artifacts.js`)
- [x] Casebook med strukturerte hypoteser, notater, vurdering og publisering (`core/casebook.js`)
- [x] The Quiet Account som testverden (88 artefakter, 8 personer, 19 kontoer, 26 bilder)
- [x] Innholdsvalidator med referanser, tidslinjer, kildeuavhengighet, tilgang og blokkeringer
- [x] Simulator med 7 scenarioer og to automatiske spillere
- [x] 28 automatiserte tester
- [x] Grafikkatalog, plassholdere og GRAPHICS.md
- [x] Commit og push (PR #46)

## Fase 2 — Telefonen og lesing
_Implementert 24. november 2026, ukommittet. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] `index.html` + eget `manifest.json` (egen PWA) + `app/main.js` som laster verden med `fetch`
- [x] Telefon-skall: låseskjerm med varsler, hjemskjerm, appbytte, tilbakeknapp/sveip, statuslinje med dag
- [x] Navnevalg ved start (standard Sam)
- [x] Browser: adresselinje, Seeker-søk, resultater med «Cached copy», sidevisning per plattform
- [x] Connect: profil, innlegg, kommentarer, bilder
- [x] Bildevisning med zoom, «Image info», «Search by image» og «Flip & search»
- [x] Lagre som bevis (langt trykk / bokmerke)
- [x] Automatisk lagring etter hver handling, eksport og import av lagring
- [x] Bilder: bruk `assets/images/<fil>` hvis den finnes, ellers plassholder
- [x] Lesevisning i Messages (tråder og vedlegg) og bevisliste i Casebook, så fase 2 kan spilles
- [ ] Test på ekte telefon (iOS Safari og Android Chrome), portrett, én hånd
- [x] Kort på landingssiden i `index.html` (MISC GAME, merket WIP)

## Fase 3 — Samtaler og Casebook
_Implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] Messages: tråder, «spør om», «vis bevis», svaralternativer, ulest-markering
- [x] Ny melding til personer man har funnet, «skriver …»-pause før svar, lagre meldinger som bevis
- [x] Casebook: bevisliste gruppert per person/organisasjon/konto, notater, hypotesebygger med ark
- [x] Hypoteser: opprette, redigere, slette, koble bevis, eget notat
- [x] Visning av antall bevis og kilder per hypotese (ingen vurdering)
- [x] Notater kan redigeres og slettes (`updateNote`, `deleteNote` i motoren)
- [x] Sleep-knapp på hjemskjermen (ikke en egen app) og nattlige hendelser på låseskjermen
- [ ] Mer variasjon i reserve-svar (i dag ett per type per person)

## Fase 3b — Kontekstmenyer, navigasjon og kunnskapsgrenser
_Implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] Felles kontekstsystem (`app/context.js`, `core/refs.js`): ett trykk på et ord gir et handlingsark, uten synlig markering
- [x] Entiteter, alias, kontoer, e-post, domener, adresser, datoer, referansenummer og begreper (`universe/terms.json`)
- [x] Fritekst: markér tekst for søk, kopi og lagring
- [x] Søkehistorikk, nylige søk, forslag, ett-trykks gjentak, direkte til resultater fra menyen
- [x] Bevart app-tilstand og rulleposisjon, retur til opphav på tvers av apper, «Recently visited»
- [x] Oppdagelsestilstander (unknown, encountered, investigated, saved) med migrering av gamle lagringer
- [x] Revisjon av Browser, Connect, Messages, Casebook, søkeforslag og kontekstmenyen for lekkasjer, med automatiske tester

## Veikart (Anders, 24. nov kveld, samlede beslutninger)
Fase 9 er ferdig. Katalogen har 83 ferdige filer etter nettsidegrafikken 25. nov (eksisterende Cora-bilde beholdes). Forbedringen av Unfiltered-ikonet kan gjennomføres. Små, avgrensede PR-er, og DESIGN.md og DEVPLAN.md oppdateres fortløpende.
1. Fullfør Casebook steg 0–5 (under). Lekkasjene L1–L4 har førsteprioritet. Røyktest i nettleser før merge.
2. Avklar og eventuelt kompletter mekanikken for saksavslutning og konsekvenser. Gjennomgangen gjøres i egen tråd først. Ingen nye avslutningsmekanismer før den er diskutert.
3. Ekstern spilltest av The Quiet Account.
4. Juster etterforskningsmekanikken etter observasjonene.
5. Autentisk nettsidearkitektur gjennom W0–W8. Godkjent som designretning (forslaget «Et mer autentisk internett i Browser», med Anders' avklaringer), implementeres først i denne fasen.
6. Bakgrunnsinnhold (mål 140–170 sider, i etapper) og nødvendig grafikk (WEB0001–WEB0024, de tolv viktigste først).
7. Ny spilltest med det utvidede internettet.
8. Resterende verktøyapper (fase 10).
9. TokTok (fase 11), en egen større produksjonsfase.
10. Nye mysterier i det eksisterende universet (fase 12).

## Tidligere rekkefølge (Anders, 24. nov)
Ingen unødvendig utvidelse av fasen som pågår.
1. ~~Global kontekstmeny, kunnskapsgrenser og navigasjon (fase 3b)~~ ✅
2. ~~Timeline (fase 4)~~ ✅
3. Rapportering og U0 (fase 5)
4. Universdeling U1 (fase 6)
5. Mediekjerne M1 (fase 7)
6. The Daily Record og Unfiltered, M2 (fase 8)
7. Ferdigstille The Quiet Account (fase 9)
8. Resterende verktøyapper: Mail, Files, Contacts, Forensics, Archive (fase 10)
9. TokTok, M3 og M4 (fase 11)
10. Videre mysterier (fase 12)

Medieproduksjon (M5) går løpende ved siden av, med 20–30 ekte videoklipp i første runde.

## Fase 4 — Timeline ✅
_Timeline implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] Timeline er den fjerde fanen i Casebook. Den er tom ved start, bygges av spilleren og genereres aldri automatisk.
- [x] Hendelser kan opprettes:
  - fra en dato («Add to Timeline»)
  - fra markert tekst («Event» i markeringslinjen, eller «Create event»)
  - fra et bilde, et dokument eller et bevis
  - manuelt («New event»)
- [x] Bevis kan knyttes til en eksisterende hendelse («Attach to existing event…»), som støttende eller motstridende. Flere bevis per hendelse er mulig.
- [x] Hver hendelse har:
  - tittel, beskrivelse og notat
  - dato: eksakt (med valgfri tid), omtrentlig (år eller måned), intervall eller ukjent
  - personer, organisasjoner og steder (bare det som er undersøkt)
  - støttende og motstridende bevis
  - teorier
  - kilde
- [x] Datoene på kilden tilbys som valg: publisert, kopiens dato, bildemetadata og datoer i teksten. Spilleren velger, og motoren løser aldri motsetninger.
- [x] Gale, motstridende og oppdiktede hendelser er tillatt, og intervaller kan stå feil vei. Ingen riktighetsindikator. Sorteringen bruker bare spillerens egne datoer.
- [x] Teorier viser tilknyttede hendelser.
- [x] Lagringsversjon 3. Eldre lagringer får en tom tidslinje.


## Fase 5 — Rapportering og U0
_Implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
_Rapporter og publisering bygges per sak fra starten, så de ikke må skrives om når neste mysterium kommer._
- [x] Publiseringsflyt med kanalvalg og Danas gjennomgang (Casebook → Reports)
- [x] En rapport har alltid én sak (`case`). Påstander vurderes mot den sakens påstander og universets kanon.
- [x] Kanaler og reviewer leses fra sakens `publishing`, ikke fra en motorregel. Universets kanaler er åpne for alle saker.
- [x] Valgte tidslinjehendelser kan tas med i rapporter, med antall kilder for og mot. Ingen vurdering i Timeline.
- [ ] Vurdering av tidslinjehendelsers nøyaktighet. Krever kanoniske hendelsesdatoer i innholdet, så det venter til det trengs.
- [x] Bevis, teorier, notater og tidslinjehendelser får `cases: []`. Tomt betyr uklassifisert. Ingenting knyttes automatisk, og spilleren velger én, flere eller ingen saker. Casebook har filter (alle, per sak, uklassifisert).
- [x] Lagringsversjon 4 med migrering: eksisterende elementer blir uklassifiserte, gamle rapporter får sin sak
- [x] Visning av reaksjoner og avslutninger (epiloger). En avsluttet sak stopper ikke spillet.
- [x] Startskjerm med tilgjengelige etterforskninger (`mysteries[].menu`): «Continue investigation», spillbare saker kan startes eller fortsettes, og frø vises som «Future investigation». Plassholderbilder til grafikken er klar.

## Fase 6 — Universdeling U1
_Implementert 24. november 2026. Ingen synlig endring for spilleren utover startskjermen. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] Innholdet deles i `content/universe/` og `content/mysteries/quiet-account/`
- [x] `mystery.json` med start (premiss, startartefakter, innlogging, intro), forutsetninger, frister, påstander, bevisliste, avslutninger, publisering, testoppsett, lag og tekster
- [x] `state.cases` med `locked`, `available`, `active` og `closed`. Flere aktive saker samtidig, og en avsluttet sak stopper ikke spillet. Lagringsversjon 5.
- [x] Start fra startskjermen (`start.menu`) og naturlig oppdagelse i verden (`start.discover`). Forutsetninger med `requires`.
- [x] Relative frister (`beforeCaseDay`, `caseDay` i regler), og `beforeDay` beholdes for univershendelser
- [x] Personer kan utvides per mysterium (`extends`). Personene i The Quiet Account er ikke delt opp ennå, det gjøres når neste mysterium trenger det.
- [x] Validator og simulator per mysterium. Bakgrunnsinnhold kan bli bevis når et mysterium lister det i `evidence`. Den absolutte `filler`-regelen er erstattet.
- [x] Narrative lag (`layer` 1–7) konfigureres per mysterium (`layers.reveal`, `hint`, `background`). The Quiet Account: reveal 1–2, hint 3–4, bakgrunn 5. Validatoren sjekker grensen.
- [x] Saksspesifikke tekster flyttet: eksempelteorien til sakens tekster, «Port Calder» til plattformdata. `.pf-brightline_site` er universets plattformstil og blir værende.

## Fase 7 — Mediekjerne (M1)
_Implementert 24. november 2026. Bare motor, validator og verktøy. Ingen synlig endring i spillet._
- [x] Artikkelfelt: seksjon, byline, rettelser, relaterte, referanser, sponset, strukturerte kommentarer (med `deletedIn`), dekker (skjult)
- [x] `videos.json` og `scripts.json` (plakat, nøkkelbilder, transkripsjon, fiktiv «Video info»), og lette kontoer uten operatør (uavklart kanon). Modellen skal tåle 150 klipp eller flere.
- [x] Delte innholdsbassenger (`universe/pools/`) lastes som vanlige universfiler. Første innhold kommer i fase 8.
- [x] Deterministisk feed som er blind for relevans (`core/feed.js`). Feeden bygger bare på likes, følger og «Not interested» på plattformen, aldri søkehistorikk. Lagringsversjon 6.
- [x] Søk i én app (`platform`), transkripsjoner i søk, og bildesøk på nøkkelbilder
- [x] Validator: ingen bevis som bare kan finnes ved å scrolle, scrolling har ingen konsekvenser, uavklart kanon, video- og artikkelfelt
- [x] Innholdsrapport (`tools/media-report.mjs`) som viser fordelingen av sanne og usanne påstander per plattform (ingen kvote) og bevis som skiller seg ut i visningstall

## Fase 8 — The Daily Record og Unfiltered (M2)
_Implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7)._
- [x] Én nyhetsmotor (`app/apps/news.js`) med to profiler fra plattformdata (`platforms[].app`). Unfiltered har egen logo, farger og tone. En tredje avis er bare innhold.
- [x] Forside (nyeste først, aldri rangert), seksjoner, artikkel, forfatterside, kommentarer (Top/Newest), søk i avisen og del (kopier lenke, åpne i Browser, lagre, send til kontakt, versjoner)
- [x] Rettelser, relaterte saker, kilder og sponsormerking vises både i appen og i Browser
- [x] Hjemskjerm med flere apper (rutenett + dokk)
- [x] Kontekstmeny: «Search The Daily Record», «Search Unfiltered» og «Author page in …» fra en byline
- [x] «Breaking»-varsler når en ny sak kommer på `day.start`. Nye saker hver dag fra dag 2 til 8.
- [x] Innhold: The Daily Record 62 saker (48 nye), 8 skribenter med side, 6 rettelser, 4 endrede og 3 fjernede saker, 5 sponsede, 6 nekrologer, 12 kommentarfelt. Unfiltered 26 saker, 4 skribenter, 4 lekkasjer med dokument på Docshare.
- [x] Fem hendelser dekkes av begge aviser: Unfiltered har rett (kaien), Daily Record har rett (brannen), begge tar feil (strømbruddet), ingen kan avgjøres (fiskedøden), og Unfiltered beskjærer Daily Records festivalbilde.
- [x] Sprekker uten forklaring (lag 4–5): samme skrivefeil hos en Daily Record- og en Unfiltered-skribent samme uke, en avdød festivalfrivillig som siteres måneder senere, en lampe ingen butikk har.
- [x] Saker utvikler seg: vannledningssaken får to åpne oppdateringer (dag 3 og 5) med rettelse og «Updated», mens Unfiltered endrer tipset sitt stille. Tidligere versjoner ligger i cachen. Oppfølgingssaker lenker tilbake.
- [x] Avisene skriver om spillerens handlinger: Unfiltered plukker opp en publisert rapport (Connect/Threadline) neste dag, og Daily Record skriver om bystyrevedtaket (utsatt eller vedtatt). Slike saker dateres den dagen de dukker opp (`datedOnShow`).
- [x] Playwright-test på iPhone- og Pixel-størrelse

## Fase 9 — The Quiet Account ferdig ✅
_Gjennomspilling 24. november 2026: se `PLAYTEST-FASE9.md`._
- [x] Hele The Quiet Account spilt gjennom på mobil kun via UI (iPhone 13, Pixel 7): Lights out på dag 3 etter 127 trykk
- [x] Alle avslutninger testet i simulatoren (11 scenarioer, 4 nye: Too late og tre Collateral)
- [x] Spoilere fjernet: plassholdere viser ikke opphav, ingen fortellerlinjer i innhold eller metadata
- [x] Bakgrunnsinnhold rundt sakens navn (19 sider), nyheter etter avstemningen (dag 9–11), replikker etter avslutningen
- [x] Avslutninger gir varsel, saker spilleren utløser dateres den dagen de dukker opp, navn i sidetitler kan trykkes på
- [x] Grafikkatalogen dekker alle bilder, profilbilder og logoer med prioritet, ansiktsreferanser og avhengigheter
- [x] Kort, generell introduksjon ved første opplåsing og kontekstuelle tips første gang en mekanikk brukes (`app/tips.js`). Tips kan hoppes over, slås av, leses igjen og nullstilles i Settings. De nevner aldri personer, steder eller saker.
- [x] Avstemningsdatoen kan finnes fra dag 1 i en vanlig «The week ahead»-sak i Daily Record, sammen med fem andre hendelser
- [x] Varsler har riktig avsender (`notify.from`), og validatoren krever ref eller from
- [x] Søk: lette stammer (-s, -es, -ing, -ed), små skrivefeil i ord på 5+ bokstaver og delvise treff merket som delvise. Kun på «full»-sider, uten relevans for saken i rangeringen.
- [x] Avslutninger vises som utvikling i saken («The Quiet Account: Lights out», «How the case developed» med dag). Saken heter «Resolved», og spilleren kan fortsette å etterforske.
- [x] ComfyUI-produksjonsliste: `tools/comfyui-list.mjs` → `graphics/COMFYUI.md` og `graphics/comfyui-jobs.json`, med prompter, størrelser, referanser og avledninger
- [ ] Papirtest-funn innarbeidet i innholdet
- [ ] Spilltest med 2–3 personer, måling av tid til første funn og tid uten fremgang (flyttet: skjer etter Casebook steg 5)
- [x] Grafikk produsert etter `graphics/COMFYUI.md`: alle 61 elementer godkjent
- [x] Flere dynamiske hendelser og reaksjoner på publisering (avisene melder konsekvenser, fase 8)
- [ ] Service worker for offline og rask lasting

## Casebook som deduksjonsverktøy (godkjent 24. nov 2026)

Kommer før fase 10. Små, separate PR-er, interne tester fortløpende. Se DESIGN.md, «Casebook som deduksjonsverktøy».

### Steg 0 — Informasjonslekkasjer
- [x] L1: teoriens kildetall og kildebrikker (Casebook og rapportbygger) teller synlige kilder (`core/provenance.js`), ikke skjult `source`
- [x] L2: «etter hvem det handler om» bygges av navn som står synlig i innholdet, ikke skjulte `mentions`
- [x] L3: Dana vurderer og kutter ut fra synlige kilder (`apparentSupportOf`). Verdens dom etter publisering bruker fortsatt kanon.
- [x] L4: kildenavnet hentes fra synlig opphav, ikke fra en karakter med samme skjulte kildenøkkel
- [x] Artefaktvisninger bærer ikke `source`, `supports` eller `mentions`
- [x] Tvillingverden-test som permanent regresjonstest, pluss test av at `app/` ikke bruker kanonhjelpere

### Steg 1 — Bevis
_Implementert 25. november 2026 på egen branch; venter på Anders’ PR-gjennomgang og eksplisitte merge-godkjenning._
- [x] Beviskort med retur til original (bevart rulleposisjon), kommentar, merker (viktig, tvilsom), åpnet vs. vurdert
- [x] «Legg bort» med årsak og gjenoppretting, uten at koblinger eller kommentarer forsvinner
- [x] Filter etter egne vurderinger, «Ikke vurdert» øverst, lagret utdrag som bevis i stedet for notat. Lagring v7.
- [x] Et lagret bevis åpner versjonen spilleren lagret, ikke den levende siden
- [x] DOM-test i Playwright: Casebook gir samme tekst og CSS-klasser i tvillingverdenene

Verifisering av steg 1: 111 kjernetester, validator (0 feil/advarsler), alle 11 scenarioer og begge automatiske spillere. Playwright på 390×844: merker, kommentar, lagret kopi/original, retur med faktisk rulleposisjon, legg bort/gjenopprett, filtre og ny lasting. DOM-testen sammenligner 411 beviskort og alle filter/grupperingsvalg i tre tvillingverdener. Kjør med `node games/dead-internet/tools/test-casebook-ui.mjs` (Playwright installert; valgfritt `PLAYWRIGHT_MODULE` og `PLAYWRIGHT_CHANNEL`).

### Steg 2 — Teorier og spørsmål
- [ ] Fri formulering, bevis for og mot, status med historikk, alternative forklaringer
- [ ] Ubesvarte spørsmål i Notes, valgfritt knyttet til bevis, personer, kilder, teorier og saker
- [ ] Velger med søk i stedet for lange «Other evidence»-lister

### Steg 3 — Sammenligning og koblinger
- [ ] Valgmodus (langt trykk) og sammenligning av bilder, dokumenter, meldinger, artikler og versjoner
- [ ] Bytte mellom to bilder og zoom
- [ ] Seks koblingstyper med kort, valgfri begrunnelse

### Steg 4 — Kildevurdering
- [ ] Kildekort per synlig kilde: troverdighet, autentisitet, «samme opphav som», kommentar
- [ ] Spillerens egen telling av uavhengige kilder

### Steg 5 — Rapportering med spillerens vurderinger
- [ ] Strukturert publisering som også dekker manipulerte dokumenter og falske identiteter
- [ ] For, mot og egne forbehold i rapportbyggeren. Rapporten lagrer et øyeblikksbilde.
- [ ] Dana kommenterer spillerens egne forbehold
- [ ] Forslag fra gjennomgangen av saksavslutning, bare når de er godkjent: nøytral saksstatus (Active, Published, Closed, Reopened forberedt), kanalbeskrivelse i rapportbyggeren fra kanalens egne data, øyeblikksbilde av påstander, bevis og forbehold
- [ ] Tvillingverden-testen utvides med rapportbyggeren og saksstatusen

### Saksavslutning (veikart punkt 2, etter steg 5, bare etter diskusjon med Anders)
- [ ] Rett F-1: `too_late` og `ghost_story` krever `vote_passed`, ikke `vote_held`, med scenario «hele historien på Connect før avstemningen»
- [ ] Rett F-2: et utfall for «kontoen er overtatt, ingen penger» (The Partial Truth)
- [ ] Forslag som ikke er avklart: «neste morgen»-klimaks med DR-artikkel, Buried Story, Cover-Up, overskrift fra verden i varselet, Unfiltered som kanal (se docs/CASE-ENDINGS-REVIEW.md §8 og spørsmålene sist)
- [ ] Utfallsmatrise-test: påstander × kanal × før/etter frist gir alltid en milepæl eller en bevisst åpen tilstand

### Autentiske nettsteder (veikart punkt 5–7, se docs/WEBSITES.md §11)
- [x] W0 Lekkasjevern: kanonfelt fjernet fra visningen (PR #68). Hviteliste i `core/site-view.js` (`publicView`): malene og `renderArtifact` får bare visningsfelt. `filler`, `covers`, `pool` og øvrige forfatterfelt holdes utenfor. DOM-tvillingtesten forblir i Casebook-arbeidet (`tests/twin.test.mjs` røres ikke her).
- [x] W1 Nettstedsmodell (`core/sites.js`, `content/universe/sites/*.json`, `site`/`page`/`blocks`, designvalg etter dato, 404-data, automatiske lister, validator og inventar). Ingen synlige endringer i Browser ennå.
- [x] W2 Malverk og tre maler (Corporate, Government, Blog). Northgate (`glossy`), bykommunen (`municipal`, monospace bare på registeroppslag) og Eastfield Notes (`classic` / `minimal` etter 22. okt 2025) er flyttet over. Eksisterende tekst er uendret. Motoren brukes også av andre nettsteder med de samme malnavnene.
- [x] Logo, favicon og heltebilder på konfigurerte nettsteder (grein `websites-w2-graphics`). Tynn chrome for landing/legacy/personal/wiki/document slik at merke og bilde synes. Katalogen er oppdatert; GRAPHICS.md er generert. Dette er ikke W3 eller W5.
- [x] W3 Browser (frem, bokmerker, tekststørrelse, nettstedstilstander, lagringsmigrering) — merget PR #77
- [x] W4 Bakgrunn runde 1 (122 sider, beholdt) og fil med bakgrunnsfakta — merget PR #78
- [x] W5 Wiki, Forum, Document, Anonymous (og saas-Landing) — merget PR #79
- [x] W6 Legacy, Personal, øvrig Landing og eldre design — på `websites-w6`, ikke merget
- [ ] W7 Spor i design (bare med Anders' ja), ny gjennomspillingstest
- [ ] W8 «Compare with…» fra Archive (etter Casebook steg 3)
- [ ] Grafikk WEB0001–WEB0024, de tolv viktigste først
- [x] Bytt `corp-registries.example` til `openfilings.org`, med test for søk, gamle adresser og referanser — på `websites-w6`, ikke merget

### Deretter
- [ ] Ekstern spilltest av hele etterforskningsopplevelsen, etter steg 5
- [ ] Justeringer etter observasjonene
- [ ] Så: avklaring av saksavslutning, deretter autentiske nettsider (W0–W8) og fase 10–12 etter veikartet over

## Fase 10 — Resterende verktøyapper
- [ ] Mail: innboks, tråder, vedlegg, videresending og metadata
- [ ] Files: dokumenter, bilder og vedlegg som spilleren eksplisitt har lastet ned
- [ ] Archive: historiske versjoner av sider, profiler og dokumenter. Inntil videre er dette en del av Browser (cache, «View cached versions», «View available versions»).
- [ ] Contacts: adressebok som spilleren selv styrer. Kontakter legges til eksplisitt eller gjennom legitime hendelser. Kontekstmenyen får «Add to Contacts».
- [ ] Forensics: gjenbruker bildeverktøyene (metadata, bildesøk, speilvendt søk), og legger til bildesammenligning, transformasjon, dokument- og versjonssammenligning, videometadata og kontoaktivitet. Viser observasjoner, aldri konklusjoner.

## Fase 11 — TokTok (M3 og M4)
- [ ] Vertikal sveip, For You og Following, profil, kommentarer, likes, lagre, del, søk. Egen logo og identitet.
- [ ] Plassholder-video. Første produksjonsrunde er 20–30 ekte klipp, resten plassholdere.
- [ ] Kontekstmeny: Video info, Show transcript, Search by frame
- [ ] Søk på nøkkelbilder, slettede og endrede klipp, cache
- [ ] 3–5 valgfrie klipp med spor i The Quiet Account. Validatoren viser at saken kan løses uten TokTok.
- [ ] Utvide klippmengden etter at produksjonsflyt, kvalitet og ytelse er testet

## Fase 12 — Videre mysterier
- [ ] Neste mysterium (Project Echo, Missing Millions, Memory Rewrite eller Ghost Network) som innholdspakke i samme univers
- [ ] Varige konsekvenser fra The Quiet Account leses av neste mysterium
- [ ] Det store spørsmålet om ekte mennesker på nettet holdes åpent
- [ ] Vurdere innholdseditor

## Senere — Valgfri AI-dialog (eksperiment)
- [ ] Vurdere AI for `autopilot`-personer bak et flagg, med personens kunnskap som eneste kilde
- [ ] Kostnadsmåling og reserve til skriptet dialog
