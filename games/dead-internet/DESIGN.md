# Dead Internet — teknisk design

_Oppdatert 25. november 2026, etter Casebook steg 1, nettsidesteg W0–W3 og nettsidegrafikk (se DEVPLAN.md)._
Medieappene i detalj: [docs/MEDIA-APPS-PROPOSAL.md](docs/MEDIA-APPS-PROPOSAL.md) (godkjent med justeringene i §0 der).
Spilldesign og sak: [docs/THE-QUIET-ACCOUNT.md](docs/THE-QUIET-ACCOUNT.md). Casebook: [docs/CASEBOOK-DEDUCTION.md](docs/CASEBOOK-DEDUCTION.md). Nettsteder: [docs/WEBSITES.md](docs/WEBSITES.md). Saksavslutning: [docs/CASE-ENDINGS-REVIEW.md](docs/CASE-ENDINGS-REVIEW.md). Opprinnelig plan: [docs/PLAN.md](docs/PLAN.md). Oppgaver: [DEVPLAN.md](DEVPLAN.md).

## Prinsipper

1. **Kjernen kjenner ikke DOM.** Alt i `core/` kjører i Node og i nettleseren. Presentasjonen leser tilstand og sender handlinger, ingenting annet.
2. **Ett vedvarende univers, mange mysterier.** Alt innhold ligger i én verden. Et mysterium er en innholdspakke i den verdenen, ikke en egen installasjon eller kopi. The Quiet Account er det første mysteriet, ikke spillet. Se «Univers og mysterier».
3. **Innhold er data.** Personer, kontoer, artefakter, bilder, dialog, regler og kanon er JSON i `content/`. Ingen historie i koden. Motoren kan brukes til andre etterforskningsspill med et annet `content/`.
4. **Kanon, påstander og spillerens tro holdes adskilt** (se under). Spilleren ser aldri sannhetsverdier.
5. **Reproduserbart.** All endring går gjennom `Game.dispatch(action)`, loggføres, og kan spilles av på nytt med samme resultat.
6. **Ingen avhengigheter, ingen byggesteg.** Ren JavaScript med ES-moduler og `// @ts-check`. Tester med Nodes innebygde `node:test`.
7. **Ingen synlig relevans.** Ingen app markerer, sorterer eller vekter etter hva som er bevis.
8. **Det store spørsmålet står åpent.** Om det finnes ekte mennesker igjen på nettet, avgjøres ikke av tilfeldige bakgrunnskontoer eller tidlige mysterier.

**Overordnede designprinsipper (Anders, 24. nov):**
- Deduksjon er spillet. Søking er verktøyet.
- Casebook er spillerens arbeidsflate og eksterne hukommelse, ikke en fasit.
- Internett skal fremstå som et autentisk univers, ikke en samling spillspor.
- Karakterer, medier og offentlige institusjoner kan ta feil. Ingen karakter er en skjult fasitmekanisme.
- Spilleren skal kunne oppnå reelle resultater gjennom egne handlinger.
- Man skal kunne vinne en sak uten å vinne spillet. Senere hendelser som utfordrer en avsluttet sak er forfattet og konsistente med kanon, aldri tilfeldige, og undergraver ikke systematisk spillerens seire.
- Jo mer spilleren oppdager, desto bedre forstår hen de konkrete mysteriene, men desto mindre sikker kan hen bli på hvordan verden egentlig fungerer.
- Saker avsluttes gjennom handlinger og konsekvenser i verden, ikke en «Solve case»-knapp. Spillerens egne merker, kildevurderinger og teoristatus påvirker aldri utfallet i seg selv. Ingen poeng, stjerner eller løsningsgrad vises.

## Mappestruktur

```
games/dead-internet/
  DESIGN.md  DEVPLAN.md
  index.html  manifest.json egen PWA (start_url /games/dead-internet/)
  app/                      telefonen (DOM): main.js, phone.js, render.js, context.js, suggest.js, media.js, ui.js, style.css
    apps/                   browser, connect, messages, casebook, settings, news (mal for aviser)
    sites/                  nettstedsmaler (W2) og statussider (W3): index, chrome, blocks, corporate, government, blog, simple, status + CSS
  core/                     spillmotoren (ingen DOM, ingen I/O)
    game.js                 fasade: Game, dispatch, spørringer, replay()
    world.js                buildWorld(): indekser over innholdet
    state.js                createState(): all spilltilstand i ett objekt
    conditions.js           betingelsesspråket
    rules.js                regler, effekter, planlagte effekter
    artifacts.js            synlighet, versjoner, cache, tilgang
    search.js               Seeker: fritekst (også i én app), offisielt nettsted først (W3), bildesøk (også nøkkelbilder), bildeinfo
    feed.js                 feeder: deterministisk rangering, følg, lik, «Not interested»
    refs.js                 referanser i tekst (leksikon, mønstre) og søkeforslag
    discovery.js            oppdagelsestilstander og kunnskapsgrenser
    timeline.js             spillerens tidslinje: hendelser, datotyper, koblinger, datovalg
    cases.js                saker i Casebook: klassifisering (cases: []), filter, epiloger, sakens status
    dialogue.js             skriptede samtaler, tillit, svaralternativer
    casebook.js             bevis, hypoteser, notater, vurdering, publisering
    provenance.js           synlig opphav og synlige navn for bevis (aldri kanon)
    sites.js                nettstedsmodell: status, design, lenker, 404 (W1)
    site-view.js            publicView(): hvitelistet visning til malene (W0)
    browser.js              adresseoppslag, bokmerker, tekststørrelse, frem/tilbake (W3, ingen DOM)
    save.js                 lagring, versjonering, migrering, eksport/import (SAVE_VERSION 9)
    content.js              laster content/manifest.json (fetch eller fs injiseres)
    util.js
  content/
    manifest.json           universets filer (files) og mysteriepakkene (mysteries)
    universe/sites/*.json   ett nettsted per fil (W1): design, nav, status, notFound
    universe/*.json         felles for alle mysterier: meta, predicates, platforms, entities,
                            accounts, images, characters, canon (fakta), terms, mysteries (frø),
                            artifacts/filler.json (bakgrunnsinnhold)
    universe/pools/         delte medier: news-dailyrecord/, news-unfiltered/ (artikler, skribenter,
                            dokumenter), news-comments/ (lesere), news/ (hendelser, bilder, daglige saker).
                            Vanlige universfiler i manifest.files. TokTok kommer i fase 11.
    mysteries/quiet-account/  mystery.json (start, lag, påstander, bevisliste, publisering,
                            testoppsett, tekster, avslutninger) + artifacts/, canon.json, rules.json
    strings/en.json         UI-tekster (lokalisering: nb.json senere)
  graphics/
    catalog.json            grafikkoversikt: stabile id-er, filnavn, størrelser, beskrivelser, avhengigheter
    GRAPHICS.md             generert lesbar oversikt
  assets/placeholders/      SVG-plassholdere, én per bilde-id
  assets/images/            ferdige bilder (tom til produksjon starter)
  tools/
    validate.mjs            innholdsvalidator
    simulate.mjs            skriptede gjennomspillinger og automatiske spillere
    make-placeholders.mjs   lager plassholdere fra katalogen
    graphics-report.mjs     lager GRAPHICS.md
    media-report.mjs        medier per plattform og bevis som skiller seg ut
    lib/                    explorer, validator, scenarioer, Node-laster
  tests/                    core (motor), world (The Quiet Account), cases (saker og rapporter),
                            universe (pakker, sakstilstander, frister, extends, lag),
                            media (artikkelfelt, video, feed, plattformsøk, medieregler)
  docs/                     plan og sakbeskrivelse
```

## Kommandoer (fra repo-roten)

| Kommando | Hva den gjør |
|---|---|
| `node --test --test-concurrency=1 games/dead-internet/tests/*.test.mjs` | Alle tester (ca. 16 s, mest den fulle validatoren) |
| `node games/dead-internet/tools/validate.mjs` | Validerer innholdet. `--fast` hopper over simulerte spillere, `--info` viser detaljer |
| `node games/dead-internet/tools/simulate.mjs` | Kjører alle scenarioer og to automatiske spillere |
| `node games/dead-internet/tools/simulate.mjs lights_out` | Ett scenario med full samtalelogg |
| `node games/dead-internet/tools/make-placeholders.mjs` | Lager plassholdere fra grafikkatalogen |
| `node games/dead-internet/tools/graphics-report.mjs` | Oppdaterer GRAPHICS.md |
| `node games/dead-internet/tools/media-report.mjs` | Medier per plattform, sann/usann/delvis-fordeling (ingen kvote) og bevis som skiller seg ut |

## Verdensmodellen

| Type | Fil | Viktige felt |
|---|---|---|
| **Entity** | `entities.json` | `kind` (person, org, place, project, event, system), `isHuman` (true/false/null), `died`, `relations[]`, `secret` (skjules for spilleren) |
| **Account** | `accounts.json` | `platform`, `handle`, `claimsToBe` (hvem kontoen utgir seg for), `operatedBy` (hvem som faktisk styrer den), `history[]` (tidligere operatører, `null` = sovende). En **lett konto** (`pool`) har bare `platform`, `handle`, `displayName`, ev. `avatar`: uten `operatedBy` er kanon uavklart. |
| **Artifact** | `artifacts/*.json` | `type`, `platform`, `author`, `date`, `versions[]`, `live`, `index`, `keywords`, `hidden`/`visibleIf`, `access`, `supports[]`, `source`, `mentions[]`, `images[]`, `filler` |
| **Video** | `videos.json` | `duration`, `poster`, `frames[] {t, image}` (nøkkelbilder er vanlige bilder), `scenes[]` (skjult: `location`, `depicts`), `script`, `audio`, `meta` (fiktiv «Video info»), `derivedFrom`, `transforms` (reupload, crop, mirror, speed, reencode, trim, overlay) |
| **Script** | `scripts.json` | `text`: transkripsjonen. Like manus gir like transkripsjoner. |
| **Image** | `images.json` | `kind`, `derivedFrom`, `transforms` (crop, mirror …), `meta` (fiktiv EXIF), `manipulation`, `supports`, `source`, `depicts` |
| **Character** | `characters.json` | `entity`, `account`, `kind` (person/autopilot), `trust`, `knows`/`believes`/`observed`, `has`, `responses[]`, `prompts[]`, `fallback` |
| **Predicate** | `predicates.json` | `arity`, `subjectKinds`, `objectKinds`, `truth` (facts, operatedBy, notHuman, relation), `template` |
| **Claim / Fact** | `canon.json` | Påstander med sannhet (`true`, `false`, `partial`) og formuleringer (`match`), pluss sanne fakta |
| **Rule** | `rules.json` | `when {event, match}`, `if`, `do[]`, `once` |
| **Mystery** | `mysteries.json` | `claims`, `endings[]` med `if` og `effects`, `deadlines[]` |

### Medier (artikler, innlegg, klipp)
Alle felt er valgfrie og kan ligge på artefakten eller en versjon: `section`, `byline[]` (konto-id eller fritekst), `corrections[] {date, text}`, `related[]`, `refs[]`, `sponsored {by}`, `comments[] {id, account, date, text, likes, replyTo, deletedIn, pinned}`, `video` (en video-id), `stats {views, likes}`, `category`. En kommentar med `deletedIn` er borte fra den versjonen og senere. `covers[]` (hendelser artikkelen dekker), `pool` og videoens `scenes`, `source` og `script`-id er forfatterdata og vises aldri. Spilleren ser klippet, bildeteksten, transkripsjonen og «Video info».

