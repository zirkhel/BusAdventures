# Empire Engine – grafikk og animasjon: dagens system og produksjonsstandard

_8. november 2026 · kartlagt fra koden på `main` (0e8cfd7). Ingen kode eller grafikk er endret._

Dokumentet har tre deler:
1. **Slik fungerer det i dag** – fakta fra `empire/ui/scene.js`, `app.js`, `cinematic.js`, `style.css` og de tre temaene.
2. **Produksjonsstandard** – krav til eksternt produserte assets (ComfyUI og annet) som virker med dagens motor uten kodeendringer.
3. **Begrensninger og forslag** – ting standarden må jobbe rundt, og som kan forbedres i motoren senere.

Merking: **[kode]** = slik koden faktisk gjør det. **[standard]** = anbefalt regel. **[må testes]** = anbefalt tall som bør bekreftes på en ekte iPhone før det låses.

---

## 1. Dagens system

### 1.1 Hvor grafikk brukes

| Sted | Hva vises | Kilde i `theme.json` |
|---|---|---|
| Romscene (lista og romsiden) | bakgrunn + gear-lag + figurer | `rooms[].background`, `upgrades[].visual`, `characters[].sprite` |
| Låst rom-kort | romets bakgrunn i gråtoner | `rooms[].background.src` |
| Figurkort (Crew/Monsters/Colony) | første ramme av figurens spritesheet, beskåret | `characters[].sprite` |
| Gear-kort og gear-miniatyr | **første** stage-bilde, uansett nivå | `upgrades[].visual.stages[0]` |
| Romkort (romfragment i pakker) | romets bakgrunn, beskåret (cover) | `rooms[].background` |
| Cinematic (events) | tekstsekvens, video eller bilde over uskarp rombakgrunn | `events[].outcomes[].cinematic` |

Filstier i `theme.json` er relative til `theme.json` **[kode]**. Motoren knytter ikke filnavn til ID-er; navnene er bare konvensjon.

### 1.2 Scenen **[kode]**

- **Format:** `presentation.sceneAspect` (alle temaer: **1.6**, altså 16:10). Scenen fyller kortbredden.
- **Faktisk størrelse:** Siden er maks 560 CSS-px bred med 10 px marg.
  - Telefon (390 px bred): scenen er ca. **370 × 231 CSS-px**, eller ca. 1110 × 694 fysiske piksler på en iPhone med 3× skjerm.
  - Desktop: maks ca. **540 × 337 CSS-px**, eller ca. 1080 × 675 fysiske piksler på 2×.
- **Lag (bakerst først):**
  1. Bakgrunn, uten z-index.
  2. Gear og figurer med `z-index = 10 + z`.
  3. «?»-markør for figurer som ikke er låst opp (z 5).
- **Navnefelt i lista:** dekker scenens nederste del med en mørk gradient (z 30). Det er ca. 75 CSS-px, altså ca. 30 % av høyden, og tettest nederst. Merket «Upgrade ›» / «Event ready ›» ligger nede til høyre.

### 1.3 Bakgrunn **[kode]**

| Felt | Støtte |
|---|---|
| `background.src` = `.svg` `.png` `.webp` `.jpg` | `<img>`, `object-fit: cover` (fyller og beskjærer ved feil format) |
| `background.src` = `.mp4` `.webm` | `<video>` autoplay, muted, loop, playsinline (vises **ikke** på låst rom-kort) |
| `background.color` | hvilken som helst CSS-bakgrunn, også gradienter (Bus Empire) |

**I dag:** alle bakgrunner er SVG med viewBox 800 × 500. Gulvlinjen ligger på ca. 64–68 % av høyden.

### 1.4 Lag: plassering og ankerpunkt **[kode]**

Hvert lag (figur eller gear) plasseres slik:

```
left = x %      top = y %      height = h % av scenehøyden
transform: translate(-50%, -100%)        → ankeret er MIDT PÅ UNDERKANTEN av bildeboksen
flip: true  → scaleX(-1) rundt samme midtpunkt
z           → z-index 10 + z
```

- **Bredden** følger bildets proporsjoner. For spritesheets er det rammebredde delt på rammehøyde.
- **Ankeret er rammens underkant, ikke figurens føtter.** Føttene må derfor stå nederst og midt i hver ramme, med samme luft i alle rammer.
- Før spritesheetet er lastet, har laget proporsjonene 2:3 (CSS-standard). Etter lasting brukes de ekte proporsjonene. Med kvadratiske rammer kan figuren derfor «hoppe» litt ved første visning, med mindre `frameAspect` er satt.

**Verdier i bruk i dag:**

