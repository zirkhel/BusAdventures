# Dead Internet — teknisk design

_Oppdatert 24. november 2026, etter fase 2 (telefonen og lesing)._
Spilldesign og sak: [docs/THE-QUIET-ACCOUNT.md](docs/THE-QUIET-ACCOUNT.md). Opprinnelig plan: [docs/PLAN.md](docs/PLAN.md). Oppgaver: [DEVPLAN.md](DEVPLAN.md).

## Prinsipper

1. **Kjernen kjenner ikke DOM.** Alt i `core/` kjører i Node og i nettleseren. Presentasjonen leser tilstand og sender handlinger, ingenting annet.
2. **Én verden, ikke saker.** Alt innhold ligger i én verden. Et `mystery` er bare en gruppering for vurdering og avslutninger, aldri en meny for spilleren.
3. **Innhold er data.** Personer, kontoer, artefakter, bilder, dialog, regler og kanon er JSON i `content/`. Ingen historie i koden. Motoren kan brukes til andre etterforskningsspill med et annet `content/`.
4. **Kanon, påstander og spillerens tro holdes adskilt** (se under). Spilleren ser aldri sannhetsverdier.
5. **Reproduserbart.** All endring går gjennom `Game.dispatch(action)`, loggføres, og kan spilles av på nytt med samme resultat.
6. **Ingen avhengigheter, ingen byggesteg.** Ren JavaScript med ES-moduler og `// @ts-check`. Tester med Nodes innebygde `node:test`.

## Mappestruktur