### Aviser (app/apps/news.js)
En plattform med `app: { template: "news", sections, sectionLabels?, logo, short, icon, theme, tagline }` blir en egen app på hjemskjermen. Listene kommer fra `game.news(platform, {section, author})`: nyeste først, bare saker som er synlige og ikke datert etter i dag, aldri rangert og aldri etter relevans. Forfattersiden lister alt under en byline. Artikkelvisningen er den samme `renderArtifact` som Browser bruker, med seksjon, byline (trykk gir «Author page in …»), sponsormerking, rettelser, relaterte saker, kilder og kommentarer. Skribenter og kommentatorer er lette kontoer. Å lese en byline gjør navnet møtt, ikke undersøkt. Nye saker kommer med universregler på `day.start` (`universe/pools/news/rules.json`), og «Breaking» gir varsel. En sak kan utvikle seg: en regel bytter levende versjon (`setLive`), og eldre versjoner blir liggende i cachen. Avisen viser første publiseringsdato og «Updated» med versjonens `date`, med mindre versjonen er `silent` (en stille endring). Listen sorteres etter første publisering, så en oppdatering flytter ikke saken til toppen. En sak med `datedOnShow` (krever `hidden`) får datoen til dagen en regel viser den. Det brukes når avisene skriver om noe spilleren har forårsaket.

### Feeder (core/feed.js)
En feed er deterministisk og blind for etterforskningen. Den leser bare plattform, kategori (`category` eller `section`), popularitet (`stats.views`), dato, forfatter og spillerens egen interaksjon på plattformen (følger, liker, «Not interested»), pluss en hash av seed og dag. Den leser aldri `supports`, `mentions`, påstander, saker eller søkehistorikk. To faner: «For You» (rangert) og «Following» (fulgte kontoer, nyeste først). `state.media` holder følger, likes og «Not interested». Å like eller følge gir ingen kunnskap. Å se et klipp (`watch`) er det samme som å åpne det: klippet blir sett og skaperen møtt. Scrolling koster ingen tid.

### Versjoner og cache
En artefakt har én eller flere versjoner. `live` sier hvilken som er publisert nå (`null` = slettet). Versjoner med `cached: true` kan leses via søkemotorens cache når de ikke lenger er live. En versjon kan ha egne `supports`, `mentions`, `images` og `source`, slik at en bufret originaltekst kan være et selvstendig bevis.

### Bilder som bevis
Bilder er egne objekter med opphav (`derivedFrom`) og transformasjoner. Bildesøk finner alle bilder med samme original. Nøkkelbilder og plakat teller som bildene til klippet, så bildesøk på et nøkkelbilde finner andre klipp med samme opptak eller sett. Speilvendte kopier finnes bare med «Flip & search». «Image info» viser fiktiv metadata. Selve filene ligger utenfor motoren: verden refererer bare til bilde-id-er, og `graphics/catalog.json` sier hvilken fil som hører til hver id.

## Kanon, påstander og spillerens tro

1. **Kanon** (`canon.json` + `accounts.operatedBy` + `entities.isHuman`) er fasit. Bare publisering og validatoren leser den.
2. **Påstander og vitnemål**: artefakter og personer har `supports` (hvilke påstander de gir bevis for), også usanne påstander. Personer kan bare støtte påstander de `knows`, `believes` eller har `observed`, og bare gi bort artefakter de `has`. Validatoren sjekker dette.
3. **Spillerens tro** (`state.evidence`, `state.hypotheses`, `state.notes`) er det spilleren har samlet og bygd. Casebook viser bare antall bevis og antall kilder slik de *ser ut* (se «Synlig opphav» under).

### Fem lag som aldri blandes

| Lag | Hva | Hvor | Casebook og karakterer kan lese |
|---|---|---|---|
| 0 Kanon | hva som er sant, hvor ting egentlig kommer fra | `canon.json`, `facts`, `claims`, `operatedBy`, `isHuman`, `source`, skjulte `mentions` | nei, bare publisering, regler og validator |
| 1 Karakterenes tro | hva Dana, Theo og andre vet og tror | dialogdata (`knows`, `believes`, `observed`) | bare gjennom det karakteren sier |
| 2 Kildenes påstand | hva teksten, bildet eller meldingen sier | synlig tekst, dato, metadata, `supports` (hva innholdet gir seg ut for å vise) | ja |
| 3 Spillerens oppdagelser | sett, møtt, undersøkt, lagret | `seen`, `encountered`, `known`, `saved` | ja |
| 4 Spillerens slutninger | bevis, teorier, notater, tidslinje (senere merker, koblinger, kildevurdering) | Casebook-tilstanden | ja, det er spillerens egne data |

**Synlig opphav (`core/provenance.js`).** Alt spilleren ser om hvor et bevis kommer fra, bygges av `apparentSource`: avsender av en melding (kontaktens konto), kontoen som postet, personen som sendte et vedlegg, håndtaket i adressen, adressen til et dokument eller en forumtråd, ellers nettstedet. Hvem et bevis handler om, bygges av `visibleRefsOf…`: navn som står i teksten, forfatter, byline og kommentatorer. Et alias teller bare når innholdet selv lister det. Skjult `source` og `mentions` brukes aldri til visning. Tre personakontoer som styres av samme aktør er derfor tre kilder i Casebook, akkurat som for en leser.

**Ingen karakter er en fasitmekanisme.** Dana og alle andre karakterer vurderer ut fra det de kan se og det de vet (lag 1–2). De kan ta feil, bli manipulert og trekke feil slutninger. Danas vurdering og hennes kutt før publisering bruker `apparentSupportOf`. Bare verdens reaksjon etter publisering bruker kanon.

**Visninger bærer ikke kanon.** `viewArtifact` fjerner `source`, `supports` og `mentions` før visningen forlater kjernen. Verktøy som explorer og validator leser kanon direkte gjennom `supportsOf`/`sourceOf`, og det er tillatt der.

**Tvillingverden-testen (`tests/twin.test.mjs`) er permanent.** Verden bygges tre ganger: som den er, med ett felles skjult opphav for alt, og med eget opphav for hver ting. I tvillingene snus også `operatedBy`, `isHuman`, sannheten i `claims` og `facts`, og det legges til skjulte mentions av navn som ikke står i teksten. Samme spiller gjør det samme i alle tre. Alt Casebook viser, og alt Dana sier og kutter, skal være identisk. Bare konsekvensene etter publisering får avvike. Feiler testen, er det visningen som skal rettes, aldri testen. En annen test sjekker at `app/` og `core/provenance.js` ikke bruker kanonhjelperne.

En **hypotese** er `[subjekt] [predikat] [objekt]` med koblede bevis og et fritt notat. Ved publisering:
- **Sannhet**: hypotesen matches mot en kanonisk påstand. Ellers utledes den fra verdensmodellen (for eksempel: en konto som styres av en annen enn den utgir seg for, er ikke en ekte person).
- **Støtte**: antall forskjellige skjulte `source` blant koblede bevis som faktisk støtter påstanden. To eller flere er sterk, én er svak. Dette er verdens dom og vises aldri. Dana bruker samme regel med synlige kilder (`apparentSupportOf`), så hun kan bli lurt.
- **Troverdighet** endres etter tabellen i `meta.publishing.scoring`, vektet per kanal.
- Sanne påstander med støtte registreres i `state.exposed`, alle publiserte i `state.published`. Avslutninger og regler leser disse.

Dana (kanalen `daily_record`) har en `reviewer`: hun kommenterer kildestyrke og dristighet, aldri sannhet, og kutter påstander som ser svakt støttet ut før publisering. Hun teller synlige kilder, men hvilke bevis som støtter en kanonpåstand avgjøres av skjulte `supports` (se «Implementert steg 5», «Punkt 9», venter på Anders). Fra steg 5 kommenterer hun også det spilleren selv har merket (bevis mot, egen kildetelling, kilder spilleren ikke stoler på), som råd før publisering; det endrer ikke kuttet eller verdens poeng (se «Implementert steg 5»).

## Søk

Fritt søk, uten krav om at ord må være oppdaget først. Hva som finnes, styres av indekseringen:

| `index` | Finnes når |
|---|---|
| `full` | Minst halvparten av søkeordene treffer (tittel, forfatter, tekst) |
| `weak` | Alle ordene i et søk med to eller flere ord treffer, eller et nøkkelord treffer |
| `exact` | Bare når et nøkkelord treffer (koder, adresser, domener) |
| `none` | Aldri (bare via vedlegg eller lenker) |

Bufrede versjoner kommer med når alle søkeordene treffer. Låste sider (`access`) vises med påloggingstittel. «Sitater i anførselstegn» søker etter eksakt frase. Transkripsjoner søkes som tekst, og `byline` teller som forfatter. Med `platform` søker man inne i én app (TokTok-søk, avisens eget søk).

## Dialog

Spilleren skriver aldri fritt til personer. Hun spør om noe hun kjenner (`ask`), viser noe hun har lest (`show`), eller velger et svaralternativ (`reply`). Første svar som passer vinner. `once` gjør at et svar bare kommer én gang. `showSupports` reagerer på alle bevis for en påstand, slik at mange veier fører til samme reaksjon. `autopilot`-personer (Calvin, Juno, Mara-kontoen) er maskiner i fiksjonen, og gir senere en naturlig plass for valgfri AI-dialog.

## Tid og regler

Tiden går bare når spilleren velger **Sleep**. Da kjøres planlagte effekter (`later`), deretter `day.start`-regler, så avslutninger. Regler er engangs som standard (`once: false` for gjentakende). Hendelser: `game.start`, `day.start`, `search`, `artifact.open`, `message.send`, `evidence.save`, `image.search`, `login`, `report.published`, `case.start`, og for stemning `video.view`, `video.like` og `feed.scroll`. Regler på de tre siste kan bare sende meldinger og varsler.

## Lagring

`state` er ett JSON-objekt. `save.js` legger på format og versjon, støtter eksport/import og migrering, og fjerner referanser til innhold som ikke lenger finnes. Lagringen injiseres (`localStorage` i nettleseren, `Map` i tester). Nøkkel: `ba_deadinternet_<world-id>`. Lagringsversjon 10: 1→2 oppdagelse, 2→3 tom tidslinje, 3→4 saker (alt blir uklassifisert, gamle rapporter får sin sak), 4→5 sakstilstander, 5→6 tom `media` (følger, likes, «Not interested»), 6→7 beviskort med tomme egne vurderinger og lagret visningskopi, 7→8 Browser-bokmerker og tekststørrelse, 8→9 teorier med «mot», status med logg og alternativer, og tomme spørsmål (se «Implementert steg 2»), 9→10 tomme koblinger mellom bevis (se «Implementert steg 3»).

## Teststrategi (Anders, 24. nov)

Testene skal beskytte både teknisk funksjonalitet og spillopplevelsen. Følg også «Testbelastning» i DEVPLAN.md: målrettede tester under utvikling, sekvensielle kjøringer og én nettleser om gangen. Status per punkt:

| Test | Status |
|---|---|
| Permanent tvillingverden-test, utvides når nye Casebook-funksjoner kommer | finnes (`tests/twin.test.mjs`) |
| DOM-tester for informasjonslekkasje | `tools/test-casebook-ui.mjs`: 411 beviskort, filtre og grupper i tre tvillingverdener |
| Lagrede bevis endres ikke når originalkilden endres | `tests/evidence.test.mjs`, også ikke-cachede/slettede versjoner og migrering |
| Sammenligning av gamle og nye nettsideversjoner | nettsidefasen (W0–W8) |
| Cache viser aldri fremtidig innhold | nettsidefasen |
| Skjulte sider dukker ikke opp i automatiske lister | nettsidefasen |
| Navigasjonslenker virker eller har en bevisst definert feiltilstand | nettsidefasen |
| Gjennomspilling av The Quiet Account etter større innholdsendringer | finnes (scenarioer i `tools/simulate.mjs` og de automatiske spillerne i validatoren) |
| Ulike rapporter og saksutfall, feilaktige teorier og konsekvenser | delvis (11 scenarioer); utvides etter gjennomgangen av saksavslutning |
| Delvise avsløringer er mulige | utvides etter gjennomgangen av saksavslutning |
| Bakgrunnsinnhold gjør ikke nødvendige spor urimelig vanskelige å finne | delvis (tilgangs- og blokkeringstestene i validatoren); nettsidefasen |
| Mobil røyktest ved relevante UI-endringer | manuell eller Playwright før merge |