| | Fighter | Quest | Space |
|---|---|---|---|
| Figurer `h` | 37–46 | 42–78 | 42–64 |
| Figurer `y` | 86–93 | 80–88 | 76–90 |
| Figurer `z` | 3–4 | 4 | 4 |
| Gear `h` | 13–48 | 11–50 | 14–54 |
| Gear `z` | 1, 2, 5 | 1, 2, 5 | 1 |

### 1.5 Medietyper **[kode]**

`type` settes automatisk hvis feltet mangler: `char` → emoji, `frames` → sprite, `.mp4/.webm/.mov` → video, ellers bilde.

| Type | Felter | Oppførsel |
|---|---|---|
| `sprite` | `src`, `frames`, `fps`, valgfri `columns`, `rows`, `frameAspect` (f.eks. `"1 / 1"`) og `blend` (0–1) | Uten `columns`/`rows`: én **horisontal rad** med like brede rammer, som før. Med `columns`/`rows`: **rutenett**, lest fra venstre mot høyre og ovenfra og ned. Vises med `background-size: columns×100% rows×100%`. Ramme *i* ligger i kolonne `i % columns`, rad `floor(i / columns)`. Mangler ett av feltene, regnes det ut fra `frames`. |
| `image` | `src` | `<img>`: stillbilde, SVG, animert WebP/GIF (spiller i egen løkke, uten kontroll) |
| `video` | `src`, valgfri `loop: false` | `<video>` autoplay, **alltid muted**, playsinline, en kilde (ingen fallback) |
| `emoji` | `char` | Tekst, størrelse `h × 0.8` cqh |

### 1.6 Spritesheet-animasjon **[kode]**

- Én felles `requestAnimationFrame`-løkke for alle figurer.
- Rammen beregnes som `floor(tid × fps) % frames`. **Alle rammer varer like lenge**, og animasjonen går alltid i løkke.
- `blend` (valgfri): andelen av hver ramme som brukes til å tone over i neste. `0.5` = posen står stille halve tiden, og tones over resten. Passer for ark med separate poser (f.eks. Lola i XXX Empire: `fps` 2.5, `blend` 0.5). Uten `blend` byttes rammene brått, som før. Ekte mellombilder (16–24 rammer) gir fortsatt best bevegelse.
- Hver figur starter på et tilfeldig tidspunkt (opptil 1 s forskjøvet), så like figurer ikke går i takt.
- Animasjonen pauses når scenen er utenfor skjermen (IntersectionObserver) og når fanen er skjult (nettleseren stopper rAF).
- Rutenett: `"frames": 24, "columns": 6, "rows": 4` (se §2.2). Validatoren melder feil hvis rammene ikke får plass i rutenettet.
- Ikke støttet: ulik tid per ramme, ping-pong, engangsanimasjoner, ulike animasjoner per tilstand (idle/angrep) og lyd.
- **I dag:** 6 rammer per figur, `fps` 3–8.
  - Fighter: rammer på 128 × 192 (ark 768 × 192).
  - Quest og Space: 160 × 160 (ark 960 × 160).
  - Alle er WebP lossless med alfa, 6–36 kB per ark.

### 1.7 Gear-stages **[kode]**

`visual.stages: [{ minLevel, src | char }, …]`. Scenen viser stage-en med høyest `minLevel` ≤ nivået. Nivå 0 betyr at ingenting vises. Byttet skjer momentant, uten overgang. Alle temaer bruker i dag to stages: nivå 1 og nivå 5 («deluxe»). Plasseringen (`x`, `y`, `h`, `z`) er felles for alle stages, så **alle stages må ha samme lerret og samme anker**.

### 1.8 Kortbilder **[kode]**

- **Figurkort:**
  - Første ramme av spritesheetet tegnes på et `<canvas>`.
  - Bildet beskjæres til boksen rundt pikslene med alfa > 90 (av 255), med 8 % luft.
  - Det skaleres med «contain» inn i et 2:3-felt (ca. 96 × 151 CSS-px på telefon), plassert midt horisontalt og 70 % ned.
  - Svak skygge (lav alfa) teller ikke med i beskjæringen.
  - Krever at bildet er på samme domene. Ved CORS-feil brukes hele rammen.
- **Ulåste figurer:** samme bilde, svart silhuett (`brightness(0)`).
- **Gear-kort:** første stage som `<img>`, 88 % av et kvadratisk felt, «contain». Ikke bygget = gråtoner.
- **Romkort:** bakgrunnen som «cover».

### 1.9 Cinematics **[kode]**

