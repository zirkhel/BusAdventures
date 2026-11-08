# Bus Adventures – Empire Engine: status og arkitektur
_7. november 2026 · gjelder prosjektplan v3_

Fase 1 er ferdig, og en spillbar prototype som dekker fase 2–3 er bygget. Alle 15 akseptansekriteriene er oppfylt (se §10). Ingen eksisterende spill eller motorer er endret; landingssiden har fått en ny IDLE-seksjon.

**Kjør lokalt** (ES-moduler trenger en webserver, `file://` fungerer ikke):
```
cd BusAdventures                # repo-roten
python -m http.server 8000      # eller: npx serve
→ http://localhost:8000/games/fighter-empire/
→ http://localhost:8000/games/bus-empire/
```

---

## 1. Hva som finnes i repoet (zirkhel/BusAdventures, commit 5640f5a)

- Ren statisk side på Vercel. Ingen byggesteg, ingen `package.json`, ingen TypeScript, ingen backend.
- **Teksteventyr** (Ward B, Shadow Over Iron Pines, template) deler `engine/` og `ui/`, med data i `games/<slug>/data/*.js`. Det finnes en GitHub-API-editor (`editor/index.html`) og Node-verktøy (`tools/validate-adventure.mjs`, `tools/play-adventure.mjs`).
- **Arkadespillene** er frittstående `index.html`-filer på 14–62 kB og lagrer highscore i `localStorage` med `ba_<spill>_`-nøkler.
- Landingssiden (`index.html`) har kort per spill, gruppert i sjangerseksjoner.

**Konsekvens for Empire:** Samme stil passer best: rene ES-moduler, JSON-data, Node-verktøy for validering og simulering, og ingen byggesteg. Empire-motoren får egen mappe (`empire/`) og deler ingenting med teksteventyrmotoren, siden mekanikken er helt annerledes. Da kan ingen av de to ødelegge den andre.

## 2. Besluttet / anbefalt / åpent

| | Hva |
|---|---|
| **Besluttet (fra planen, implementert)** | Grunninntekt fra tomt rom · 6 rom · 3 faste karakterer og 3 oppgraderinger (gear) per rom, gear også med Common/Rare/Epic · en event i hvert rom (endret etter spilltest 8. nov) · fast sjeldenhet per karakter · booster kun for spillvaluta, kun fra bygde rom · fragmentkost 1/3/5/10 for karakternivå 2–5 · alle nivåøkninger krever fragmenter **og** valuta, nytt rom krever bare valuta · full-crew-bonus · frivillig prestige med synlige krav, reset og permanent bonus/romgrense · valgfrie rom-events med tilfeldige utfall, cinematic og uten permanent straff · lokal lagring uten konto · ingen monetisering, anti-cheat, backend eller FOMO |
| **Anbefalt (mitt forslag, lett å endre)** | Startverdier for alle tall i `theme.json` (se §4) · opplåsing av karakter koster bare fragmenter (Common 2, Rare 3, Epic 5) · boosterpris = 30 sek av nåværende inntekt · 3 trekk per pakke · pity: garantert Epic-fragment senest i pakke 12 · offline-inntekt 100 % opptil 24 t · egne fragmenttyper for romnivå og for hver oppgradering · plain JS + JSDoc, ikke TypeScript · spritesheet som animasjonsformat (§7) · engelsk UI som resten av siden |
| **Åpent** | Alle balansetall · om offline skal være ubegrenset (`"offlineCapHours": null` gjør det) · pakketyper · events med kostnad · hvordan svært lang progresjon etter siste prestige-trinn skal fungere · endelig grafikkstil og AI-produksjonsløp · Empire Editor (ikke startet, som planen sier) |

**Avvik fra planen å merke seg:** Prestige-illustrasjonen i planen krever «minst 4 karakterer» i rom 5, men et rom har bare 3. Jeg brukte 3. Kravtypen `charactersUnlocked` uten `room` teller på tvers av alle rom, hvis det var meningen.

## 3. Arkitektur