## Validator

`tools/validate.mjs` sjekker:
- **Referanser**: alle id-er i artefakter, kontoer, bilder, personer, regler, avslutninger og kanon finnes. Ukjente betingelser og effekter er feil.
- **Tidslinjer**: ingen innlegg før kontoen fantes, mens den var sovende, eller skrevet av en død person. Ingen bilder tatt etter at de ble publisert. Versjoner i riktig rekkefølge. Ingen kopi eldre enn originalen.
- **Kanon**: usanne påstander motsier ikke fakta, sanne påstander stemmer med verdensmodellen.
- **Personkunnskap**: personer gir bare bort det de har og vitner bare om det de vet, tror eller har sett.
- **Kildeuavhengighet**: hver kjernepåstand (S1–S3) har minst tre uavhengige kilder i innholdet.
- **Bakgrunnsinnhold som bevis**: universinnhold kan støtte en påstand bare når mysteriet lister det i `evidence` (se «Univers og mysterier»).
- **Uavklart kanon**: ingen påstand i et spillbart mysterium kan hvile på en konto uten `operatedBy` eller en person med `isHuman: null`.
- **Medier**: videoer (plakat, nøkkelbilder innenfor klippet, manus, opphav, transformasjoner), manus med tekst, artikkelfelt (seksjon finnes i appen, byline, relaterte, sponsor, dekker), kommentarer (konto, svar, `deletedIn`).
- **Ingen bevis bare i feeden**: alt som støtter en påstand i et spillbart mysterium må kunne nås ved søk, via forfatterens profil, en lenke (`related`, `refs`) eller ved å bli gitt. De automatiske spillerne bruker aldri feeden.
- **Scrolling uten konsekvenser**: regler på `video.view`, `video.like` og `feed.scroll` kan bare bruke `message` (uten vedlegg og støtte), `notify` og `later`. De kan bare matche på `platform` og `tab`, og `if` kan ikke bruke `seen`, `notSeen`, `saved`, `visible`, `live`, `known`, `exposed` eller `published`. En reaksjon på scrolling skal aldri peke ut et klipp, en skaper eller hva spilleren har funnet. Flagg kan i prinsipp bære det samme, så teksten i slike regler må også leses ved innholdstesting.
- **Søkbart er ikke det samme som finnbart**: et klipp som er bevis og bare kan finnes ved søk, gir en advarsel hvis ikke noe annet innhold leder til det (skaperen nevnt, håndtaket skrevet, eller et av klippets nøkkelord). De automatiske spillerne søker bare med ord de har lest (pluss sakens startsøk), så kjernebevis er dekket av tilgangstesten. Resten må testes når mysterier med videobevis lages.
- **Tilgang**: to automatiske spillere (forsiktig og hensynsløs) spiller gjennom og må nå minst to uavhengige kilder for hver kjernepåstand.
- **Blokkeringer**: hver artefakt, hvert bilde og hver person som bidrar til en kjernepåstand fjernes én om gangen. Saken må fortsatt kunne løses.
- **Grafikk**: hver bilde-id i verden finnes i katalogen med samme avhengighet, og har en plassholder.

## Telefonen (app/)

- `main.js` laster verden med `fetch`, gjenoppretter lagring fra `localStorage` (eller viser navnevalg), og lagrer etter hver handling via `game.on("state")`. Eksport og import bruker `save.js`.
- `phone.js` eier statuslinje (klokke, dato og dag), låseskjerm med varsler, hjemskjerm, bannervarsler, bildevisning og ark. Hver app har sin egen tilbakestabel. Knappen øverst til venstre i hver app er «tilbake», og «Home» når appen står på første skjerm. Sveip fra venstre kant, Esc og nettleserens egen tilbakeknapp gjør det samme. Nettleserens tilbake holdes inne i spillet med en ekstra historikkoppføring. Bare på hjemskjermen forlater to trykk innen 2 sekunder spillet.
- Skjermer er rene data (`{kind:"page", id, version, view}`), så tilbake viser samme visning uten å sende handlingen på nytt.
- `render.js` tegner en artefakt etter plattformtype (sosial, forum, avis, blogg, register, dokument). `[Photo: …]` i teksten byttes med neste bilde. Kommentarer (`@handle (tid): tekst`) og foruminnlegg (`navn: tekst`) gjenkjennes. All tekst går gjennom kontekstsystemet (se under), så navn, adresser og @handles ser ut som vanlig tekst og åpner et handlingsark ved trykk.
- Connect-adresser åpnes i Connect, alt annet i Browser. Private dokumenter (e-post, vedlegg) åpnes i appen man står i.
- `media.js` bruker `graphics/catalog.json`: filen i `assets/images/` hvis den finnes, ellers plassholderen. Nye bilder krever ingen kodeendring.
- **Messages** (fase 3): spilleren velger «Ask about…» (alt hun har undersøkt eller lagret, gruppert som personer, kontoer, organisasjoner, hendelser og steder) eller «Show evidence…» (artefakter i Casebook, med versjonen som ble lagret). Svaralternativer (`prompts`) vises som knapper når en person tilbyr dem. «New message» viser personer man kan kontakte (`canContact`). Svarene bestemmes av personens `responses` i `characters.json`, ut fra kunnskap, tillit og flagg. UI-et velger aldri innhold selv.
- **Casebook** (fase 3): bevis gruppert etter hvem de handler om (`game.evidenceAbout`, bare kjente og ikke-hemmelige id-er), teorier bygd med `[hvem] [relasjon] [hvem/hva]`, der relasjoner filtreres etter `subjectKinds`/`objectKinds`, og notater. En teori viser antall bevis, antall uavhengige kilder og hvem kildene er, aldri om den stemmer.
- **Sleep until tomorrow** er en knapp på hjemskjermen, som også viser spilledag og dato. Knappen åpner en bekreftelse med dagens dato og datoen spilleren våkner til, og sier at meldinger, nyheter, dokumenter og hendelser kan ha endret seg, uten å si hva. Dagen går, nattlige hendelser kjøres, og låseskjermen viser «Good morning · Day N» med den nye datoen til spilleren låser opp. Lesing, søking, navigasjon og scrolling flytter aldri tiden.
- **Kjente tidsfrister**: en mysteriepakke kan ha `deadlines: [{ id, label, caseDay | day, knownIf?, until? }]`. `caseDay` regnes fra dagen saken startet. En frist vises bare for aktive saker, bare når `knownIf` holder (spilleren har møtt datoen i verden), og bare til og med fristdagen eller til `until` holder. Den vises på hjemskjermen og i sove-dialogen under «Dates you know about». Kjernen: `game.deadlines()`.
- Spillet må serveres over HTTP (ES-moduler fungerer ikke fra `file://`). Lokalt: `python -m http.server` eller `npx serve` fra repo-roten, så `/games/dead-internet/`.

## Kontekstsystemet (app/context.js, core/refs.js)

Ett felles system for alle apper, ikke én løsning per app.

- **Kjernen (`core/refs.js`, uten DOM)** bygger et leksikon fra verden: navn og alias på ikke-hemmelige entiteter, kontoer (brukernavn og visningsnavn) og begreper fra `universe/terms.json`. `scanText` finner i tillegg e-poster, nettadresser, domener, @handles, datoer og referansenummer med mønstre. Hvert treff er et spenn `{start, end, text, type, id, alias}`.
- Et alias som også er et brukernavn (`truthseeker_88`) er en identitetspåstand. Det tolkes som kontoen, aldri som personen. Handlingsarket viser og søker alltid på teksten slik den står, aldri på et kanonisk navn.
- **Presentasjonen (`app/context.js`)**: `ctx.text()` gjør tekst om til noder der referanser er `span.ref` uten synlig forskjell (ingen farge, understrek, vekt eller ikon). `ctx.block(el, origin)` merker lesbart innhold med opphav (side, melding, notat).
- **Ett trykk på et hvilket som helst ord** i et merket område åpner handlingsarket. Ord som ikke er referanser fungerer også (søk, Connect-søk, lagre, kopier), og en rekke ord med stor forbokstav («Harbor Street») tas som ett navn. Å være trykkbar betyr derfor ingenting.
- **Langt trykk markerer tekst** som vanlig. En linje nederst tilbyr «Search», «Copy», «Save» og flere handlinger for markeringen.
- **Handlinger registreres** med `ctx.register({id, icon, types, label, when?, run, investigates?})`. Standardsettet ligger i `registerDefaultActions`:
  - Søk med Seeker.
  - Finn Connect-profil. Dette er et søk, som åpner profilen direkte bare når søket finner nøyaktig én.
  - Send melding, bare til eksisterende kontakter.
  - Spør noen om dette.
  - Lag teori.
  - Besøk nettsted (entitetens `website`).
  - Åpne side eller nettsted.
  - Vis cachede versjoner.
  - Oppslag i verktøy (plattformens `lookup`, for eksempel SpillCheck for e-post).
  - Bilde: vis, metadata, bildesøk, speilvendt søk, lagre.
  - Dokument: åpne, lagre, tilgjengelige versjoner.
  - Lagre i Casebook, som et notat som husker hvor det ble funnet.
  - Kopier.
- **`when`-tester bruker bare det spilleren allerede kan se eller gjøre.** Eksempler: kontaktlisten, egne oppdagelsestilstander og offentlige data som en organisasjons nettsted. De bruker aldri skjulte relasjoner eller kontoer.
- Nye typer og handlinger krever ingen endring i appene.

## Oppdagelse og kunnskapsgrenser (core/discovery.js)

Verden vet alt. Spilleren vet bare det hun har gjort noe med. Tilstander per entitet eller konto:

| Tilstand | Betyr | Lagres i |
|---|---|---|
| unknown | finnes i verden, aldri møtt | – |
| encountered | sto i innhold spilleren åpnet | `s.encountered` |
| investigated | søkt etter, valgt i kontekstmenyen, profilen åpnet, eller personen skrev til deg | `s.known` |
| saved | lagret i Casebook | `s.saved` |

- Å åpne en artikkel gir bare `encountered`. Emner i Messages, velgerne i teoribyggeren, Casebook-grupper og søkeforslag bruker bare `investigated` og `saved` (`game.known()`, `game.topics()`).
- Et fritt søk undersøker navnene i spørringen hvis søket gir treff, eller hvis navnet er møtt før. Et alias teller bare for noe som er møtt, så det å gjette et kallenavn sier ikke hvem det er.
- `investigate` krever at navnet er møtt, eller at teksten er selve navnet. Den virker aldri på hemmeligheter.
- Kontakter er folk som har skrevet til deg, folk hvis profil du har åpnet, eller folk du har undersøkt. Unntaket er kontoen saken starter med.
- Søkeforslag kommer bare fra egne søk og undersøkte navn (`game.suggest`).
- «Nylig besøkt» lagres per spill (nøkkel med seed) i `localStorage` og fylles bare av faktisk navigasjon.
- Lagringsversjon 2 (nå 3, med Timeline). Version 1-lagringer migreres slik:
  - Alt som var «kjent» blir `encountered`.
  - Følgende blir `investigated` igjen: startpremisset, temaer man har spurt om, folk man har snakket med, åpnede profiler, teoriers subjekt og objekt, og navn i tidligere søk.
