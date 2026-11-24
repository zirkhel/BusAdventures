# Dead Internet — teknisk design

_Oppdatert 24. november 2026, etter fase 4 (Timeline) og Anders' beslutninger om univers, mysterier og medieapper._
Medieappene i detalj: [docs/MEDIA-APPS-PROPOSAL.md](docs/MEDIA-APPS-PROPOSAL.md) (godkjent med justeringene i §0 der).
Spilldesign og sak: [docs/THE-QUIET-ACCOUNT.md](docs/THE-QUIET-ACCOUNT.md). Opprinnelig plan: [docs/PLAN.md](docs/PLAN.md). Oppgaver: [DEVPLAN.md](DEVPLAN.md).

## Prinsipper

1. **Kjernen kjenner ikke DOM.** Alt i `core/` kjører i Node og i nettleseren. Presentasjonen leser tilstand og sender handlinger, ingenting annet.
2. **Ett vedvarende univers, mange mysterier.** Alt innhold ligger i én verden. Et mysterium er en innholdspakke i den verdenen, ikke en egen installasjon eller kopi. The Quiet Account er det første mysteriet, ikke spillet. Se «Univers og mysterier».
3. **Innhold er data.** Personer, kontoer, artefakter, bilder, dialog, regler og kanon er JSON i `content/`. Ingen historie i koden. Motoren kan brukes til andre etterforskningsspill med et annet `content/`.
4. **Kanon, påstander og spillerens tro holdes adskilt** (se under). Spilleren ser aldri sannhetsverdier.
5. **Reproduserbart.** All endring går gjennom `Game.dispatch(action)`, loggføres, og kan spilles av på nytt med samme resultat.
6. **Ingen avhengigheter, ingen byggesteg.** Ren JavaScript med ES-moduler og `// @ts-check`. Tester med Nodes innebygde `node:test`.
7. **Ingen synlig relevans.** Ingen app markerer, sorterer eller vekter etter hva som er bevis.
8. **Det store spørsmålet står åpent.** Om det finnes ekte mennesker igjen på nettet, avgjøres ikke av tilfeldige bakgrunnskontoer eller tidlige mysterier.

## Mappestruktur