```
empire/
  engine/            Lag A — ren logikk, ingen DOM, kjører i nettleser og Node
    empire.js        Empire-klassen: inntekt, nivåer, booster, prestige, events, krav
    curves.js        kostnadskurver, vektet trekk, seedbar RNG
    save.js          localStorage, offline, eksport/import
    validate.js      validering av tema (brukes av verktøy og senere Empire Editor)
  ui/                Lag C — generell presentasjon
    app.js           HUD, romkort, booster-åpning, prestige, meny, velkommen tilbake
    scene.js         lagvis romscene fra data, sprite-animasjon
    cinematic.js     avspilling av event-utfall
    style.css        layout; farger via --emp-*-variabler fra temaet
games/
  fighter-empire/    Lag B — bare data og bilder
    index.html       10 linjer: monterer motoren med ./theme.json
    theme.json       alt spillinnhold og alle balansetall
    assets/          rooms/*.svg, sprites/*.webp, upgrades/*.svg
  bus-empire/        andre tema: emoji-grafikk, ingen bildefiler, ingen prestige
tools/
  validate-empire.mjs   sjekker tema + at alle mediefiler finnes
  simulate-empire.mjs   bot spiller temaet og skriver milepæler (balansering)
  test-empire.mjs       motortester mot akseptansekriteriene
  make-placeholder-art.py  genererer plassholdergrafikken
```

**Kontrakter:**
- Motoren eier all spilltilstand. UI kaller `quoteLevel()` for å vise pris og `levelUp()` for å handle. Hver handling returnerer `{ ok, reason, ... }`, så UI-et aldri trenger å regne selv.
- Events: motoren trekker og lagrer utfallet **før** cinematic spilles. Å lukke fanen midt i en cinematic mister derfor ingenting.
- Alle ID-er er stabile strenger (`alley.knuckles`). Navn og filbaner kan endres fritt uten at lagringer brytes. Lagringen har `saveVersion` og en `migrateState()` som rydder bort ID-er som er fjernet fra temaet.
- Tema-JSON er det samme formatet en framtidig Empire Editor vil lese og skrive. `validateTheme()` er allerede skrevet for det.

### Skjermbilder i UI-et
- **Romlista** viser bare scenene under hverandre, med navn, nivå, crew og inntekt. «Upgrade ›» lyser når noe i rommet kan gjøres nå.
- **Romsiden** (trykk på et rom) har romnivå, de tre karakterene (Crew) og de tre oppgraderingene (Gear) som like kort, og eventuelle events. Trykk på et kort for stor versjon med beskrivelse og effekt. Adressen får `#<rom-id>`, så telefonens tilbake-gest og pila øverst til venstre går tilbake til lista.
- **Gevinst:** hver oppgradering og karakter viser hva neste nivå gir, for eksempel «Next level: +$2.3/s (+14%)». Tallet regnes ut av motoren (`previewGain()`), så det stemmer alltid med økonomien i temaet.
- **Hjelpelinja** under pengetelleren sier alltid hva neste lure trekk er, og hopper til riktig rom og knapp når man trykker på den.

## 4. Økonomimodellen

Alle tall ligger i `theme.json → economy`. Kostnader uttrykkes i **sekunder av rommets grunninntekt**, så et nytt rom bare trenger `price` og `baseIncome`; resten skalerer automatisk.

```
rominntekt = (grunn + Σ karakterer) × Π oppgraderinger × full-crew × prestige

  grunn       = baseIncome × (1 + 0.25 × (romnivå − 1))
  karakter    = baseIncome × rarity.incomeShare × (1 + 0.6 × (karakternivå − 1))
                  incomeShare: Common 0.6 · Rare 1.2 · Epic 2.5
  oppgradering= 1 + 0.12 × oppgraderingsnivå       (hver av de tre)
  full-crew   = 1.5 når alle tre er ansatt
  prestige    = ×2 / ×3 / ×4 etter trinn 1 / 2 / 3

kostnad (valuta) = baseIncome × seconds × growth^(nivå − 1)
  romnivå 15 s ×1.33 · karakter 30 s × rarity.costFactor ×1.6 · oppgradering 30 s ×1.5
fragmentkost     = liste, deretter +n per nivå
  karakter [1,3,5,10]+5 · romnivå [1,1,1,2,2,2,3,3,3]+1 · oppgradering [1,2,3,4,6]+2
```