- Testene i `tests/world.test.mjs` sjekker:
  - at en ny verden bare viser premisset
  - at det å lese ikke fyller verktøy
  - at én person ikke avslører andre
  - at hemmeligheter og identitetsalias aldri lekker
  - at forslag holder seg innenfor grensene
  - at migreringen fungerer

## Timeline (core/timeline.js, Casebook)

Timeline er spillerens egen rekonstruksjon. Den er ikke et sammendrag av historien.

- **Hendelse:** tittel, beskrivelse, notat, dato, hvem eller hva, bevis med holdning (`supports`/`contradicts`), teorier og kilde.
- **Datotyper:** `exact` (dag og valgfri tid), `approx` (år, måned eller dag), `range` (fra og til) og `unknown`.
- **Motoren sjekker bare at feltene er gyldige.** Den sjekker at datoen finnes, at bevis og teorier finnes, og at personer og steder er undersøkt. Den leser aldri kanon, påstander, fakta eller hemmelige entiteter. Derfor kan den ikke rette, hinte eller avsløre noe.
- **Feil er lov:** gale datoer, intervaller feil vei, motstridende og oppdiktede hendelser.
- **Sortering:** bare etter spillerens dato. Ukjent dato kommer sist, og rekkefølgen er stabil.
- **Datovalg (`dateCandidates`):** datoer spilleren kan se på kilden:
  - publisert, eller datoen til en cachet kopi
  - bildemetadata («taken»)
  - datoer i teksten
  - tidspunktet en melding kom

  En dato uten år får kildens år og merkes som en gjetning. Spilleren velger og kan endre alt.
- **Opprettelse:**
  - kontekstmenyen: «Add to Timeline» på datoer, bilder og dokumenter
  - markeringslinjen: «Event»
  - bevismenyen: «Add to Timeline» og «Attach to existing event…»
  - «New event» i fanen

  Utkastet ligger på skjermen og overlever bytte av app. Etter lagring går man tilbake dit man kom fra.
- **I rapporter:** spilleren kan velge hendelser i en rapport. De går inn slik spilleren skrev dem, med antall uavhengige kilder for og mot. Rapportmotoren vurderer dem ikke mot noen fasit, og Timeline viser aldri noen vurdering.

## Navigasjon

- Hver app har sin egen stabel. Når man bytter app, beholdes side, rulleposisjon, søkeresultater, åpen samtale og Casebook-fane.
- En handling som åpner noe i en annen app, husker opphavet (`returnTo`). Tilbake, og lenken «◂ tittel» i statuslinjen, går rett tilbake dit, med samme rulleposisjon. Åpner man appen fra hjemskjermen, glemmes opphavet.
- Hjemskjermen viser «Recently visited». Browser har «History» med besøkte sider og alle søk, der ett trykk gjentar et søk. Søkefelt i Browser og Connect viser forslag.

## Univers og mysterier

_Besluttet av Anders 24. november 2026. Bygd i U0 (fase 5) og U1 (fase 6)._

**Ett univers.** Personer, kontoer, medier, selskaper, apper, bilder og bakgrunnsinnhold er felles. Et mysterium er en innholdspakke med egen start, påstander, regler, avslutninger, publiseringskanaler og testoppsett. Nye mysterier legges til som pakker i samme verden.

**Hybridmodell for valg av mysterier.**
- Spilleren kan velge et tilgjengelig startmysterium fra hovedmenyen.
- Nye mysterier kan også oppdages naturlig i verden, gjennom vanlige hendelser og betingelser.
- Flere mysterier kan være aktive samtidig.
- Når en sak er avsluttet, kan spilleren fortsette å utforske verden.
- Kunnskap, bevis, relasjoner og konsekvenser følger med, fordi de er universtilstand.
- Mysterier kan ha forutsetninger (`requires`), men følger ikke nødvendigvis en fast rekkefølge.

Startskjermen bygges fra `mysteries[].menu` (`order`, `tagline`, `image`). Et nytt mysterium dukker opp der ved å legge til innhold. Spillbare saker kan startes eller fortsettes, og frø med `menu` vises som «Future investigation». Inntil U1 deler alle saker én lagring.

**Innholdspakker (`core/content.js`).** `manifest.files` er universet. `manifest.mysteries` lister mysteriepakker. Hver pakke er en `mystery.json` med `files` (relativt til mappen) som legger artefakter, påstander, regler og personutvidelser inn i samme verden. Id-er er globale. `w.packOf` sier om en artefakt hører til universet eller et mysterium. En person kan utvides per mysterium med `{ "extends": "dana", ... }`: lister legges til og objekter slås sammen.

**Sakstilstander (`state.cases`, `core/cases.js`).**
- `locked` → `available` → `active` → `closed`.
- `requires` (en vanlig betingelse, for eksempel `{ caseClosed: "quiet_account" }`) låser opp en sak.
- `start.menu` gjør saken valgbar fra startskjermen, og `start.discover` starter den når betingelsen holder i verden. Dette sjekkes etter hver handling.
- Når en sak starter, blir premisset (`start.known`) kjent, og startartefaktene (`start.artifacts`) dukker opp.
- Regler fra en pakke kjører bare når saken er startet. `day.start` får da `caseDay`, som er dag 1 den dagen saken startet.
- Avslutninger evalueres for aktive og lukkede saker, med `beforeCaseDay` regnet fra sakens start. `beforeDay` beholdes for univershendelser.
- Flere saker kan være aktive samtidig. En lukket sak stopper ikke regler, verden eller andre saker.
- Innlogginger (`start.logins`) gjelder når saken er startet.
- Validator og simulator kjøres per mysterium med sakens `testing`.

**Casebook er spillerens, ikke sakens.** Bevis, teorier, notater og tidslinjehendelser ligger i én felles notatbok. Hvert element får `cases: []`.
- Tom liste betyr uklassifisert, og det er standard.
- Ingenting knyttes automatisk til aktive saker. Spilleren velger én, flere eller ingen.
- Casebook viser alt som standard, med filter per sak og for uklassifisert.
- En rapport gjelder alltid én sak (`case`). Påstandene vurderes mot den sakens påstander og universets kanon. Kanaler og reviewer kommer fra saken, så Dana er reviewer i The Quiet Account uten at det er en motorregel.

**Bakgrunnsinnhold kan bli bevis.** Fyllinnhold i universet og i delte bassenger kan senere bli bevis, men bare når et mysterium eksplisitt peker på det. Validatoren sjekker at referansen finnes og at innholdet var publisert før saken trenger det, så en ny sak ikke stille endrer en gammel. Dagens validatorregel om at `filler` aldri kan støtte påstander, erstattes av dette i U1. Inntil da støtter ingen fyllartefakter i The Quiet Account noen påstand.

**Narrative lag per mysterium.** Innhold som berører det store narrativet kan ha en skjult `layer` (1–7). Lagene går fra «én konto er en marionett» (1) til «er spilleren et menneske?» (7). Hvilke lag et mysterium kan avsløre, er konfigurert i mysteriet, ikke globalt (`layers: { reveal, hint, background }` i `mystery.json`). Validatoren sjekker at et mysterium ikke er avhengig av, eller får støtte fra, innhold over sin egen grense. The Quiet Account avslører ikke lag 5–7 og har lag 3–4 bare som tvil. Senere mysterier kan utforske de høyere lagene. Uavklart kanon (`isHuman: null`, manglende `operatedBy`) betyr ukjent, ikke falsk.

**Ingen kvoter på sannhet.** Aviser og kanaler har ingen fast andel sanne påstander. Innholdsrapporten kan vise fordelingen, men troverdighet skal komme fra historien og redaksjonelle interesser.

**Medieapper (arbeidsnavn).** The Daily Record og Unfiltered er samme nyhetsmotor med hver sin profil. TokTok er en videoplattform. Unfiltered og TokTok beholdes som arbeidsnavn, med egne logoer og egen visuell identitet.
- TokTok sin personlige feed bygger bare på likes, følger og annen eksplisitt interaksjon i TokTok. Aldri på søkehistorikk fra Seeker eller andre apper.
- The Quiet Account kan ha 3–5 valgfrie TokTok-klipp med relevante spor. Saken skal fortsatt kunne løses uten TokTok, og validatoren skal vise det.
- Arkitekturen skal tåle 150 videoklipp eller flere. Første produksjonsrunde er 20–30 ekte klipp, resten plassholdere, og vi utvider etter at produksjonsflyt, kvalitet og ytelse er testet.

**Rapporter (fase 5, `core/casebook.js` og Casebook → Reports).**
- `publish(channel, hypotheses, { case, events })`. En rapport har alltid én sak. Hvis bare én sak finnes, brukes den.
- Kanaler: universets kanaler (`meta.publishing.channels`, for eksempel Connect og Threadline) er åpne for alle saker. En sak kan ha egne kanaler (`mysteries[].publishing.channels`). Daily Record via Dana ligger i The Quiet Account, så Dana er reviewer der uten at det er en motorregel.
- Påstander matches bare mot sakens egne `claims`. Alt annet vurderes ut fra verdensmodellen. Poengtabellen kan overstyres per sak (`publishing.scoring`).
- Rapportbyggeren viser teorier og hendelser gruppert etter spillerens egen klassifisering: i saken, uklassifisert og andre saker. Alt kan velges.
- Etter publisering vises reaksjonene (nye varsler og meldinger) og eventuelle avslutninger. Casebook viser aldri sannhet eller poeng.
- Avslutninger har `title` og `epilogue`. En avslutning med `closes: true` gjør saken lukket. Spillet fortsetter, og spilleren kan fortsette å utforske.

**Hva som fortsatt er felles.** `startDate` er universets kalender. Personene ligger samlet i `universe/characters.json`, og deling i `extends` per sak gjøres når et nytt mysterium trenger det. `.pf-brightline_site` er stil for en plattform i universet, ikke for saken. Kjernen og appene har ingen id-er eller tekster fra The Quiet Account. Introteksten, premisset, innloggingen, testoppsettet og eksempelteorien ligger i `mystery.json`.

## Casebook som deduksjonsverktøy (godkjent 24. nov 2026)

Casebook er spillerens eksterne hukommelse og arbeidsflate, ikke en oppgaveliste fra spillmotoren. Spilleren skal kunne samle, rydde, kommentere, stille spørsmål, sammenligne, trekke slutninger og endre mening. Spillet forteller aldri spilleren hva som er riktig å tro. Forslaget med begrunnelse: [docs/CASEBOOK-DEDUCTION.md](docs/CASEBOOK-DEDUCTION.md) (presiseringene i DEVPLAN.md og under gjelder foran forslaget).