Vises i et stående **3:4**-felt (maks 80 % av skjermhøyden) over romets bakgrunn med blur og mørk tone. Trykk hopper over.

| `cinematic.type` | Felter | Oppførsel |
|---|---|---|
| `sequence` | `frames: [{ text, ms, color?, shake?, image? }]` | Tekst (og ev. bilde) per ramme |
| `video` | `src`, `muted?` | Forsøker lyd, faller tilbake til muted. Slutter ved `ended`. «Contain» i feltet |
| `image` | `src`, `ms` (standard 2500) | Stillbilde eller animert WebP |

**I dag:** alle events bruker `sequence`, uten mediefiler.

### 1.10 Validering i dag **[kode]**

`tools/validate-empire.mjs` sjekker at alle filer i `theme.json` finnes, og at `x`, `y` og `h` er tall. Den sjekker **ikke**:
- bildestørrelser,
- om arkbredden er delelig med `frames`,
- alfa,
- filstørrelse.

### 1.11 Filnavn i dag (konvensjon, ikke krav) **[kode]**

```
games/<spill>/theme.json
games/<spill>/assets/rooms/<rom-id>.svg
games/<spill>/assets/sprites/<rom-id>-<figur>.webp                 (ID «alley.knuckles» → «alley-knuckles»)
games/<spill>/assets/upgrades/<rom-id>-<ting>.svg  +  …-deluxe.svg
```

---

## 2. Produksjonsstandard for eksterne assets

Målet er at en fil fra ComfyUI (eller en tegner) kan legges rett inn og vises riktig uten å røre motoren. Alle punktene virker med dagens kode.

### 2.1 Filnavn og mapper **[standard]**

- Små bokstaver, a–z, 0–9 og bindestrek. Ingen mellomrom eller æøå.
- Filnavn følger ID-en med punktum byttet til bindestrek: `cellar.king` → `cellar-king.webp`.
- Mapper som i dag: `assets/rooms/`, `assets/sprites/`, `assets/upgrades/`. Ny mappe for video og bilder til events: `assets/cinematics/<event-id>-<utfall>.mp4`.
- Gear-stages: `<id>.webp`, `<id>-deluxe.webp` (flere stages: `<id>-s2`, `-s3` …).
- Kildefiler (ComfyUI-workflow, ubeskårne rammer, prompt) legges **utenfor** `games/` (f.eks. `art-src/<spill>/…`) eller utenfor repoet. Bare ferdige filer i `games/`.

### 2.2 Figurer (spritesheets) **[standard]**

| Egenskap | Krav |
|---|---|
| Fil | WebP med alfa. Lossless, eller lossy med full alfakvalitet. PNG er tillatt mens man jobber |
| Oppsett | **Én horisontal rad** (eldre ark, opptil ca. 12 rammer) eller **rutenett** med `columns`/`rows`. Like store rammer, ingen luft mellom rammer |
| Arkstørrelse | **nøyaktig** `columns × rammebredde` bred og `rows × rammehøyde` høy (heltall). Én rad: `rows` = 1 |
| Rammestørrelse | **384 × 384** som standard, **512 × 512** for store figurer (h ≥ 60) **[må testes]**. Høye figurer kan bruke 320 × 480 (2:3) |
| Antall rammer | 6–12. Arkbredden skal være ≤ 4096 px (f.eks. 10 × 384, 8 × 512) **[må testes]** |
| Bildefrekvens | 6–10 fps for tomgang. Rammene må gi en sømløs løkke (siste → første) |
| Retning | Figuren ser **mot høyre**. Venstre fås med `flip: true` |
| Anker | Føttene **nederst midt i rammen**, med 2–4 % luft under (plass til skygge). Samme fotlinje og samme midtlinje i alle rammer |
| Skala | Figuren fyller 80–90 % av rammehøyden i den høyeste rammen. Små vesener (rotter) kan fylle mindre, men skal stå på samme fotlinje |
| Skygge | Myk ellipse under føttene, bakt inn i rammen, alfa ≤ 35 % (blir ikke med i kortbeskjæringen) |
| Lys | Fra oppe til venstre, likt for alle figurer i samme spill |
| Perspektiv | Sidevisning eller lett tre-kvart, kamera i øyehøyde, ingen kamerabevegelse eller zoom |
| Ramme 0 | Den beste «portrett-rammen». Den brukes på kortet, så hele figuren må synes |
| Filstørrelse | ≤ 300 kB per ark med én rad. Rutenett med 24 rammer: ≤ 600 kB **[må testes]** |
| I `theme.json` | `frames`, `fps` og helst `frameAspect` (f.eks. `"1 / 1"`), så figuren ikke hopper når den lastes |