Rom: Back Alley gratis/1 per s · Boxing Gym 2K/8 · Thai Resort 90K/60 · Dojo 6M/500 · Arena 400M/4 000 · World Championship Stadium 30B/32 000.

**Gear-sjeldenhet:** bonus per nivå = 12 % × `gearIncome` (Common 0.8 → 9,6 %, Rare 1.0 → 12 %, Epic 1.5 → 18 %), og prisen ganges med samme `costFactor` som for figurene. Gear trekkes i pakker som figurene: først sjeldenhet (65/27/8), så en ting av den sjeldenheten.

**Prestige-trinn (6 rom):** start 3 rom → trinn 1 åpner rom 4 (×2) → trinn 2 rom 5 (×3) → trinn 3 rom 6 (×4) → trinn 4 er siste bonus (×6, krever stadion nivå 25 og alle tre figurene). Simulatoren (aktiv spiller, events når de er klare): 1,3 t / 4,6 t / 11 t / ca. 19 t+.

**Simulert tempo** (`tools/simulate-empire.mjs`, grådig bot):

| | Aktiv spiller | Sjekker innom hver 30. min |
|---|---|---|
| Rom 2 | 10 min | 1 t |
| Rom 3 | 39 min | 2 t |
| 1. prestige | 1,4 t | 3,5 t |
| 2. prestige | 6,5 t | 10 t |
| Alle 5 rom | 12,8 t | – |

De tre første rommene bygges på 39 min i første runde, 28 min etter første prestige og 20 min etter andre, så tidlige rom blir merkbart raskere. Boten er en linjal for å sammenligne innstillinger, ikke en modell av en ekte spiller. Endre et tall og kjør simulatoren på nytt.

## 5. Booster packs

`theme.json → booster`. Hvert av de 3 trekkene velger først type (karakter 55 · romfragment 15 · oppgraderingsfragment 20 · valuta 10), så sjeldenhet (65/27/8) og så tilfeldig blant det som finnes i **bygde** rom. Typer uten gyldige mål faller bort, og maksede mål trekkes ikke (`excludeMaxed`), så duplikater aldri er bortkastet. Hvis 11 pakker på rad er uten Epic, gir siste trekk i pakke 12 et Epic-fragment (`epicPity`, `null` slår det av).

**Navn og flere pakker:** Knappen heter «Booster Pack» i alle temaer (et tema *kan* sette `booster.name`, men trenger ikke). Etter en pakke kan man åpne 1 eller 10 til (`openBoosters(n)`, stopper når pengene tar slutt). Like kort slås sammen til ett kort med «+3», sortert Epic → Rare → Common → rom → penger, og snus raskt.

## 6. Prestige og events

**Prestige** (`theme.json → prestige`): `startRooms` gir romgrensen før første prestige. Hvert trinn har `requires` (liste med krav), `incomeMultiplier` og `roomLimit`. Kravtyper som deles med events: `roomBuilt`, `roomLevel`, `charactersUnlocked`, `characterLevelSum`, `upgradeLevel`, `runEarned`. Reset krever to bekreftelser i UI-et.

**Events** — ett per rom: Backyard Alley Brawl Tournament, Friday Sparring Night, Beach Muay Thai Cup, Tournament of the Hidden Masters, Title Fight, World Championship. Låses opp på romnivå 3 med to figurer; nedkjøling 10 min i bakgata, opp til 60 min på stadion. Format (`rooms[].events[]`): `unlock` (krav), `costSeconds`, `cooldownSeconds`, `repeatable`, `outcomes[]`. Hvert utfall har `weight` + `skillWeight` × (sum av karakternivå i rommet), med `minWeight` som gulv. Belønningstyper: `coins` (sekunder av rominntekt), `fragments` (sjeldenhet, antall, rom eller alle), `booster`. Validatoren avviser negative belønninger. Cinematic per utfall: `sequence` (tekstrammer, ingen filer), `video` eller `image`.