- **Hvert spørsmål har ett hjem.** Search History (Seeker/Browser): hva har jeg søkt etter. Evidence: hva har jeg valgt å samle. Notes: hva tenker jeg, og hvilke spørsmål har jeg. Timeline: når mener jeg det skjedde. Theories: hva tror jeg har skjedd. Connections: hvordan henger det sammen (på beviskort, i sammenligning og i teorier, ingen egen fane). Kildekort: hvem stoler jeg på. Report: hva kan jeg stå for offentlig. Informasjon lagres ett sted og vises ved referanse.
- **Bevis:** beviskort, egen kommentar, merker (viktig, tvilsom), «Legg bort» med årsak (irrelevant eller ferdig) og gjenoppretting. Ingen koblinger eller kommentarer forsvinner ved å legge bort. Å åpne et beviskort er ikke det samme som å ha vurdert det: «åpnet» registreres stille, «vurdert» settes av spilleren.
- **Spørsmål** kan registreres uten teori, i Notes. De kan valgfritt knyttes til bevis, personer, kilder, teorier og saker, og spilleren markerer dem som besvart, gjenåpner eller legger dem bort. Spillet lager aldri spørsmål fra kanon.
- **Teorier:** fri formulering mens spilleren tenker, strukturert form først ved publisering. Bevis for og mot, status (arbeidsteori, overbevist, forkastet) med historikk, og alternative forklaringer. Strukturen ved publisering må dekke manipulerte dokumenter, falske identiteter og liknende, ikke bare dagens relasjoner.
- **Sammenligning** av bilder, dokumenter, meldinger, artikler og versjoner av samme kilde. To bilder kan byttes mellom og zoomes. Seks koblingstyper: støtter, motsier, relatert, samme opphav, mulig manipulert, urelatert.
- **Kildevurdering** gjøres per synlig kilde: troverdighet, er den den den utgir seg for, og «samme opphav som». Spillerens egne «samme opphav» (på kildekortet og som kobling mellom bevis) slår sammen kilder i spillerens telling. Implementert i steg 4, se under.
- **Spillerlaget er usynlig for reglene.** Merker, koblinger, spørsmål og kildevurderinger leses aldri av betingelser, så verden kan ikke belønne en riktig kobling og dermed røpe fasit.
- **Mobil:** hurtigmenyer, valgmodus med langt trykk, filtrering etter egne vurderinger, korte valgfrie kommentarer, kontekstmenysystemet gjenbrukes, retur til originalkilden med bevart rulleposisjon.

### Implementert steg 1 (25. november 2026, venter på PR-gjennomgang)

`core/workbench.js` håndterer bare spillerens vurderinger gjennom `dispatch`: `opened` registrerer første åpning stille, `marks.reviewed` settes/fjernes eksplisitt, og `important`/`doubtful` er uavhengige merker. `shelf` er `null`, `irrelevant` eller `finished`, med dag. Kommentar, saker og teori-/tidslinjekoblinger beholdes ved gjenoppretting. Reglene og publiseringsvurderingen leser ingen av disse feltene.

Evidence-fanen har vurderings- og saksfilter, med ikke-vurderte bevis først. Kortet gir kommentar, merker, eksisterende koblinger og valg mellom lagret kopi og originalkilden; telefonens navigasjonsstakk bevarer rulleposisjonen. Utdrag med kilde blir bevis med `quote.text` og samme kildereferanse/versjon. Tekst uten kilde og spillerens egne notater forblir notater; gamle notater konverteres ikke automatisk.

Nye sidebevis får eksplisitt versjon og `snapshot` av kjernens rensede visningsobjekt. `evidenceView(id)` krever et eksisterende bevis og gir en kopi av disse dataene; den gir aldri tilgang til andre versjoner. Den levende siden og Seeker-cachen beholder sine tilgangsregler. Bilder lagrer også sideversjonen de ble funnet på. Duplikater identifiseres etter kilde, versjon, bilde/melding og eventuelt utdrag.

Migrering v6→v7 beholder alle eksisterende referanser og kommentarer og fyller tomme vurderinger. En eksplisitt gammel versjon gjenopprettes som lagret kopi selv om den ikke er cachet. Hvis et gammelt bevis mangler versjon, kan den historiske versjonen ikke rekonstrueres sikkert: migreringen binder den til nåværende versjon når den finnes. Ingen vurderinger utledes fra at spilleren tidligere har åpnet kilden.

Playwright-testen kjøres separat fra de avhengighetsfrie kjernetestene: `node games/dead-internet/tools/test-casebook-ui.mjs`. Den bruker installert `playwright`, eller en pakke angitt med `PLAYWRIGHT_MODULE`; `PLAYWRIGHT_CHANNEL` kan velge en installert nettleser. Den starter en lokal server, tester 390×844 og sammenligner tekst, CSS-klasser og kontrollverdier i tvillingverdenene. Skjermbildet lagres lokalt i `test-results/`.

### Implementert steg 2 (25. november 2026, merget PR #85 · `d6dbb8c`)

**Teorier.** En teori er spillerens egne ord (`title`) og/eller en strukturert påstand `[subject] [predicate] [object]`. Minst én av dem må finnes. Casebook viser egne ord først (`theoryLabel`); en teori med begge viser påstanden under som «As a claim: …». Bare teorier med strukturert påstand kan vurderes av Dana og publiseres (`isStructured`). `review()` hopper over de andre, `publish()` filtrerer dem bort, og rapportbyggeren viser bare påstandene og sier hvor mange teorier som bare står med egne ord. Steg 5 bygger den strukturerte publiseringen videre (manipulerte dokumenter, falske identiteter); modellen hindrer ikke det.

- **For og mot:** `evidence` er fortsatt listen over bevis *for* (samme felt som før, og den eneste listen scoring og Dana leser, så simulator og avslutninger er uendret). `against` er bevis *mot*. Et bevis er enten for eller mot én teori, aldri begge: `linkEvidence(g, h, e, on, stance)` med `stance` `supports`/`contradicts` flytter det. Visningen teller begge sider med synlige kilder (`apparentSource`): `evidenceCount`/`sourceCount` (for) og `againstCount`/`againstSourceCount`.
- **Status med historikk:** `open` («Working theory»), `convinced` («Convinced»), `rejected` («Rejected»). Hver endring logges i `statusLog` med dag. Forkastede teorier foldes sammen i en egen gruppe i Theories-fanen, og alle koblinger beholdes. Fargene er nøytrale; ingen status ser ut som en vurdering fra spillet.
- **Alternativer:** `alternatives` lagres én gang på den ene teorien og vises på begge (`alternativesOf`). Spilleren kan skrive et nytt alternativ eller koble en eksisterende teori.
- **Redigering:** `updateHypothesis` tar bare `title`, `note` og trippelen. `predicate: null` fjerner påstanden hvis teorien har egne ord. Bevis, status og alternativer har egne handlinger.

**Spørsmål.** `s.questions` er spillerens egne spørsmål, med ett hjem i Notes (segmentet «Notes / Questions»). Et spørsmål har tekst, status `open`/`answered`/`dropped` («Set aside») med `statusLog`, et valgfritt eget svar, saker (`setCases("question", …)`) og koblinger `links: { evidence, topics, sources, theories }`. Koblinger godtas bare til det spilleren ser eller har laget: lagrede bevis, undersøkte navn som ikke er hemmelige (`s.known`), synlige kildenøkler fra lagrede bevis (`apparentSource`) og egne teorier. Teorikortet og beviskortet viser spørsmålene som er koblet til dem, ved referanse. Fjernes et bevis eller en teori, forsvinner koblingen fra spørsmålene. Spillet lager aldri spørsmål.

**Velger med søk.** «Other evidence»-listen under en teori er borte. «+ For», «+ Against», «Attach evidence» (Timeline) og «Link evidence» (spørsmål) åpner én velger (`pickEvidence`) med søkefelt alltid synlig: viktige bevis først, så resten som ikke er lagt bort, så det som er lagt bort. Søket treffer tittel, synlig kilde, spillerens kommentar og utdrag. Allerede koblede bevis vises ikke.

**Spillerlaget er usynlig for reglene.** Ingen av handlingene (`setTheoryStatus`, `linkAlternative`, `addQuestion`, `updateQuestion`, `linkQuestion`, `deleteQuestion`, `linkEvidence` med `contradicts`) fyrer hendelser eller leses av betingelser. En fuzz-test i `tests/theories.test.mjs` sjekker at 300 tilfeldige handlinger ikke endrer `flags`, `counters`, `trust`, `credibility`, `fired`, `notifications`, `pending`, `messages` eller `endings`.

**Lagring v9.** Migrering 8→9 (`migrateTheories` i `core/workbench.js`): alle eksisterende koblinger blir «for», `against: []`, `status: "open"` med én loggrad fra teoriens dag, `alternatives: []`, `title: ""` og `s.questions = []`. Ingenting utledes. v7-lagringer går 7→8→9. `deserialize` beholder en teori med egne ord selv om relasjonen er borte fra innholdet (påstanden fjernes, med advarsel), og renser `against`, `alternatives` og spørsmålskoblinger.

**Lekkasjevern.** Tvillingverden-testen spiller også teorier med egne ord, bevis mot, status, alternativer og spørsmål koblet til bevis, personer, kilder og teorier, og sammenligner `casebookView` (nå med `questions`) og `visibleSources()`. Forbudstesten dekker nå også `core/workbench.js`, og hver visningsfunksjon i `core/casebook.js` (`casebookView`, `theoryLabel`, `visibleSources`, `alternativesOf` med flere) sjekkes for kanonhjelpere og `.source`. DOM-testen i Playwright sammenligner Theories-fanen, alle teorikort, byggeren, Questions-listen, alle spørsmålskort, rapportbyggeren og innholdet i søkevelgerne i tre tvillingverdener.

### Implementert steg 3 (25. november 2026, merget PR #86 · `5d64cbc`)

**Sammenligning.** `compareView(g, refs)` i `core/compare.js` stiller opp to eller flere ting side om side. En ref er et lagret bevis (`{evidence}`), en side eller et bilde spilleren har sett (`{artifact, version?, image?}`), eller en melding (`{message}`). Hvert element får bare synlige felt: type, tittel, synlig kilde (`apparentSource`), plattform, adresse, dato, kopi («Your saved copy», «Archive copy», «Live page», «Saved message»; samme ord som i Archive fra W8), forfatter, tekst, vedlegg, bilde og bildeinfo (samme rader som i bildevisningen, også «Metadata: None»). `differs` sier hvilke av disse som er ulike; spillet tolker aldri forskjellen. To kopier av samme side gir `changes`: tittelendring og avsnitt som er like, fjernet eller lagt til (LCS per avsnitt, `textChanges`). Tilgang følger `viewArtifact`: bare gjeldende versjon og versjoner i `cachedVersions`, og siden må være sett (`s.seen`). Et lagret bevis viser alltid den lagrede kopien (`savedArtifactView`). Meldinger fra spilleren selv kan ikke sammenlignes. Spørringen endrer ingen tilstand.

- **Skjermen** («Compare»): rutenett med bokstav og tittel per element og radene What, Source, Platform, Address, Date, Copy, Author og Saved, pluss bildeinfo. Rader som er forskjellige får «•». Med tre eller flere elementer kan tabellen rulles sideveis. Under: bildene, «Changes from A to B», teksten til hvert element, «Your connections» mellom dem, og handlingene «How are they connected?», «New theory from this» og «New event from this». Er noe ulagret, står det i stedet «Save to Casebook to connect them», som lagrer nøyaktig kopiene som vises.
- **To bilder:** ett om gangen, med «Show A / Show B», zoom (100–500 %) og dra for å flytte. Zoom og posisjon er felles, så spilleren kan bytte og se samme utsnitt.
- **Innganger:** valgmodus i Evidence-fanen (langt trykk på et bevis eller «Select»; fast linje øverst med «Compare», «Link», «Set aside» og «Done»), «Compare with…» på beviskortet og i bevismenyen (søkevelgeren), «Compare all» på teorikortet, og `phone.compare(refs)` for andre apper (W8).

**Koblinger** (Anders, 25.11.2026). `s.links` er spillerens egne koblinger, alltid mellom nøyaktig to lagrede bevis: `{id, a, b, kind, note, day, edited?}`. Seks typer (`LINK_KINDS`), to av dem med retning (`DIRECTED_LINKS`):

| Type | Tekst i spillet | Retning |
|---|---|---|
| `supports` («Supports») | «A supports B» | Ja: A støtter B |
| `contradicts` («Contradicts») | «A and B contradict each other» | Nei |
| `related` («Related») | «A and B are connected» | Nei |
| `same_origin` («Same origin») | «A and B have the same origin» | Nei |
| `manipulated` («Possibly manipulated») | «A may be manipulated, compared with B» | Ja: A er mistenkt, B er grunnlaget |
| `unrelated` («Unrelated») | «A and B are not connected» | Nei |