```
games/dead-internet/
  DESIGN.md  DEVPLAN.md
  index.html  manifest.json egen PWA (start_url /games/dead-internet/)
  app/                      telefonen (DOM): main.js, phone.js, render.js, media.js, ui.js, style.css
    apps/                   browser, connect, messages, casebook, settings
  core/                     spillmotoren (ingen DOM, ingen I/O)
    game.js                 fasade: Game, dispatch, spørringer, replay()
    world.js                buildWorld(): indekser over innholdet
    state.js                createState(): all spilltilstand i ett objekt
    conditions.js           betingelsesspråket
    rules.js                regler, effekter, planlagte effekter
    artifacts.js            synlighet, versjoner, cache, tilgang
    search.js               Seeker: fritekst, bildesøk, bildeinfo
    dialogue.js             skriptede samtaler, tillit, svaralternativer
    casebook.js             bevis, hypoteser, notater, vurdering, publisering
    save.js                 lagring, versjonering, migrering, eksport/import
    content.js              laster content/manifest.json (fetch eller fs injiseres)
    util.js
  content/
    manifest.json           hvilke filer verden består av
    world/*.json            meta, predicates, platforms, entities, accounts, images,
                            artifacts/*.json, characters, canon, rules, mysteries
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
    lib/                    explorer, validator, scenarioer, Node-laster
  tests/                    core.test.mjs (motor), world.test.mjs (The Quiet Account)
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

## Verdensmodellen

| Type | Fil | Viktige felt |
|---|---|---|
| **Entity** | `entities.json` | `kind` (person, org, place, project, event, system), `isHuman` (true/false/null), `died`, `relations[]`, `secret` (skjules for spilleren) |
| **Account** | `accounts.json` | `platform`, `handle`, `claimsToBe` (hvem kontoen utgir seg for), `operatedBy` (hvem som faktisk styrer den), `history[]` (tidligere operatører, `null` = sovende) |
| **Artifact** | `artifacts/*.json` | `type`, `platform`, `author`, `date`, `versions[]`, `live`, `index`, `keywords`, `hidden`/`visibleIf`, `access`, `supports[]`, `source`, `mentions[]`, `images[]`, `filler` |
| **Image** | `images.json` | `kind`, `derivedFrom`, `transforms` (crop, mirror …), `meta` (fiktiv EXIF), `manipulation`, `supports`, `source`, `depicts` |
| **Character** | `characters.json` | `entity`, `account`, `kind` (person/autopilot), `trust`, `knows`/`believes`/`observed`, `has`, `responses[]`, `prompts[]`, `fallback` |
| **Predicate** | `predicates.json` | `arity`, `subjectKinds`, `objectKinds`, `truth` (facts, operatedBy, notHuman, relation), `template` |
| **Claim / Fact** | `canon.json` | Påstander med sannhet (`true`, `false`, `partial`) og formuleringer (`match`), pluss sanne fakta |
| **Rule** | `rules.json` | `when {event, match}`, `if`, `do[]`, `once` |
| **Mystery** | `mysteries.json` | `claims`, `endings[]` med `if` og `effects` |

### Versjoner og cache
En artefakt har én eller flere versjoner. `live` sier hvilken som er publisert nå (`null` = slettet). Versjoner med `cached: true` kan leses via søkemotorens cache når de ikke lenger er live. En versjon kan ha egne `supports`, `mentions`, `images` og `source`, slik at en bufret originaltekst kan være et selvstendig bevis.

### Bilder som bevis
Bilder er egne objekter med opphav (`derivedFrom`) og transformasjoner. Bildesøk finner alle bilder med samme original. Speilvendte kopier finnes bare med «Flip & search». «Image info» viser fiktiv metadata. Selve filene ligger utenfor motoren: verden refererer bare til bilde-id-er, og `graphics/catalog.json` sier hvilken fil som hører til hver id.

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

Bufrede versjoner kommer med når alle søkeordene treffer. Låste sider (`access`) vises med påloggingstittel. «Sitater i anførselstegn» søker etter eksakt frase.

## Dialog

Spilleren skriver aldri fritt til personer. Hun spør om noe hun kjenner (`ask`), viser noe hun har lest (`show`), eller velger et svaralternativ (`reply`). Første svar som passer vinner. `once` gjør at et svar bare kommer én gang. `showSupports` reagerer på alle bevis for en påstand, slik at mange veier fører til samme reaksjon. `autopilot`-personer (Calvin, Juno, Mara-kontoen) er maskiner i fiksjonen, og gir senere en naturlig plass for valgfri AI-dialog.

## Tid og regler

Tiden går bare når spilleren velger **Sleep**. Da kjøres planlagte effekter (`later`), deretter `day.start`-regler, så avslutninger. Regler er engangs som standard (`once: false` for gjentakende). Hendelser: `game.start`, `day.start`, `search`, `artifact.open`, `message.send`, `evidence.save`, `image.search`, `login`, `report.published`.

## Lagring

`state` er ett JSON-objekt. `save.js` legger på format og versjon, støtter eksport/import og migrering, og fjerner referanser til innhold som ikke lenger finnes. Lagringen injiseres (`localStorage` i nettleseren, `Map` i tester). Nøkkel: `ba_deadinternet_<world-id>`.

## Validator

`tools/validate.mjs` sjekker:
- **Referanser**: alle id-er i artefakter, kontoer, bilder, personer, regler, avslutninger og kanon finnes. Ukjente betingelser og effekter er feil.
- **Tidslinjer**: ingen innlegg før kontoen fantes, mens den var sovende, eller skrevet av en død person. Ingen bilder tatt etter at de ble publisert. Versjoner i riktig rekkefølge. Ingen kopi eldre enn originalen.
- **Kanon**: usanne påstander motsier ikke fakta, sanne påstander stemmer med verdensmodellen.
- **Personkunnskap**: personer gir bare bort det de har og vitner bare om det de vet, tror eller har sett.
- **Kildeuavhengighet**: hver kjernepåstand (S1–S3) har minst tre uavhengige kilder i innholdet.
- **Tilgang**: to automatiske spillere (forsiktig og hensynsløs) spiller gjennom og må nå minst to uavhengige kilder for hver kjernepåstand.
- **Blokkeringer**: hver artefakt, hvert bilde og hver person som bidrar til en kjernepåstand fjernes én om gangen. Saken må fortsatt kunne løses.
- **Grafikk**: hver bilde-id i verden finnes i katalogen med samme avhengighet, og har en plassholder.

## Telefonen (app/)

- `main.js` laster verden med `fetch`, gjenoppretter lagring fra `localStorage` (eller viser navnevalg), og lagrer etter hver handling via `game.on("state")`. Eksport og import bruker `save.js`.
- `phone.js` eier statuslinje (klokke, dato og dag), låseskjerm med varsler, hjemskjerm, bannervarsler, bildevisning og ark. Hver app har sin egen tilbakestabel. Knappen øverst til venstre i hver app er «tilbake», og «Home» når appen står på første skjerm. Sveip fra venstre kant, Esc og nettleserens egen tilbakeknapp gjør det samme. Nettleserens tilbake holdes inne i spillet med en ekstra historikkoppføring. Bare på hjemskjermen forlater to trykk innen 2 sekunder spillet.
- Skjermer er rene data (`{kind:"page", id, version, view}`), så tilbake viser samme visning uten å sende handlingen på nytt.
- `render.js` tegner en artefakt etter plattformtype (sosial, forum, avis, blogg, register, dokument). `[Photo: …]` i teksten byttes med neste bilde. Kommentarer (`@handle (tid): tekst`) og foruminnlegg (`navn: tekst`) gjenkjennes. Adresser, e-poster og @handles blir lenker. En kjent adresse åpner siden, alt annet blir et Seeker-søk.
- Connect-adresser åpnes i Connect, alt annet i Browser. Private dokumenter (e-post, vedlegg) åpnes i appen man står i.
- `media.js` bruker `graphics/catalog.json`: filen i `assets/images/` hvis den finnes, ellers plassholderen. Nye bilder krever ingen kodeendring.
- Spillet må serveres over HTTP (ES-moduler fungerer ikke fra `file://`). Lokalt: `python -m http.server` eller `npx serve` fra repo-roten, så `/games/dead-internet/`.

## Kjente begrensninger

- Søkerangeringen er enkel (vekting av felt og dekning). Godt nok for 90 artefakter, men bør justeres med ekte spilltesting.
- Tokenisering er laget for engelsk. Lokalisering av innhold vil kreve språkavhengig tokenisering.
- Den automatiske spilleren sender mange meldinger (tusenvis) fordi den prøver alt. Det påvirker ikke spillet, bare kjøretiden til validatoren (ca. 15 s).
- Spillerens egne meldinger er forhåndsformulerte (`strings.messages`). Variasjon kommer senere.