**Hvorfor 384–512:** En figur med `h` 60 er ca. 140 CSS-px høy på telefon, altså ca. 415 fysiske piksler på 3×. Dagens rammer på 160–192 px blir derfor oppskalert 2–3 ganger, og det synes på retina-skjermer.

**Minnebudsjett [må testes]:** Et ark bruker bredde × høyde × 4 byte i minnet når det er dekodet (3072 × 384 ≈ 4,7 MB). Lista kan vise alle rommene, så hold summen for alle figurarkene i ett spill under ca. 100 MB. 18 figurer × 8 rammer × 384 ≈ 85 MB.

#### XXX Empire: standard for figurer (fra 8. nov)

| Egenskap | Krav |
|---|---|
| Rammer | **24** per animasjon, ekte mellombilder (ikke separate poser) |
| Rutenett | **6 kolonner × 4 rader** |
| Avspilling | **8 fps**, altså 3 sekunder per løkke. Ramme 23 → 0 må være sømløs |
| Rammehøyde | 448–512 px. 512 gir f.eks. rammer på ca. 270 × 512 og et ark på 1620 × 2048 |
| I `theme.json` | `"frames": 24, "columns": 6, "rows": 4, "fps": 8, "frameAspect": "<b> / <h>"` |
| Verktøy | `python3 tools/normalize-sheet.py inn.png ut.webp --frames 24 --columns 6 --height 512 --quality 80` leser et 6 × 4-ark, retter føtter og rammer og skriver et nytt 6 × 4-ark. Det skriver også ut verdiene til `theme.json` |

Minne: et 1620 × 2048-ark er ca. 13 MB dekodet. Har alle 24 figurene i XXX Empire slike ark, blir summen over 100 MB-budsjettet over hvis alle vises samtidig. Følg med på mobil, og gå ned til 448 px rammehøyde om nødvendig.

Eksisterende ark med én rad (Fighter, Quest, Space, Lola) virker som før og er ikke endret.

### 2.3 Gear (ting i rommet) **[standard]**

| Egenskap | Krav |
|---|---|
| Fil | SVG, eller WebP/PNG med alfa |
| Lerret | Fritt format, men **alle stages av samme ting har identisk lerret og anker** |
| Anker | Tingen står på underkanten av lerretet, midt horisontalt (bortsett fra bevisste «henger på veggen»-ting, som da plasseres med `y` høyere opp) |
| Oppløsning (raster) | Lengste side ≥ 512 px, ≤ 1024 px |
| Kortlesbarhet | Stage 1 skal være gjenkjennelig i et kvadrat på ca. 90 CSS-px (kortet viser alltid stage 1) |
| Filstørrelse | ≤ 120 kB per stage **[må testes]** |
| Animert gear | Animert WebP via `type: image` fungerer (egen løkke). Gear med `frames` blir spritesheet, men kortet bruker da bare ramme 0 som `<img>`, så unngå det inntil videre |

### 2.4 Bakgrunner **[standard]**

| Egenskap | Krav |
|---|---|
| Fil | WebP eller JPG, uten alfa (SVG er fortsatt lov) |
| Format | **16:10**, **1600 × 1000** (minimum 1280 × 800) |
| Filstørrelse | ≤ 250 kB **[må testes]** |
| Gulvlinje | Ca. **66 %** fra toppen. Figurene står mellom 76 og 93 %. |
| Navnefelt | Nederste ca. 25 % blir dekket i lista. Ingen viktige detaljer der, og hold hjørnet nede til høyre rolig (merket) |
| Innhold | Ingen figurer og ingen ting som også finnes som gear (det dobles ellers) |
| Lys | Samme lysretning som figurene |
| Video-bakgrunn | Tillatt (`.mp4`, H.264, sømløs løkke, ≤ 1,5 MB), men låst rom-kort viser da ingen bakgrunn |

### 2.5 Cinematics **[standard]**

| | Krav |
|---|---|
| Standard | `sequence` med tekst (ingen filer). Billigst og alltid riktig |
| Video | MP4 (H.264, AAC valgfritt), **stående 3:4, 720 × 960**, 3–8 s, ≤ 2 MB. Ikke avhengig av lyd (kan bli muted) |
| Bilde | WebP 720 × 960, også animert, med `ms` satt |
| Ett utfall = en fil | `assets/cinematics/<event-id>-<utfall>.mp4`, f.eks. `cellar-clear-legend.mp4` |

### 2.6 Hva som **ikke** skal leveres nå