- **Én per par, type og retning** (`sameLink`): for typer uten retning er A–B og B–A samme kobling; for de rettede er «A supports B» og «B supports A» to koblinger. Å lagre en kobling som finnes, gir «You already connected these that way» og oppdaterer bare begrunnelsen. `updateLink` endrer type, begrunnelse og retning (`swap`), aldri paret, og nekter (`duplicate_link`) hvis resultatet finnes fra før. `addLink` godtar bare `{a, b}`: ingen gruppekoblinger, ikke et bevis med seg selv.
- **Opprettelse:** fra sammenligningen av to («How are they connected?»), fra valgmodus med to valgt («Link»), og når flere er sammenlignet eller valgt, velger spilleren først det ene og så det andre («Connect two of these»). Redigereren viser setningen («A supports B.»), og for de rettede typene A og B under hverandre med pil og «⇅ Swap A and B». Begrunnelsen («Because») er valgfri, og under står «Your own reading. Nothing checks it.».
- **Visning fra hver side:** beviskortet viser koblingen som en setning der kortets eget bevis er «this»: på A-kortet «This supports Lindsay», på B-kortet «Mike supports this». Koblinger uten retning leses fra kortets side («This and Pat have the same origin» på begge). Sammenligningen bruker bokstavene (A · …), og teorikortet viser begge titler i lagret rekkefølge.
- Fjernes et bevis, forsvinner koblingene det inngår i.

**Spillerlaget er usynlig for reglene.** `addLink`, `updateLink`, `removeLink` og `compare` fyrer ingen hendelser og leses ikke av betingelser, scoring, Dana eller avslutningene. «Same origin» endrer ikke den synlige kildetellingen på teorikortet; spillerens egen telling kom i steg 4 (se under). En fuzz-test i `tests/compare.test.mjs` sjekker at 300 tilfeldige koblinger og sammenligninger ikke endrer verden, og at koblinger spilles likt av fra handlingsloggen.

**Lagring v10.** Migrering 9→10 (`migrateLinks`): `s.links = []`. v8 og v7 går gjennom kjeden. Formen `{a, b}` erstattet `{items}` før v10 ble merget, så ingen lagret v10-form trenger egen migrering. `deserialize` beholder bare koblinger med kjent type og to ulike, eksisterende bevis, og fjerner doble (samme par, type og retning) og alt med `items` (med advarsel).

**Lekkasjevern.** Tvillingverden-testen legger til koblinger av alle typer, begge retninger for de rettede (også mellom de tre «vennene» med én skjult kilde), og sammenligner over 300 sammenligninger: beviser parvis, bilder, meldinger, tre bevis og alle bufrede versjoner mot gjeldende side. Forbudstesten dekker `core/compare.js`. DOM-testen sammenligner sammenligningsskjermer (også bildebytte og sidepar), koblingsredigereren, beviskort med koblinger og valgmodus i tre tvillingverdener. En bevisst lekkasje ble fanget av alle tre og fjernet.

**For W8** (levert, se «Browser eier nettleseren» under). Browser Archive kaller `phone.compare([{ artifact, version: a }, { artifact, version: b }])` (eller uten `version` for gjeldende side). Casebook sjekker selv at versjonene er tilgjengelige og sett, viser endringene og lar spilleren lagre begge kopiene før de kobles. Se docs/WEBSITES.md §9.1.

### Implementert steg 4 (25. november 2026, merget som PR #88 · `20d2f49`)

**Kildekort per synlig kilde.** `core/sources.js` (ny) gir ett kort per synlig kilde, med de samme nøklene som `apparentSource` gir og som spørsmål fra steg 2 kobles til (`account:…`, `contact:…`, `site:…`, `page:…`, `handle:…`). Kortet har to spørsmål, «Do I trust this source?» og «Is it who it claims to be?», med svarene Yes, Unsure og No. Et nytt trykk på samme svar tar det tilbake. I tillegg har kortet «Same origin as …» (andre synlige kilder, valgt med søk), en egen kommentar, kildens bevis og spørsmålene som er koblet til kilden, med et felt for å stille et nytt. Alle svar står tomme til spilleren svarer, i én nøytral farge, og kortet sier «Your own assessment. The Casebook never says whether you're right.» Lagres i `s.sourceViews[nøkkel] = { trust, authentic, sameAs, note, day, edited? }` gjennom handlingene `assessSource` og `linkSources` (begge går gjennom `dispatch`, logges og spilles av likt).

- **Innganger:** «Sources» øverst i Evidence-fanen (liste over alle synlige kilder med antall bevis og spillerens egne svar, eller «Not assessed»), raden «Source: …» på beviskortet, og kildebrikkene på teorikortet. Ingen ny fane.
- **«Same origin as» går begge veier.** Sier spilleren at Mike har samme opphav som Pat, står Mike også på Pats kort. Svaret kan fjernes fra begge kort.
- **Kortene er spillerens.** Fjernes det siste beviset fra en kilde, vises ikke kortet lenger, men svarene og kommentaren beholdes og kommer tilbake når spilleren lagrer noe fra kilden igjen. Kilder som ikke er synlige nå, står ikke i «Same origin as» og binder ikke sammen en kjede. «Set aside» er ikke fjerning: kortet blir stående, teller i gruppene og viser «(1 set aside)».
- **Stabil kilde-ID.** Svarene lagres under kildenøkkelen (`account:<id>`, `contact:<id>`, `site:<domene>`, `page:<adresse>`, `handle:<domene>/<handle>`), aldri under visningsnavnet. Bytter en konto visningsnavn, står kortet og svarene; to kilder med samme navn er to kort og to kilder i tellingen.
- **«Unsure» er et svar.** Lagres som `"unsure"`, ikke `null`, og vises som trykket knapp og «Your answer: Unsure». Ubesvart vises som «Not answered».

**Spillerens egen telling av uavhengige kilder.** `ownCount(g, ids)` teller de synlige kildene for en liste bevis og slår sammen dem spilleren selv mener har samme opphav: svarene «Same origin as» på kildekortene og koblingene «Same origin» mellom to bevis fra steg 3, som her betyr at de to bevisenes synlige kilder har samme opphav. Gruppene er transitive (Mike ~ Pat og Pat ~ Lindsay gir én gruppe). Teorikortet viser fortsatt den synlige tellingen og legger til «n in your count» bare når den er en annen, med linjen «3 sources · 1 in your count. Your count follows your “same origin” answers and connections.» Teorilisten viser «3 sources · 1 in your count» (formuleringen Anders ba om å beholde: den skiller synlig opphav fra spillerens slutning). Spillerens egne forbehold telles også, men endrer ikke tellingen: «You don't trust n of these sources.» og «You doubt n is who it claims to be.» Kildekortet viser under «Connections that join it (n)» nøyaktig hvilke «Same origin»-koblinger som slår det sammen med en annen kilde («With Lindsay · 1 connection», og selve koblingen med begrunnelse); koblingen åpnes i koblingsredigereren derfra og kan endres eller fjernes. Koblingene skriver aldri til kortets egne «Same origin as»-svar. Gruppen vises som brikker; en kilde som bare er med gjennom en tredje, står som «Lindsay · via Pat» (korteste vei). Alt beregnes på nytt fra svarene og koblingene hver gang, så en fjernet kobling, et fjernet svar eller et fjernet bevis i midten av kjeden endrer tellingen med en gang. Andre koblingstyper og troverdighetssvar endrer ikke tellingen.

**Spillerlaget er usynlig for reglene.** `assessSource` og `linkSources` fyrer ingen hendelser og leses ikke av betingelser, scoring, Dana, rapportbyggeren eller avslutningene. Danas vurdering bruker fortsatt `apparentSupportOf` uendret; hvordan hun skal lese spillerens forbehold, hører til steg 5 (planendring godkjent av Anders 25.11.2026, se under). Testene sjekker at kildekort ikke endrer verden, Danas tekst eller `supportOf`/`apparentSupportOf`, og at en publisering gir samme resultat med og uten kildekort.

**Lagring v11.** Migrering 10→11 (`migrateSources`): `s.sourceViews = {}`. v9, v8 og v7 går gjennom kjeden. Ved lasting renser `cleanSources` kortene: ukjente svar blir «ikke besvart», `sameAs` til seg selv eller med feil type fjernes, og «same as» repareres slik at det går begge veier. En «Same origin»-kobling fra en v10-lagring teller i spillerens egen telling med en gang.

**Lekkasjevern.** `core/sources.js` står i forbudstesten og har i tillegg en strengere sjekk: den leser ingen `.source`, `.supports`, `.mentions` eller `.truth` og slår ikke opp i `w.artifacts`, `w.accounts` eller andre verdensdata; alt går gjennom `apparentSource`. Tvillingverden-testen fyller ut kildekort for alle synlige kilder (alle svar, kommentarer, «same as»-kjeder) og sammenligner kildelisten, alle kortene og teorienes egne tellinger i tre verdener. DOM-testen gjør det samme for Sources-listen, alle kildekortene, velgeren «Same origin as…», teoriene og beviskortene. En bevisst lekkasje (bevisets skjulte `source` i kildekortet, og som CSS-klasse i Sources-listen) ble fanget av tvillingtesten, forbudstesten og DOM-testen, og er fjernet. Etter gjennomgangen dekker testene også indirekte grupper, kilder der alle bevis er lagt bort, og koblingsredigereren åpnet fra kildekortet; en ny bevisst lekkasje («direct» lest fra skjult opphav) ble fanget av tvillingtesten og forbudstesten.

**Anders' beslutninger 25.11.2026.** Punkt 1–6 godkjent med justeringene over («Unsure» som aktivt svar; koblingene som slår sammen vises og kan åpnes fra kortet, og overskriver aldri kortets svar; «via» for indirekte grupper og ny beregning ved fjerning; manglende tillit trekker ikke fra, fordi troverdighet og uavhengighet er forskjellige spørsmål; «Set aside» er ikke fjerning; stabil kilde-ID). Punkt 7 er en planendring: Dana og rapportene samles i steg 5, med disse grensene: Danas vurdering før publisering holdes atskilt fra verdens poengberegning etterpå; at Dana leser spillerens forbehold, gir ikke i seg selv grunnlag for å endre poengreglene; nye tall i Timeline merkes som spillerens egen opptelling.

### Implementert steg 5 (25. november 2026, greina `casebook-step-5`, PR #89, justert etter Anders' gjennomgang samme dag; punkt 9 venter)

Rapportering med spillerens egne vurderinger, innenfor grensene Anders satte 25.11.2026: Danas vurdering *før* publisering holdes atskilt fra verdens poengberegning *etterpå*; at hun leser spillerens forbehold, endrer ikke poengreglene; nye tall i Timeline er merket som spillerens egen opptelling. Alt spilleren vurderer forblir spillerens; spillet bekrefter det aldri.

**Tre lag, holdt fra hverandre.**

| Lag | Funksjon | Leser | Endrer |
|---|---|---|---|
| Danas kommentar til kildene | `review()` (uendret) | synlige kilder blant bevis som støtter påstanden, der «støtter» for kanonpåstander er de **skjulte** `supports`-merkene (`apparentSupportOf` → `matchClaim`, `evidenceFacts`); se «Punkt 9» under | ingenting |
| Danas notater om spillerens egne merker | `editorNotes()` (ny, `core/reporting.js`) | bare spillerlaget: bevis mot, egen telling, kildekortenes «No», teoristatus | ingenting (ren spørring, ikke i loggen) |
| Verdens reaksjon | `publish()` (uendret) | kanon: `supportOf`, `truthOf`, scoring; kuttet etter `apparentSupportOf` | troverdighet, flagg, hendelser, avslutninger |

