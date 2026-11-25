# Dead Internet — teknisk design

_Oppdatert 25. november 2026. Beskriver implementasjonen ved PR #89 `50d5643`; PR-en er ikke merget. Status og arbeidsrekkefølge står i DEVPLAN._
Medieappene i detalj: [docs/MEDIA-APPS-PROPOSAL.md](docs/MEDIA-APPS-PROPOSAL.md).
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
    save.js                 lagring, versjonering, migrering, eksport/import (SAVE_VERSION 12 i PR #89)
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
                            Vanlige universfiler i manifest.files. TokTok-appen gjenstår.
    mysteries/quiet-account/  mystery.json (start, lag, påstander, bevisliste, publisering,
                            testoppsett, tekster, avslutninger) + artifacts/, canon.json, rules.json
    strings/en.json         UI-tekster (lokalisering: nb.json senere)
  graphics/
    catalog.json            grafikkoversikt: stabile id-er, filnavn, størrelser, beskrivelser, avhengigheter
    GRAPHICS.md             generert lesbar oversikt
  assets/placeholders/      SVG-plassholdere, én per bilde-id
  assets/images/            ferdige bilder fra grafikkatalogen
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
| `node --test --test-concurrency=1 games/dead-internet/tests/*.test.mjs` | Alle tester, sekvensielt; kjøretid avhenger av miljø |
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

1. **Kanon** (`canon.json` + `accounts.operatedBy` + `entities.isHuman`) er fasit. Verdens vurdering, regler og forfatterverktøy kan lese den; spillerens visninger og redaksjonens vurdering skal ikke gjøre det. Gjenværende dialogproblemer er listet i BACKLOG.
2. **Påstander og vitnemål**: artefakter og personer har `supports` (hvilke påstander de gir bevis for), også usanne påstander. Personer kan bare støtte påstander de `knows`, `believes` eller har `observed`, og bare gi bort artefakter de `has`. Validatoren sjekker dette.
3. **Spillerens tro** (`state.evidence`, `state.hypotheses`, `state.notes`) er det spilleren har samlet og bygd. Casebook viser bare antall bevis og antall kilder slik de *ser ut* (se «Synlig opphav» under).

### Fem lag som aldri blandes

| Lag | Hva | Hvor | Casebook og karakterer kan lese |
|---|---|---|---|
| 0 Kanon | hva som er sant, hvor ting egentlig kommer fra | `canon.json`, `facts`, `claims`, `operatedBy`, `isHuman`, `source`, skjulte `mentions` og `supports` | nei, bare publisering, regler og validator |
| 1 Karakterenes tro | hva Dana, Theo og andre vet og tror | dialogdata (`knows`, `believes`, `observed`) | bare gjennom det karakteren sier |
| 2 Kildenes påstand | hva teksten, bildet eller meldingen sier | synlig tekst, dato og metadata; ikke skjulte `supports`-merker | ja |
| 3 Spillerens oppdagelser | sett, møtt, undersøkt, lagret | `seen`, `encountered`, `known`, `saved` | ja |
| 4 Spillerens slutninger | bevis, teorier, notater, tidslinje (inkludert merker, koblinger og kildevurdering) | Casebook-tilstanden | ja, det er spillerens egne data |

**Synlig opphav (`core/provenance.js`).** Alt spilleren ser om hvor et bevis kommer fra, bygges av `apparentSource`: avsender av en melding (kontaktens konto), kontoen som postet, personen som sendte et vedlegg, håndtaket i adressen, adressen til et dokument eller en forumtråd, ellers nettstedet. Hvem et bevis handler om, bygges av `visibleRefsOf…`: navn som står i teksten, forfatter, byline og kommentatorer. Aliasreglene og skillet mellom avsender og omtale er beskrevet i regel P; innførte kallenavn kan komme fra et annet lagret bevis. Skjult `source` og `mentions` brukes aldri til visning. Tre personakontoer som styres av samme aktør er derfor tre kilder i Casebook, akkurat som for en leser.

**Ingen karakter er en fasitmekanisme.** Målet er at karakterer vurderer ut fra det de kan se og det de vet (lag 1–2). Flere dialogutløsere bruker fortsatt skjulte relevansmerker; dette er et kjent avvik, se BACKLOG. De kan ta feil, bli manipulert og trekke feil slutninger. Danas vurdering og hennes kutt før publisering bruker `apparentSupportOf`, som fra punkt 9 (25.11.2026) bare leser synlige navn, spillerens «Supports»-koblinger og synlige opphav. Denne redaksjonelle vurderingen bruker ikke kanon; verdens reaksjon etter publisering gjør det.

**Visninger bærer ikke kanon.** `viewArtifact` fjerner `source`, `supports` og `mentions` før visningen forlater kjernen. Verktøy som explorer og validator leser kanon direkte gjennom `supportsOf`/`sourceOf`, og det er tillatt der.

**Tvillingverden-testen (`tests/twin.test.mjs`) er permanent.** Verden bygges tre ganger: som den er, med ett felles skjult opphav for alt, og med eget opphav for hver ting. I tvillingene snus også `operatedBy`, `isHuman`, sannheten i `claims` og `facts`, og det legges til skjulte mentions av navn som ikke står i teksten. Samme spiller gjør det samme i alle tre. Alt Casebook viser, og Danas redaksjonelle vurdering, avslag og kutt, skal være identisk. Dette kravet må ikke forveksles med de urettede persondialogene. Bare konsekvensene etter publisering får avvike. Feiler testen, er det visningen som skal rettes, aldri testen. En annen test sjekker at `app/` og `core/provenance.js` ikke bruker kanonhjelperne.

En **hypotese** er `[subjekt] [predikat] [objekt]` med koblede bevis og et fritt notat. Ved publisering:
- **Sannhet**: hypotesen matches mot en kanonisk påstand. Ellers utledes den fra verdensmodellen (for eksempel: en konto som styres av en annen enn den utgir seg for, er ikke en ekte person).
- **Støtte**: antall forskjellige skjulte `source` blant koblede bevis som faktisk støtter påstanden. To eller flere er sterk, én er svak. Dette er verdens dom og vises aldri. Dana bruker ikke denne regelen: hun teller ulike synlige opphav blant bevis som synlig dekker partene, alene eller via spillerens «Supports»-koblinger (`apparentSupportOf`, punkt 9), så hun kan bli lurt.
- **Troverdighet** endres etter tabellen i `meta.publishing.scoring`, vektet per kanal.
- Sanne påstander med støtte registreres i `state.exposed`, alle publiserte i `state.published`. Avslutninger og regler leser disse.

Danas redaksjonelle gjennomgang og kutt bruker samme synlige [regel P](docs/PUNKT9-SYNLIG-VURDERINGSREGEL.md). Spillerens forbehold gjengis som råd i en egen boks. Verdens vurdering av publisert innhold er et separat lag. [Casebook](docs/CASEBOOK-DEDUCTION.md) beskriver kildekort, rapportgrunnlag, hjelp og tips.

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

`state` er ett JSON-objekt. `save.js` legger på format og versjon, støtter eksport/import og migrering, og fjerner referanser til innhold som ikke lenger finnes. Lagringen injiseres (`localStorage` i nettleseren, `Map` i tester). Nøkkel: `ba_deadinternet_<world-id>`. Lagringsversjon 12 i PR #89. Migreringene dekker oppdagelse, Timeline, saker, medier, beviskopier, Browser, teorier, koblinger, kildekort (v11) og rapportøyeblikksbilder (v12). Eldre rapporter får `snapshot: null`, ikke rekonstruert historikk. Tips lagres separat på enheten. Se `core/save.js` og `core/state.js` for faktisk migreringskjede.

## Teststrategi

Følg [teststrategien i DEVPLAN](DEVPLAN.md#teststrategi-og-belastning): målrettet og sekvensielt under utvikling, full pakke én gang før PR, én nettleser og maksimalt én worker. [PR #89-kontrollisten](docs/PR89-REVIEW.md) skiller kontrollerte og rapporterte resultater.

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
- **Messages**: spilleren velger «Ask about…» (alt hun har undersøkt eller lagret, gruppert som personer, kontoer, organisasjoner, hendelser og steder) eller «Show evidence…» (artefakter i Casebook, med versjonen som ble lagret). Svaralternativer (`prompts`) vises som knapper når en person tilbyr dem. «New message» viser personer man kan kontakte (`canContact`). Svarene bestemmes av personens `responses` i `characters.json`, ut fra kunnskap, tillit og flagg. UI-et velger aldri innhold selv.
- **Casebook**: bevis gruppert etter hvem de handler om (`game.evidenceAbout`, bare kjente og ikke-hemmelige id-er), teorier bygd med `[hvem] [relasjon] [hvem/hva]`, der relasjoner filtreres etter `subjectKinds`/`objectKinds`, og notater. En teori viser antall bevis, antall synlige opphav, spillerens egen opptelling og hvem kildene er, aldri om den stemmer.
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
- Oppdagelsesdata ble innført i v2. Den bevarte migreringen av v1-lagringer gjør følgende:
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
- **I rapporter:** spilleren kan velge hendelser i en rapport. De går inn slik spilleren skrev dem, med antall synlige opphav for og mot, med spillerens egen opptelling tydelig merket. Rapportmotoren vurderer dem ikke mot noen fasit, og Timeline viser aldri noen vurdering.

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

**Bakgrunnsinnhold kan bli bevis.** Fyllinnhold i universet og i delte bassenger kan senere bli bevis, men bare når et mysterium eksplisitt peker på det. Validatoren sjekker at referansen finnes og at innholdet var publisert før saken trenger det, så en ny sak ikke stille endrer en gammel. Dette er implementert i U1; sjekk mysteriets `evidence` og validatoren før bakgrunnsinnhold tas i bruk som bevis.

**Narrative lag per mysterium.** Innhold som berører det store narrativet kan ha en skjult `layer` (1–7). Lagene går fra «én konto er en marionett» (1) til «er spilleren et menneske?» (7). Hvilke lag et mysterium kan avsløre, er konfigurert i mysteriet, ikke globalt (`layers: { reveal, hint, background }` i `mystery.json`). Validatoren sjekker at et mysterium ikke er avhengig av, eller får støtte fra, innhold over sin egen grense. The Quiet Account avslører ikke lag 5–7 og har lag 3–4 bare som tvil. Senere mysterier kan utforske de høyere lagene. Uavklart kanon (`isHuman: null`, manglende `operatedBy`) betyr ukjent, ikke falsk.

**Ingen kvoter på sannhet.** Aviser og kanaler har ingen fast andel sanne påstander. Innholdsrapporten kan vise fordelingen, men troverdighet skal komme fra historien og redaksjonelle interesser.

**Medieapper (arbeidsnavn).** The Daily Record og Unfiltered er samme nyhetsmotor med hver sin profil. TokTok er en videoplattform. Unfiltered og TokTok beholdes som arbeidsnavn, med egne logoer og egen visuell identitet.
- TokTok sin personlige feed bygger bare på likes, følger og annen eksplisitt interaksjon i TokTok. Aldri på søkehistorikk fra Seeker eller andre apper.
- The Quiet Account kan ha 3–5 valgfrie TokTok-klipp med relevante spor. Saken skal fortsatt kunne løses uten TokTok, og validatoren skal vise det.
- Arkitekturen skal tåle 150 videoklipp eller flere. Første produksjonsrunde er 20–30 ekte klipp, resten plassholdere, og vi utvider etter at produksjonsflyt, kvalitet og ytelse er testet.

**Rapporter ( `core/casebook.js` og Casebook → Reports).**
- `publish(channel, hypotheses, { case, events })`. En rapport har alltid én sak. Hvis bare én sak finnes, brukes den.
- Kanaler: universets kanaler (`meta.publishing.channels`, for eksempel Connect og Threadline) er åpne for alle saker. En sak kan ha egne kanaler (`mysteries[].publishing.channels`). Daily Record via Dana ligger i The Quiet Account, så Dana er reviewer der uten at det er en motorregel.
- Påstander matches bare mot sakens egne `claims`. Alt annet vurderes ut fra verdensmodellen. Poengtabellen kan overstyres per sak (`publishing.scoring`).
- Rapportbyggeren viser teorier og hendelser gruppert etter spillerens egen klassifisering: i saken, uklassifisert og andre saker. Alt kan velges.
- Etter publisering vises reaksjonene (nye varsler og meldinger) og eventuelle avslutninger. Casebook viser aldri sannhet eller poeng.
- Avslutninger har `title` og `epilogue`. En avslutning med `closes: true` gjør saken lukket. Spillet fortsetter, og spilleren kan fortsette å utforske.

**Hva som fortsatt er felles.** `startDate` er universets kalender. Personene ligger samlet i `universe/characters.json`, og deling i `extends` per sak gjøres når et nytt mysterium trenger det. `.pf-brightline_site` er stil for en plattform i universet, ikke for saken. Kjernen og appene har ingen id-er eller tekster fra The Quiet Account. Introteksten, premisset, innloggingen, testoppsettet og eksempelteorien ligger i `mystery.json`.

## Casebook, rapportering og nettsteder

Gjeldende funksjon er beskrevet samlet i [Casebook](docs/CASEBOOK-DEDUCTION.md), [regel P](docs/PUNKT9-SYNLIG-VURDERINGSREGEL.md), [nettsteder og Archive](docs/WEBSITES.md) og [saksavslutning](docs/CASE-ENDINGS-REVIEW.md). Ikke kopier trinnvise implementeringslogger inn her.

Casebook steg 5 og regel P er implementert i PR #89, men ikke merget. Verdens poengregler og avslutninger er uendret; hva redaksjonen slipper gjennom er endret. Spillerens kildekort er råd og egen opptelling, mens rettede Supports-koblinger kan bidra til dekning i redaksjonen.

## Apper og videre arbeid

Browser, Connect, Messages, Casebook, Settings, The Daily Record og Unfiltered finnes. Archive er integrert i Browser. Mail, Files, Contacts, Forensics og TokTok er senere retninger, ikke ferdige apper. Se [medier](docs/MEDIA-APPS-PROPOSAL.md) og [BACKLOG](docs/BACKLOG.md).

Søket er laget for engelsk og må vurderes med ekstern spilltest mot dagens innholdsmengde. Dialogen er skriptet. Kjente relevanslekkasjer i personreaksjoner og tillitsfarmen er åpne problemer; de skal ikke forveksles med den rettede redaksjonsvurderingen.