## 7. Animasjonsformat – anbefaling

| | Spritesheet (WebP/PNG) | Animert WebP | Transparent video |
|---|---|---|---|
| Transparens | Ja, overalt | Ja, overalt | **Ikke VP9-alfa på Safari/iOS.** Krever HEVC-alfa i tillegg, eller «stacked alpha» via WebGL |
| Kontroll (fps, pause, synk) | Full | Ingen | God |
| Ytelse på mobil | Svært god, en tegning per bilde | Ok for små, tung dekoding ved store/mange | God via maskinvare, men tyngre å starte mange samtidig |
| Filstørrelse | Ok ved < ~16 bilder, stor ved lange looper | Middels | Best for lange/store |
| Sømløs loop | Eksakt | Eksakt | Kan hakke ved loop-punktet |
| AI-produksjon (ComfyUI/Wan) | Video → fjern bakgrunn → velg bilder → pakk | Video → fjern bakgrunn → encode | Video → fjern bakgrunn → **to** encodinger |

**Standard: horisontal spritesheet i WebP med alfa** (implementert). Motoren trenger bare `src`, `frames` og `fps`, og pauser animasjoner som er utenfor skjermen.
**Reservevei: animert WebP** (`type: "image"`) for lange eller store looper der kontroll ikke trengs. Det støttes allerede uten kodeendring.
**Cinematics:** vanlig MP4 (H.264) uten transparens, siden de vises i fullskjerm over en mørk bakgrunn. Det støttes (`type: "video"`).

Videogenerering gir **ikke** transparent bakgrunn. Generer på ensfarget/grønn bakgrunn og fjern den (for eksempel BiRefNet/rembg-node i ComfyUI) før pakking. `tools/make-placeholder-art.py` viser formatet: 128×192 per bilde, føttene nederst i midten.

## 8. Slik legger du til et rom

1. Legg en bakgrunn i `assets/rooms/` (aspect 1.6, for eksempel 800×500).
2. Legg tre spritesheets i `assets/sprites/` (samme bildestørrelse per bilde, alle bilder på en rad).
3. Legg til et objekt i `rooms[]` med `id`, `order`, `price`, `baseIncome`, `background`, 3 `characters` og 3 `upgrades`. Kopier et eksisterende rom.
4. Plasser med `x`/`y` (føttenes posisjon i % av scenen), `h` (høyde i % av scenen) og `z` (lag). Juster i nettleseren.
5. `node tools/validate-empire.mjs games/fighter-empire` og `node tools/simulate-empire.mjs games/fighter-empire`.
6. Skal rommet bak et prestige-trinn: øk `roomLimit` i riktig trinn.

## 9. Slik lager du et nytt tema

Kopier `games/bus-empire/` (minst) eller `games/fighter-empire/` (fullt). Bytt `id` (det er lagringsnøkkelen), navn, valuta, palett, rom og grafikk. Ingen filer i `empire/` skal endres. Prestige og events er valgfrie. Grafikk kan være spritesheets, animert WebP, video eller emoji, også blandet.

## 9b. Quest Empire (andre fulle tema, 8. nov)

`games/quest-empire/` bruker samme motor og UI uten kodeendringer. Det eneste som er nytt, er data og grafikk:
- Rommene er quests: Rats in the Cellar → Goblins in the Woods → The Haunted Crypt → The Troll Bridge → The Wizard's Tower → The Dragon's Lair.
- «Crew» er monstre (3 per quest, Common/Rare/Epic) som animeres i scenen når de er beseiret. Gear er ting i rommet. Hver quest har en bosskamp som event.
- Ordene i UI-et kommer fra `presentation.labels` (Monsters, Defeat, Quest, All quests, Quest complete, slain …). Fighter Empire bruker standardordene (Crew, Hire, Room …).
- Grafikk: `tools/make-quest-art.py` (rotter, goblins, skjeletter, spøkelse, lich, ulv, troll, golem, imp, rustning, trollmann, kobold, wyvern, drage). Rammene er 160×160. Kortbildet beskjæres automatisk til figuren, så rammeformatet spiller ingen rolle.
- Økonomi, pakker og prestige («New Game+») er kopiert fra Fighter Empire.