`publish()` leser verken notatene eller kildekortene. Testene sjekker at publisering gir nøyaktig samme verden med og uten spillerens forbehold, at `review()` gir samme tekst, og at det å spørre Dana ikke endrer noe.

**Danas notater.** I en egen boks under hennes vurdering (Anders 25.11.2026, beslutning 1: hennes vurdering og det hun gjengir om spillerens forbehold skal skilles synlig). Første boks: «Dana Reyes: how your sources look to me» (`review()`). Andre boks: «Dana Reyes: what you've marked yourself» (`editorNotes`). Én linje per merke, i hennes stemme, og bare når spilleren selv har merket det:
- `rejected`: «you've rejected this theory yourself. Why put it out under your name?»
- `against`: «you've linked 1 piece of evidence against it yourself. I won't pick a side for you, but readers will want to see that you weighed it.» (beslutning 3: hun anerkjenner motbevisene uten å si hvilken side som har rett)
- `ownCount` (egen telling lavere enn synlig): «By your own count that's 1 source, not 3.»
- `notTrusted` («No» på tillit): «you told me you don't trust 1 of the sources behind it. If you don't, why should readers?»
- `notAuthentic` («No» på «who it claims to be»): «you doubt 1 source is who it claims to be. Don't lean on it until you know.»

«Unsure» kommenteres ikke (beslutning 2). Tekstene ligger i `strings.review.dana.own`; en reviewer uten slike tekster sier ingenting om spillerens merker. Under boksene (Anders' tekst): «These are my concerns, not a guarantee that your conclusions are right.» Ved lav tillit forklarer avslaget hvorfor gjennomgangen uteblir: «I don't go through sources for people I don't know yet, so I won't review this. Show me you know something about this story first.» Bare teksten er endret; `minTrust` er det samme.

**Rapportbyggeren.** Hver påstand viser «3 marked as supporting by you · 1 marked against · 3 sources · 1 in your count» (beslutning 9) og spillerens forbehold i kursiv («You don't trust 1 · You doubt 1 is who it claims to be», «You rejected this theory»). Teorier med bare egne ord står i en egen liste med forklaringen «These can't go in a report yet. A report publishes claims, and these theories don't have one: add who, the relation and what to a theory to publish it.» og «needs a claim to publish» på hver rad; et trykk åpner teorien (beslutning 6; bredere påstandstyper gjenstår). Hendelser viser «3 supporting · 3 sources · 1 in your count · 1 contradicting».

**Øyeblikksbilde.** `publish` i `core/game.js` tar `reportBasis` rett før publisering og lagrer det som `report.snapshot = { day, theories: [...], events: [...], cut }` når rapporten går ut. Etter beslutning 5 fryser det også ordlyden: påstanden (`claimLabel`), spillerens ord (`words`) og notat (`note`), hvert koblet bevis med retning, hva det var (tittel, sitat, samtale eller bilde) og spillerens notat (`reasons`), spillerens koblinger mellom disse bevisene med begrunnelse (`connections`), og hendelsenes beskrivelse. Kuttede påstander leses fra øyeblikksbildet også i `casebookView`. Historiske rapporter endres derfor ikke når spilleren senere redigerer, kobler om eller sletter i Casebook. Visningen skiller «Published», «Timeline events published» og «Cut by Dana Reyes, not published». Rapporter fra før øyeblikksbildet viser kuttede påstander slik teorien lyder nå. `publish()` i `core/casebook.js` og alt verden lagrer om rapporten er uendret.

**Timeline.** `timelineView` gir `supportSources`/`ownSupportSources` og `contradictSources`/`ownContradictSources` (samme telling som teoriene, `ownCount` fra steg 4). Listen og hendelsen viser spillerens telling bare når den er en annen, alltid merket «in your count».

**Tips.** «Comparing» vises første gang Compare åpnes, med Anders' tekst (beslutning 10): «Compare text, details or images. Differences are shown without judging what they mean. Any connections you add record your own interpretation.»

**Lagring v12.** Migrering 11→12 (`migrateReports`): eksisterende rapporter får `snapshot: null`; ingenting gjettes. v10, v9, v8 og v7 går gjennom kjeden. Et ødelagt øyeblikksbilde blir `null` ved lasting (`cleanReports`).

**Lekkasjevern.** `core/reporting.js` står i forbudstesten og har en strengere sjekk (ingen `.source`, `.supports`, `.mentions`, `.truth`, `operatedBy`, `isHuman`, ingen `w.artifacts`/`w.accounts`/`w.claims`/…, ingen `supportOf`/`truthOf`/`matchClaim`/`evidenceFacts`). Tvillingverden-testen sammenligner (med første ulike sti, siden en full diff av de store øyeblikksbildene gikk tom for minne) Danas notater for alle teorier, `reportBasis` for alle teorier og hendelser, Timeline-tallene og øyeblikksbildet som lagres ved publisering (Daily Record og Connect) i tre verdener. DOM-testen sammenligner rapportbyggeren med alle påstander og hendelser, Danas boks med notater, Timeline, hendelsene og øyeblikksbildet etter publisering. To bevisste lekkasjer (skjult opphav i `editorNotes`, og som CSS-klasse i rapportbyggeren) ble fanget av tvillingtesten og forbudstesten, og av DOM-testen, og er fjernet. Etter justeringene ble det gjort to til: skjult opphav i de frosne begrunnelsene (`reasons`) ble fanget av forbudstesten og begge tvillingtestene (første ulike sti `$.reportBasis.theories.0.reasons.0.leak`), og som CSS-klasse på en begrunnelse i øyeblikksbildet av DOM-tvillingen; fjernet.

**Punkt 9: Dana og skjult kanon (undersøkt 25.11.2026).** Dana leser ikke `truth`, men `review()` og Daily Record-kuttet avgjør om et bevis støtter en *kanonpåstand* med de skjulte `supports`-merkene (`core/casebook.js`: `matchClaim` linje 318, `apparentSupportOf` linje 390/397, `review` linje 411 og 423–424, kuttet linje 466, avslaget linje 478). For påstander som ikke er i kanon teller hun bevis som synlig nevner subjekt og objekt. Hun kan derfor brukes som fasit for relevans, og forskjellen mellom de to reglene røper om en påstand er forhåndsdefinert. Probetesten (`tools/lib/dana-probe.mjs`, `tests/dana-probe.test.mjs`) spør henne 7059 ganger i tvillingverdener: med sannheten snudd er alt likt; med `supports` tømt er 22 enkeltsvar og 11 av 13 svar med alle bevis ulike, med kuttet. Steg 5s notater og øyeblikksbildet er like. Den ordinære tvillingtesten endret ikke `supports` og kunne ikke fange dette. Ingen løsning er implementert. Alternativene i DEVPLAN («Steg 5», «Punkt 9»): A) bare Danas tekst på synlige felt (lukker ikke kuttet, anbefales ikke alene), B) tekst og kutt på synlige felt (endrer publiseringsutfall, anbefalt), C) hun teller bare det spilleren har koblet (endrer publiseringsutfall).

**Ikke gjort:** strukturert publisering for manipulerte dokumenter er en eksplisitt restoppgave til designavklaringen om publisering og saksavslutning, ikke automatisk del av F-1/F-2 (beslutning 8). Bredere påstandstyper gjenstår (beslutning 6). Kuttet følger synlige kilder, ikke spillerens telling (beslutning 4, godkjent). Bevis mot er råd (beslutning 3, godkjent). Nøytral saksstatus og kanalbeskrivelse er ikke godkjent ennå.

## Saksavslutning og konsekvenser (gjennomgang 24. nov 2026, ikke diskutert ennå)

Full gjennomgang: [docs/CASE-ENDINGS-REVIEW.md](docs/CASE-ENDINGS-REVIEW.md). Prinsippene er godkjent (se «Prinsipper»). Forslagene til endringer er **ikke** diskutert eller godkjent, og ingen nye avslutningsmekanismer implementeres før det er gjort.

**Slik virker det i dag.** Saken avsluttes gjennom handlinger i verden (publisering og tid), ikke en knapp. `checkEndings()` (`core/game.js`) kjøres etter hver publisering og hver Sleep og går gjennom `endings` i alle startede saker. Betingelsene er deklarative: `exposed` (sann påstand publisert med reell støtte, valgfritt kanal og frist), `published` (publisert, sann eller ikke) og flagg fra regler (`vote_held`, `silent_vote` …). Fristen i The Quiet Account er `beforeCaseDay: 8` (avstemningen). En avslutning med `closes: true` gjør saken *Resolved*, og verden går videre. Flere avslutninger kan inntreffe. The Quiet Account har ni: `lights_out`, `too_late`, `ghost_story`, `who_paid_whom` (lukker) og `wrong_murder`, `collateral_theo`, `collateral_owen`, `collateral_iris`, `silence` (lukker ikke). Utfall leser bare hva som er publisert og eksponert, aldri spillerens egne vurderinger.

**Kjente feil (ikke rettet):**
- **F-1:** hele historien (S2 + S3, sterk) på Connect eller Threadline før avstemningen gir utsatt avstemning (A67), men også `too_late` med teksten «the towers are approved». Årsak: `D11_vote_held` setter `vote_held` også når avstemningen utsettes. Foreslått retting: `too_late` og `ghost_story` krever `vote_passed`.
- **F-2:** bare S2 gjennom Daily Record før avstemningen gir ingen avslutning noen gang («The Partial Truth» mangler). Foreslått retting: utvid `ghost_story` (S8 eller S2, uten krav om S1, kanalnøytral epilog) eller en egen avslutning.

**Svakheter:** `lights_out` viser klimakset i publiseringsøyeblikket, ikke neste morgen. Daily Record skriver ingen egen artikkel om spillerens sak. `silence` etterfulgt av senere publisering gir to epiloger. Brightlines uttalelse (A42) kommer etter hvilken som helst rapport.

**Forslag til diskusjon** (se §8 i gjennomgangen): nøytral saksstatus Active / Published / Closed (Reopened forberedt) og kanalbeskrivelse i rapportbyggeren i Casebook steg 5. En egen liten PR etterpå med F-1, F-2, «neste morgen»-avslutning, Buried Story, Cover-Up, overskrift fra verden i varselet og eventuelt Unfiltered som kanal. Tre åpne spørsmål til Anders står sist i gjennomgangen.

**For fremtidige mysterier** (forslag): påstander er byggeklossene; tre lag avslutninger (milepæler, sidekonsekvenser, ettervirkninger); dimensjonene Accuracy, Evidence, Coverage, Impact, Collateral og Timing er en sjekkliste for forfatteren, aldri tall for spilleren; en utfallsmatrise-test publiserer kombinasjoner av påstander × kanal × før/etter frist.

## Autentiske nettsteder (godkjent designretning 24. nov 2026, W0–W7 merget)

Full beskrivelse og beslutninger: [docs/WEBSITES.md](docs/WEBSITES.md), §0 gjelder foran resten av dokumentet. Implementeres i veikartets punkt 5 (W0–W8), ikke før.