```
games/dead-internet/
  DESIGN.md  DEVPLAN.md
  index.html  manifest.json egen PWA (start_url /games/dead-internet/)
  app/                      telefonen (DOM): main.js, phone.js, render.js, context.js, suggest.js, media.js, ui.js, style.css
    apps/                   browser, connect, messages, casebook, settings
  core/                     spillmotoren (ingen DOM, ingen I/O)
    game.js                 fasade: Game, dispatch, spørringer, replay()
    world.js                buildWorld(): indekser over innholdet
    state.js                createState(): all spilltilstand i ett objekt
    conditions.js           betingelsesspråket
    rules.js                regler, effekter, planlagte effekter
    artifacts.js            synlighet, versjoner, cache, tilgang
    search.js               Seeker: fritekst (også i én app), bildesøk (også nøkkelbilder), bildeinfo
    feed.js                 feeder: deterministisk rangering, følg, lik, «Not interested»
    refs.js                 referanser i tekst (leksikon, mønstre) og søkeforslag
    discovery.js            oppdagelsestilstander og kunnskapsgrenser
    timeline.js             spillerens tidslinje: hendelser, datotyper, koblinger, datovalg
    cases.js                saker i Casebook: klassifisering (cases: []), filter, epiloger, sakens status
    dialogue.js             skriptede samtaler, tillit, svaralternativer
    casebook.js             bevis, hypoteser, notater, vurdering, publisering
    save.js                 lagring, versjonering, migrering, eksport/import
    content.js              laster content/manifest.json (fetch eller fs injiseres)
    util.js
  content/
    manifest.json           universets filer (files) og mysteriepakkene (mysteries)
    universe/*.json         felles for alle mysterier: meta, predicates, platforms, entities,
                            accounts, images, characters, canon (fakta), terms, mysteries (frø),
                            artifacts/filler.json (bakgrunnsinnhold)
    universe/pools/         delte medier (aviser, TokTok): artikler, lette kontoer, videos, scripts.
                            Vanlige universfiler i manifest.files. Første innhold kommer i fase 8.
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
| `node --test games/dead-internet/tests/*.test.mjs` | Alle tester (ca. 16 s, mest den fulle validatoren) |
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
| **Mystery** | `mysteries.json` | `claims`, `endings[]` med `if` og `effects` |

### Medier (artikler, innlegg, klipp)
Alle felt er valgfrie og kan ligge på artefakten eller en versjon: `section`, `byline[]` (konto-id eller fritekst), `corrections[] {date, text}`, `related[]`, `refs[]`, `sponsored {by}`, `comments[] {id, account, date, text, likes, replyTo, deletedIn, pinned}`, `video` (en video-id), `stats {views, likes}`, `category`. En kommentar med `deletedIn` er borte fra den versjonen og senere. `covers[]` (hendelser artikkelen dekker), `pool` og videoens `scenes`, `source` og `script`-id er forfatterdata og vises aldri. Spilleren ser klippet, bildeteksten, transkripsjonen og «Video info».

### Feeder (core/feed.js)
En feed er deterministisk og blind for etterforskningen. Den leser bare plattform, kategori (`category` eller `section`), popularitet (`stats.views`), dato, forfatter og spillerens egen interaksjon på plattformen (følger, liker, «Not interested»), pluss en hash av seed og dag. Den leser aldri `supports`, `mentions`, påstander, saker eller søkehistorikk. To faner: «For You» (rangert) og «Following» (fulgte kontoer, nyeste først). `state.media` holder følger, likes og «Not interested». Å like eller følge gir ingen kunnskap. Å se et klipp (`watch`) er det samme som å åpne det: klippet blir sett og skaperen møtt. Scrolling koster ingen tid.

### Versjoner og cache
En artefakt har én eller flere versjoner. `live` sier hvilken som er publisert nå (`null` = slettet). Versjoner med `cached: true` kan leses via søkemotorens cache når de ikke lenger er live. En versjon kan ha egne `supports`, `mentions`, `images` og `source`, slik at en bufret originaltekst kan være et selvstendig bevis.

### Bilder som bevis
Bilder er egne objekter med opphav (`derivedFrom`) og transformasjoner. Bildesøk finner alle bilder med samme original. Nøkkelbilder og plakat teller som bildene til klippet, så bildesøk på et nøkkelbilde finner andre klipp med samme opptak eller sett. Speilvendte kopier finnes bare med «Flip & search». «Image info» viser fiktiv metadata. Selve filene ligger utenfor motoren: verden refererer bare til bilde-id-er, og `graphics/catalog.json` sier hvilken fil som hører til hver id.

## Kanon, påstander og spillerens tro

1. **Kanon** (`canon.json` + `accounts.operatedBy` + `entities.isHuman`) er fasit. Bare publisering og validatoren leser den.
2. **Påstander og vitnemål**: artefakter og personer har `supports` (hvilke påstander de gir bevis for), også usanne påstander. Personer kan bare støtte påstander de `knows`, `believes` eller har `observed`, og bare gi bort artefakter de `has`. Validatoren sjekker dette.
3. **Spillerens tro** (`state.evidence`, `state.hypotheses`, `state.notes`) er det spilleren har samlet og bygd. Casebook viser bare antall bevis og antall uavhengige kilder.

En **hypotese** er `[subjekt] [predikat] [objekt]` med koblede bevis og et fritt notat. Ved publisering:
- **Sannhet**: hypotesen matches mot en kanonisk påstand. Ellers utledes den fra verdensmodellen (for eksempel: en konto som styres av en annen enn den utgir seg for, er ikke en ekte person).
- **Støtte**: antall forskjellige `source` blant koblede bevis som faktisk støtter påstanden. To eller flere er sterk, én er svak.
- **Troverdighet** endres etter tabellen i `meta.publishing.scoring`, vektet per kanal.
- Sanne påstander med støtte registreres i `state.exposed`, alle publiserte i `state.published`. Avslutninger og regler leser disse.

Dana (kanalen `daily_record`) har en `reviewer`: hun kommenterer kildestyrke og dristighet, aldri sannhet, og kutter påstander med svak støtte før publisering.

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

`state` er ett JSON-objekt. `save.js` legger på format og versjon, støtter eksport/import og migrering, og fjerner referanser til innhold som ikke lenger finnes. Lagringen injiseres (`localStorage` i nettleseren, `Map` i tester). Nøkkel: `ba_deadinternet_<world-id>`. Lagringsversjon 6: 1→2 oppdagelse, 2→3 tom tidslinje, 3→4 saker (alt blir uklassifisert, gamle rapporter får sin sak), 4→5 sakstilstander, 5→6 tom `media` (følger, likes, «Not interested»).

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
- **Sleep** er en knapp på hjemskjermen. Dagen går, nattlige hendelser kjøres, og telefonen viser låseskjermen med nye varsler.
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

## Appkart

| App | Status | Hva som finnes i dag |
|---|---|---|
| Browser | ferdig | Seeker, nettsteder, cachede kopier, historikk |
| Connect | ferdig | profiler, innlegg, søk |
| Messages | ferdig | emnebaserte samtaler, vis bevis, svarvalg |
| Casebook | ferdig | Evidence, Theories, Notes, Timeline (bygd av spilleren, uten fasit) |
| Settings | ferdig | navn, eksport/import, start på nytt |
| Mail | planlagt | e-poster finnes som dokumenter (videresendte e-poster i vedlegg) |
| Files | planlagt | vedlegg åpnes fra Messages, og lagrede dokumenter ligger i Casebook |
| Archive | i Browser foreløpig | versjoner og cache i motoren, «View cached versions» og «View available versions» |
| Contacts | planlagt | `contacts()` gir i dag etablerte kontakter, og skal aldri fylles fra hele personregisteret |
| Forensics | planlagt | skal gjenbruke bildeverktøyene i bildeviseren (metadata, bildesøk, speilvendt søk) |
| The Daily Record | planlagt | artikler er vanlige artefakter i Browser i dag |
| Unfiltered | planlagt | samme nyhetsmotor som The Daily Record, egen profil og identitet |
| TokTok | planlagt | video følger bildemodellen (opphav, transformasjoner, metadata) |

## Kjente begrensninger

- Søkerangeringen er enkel (vekting av felt og dekning). Godt nok for 90 artefakter, men bør justeres med ekte spilltesting.
- Tokenisering er laget for engelsk. Lokalisering av innhold vil kreve språkavhengig tokenisering.
- Den automatiske spilleren sender mange meldinger (tusenvis) fordi den prøver alt. Det påvirker ikke spillet, bare kjøretiden til validatoren (ca. 15 s).
- Spillerens egne meldinger er forhåndsformulerte (`strings.messages`). Variasjon kommer senere.