## 9c. Space Empire: bevis på at motoren er generisk (8. nov)

`games/space-empire/` ble laget **uten én endret linje i `empire/`** (sjekket med `git diff origin/main -- empire/` før merge). Alt nytt er data og grafikk:
- Rom → planeter: Lunar Outpost → Mars Colony → Asteroid Belt Mine → Europa Ice Station → Gas Giant Refinery → Dyson Ring.
- Crew → kolonister og maskiner (roboter, droner, mecher, en AI-kjerne, en romblekksprut og en romvesen-ambassadør). Gear → moduler.
- Hire → Deploy, Room → Planet, valuta → Credits (₵), events → ekspedisjoner, prestige → Warp Jump.
- Grafikk: `tools/make-space-art.py`. Felles tegnefunksjoner ligger i `tools/artkit.py` (brukes også av `make-quest-art.py`).

**Slik lager du et nytt tema:** kopier `games/space-empire/`, bytt `id`, tekster, `presentation.labels` og grafikk. Ingen kode i `empire/` skal røres.

## 10. Akseptansekriterier

| # | Status | Verifisert med |
|---|---|---|
| 1 Inntekt umiddelbart uten karakterer | ✅ | test 1, UI |
| 2 Tre plasser, tre oppgraderinger (var to) | ✅ | test 2, validator |
| 3 Låst til rom, fast sjeldenhet | ✅ | test 3 |
| 4 Booster for valuta, kun bygde rom | ✅ | test 4, 4b |
| 5 Fragmenter låser opp og oppgraderer | ✅ | test 5 |
| 6 Nivåer påvirker inntekt | ✅ | test 6 |
| 7 Full-crew-bonus | ✅ | test 7, UI |
| 8 To+ rom, vertikal navigasjon | ✅ | nettlesertest, 390 px og desktop |
| 9 Gamle rom tjener og kan oppgraderes | ✅ | test 9 |
| 10 Lokal lagring uten innlogging | ✅ | test 10, nettlesertest med reload |
| 11 Animert karakter plassert via konfigurasjon | ✅ | test 11, skjermbilder |
| 12 Nytt tema uten motorendring | ✅ | test 12, Bus Empire |
| 13 Ingen nivåkjøp uten fragmenter **og** valuta | ✅ | test 13 |
| 14 Prestige med krav, reset, permanente bonuser | ✅ | test 14, nettlesertest |
| 15 Event med cinematic, tilfeldig belønning, ingen straff | ✅ | test 15, 15b, nettlesertest |

`node tools/test-empire.mjs` → 17/17.

## 11. Plassering i repoet

- `empire/` er motoren (Lag A) og det felles UI-et (Lag C). Den deler ingenting med `engine/` og `ui/` for teksteventyrene.
- `games/fighter-empire/` er listet på landingssiden under en ny seksjon, `// IDLE`.
- `games/bus-empire/` er bare et bevis på temagjenbruk og er **ikke** listet. Den nås direkte på `/games/bus-empire/`.
- `tools/*-empire.mjs` og `tools/make-placeholder-art.py` ligger ved siden av eventyrverktøyene.
- Lagring bruker nøkkelen `ba_empire_<tema-id>` i `localStorage`, i samme stil som arkadespillene (`ba_<spill>_`).

## 12. Forslag til neste steg

1. Spill prototypen et par dager og juster tall i `theme.json`. Simulatoren viser konsekvensen før du spiller.
2. Ta et lite valg om offline-tak (24 t eller ubegrenset).
3. Lag ett ekte rom i den endelige kunststilen (bakgrunn + en animert figur via ComfyUI/Wan) for å teste produksjonsløpet fra §7.