- **Arkitektur:** artefakten er fortsatt grunnenheten (søk, cache, versjoner, oppdagelse og bevis uendret). Nytt i W1: nettstedskonfigurasjon (`content/universe/sites/<site>.json`) med daterte `designs`, `nav`, `status` (parkert, vedlikehold, borte) og `notFound`, indeksert av `core/sites.js`. Sideversjoner kan ha `blocks`; sider med bare `body` blir én tekstblokk. Inventar og uløste referanser: [docs/WEBSITE-INVENTORY.md](docs/WEBSITE-INVENTORY.md). Nye sider får id `W-<site>-<nnnn>`.
- **Maler:** elleve gjenbrukbare maler (Corporate, Government, Blog, Wiki, Forum, News, Anonymous, Legacy, Personal, Landing, Document) med varianter og temaer. Ingen nye rammeverk, mobil først, bare systemfonter. **W2 implementerer Corporate, Government og Blog** i `app/sites/`; `renderArtifact` velger malen når nettstedets gjeldende design har en av disse. Et grafikksteg 25. nov gir alle konfigurerte nettsteder SVG-logo og favicon i adressefeltet, heltebilder på malte sider, og en tynn chrome for landing, legacy, personal, wiki og document. Inventar: [docs/WEBSITE-INVENTORY.md](docs/WEBSITE-INVENTORY.md). Katalog: [graphics/GRAPHICS.md](graphics/GRAPHICS.md).
- **Design versjoneres etter dato.** En cachet side vises med designet som gjaldt da.
- **Lister bygger seg selv** fra synlige sider med samme `site`/`page`. Cachede versjoner viser bare sider fra før cache-datoen. `listed: false` holder en side utenfor.
- **Malene får bare et hvitelistet offentlig visningsobjekt.** `publicView()` i `core/site-view.js` (W0, 25. nov) brukes av `renderArtifact`. Aldri `supports`, `mentions`, `source`, `filler`, `hidden`, `covers` eller `pool`.
- **Browser eier nettleseren** (tilbake/frem, bokmerker adskilt fra bevis, tekststørrelse, cache og Archive). Nettstedene eier sin presentasjon (404, innlogging i eget design). **W3** (25. nov, `core/browser.js`, `core/search.js`, `app/apps/browser.js`, `app/sites/status.js`, lagring versjon 8): frem-knapp (økt-stakk, ikke lagret), stjernebokmerker atskilt fra Casebook (bok-ikon), A−/A+, 404 og vedlikehold i nettstedets chrome, parkert «This domain may be for sale», «This site can't be reached» for `gone`. `portcalderjazz.com` er parkert fra 2022; W6 legger til en cachet 2019-side. Seeker setter offisielt nettsted først når spørringen tydelig navngir et nettsted i W1-modellen (f.eks. «kestrel», «northgate», «brightline», «port calder», «eastfield notes»); `gone`/`parked` vises som treff og følger status. Rangeringen vet fortsatt ikke hva som betyr noe for en sak.

**Archive i Browser (W8, 25. nov 2026, merget PR #87 · `50f65fb`, med Anders' sju avgjørelser 25.11.2026).** `archiveView(g, id)` i `core/archive.js` (`g.archive(id)`) samler alle kopier av én adresse som spilleren kan åpne, eldst først: Seekers kopier («Archive copy», `cachedVersions` fra `viewArtifact`), den levende siden («Live page») og spillerens egne lagrede helsidekopier («Your saved copy», `savedArtifactView`). Spillerens egne kopier er alltid egne rader, også når Seeker har samme versjon; utdrag, enkeltbilder og meldinger hører hjemme i Casebook og står ikke i Archive. Hver rad har en `ref` som `phone.compare()` tar. **Tilgang:** arkivet krever at siden er sett, unntatt en side som er borte eller slettet og hvis «Not available»-side allerede tilbyr Seekers kopi. Arkivet viser aldri sider eller versjoner spilleren ikke har tilgang til, men en lagret kopi kan alltid åpnes, også etter at originalen er låst eller slettet: låsing stopper nytt innhold, ikke spillerens dokumentasjon. En låst side viser bare spillerens egne kopier (ikke antall arkivkopier, ikke tittelen bak innloggingen); uten lagret kopi viser den ingenting. **Sammenligning med den levende siden:** `current` er indeksen til den levende siden eller −1, og `noCurrent` sier hvorfor («locked», «deleted», «gone», «unavailable»). `withCurrent` er sann bare for en eldre kopi med en annen versjon når den levende siden kan leses; ingen annen kopi stilles stille inn som «current». `sameAsCurrent` merker en kopi av samme versjon. Spørringen endrer ingen tilstand, og `archivePair` gir alltid eldst først, så «Changes from A to B» leses forover.

- **Skjermen** (`archive {id, pick?}` i Browser, «archive»-merke i adressefeltet): adresse og tittel, en merknad om at bare tekst og detaljer sammenlignes (bilder sammenlignes for seg i Casebook), en fast linje med «Compare text and details» når to er krysset av, og én rad per kopi med dato, ikon og kopitype («Archive copy» · Kept by Seeker, «Live page» · Open now, «Your saved copy» · In your Casebook · saved day N). Spillerens egne rader har blå tone og stripe i venstre kant. «Compare with live» står bare på eldre kopier når den levende siden kan leses; en lagret kopi av samme versjon sier «Same as live»; uten levende side står «There is no live page to compare with.» under statuslinjen. Sammenligningen åpnes med tittelen «Compare text and details» og en merknad om bilder, og Copy-raden bruker de samme ordene. Spillet sier aldri hva som er endret eller hvorfor; det gjør bare sammenligningen i Casebook, som stiller kopiene opp.
- **Innganger:** en tynn «Archive · n copies of this page»-stripe øverst på sider med minst to kopier; «Compare with live page» og «All copies» i banneret på en arkivkopi (gult banner) eller egen lagret kopi (blått banner, «Your saved copy»), der «Compare with live page» er deaktivert med en kort, nøytral grunn når den levende siden er låst, slettet eller borte; «All copies in Archive» eller «Your saved copy in Archive» på «Not available»-sider (Browser, Connect, Messages, avisene) og på innloggingssiden når spilleren har en lagret kopi (`phone.archiveOpener(id)`); og «Other versions» / «View available versions» åpner Archive for sider spilleren har sett (det gamle valgarket brukes fortsatt for dokumenter som ikke er åpnet).
- **Lekkasjevern:** `core/archive.js` står i forbudstesten. Tvillingverden-testen sammenligner Archive for alle sette sider og alle sammenligningene den gir; DOM-testen i `tools/test-browser-archive-ui.mjs` sammenligner alle Archive-skjermer, avkryssede par arkivkopier, levende sider og lagrede kopier med stripe og banner (også lagret-så-låst og lagret-så-slettet) i tre tvillingverdener. En bevisst lekkasje (skjult `sourceOf` i en rad) ble fanget av alle tre og fjernet.
- **Samme mal er ikke samme opphav.** Uavhengige nettsteder kan dele et kommersielt tema. Malvalg skal aldri være en sikker indikator.
- **Bakgrunnsinternett:** mål 140–170 sider i etapper. **W4** (merget 25. nov, PR #78 · `24a20c3`) er første runde: 122 nye sider på Northgate, Brightline, City of Port Calder, Eastfield Notes og Kestrel; sidene beholdes. Godkjent ny kanon: ordfører Denise Harlan og 11 rådsmedlemmer (Ana Ruiz + 10 nye navn); rådhuset 40 Civic Center, skranke 8:30–16:30. Nye fakta står i `content/universe/background-facts.json` med `status: canon | claim` og sjekkes mot kanon av validatoren. Eksisterende sider er urørt; skjulte sider forblir skjulte; Brightlines nye sider ligger i mysteriepakken. Bakgrunnssider skal ha like god grafikk som sider med spor (W4 gjenbruker eksisterende katalogbilder på hjemmesidene). **W5** (merget 25. nov, PR #79 · `9b6ce40`) flytter Calderpedia, Threadline, Docshare, SpillCheck og Faceless Stock over på Wiki-, Forum-, Document- og Anonymous-malene (saas-Landing for Faceless), med 76 nye sider; eksisterende ordlyd er uendret. Godkjent ny kanon: fyret automatisert i 1998, siste fyrmester Samuel Okoro; Harbor Festival-frivillige siden minst 1979; bruddene HarborFit (mars 2021), Slice of Calder (november 2022) og CalderLearn (august 2024). 6:10-fergekapteinen «Dennis» er bare en forum-påstand. **W6** (merget 25. nov, PR #80 · `4e5bff8`) legger til malene Legacy og Personal og Landing `smallbiz`, 50 nye sider (bibliotek, transit, kraft, kredittunion, Walt's side, Harbor PA, utfylling av tynne sider, cachet jazz 2019 og Kestrel 2014), og omdøper registerdomenet til `openfilings.org`. Godkjent W6-kanon: bibliotekets hverdagsåpningstider og øvrige ansatte, Harbor Dental-teamet, HarborDesk-priser og Dock Road, Open Filings. **W7** (merget 25. nov, PR #81 · `9190200`) er spor i design som innhold: stockansikt på uavhengige sider, 18 Harbor Street, cachet Team 2024, felles formuleringer, Lumen som blindvei, og gjennomspillingen `design_as_clue` (fortsatt `lights_out`). Godkjent W7-kanon: HarborDesks leietakere, Haven Mutuals kontor, community leads 2024.
- **Avklaringer:** SpillCheck beholder rollen. Eastfield Notes er fra 2019, med gammelt tema fra ca. 2012, og Brightline byttet design samtidig med innholdet i oktober 2025. `corp-registries.example` er i W6 byttet til `openfilings.org`, med alias og egen test for søk, gamle adresser og referanser. En cachet personalside fra 2024 på biblioteket lister Mara og Priya, uten nye personopplysninger. Calvins stockfoto kan ha flere uavhengige treff. Maras møllebilde brukes ikke på Calderpedia nå. Brightlines kundecaser forblir anonyme.

## Appkart

| App | Status | Hva som finnes i dag |
|---|---|---|
| Browser | ferdig | Seeker (offisielt nettsted først ved merkenavn/domene), nettsteder, cachede kopier, historikk, frem-knapp, bokmerker, tekststørrelse, 404/parkert/vedlikehold/«can't be reached» (W3) |
| Connect | ferdig | profiler, innlegg, søk |
| Messages | ferdig | emnebaserte samtaler, vis bevis, svarvalg |
| Casebook | ferdig | Evidence, Theories, Notes, Timeline (bygd av spilleren, uten fasit) |
| Settings | ferdig | navn, eksport/import, start på nytt |
| Mail | planlagt | e-poster finnes som dokumenter (videresendte e-poster i vedlegg) |
| Files | planlagt | vedlegg åpnes fra Messages, og lagrede dokumenter ligger i Casebook |
| Archive | i Browser (W8) | Archive-skjermen per adresse (`core/archive.js`): arkivkopier, levende side og egne lagrede kopier, med «Compare text and details» til Casebook. «View cached versions» (per domene) er uendret |
| Contacts | planlagt | `contacts()` gir i dag etablerte kontakter, og skal aldri fylles fra hele personregisteret |
| Forensics | planlagt | skal gjenbruke bildeverktøyene i bildeviseren (metadata, bildesøk, speilvendt søk) |
| The Daily Record | ferdig | egen app fra nyhetsmalen: forside, seksjoner, artikkel, forfatterside, kommentarer, søk, del. Samme artikler som på nettstedet i Browser. |
| Unfiltered | ferdig | samme nyhetsmal, egen logo, farger og seksjoner |
| TokTok | planlagt | video følger bildemodellen (opphav, transformasjoner, metadata) |

## Kjente begrensninger

- Søkerangeringen er enkel (vekting av felt og dekning). Godt nok for 90 artefakter, men bør justeres med ekte spilltesting.
- Tokenisering er laget for engelsk. Lokalisering av innhold vil kreve språkavhengig tokenisering.
- Den automatiske spilleren sender mange meldinger (tusenvis) fordi den prøver alt. Det påvirker ikke spillet, bare kjøretiden til validatoren (ca. 15 s).
- Spillerens egne meldinger er forhåndsformulerte (`strings.messages`). Variasjon kommer senere.