- **Transparent video for figurer eller gear.** VP9-alfa virker ikke i Safari, og HEVC-alfa virker bare i Safari. Motoren tar bare en kilde, så det kan ikke vises riktig på både iPhone og Android.
- **Rutenett-spritesheets** (flere rader), ulik tid per ramme, ping-pong eller engangsanimasjoner.
- **Lyd** på figurer og gear.
- Filer fra et annet domene uten CORS. Kortbeskjæringen virker da ikke.

---

## 3. Produksjonsløp med ComfyUI (anbefalt)

ComfyUI er et produksjonsverktøy, ikke noe motoren er avhengig av **[standard]**. Løpet under gir filer som oppfyller kap. 2. Nodenavn varierer med versjoner, så stegene er beskrevet funksjonelt.

**Figur (idle-løkke):**
1. **Nøkkelbilde:** tekst-til-bilde av hel figur, sidevisning mot høyre, nøytral eller grønn flat bakgrunn, samme stil-prompt og LoRA for hele spillet, fast seed per figur.
2. **Animasjon:** bilde-til-video (f.eks. Wan) med nøkkelbildet som start. Prompt for kort tomgangsbevegelse, «static camera, no zoom, no pan», 2–3 s.
3. **Uttrekk:** velg 6–12 rammer som danner en sømløs løkke (første og siste ramme nesten like).
4. **Fjern bakgrunn** på hver ramme (BiRefNet/RMBG eller tilsvarende). Videogenerering gir **ikke** alfa av seg selv.
5. **Juster (viktigst):** finn fotlinje og horisontalt midtpunkt i hver ramme, og flytt alle rammene slik at de er like. Ellers «svømmer» figuren i scenen.
6. **Beskjær og skaler** til fast rammestørrelse (384² eller 512²), med føttene 2–4 % fra bunnen.
7. **Pakk** rammene horisontalt til ett ark og lagre som WebP med alfa.
8. **Sjekk** ramme 0 (blir kortbildet), filstørrelse og at arkbredde = rammer × rammebredde.

**Gear:** tekst-til-bilde av tingen alene, fjern bakgrunn, plasser på fast lerret med bunnen på underkanten. Deluxe-versjonen lages fra samme bilde (img2img eller inpainting), så lerret og anker blir identiske.

**Bakgrunn:** tekst-til-bilde 16:10, «empty scene, no characters», horisont og gulv på ca. 2/3, rolig nederkant. Skaler til 1600 × 1000 og lagre som WebP.

**Kjente fallgruver:**
- Figuren endrer størrelse eller ansikt gjennom videoen. Hold klippene korte og bruk fast seed.
- Kamerabevegelse ødelegger ankeret.
- Kanter fra grønn bakgrunn («green spill»). Bruk nøytral grå bakgrunn hvis fjerningen sliter.

---

## 4. Begrensninger i motoren og mulige forbedringer (ikke gjort)

Disse er bare forslag. Standarden over fungerer uten dem.

| # | Begrensning i dag | Mulig forbedring |
|---|---|---|
| 1 | Bare en rad per spritesheet. Lange animasjoner blir svært brede | Støtte for `columns`/`rows` (rutenett) |
| 2 | Lik tid per ramme, bare løkke | `durations[]`, `pingpong`, engangsanimasjon |
| 3 | Én animasjon per figur | Flere tilstander (idle, «nettopp ansatt», event) |
| 4 | Kortbildet er alltid ramme 0, automatisk beskåret | Valgfritt `portrait`-felt med eget bilde |
| 5 | Gear-kort viser alltid stage 1 | Vise gjeldende stage |
| 6 | Én videokilde. Transparent video er ikke mulig på tvers av nettlesere | Flere kilder (`sources[]`, HEVC + VP9) |
| 7 | Ingen forhåndslasting eller oppløsningsvarianter | Forhåndslasting per rom, `@2x`/`@3x`-varianter |
| 8 | Validatoren sjekker ikke størrelser | `tools/check-assets.mjs`: arkbredde/rammer, alfa, filstørrelse, rammestørrelse |
| 9 | Skygge må bakes inn i hver figur | Skygge tegnet av motoren under ankeret |
| 10 | Låst rom-kort viser ikke video-bakgrunn | Bruke `background.poster` |
| 11 | Ikonene 🏆 og 🏠 står fast i UI-et | Flytte dem til `presentation.labels` eller egne ikonfelt |
| 12 | Ingen lyd | Valgfri lyd per event eller utfall |

**Forslag til rekkefølge når vi skal endre kode:** 8 (sjekkverktøy) → 4 (portrett) → 5 (gear-stage på kortet) → 1–2 (rutenett og timing), og først deretter resten.
