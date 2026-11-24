# Dead Internet — plan: The Daily Record, Unfiltered og TokTok

_Godkjent 24. november 2026 med beslutningene i §0. Ingenting her er implementert ennå._
_Oppdatert 24. nov: Anders valgte rekkefølge A (§10) og la til kravet om flere mysterier i samme univers (§13)._
_Grunnlag: `main` etter PR #50 (kontekstsystem, oppdagelsestilstander, fase 3). Timeline (fase 4) bygges parallelt og berøres ikke._
_DESIGN.md og DEVPLAN.md oppdateres først etter at Timeline er merget (se §11 og §12)._

---

## 0. Beslutninger (Anders, 24. november 2026)

Planen er godkjent med disse justeringene:

1. **TokTok i The Quiet Account:** 3–5 valgfrie klipp med relevante spor. Saken må fortsatt kunne løses uten TokTok (blokkeringstesten i validatoren viser det).
2. **Personlig feed:** bygger på likes, følger og annen eksplisitt interaksjon i TokTok (for eksempel «Not interested»). Aldri på søkehistorikk fra Seeker eller andre apper.
3. **Navn:** Unfiltered og TokTok beholdes som arbeidsnavn, med egne logoer og egen visuell identitet.
4. **Video:** arkitekturen skal tåle 150 klipp eller flere. Første produksjonsrunde er 20–30 ekte klipp, resten plassholdere. Vi utvider etter at produksjonsflyt, kvalitet og ytelse er testet.
5. **Universdeling:** U0 og U1 (§13) er godkjent.
6. **Bakgrunnsinnhold kan bli bevis.** Det er ingen absolutt regel om at fyllinnhold aldri kan støtte en påstand. Et senere mysterium kan eksplisitt peke på eksisterende bakgrunnsinnhold som bevis (§8.1, §13.3). Det er viktig for langsiktig historiefortelling og gjenbruk.
7. **Casebook-elementer kan være uklassifiserte.** Nye bevis knyttes ikke automatisk til aktive saker. Spilleren velger én, flere eller ingen saker (§13.2).
8. **Ingen kvote på sannhet.** Regelen om maks 70 % sanne påstander per avis er fjernet. Innholdsrapporten viser fordelingen, men troverdighet skal komme fra historien og redaksjonelle interesser.
9. **Hybridmodell for mysterier (§13.2):**
   - spilleren kan velge et tilgjengelig startmysterium fra hovedmenyen
   - nye mysterier kan oppdages naturlig i verden
   - flere mysterier kan være aktive samtidig
   - spilleren kan utforske videre etter at en sak er avsluttet
   - kunnskap, bevis, relasjoner og konsekvenser følger med
   - mysterier kan ha forutsetninger, men følger ikke nødvendigvis en fast rekkefølge
10. **Ett vedvarende univers.** Nye mysterier er innholdspakker, ikke egne installasjoner eller kopier av verden.
11. **Det store spørsmålet står åpent.** Om det finnes ekte mennesker på nettet, skal ikke avgjøres av tilfeldige bakgrunnskontoer eller tidlige mysterier (§3.5, §3.6).
12. **Lag-grenser per mysterium.** Hvilke narrative lag (1–7) et mysterium kan avsløre, settes i mysteriet selv, ikke globalt. The Quiet Account avslører ikke lag 5–7. Fremtidige mysterier kan utforske dem (§5).

**Utviklingsrekkefølge:** Timeline → Rapportering og U0 → Universdeling U1 → Mediekjerne (M1) → The Daily Record og Unfiltered (M2) → Ferdigstille The Quiet Account → Resterende verktøyapper (Mail, Files, Contacts, Forensics, Archive) → TokTok (M3–M4) → Videre mysterier. Ingen utvidelse av fasen som pågår.

DESIGN.md og DEVPLAN.md oppdateres av hovedtråden.

---

## 1. Kort fortalt

- **Én nyhetsapp-motor, to aviser.** The Daily Record og Unfiltered blir samme app-modul (`app/apps/news.js`) med hver sin konfigurasjon, profil og design. Artiklene er fortsatt vanlige artefakter, så samme artikkel kan åpnes i nyhetsappen og på adressen i Browser.
- **TokTok bygges på det vi har.** En skaper er en vanlig `account` (med `claimsToBe` og `operatedBy`). Et klipp er en artefakt av typen `video`. Videoen selv er et nytt medieobjekt (`videos.json`) som fungerer som bildene: stabile id-er, opphav, transformasjoner og fiktiv metadata.
- **Ingen ny etterforskningslogikk trengs i første omgang.** Gjenbrukte footage finnes ved at nøkkelbilder i videoer er vanlige bilder, så bildesøket vi har finner dem. Identiske manus finnes med eksakt frasesøk på transkripsjoner. Slettede og endrede videoer bruker versjoner og cache.
- **Feeden er deterministisk og blind for relevans.** For You-feeden velges av en seedet algoritme i kjernen som bare ser på offentlige egenskaper (kategori, popularitet, hvem du følger, hva du har likt). Den vet ikke hva som er bevis. Validatoren nekter bevis som bare kan finnes ved å scrolle.
- **Innholdet er delte bassenger.** Bakgrunnsinnhold (katter, matlaging, sport, nekrologer …) ligger i gjenbrukbare `pools` som flere mysterier deler. Kommentarer og variasjon lages av et verktøy under utvikling og sjekkes inn som vanlig JSON. Spillet kjører aldri AI.
- **Rekkefølge:** Timeline → rapportering og U0 → universdeling U1 → mediekjerne (M1) → nyhetsappene (M2) → The Quiet Account ferdig → resterende verktøyapper → TokTok (M3–M4) → videre mysterier. Produksjon i ComfyUI (M5) går løpende (§10).

---

## 2. Hva vi kan gjenbruke

| Behov | Finnes allerede | Hva som må til |
|---|---|---|
| Artikler, datoer, versjoner, slettede artikler | `artifacts` med `versions[]`, `live: null`, `cached` | Nye felt: seksjon, byline, rettelser, relaterte, referanser, sponset |
| Historiske versjoner og Archive | Versjoner og cache i `core/artifacts.js`, «Cached copy» i Browser | Ingenting nytt for nyhetsappene. Archive (fase 7) leser det samme. |
| Visning av artikler | `renderArtifact` med `kind: "news"` | Flere byggeklosser: bildetekst og kreditering, rettelsesboks, relaterte, kommentarer som data |
| Kommentarer | Tolkes fra tekstlinjer (`@handle (tid): tekst`) | Strukturerte `comments[]` (kan ha egne versjoner, slettes, svare hverandre). Gammelt tekstformat støttes fortsatt. |
| Forfatterprofiler | `entities` (person) + `accounts` | Byline peker på konto. Forfatterside = liste over artefakter med samme `author`. |
| Hendelser fra flere kilder | `entities` med `kind: "event"` og `mentions` | Nytt felt `covers: [evt]` som knytter dekning av samme hendelse sammen (kun for validator og forfattere, aldri vist) |
| Bilder og manipulerte versjoner | `images.json` med `derivedFrom`, `transforms`, `manipulation`, `meta` | Ingenting. Videoer følger samme modell. |
| Bildesøk og flip-søk | `core/search.js`, bildeviseren | Nøkkelbilder i videoer registreres som bilder, så de søkes på samme måte |
| Fritt søk, frasesøk | `core/search.js` med `index`-nivåer | Plattformfilter (søk inne i en app), transkripsjoner og bildetekster indekseres |
| Kontekstmenyen | `ctx.register(...)` i `app/context.js` | Nye handlinger (§7). Ingen endring i appene. |
| Oppdagelse | `core/discovery.js` (unknown/encountered/investigated/saved) | Å se et klipp gir `encountered`, profil og søk gir `investigated`, som i dag |
| Varsler | `notify` + regler på `day.start` | «Breaking»-varsler fra nyhetsappene og «X postet en ny video» |
| Tid | Tiden går bare ved Sleep | Ingenting. Å scrolle koster ingen tid (krav i §6.6). |
| Grafikk | `graphics/catalog.json`, plassholdere, `media.js` | Egen `videos`-seksjon i katalogen og plassholdere for video (§9) |
| Lagring | `save.js` med migreringer (versjon 2) | Versjon 3: følger, likes, lagrede klipp, feed-posisjon |

**Konklusjon:** Nyhetsappene er hovedsakelig nye visninger av data vi allerede har, pluss noen artikkel-felt. TokTok krever ett nytt medieobjekt (video), en feed-algoritme og en ny app, men etterforskningen kan gjenbruke søk, bilder, versjoner og kontekstmenyen.

---

## 3. Verdensmodell: nye og utvidede typer

### 3.1 Utsalg (outlets)
En avis eller plattform er fortsatt en `platform` i `platforms.json`, med en tilhørende organisasjon i `entities.json`. Nytt er en valgfri `app`-blokk:

```json
{ "id": "dailyrecord", "name": "The Daily Record", "kind": "news", "domain": "dailyrecord-pc.com",
  "org": "org_dailyrecord",
  "app": { "id": "dailyrecord", "template": "news", "theme": "record", "icon": "newspaper",
           "sections": ["breaking", "local", "politics", "business", "technology", "culture",
                        "lifestyle", "obituaries", "opinion", "sponsored"],
           "commentsPlatform": "dailyrecord" } }
```

- `template: "news"` betyr at appen lages av `app/apps/news.js`. Unfiltered får samme mal med `theme: "unfiltered"` og egne seksjoner (for eksempel «Investigations», «Leaks», «Whistleblowers», «They don't want you to know», «Reader tips»).
- Hjemskjermen leser appene fra plattformene, så en tredje avis senere er bare innhold.

### 3.2 Artikler (utvidet `article`)
Alle nye felt er valgfrie. Eksisterende artikler fungerer uendret.

| Felt | Betyr |
|---|---|
| `section` | Seksjon i appen |
| `byline` | Konto-id(er) for forfatter. Fritekst («Staff», «Unfiltered Desk») er lov. |
| `images[]` | Som i dag. Ny `credit` per bilde i artikkelen («Photo: Daily Record photo desk», «Reader submitted») |
| `related[]` | Artikkel-id-er som vises under «Related». Skrives for hånd eller lages av verktøyet etter seksjon og stikkord. |
| `corrections[]` | `{date, text}`. Vises som rettelsesboks. Kan høre til en versjon. |
| `refs[]` | Eksterne referanser: artefakt-id-er, adresser, eller TokTok-klipp. Vises som lenker nederst. |
| `sponsored` | `{by: org}`. Vises som «Sponsored by …» (slik ekte aviser gjør, ikke som et hint). |
| `comments[]` | Strukturerte kommentarer (§3.4) |
| `covers[]` | Hendelser artikkelen dekker. Usynlig for spilleren. Brukes av validatoren og innholdsverktøy. |
| `pool` | Hvilket innholdsbasseng artikkelen hører til (§8) |

Slettede artikler er `live: null` som i dag. En avis kan også «avpublisere» stille (versjon uten merknad) eller med merknad («This article has been removed»).

### 3.3 Video (nytt medieobjekt, `videos.json`)
Speiler `images.json`, så Forensics, katalog og validator kan behandle begge likt.

```json
{ "id": "VID0142", "kind": "clip", "duration": 14, "poster": "VID0142P",
  "derivedFrom": null, "transforms": [],
  "frames": [{ "t": 3, "image": "VID0142F1" }, { "t": 9, "image": "VID0142F2" }],
  "scenes": [{ "from": 0, "to": 14, "location": "loc_kitchen_set_03", "depicts": [] }],
  "script": "SCR_morning_routine", "audio": "SND_trend_017",
  "meta": { "uploaded": "2026-02-03 21:14", "device": "Lumen 9", "encoder": "ClipKit 2.1", "location": null },
  "manipulation": null, "source": "toktok-kayla" }
```

- `frames` er nøkkelbilder. Hver er et vanlig bilde i `images.json` med `derivedFrom` til en felles original når klippet bruker gjenbrukt footage. Da finner dagens bildesøk alle klipp med samme bakgrunn eller opptak. Ingen ny søkemotor.
- `scenes[].location` er en kanonisk (skjult) beskrivelse av settet. To «urelaterte» skapere med samme `location` er et gjenbrukt studio. Spilleren må selv se det, eller finne det med bildesøk på et nøkkelbilde.
- `script` peker på `scripts.json` (transkripsjoner). Like manus gir like transkripsjoner, med små variasjoner. Frasesøk («"I was today years old"») finner dem.
- `transforms` for video: `reupload`, `crop`, `mirror`, `speed`, `reencode`, `trim`, `overlay`. En speilvendt reupload finnes bare med flip-søk, som for bilder.
- Spilleren ser aldri `scenes`, `location`, `source` eller `script`-id. Hun ser klippet, bildeteksten, transkripsjonen («Show transcript») og metadataen «Video info» viser.

### 3.4 Strukturerte kommentarer
```json
{ "id": "c1", "account": "acc_tt_bean", "date": "2026-02-03 21:20", "text": "my cat does this exact thing 😭",
  "likes": 4120, "replyTo": null, "deletedIn": null, "pinned": false }
```
Brukes av artikler, Connect-innlegg og TokTok. Kommentarer fra bassenger (§8) kan peke på kontoer som bare finnes som navn i bassenget (lette kontoer, se 3.5).

### 3.5 Lette kontoer
TokTok og kommentarfelt trenger hundrevis av kontoer. Å skrive full `account` for hver er for tungt. Derfor får `accounts` en lett variant i bassengfiler (`{id, platform, handle, displayName, avatar?, pool}`) uten historie. Motoren behandler dem som vanlige kontoer. Kanon sier ingenting om dem (`operatedBy` udefinert = ukjent), noe som passer premisset: ingen vet hvem de er. Validatoren skal hindre at lette kontoer eller tidlige mysterier gir et svar på om det finnes mennesker på nettet (§0 punkt 11).

### 3.6 Kanon som kan stå åpen
De store spørsmålene (har avisen ekte journalister, finnes det mennesker igjen) skal ikke besvares i The Quiet Account, og kanskje ikke i noe enkelt mysterium. Modellen:

- `isHuman: null` og manglende `operatedBy` betyr **uavklart kanon**, ikke «falsk».
- Validatoren nekter at en påstand i et aktivt mysterium avhenger av uavklart kanon. Da kan senere mysterier bestemme sannheten uten å motsi tidligere saker.
- Nytt valgfritt felt på personer og kontoer: `selfModel` (`"believes-human"`, `"knows-synthetic"`, `"unknown"`). Skjult kanon. Gjør det mulig å skrive syntetiske personer som tror de er mennesker, og la dialog og innhold være konsistent med det.
- Nytt felt `layer` (1–7) på innhold som berører det store narrativet (§5). Skjult. Brukes bare av validatoren og forfattere, sammen med lag-grensene hvert mysterium setter selv (§5).

---

## 4. Appene

### 4.1 The Daily Record (`news`-malen)
- **Forside:** toppsak, «Breaking»-stripe, seksjonsfaner (horisontal rulling), siste nytt. Listen bygges av motoren (`game.feed("dailyrecord", {section})`): synlige artikler fra plattformen, nyeste først, filtrert på `visibleIf` og spilldag.
- **Artikkel:** samme `renderArtifact` som Browser, med tittel, ingress, byline (trykk gir kontekstmenyen, med «Author profile»), bilder med kreditering, brødtekst, rettelser, «Related», referanser og kommentarer.
- **Forfatterside:** profilbilde, kort bio fra kontoen, liste over artikler. Spilleren kan selv legge merke til at en journalist skriver 40 artikler om dagen, eller ikke har noe liv utenfor bylinen.
- **Søk i appen:** samme `core/search.js` med plattformfilter.
- **Kommentarer:** strukturerte, kan sorteres «Top/Newest». Slettede kommentarer forsvinner fra live-versjonen men kan ligge i cache.
- **Historikk:** «This article was updated» lenker til versjonsvelgeren vi allerede har. Slettede artikler gir «Page not found», med «Cached copy» der den finnes.
- **Del:** «Copy link», «Open in Browser», «Save to Casebook», «Send to…» (eksisterende kontakter).
- **Varsler:** «Breaking» på låseskjermen når en regel publiserer en artikkel på `day.start`.

Den samme artikkelen åpnes også på `dailyrecord-pc.com/...` i Browser. Det er ett objekt, med to presentasjoner.

### 4.2 Unfiltered
Samme mal, annen tone og design: mørkere, tettere, store titler, «REPORTER UNKNOWN»-bylines, tipsboks, lekkede dokumenter (dokument-artefakter på Docshare), «Donate to keep us independent». Egen seksjonsliste. Eget kommentarfelt som er mer aktivt og mer giftig.

**Balanse mellom avisene** (innholdsregel, sjekkes av verktøyet `tools/media-report.mjs`):
- Begge aviser har både sanne, delvis sanne, misforståtte og oppdiktede påstander i kanon.
- For hver hendelse som begge dekker, varierer det hvem som har mest rett.
- Rapporten viser fordelingen av sanne, delvis sanne og usanne påstander per avis, uten kvote. Troverdigheten skal komme fra historien og avisenes interesser (§0 punkt 8).

### 4.3 TokTok
**Grensesnitt (mobil-først):**
- Fullskjerms vertikale klipp, sveip opp/ned. Faner: «For You» og «Following». Søk øverst.
- Høyre kolonne: avatar (følg), like, kommentarer, lagre, del. Nederst: @handle, bildetekst, lyd.
- Trykk pauser. Langt trykk gir kontekstmenyen for klippet (Video info, Show transcript, Search by frame, Save to Casebook, Not interested).
- Bildetekst, transkripsjon og kommentarer går gjennom `ctx.text()` som all annen tekst, så navn og hashtags kan trykkes uten å se annerledes ut.
- Profil: avatar, bio, følgere og likes, rutenett av klipp med visningstall, faner «Videos» og «Liked» (hvis offentlig).
- Søk: kontoer, klipp (bildetekst, hashtags, transkripsjon) og lyder.
- Visningstall, likes og følgere er tall i innholdet. Ingen av dem er klikkbare lister over ekte brukere. «Millions of views and no one you can find» er en del av opplevelsen.

**Teknisk:**
- Bare tre klippelementer i DOM (forrige, nåværende, neste) som gjenbrukes. Bare neste klipp forhåndslastes.
- Lyd er av til spilleren slår den på, som i dagens spill på siden.
- Plassholder-modus (§9.3) gjør at alt fungerer før en eneste video er produsert.

**Feed-algoritmen (`core/feed.js`, uten DOM):**
- Deterministisk: seed = lagringens seed + dag + posisjon. Samme lagring gir samme feed, så replay og tester fungerer.
- Vekter bare offentlige egenskaper og eksplisitt interaksjon i TokTok: kategori, popularitet, alder, skapere spilleren følger, og kategorier spilleren har likt eller valgt «Not interested» på. Aldri søkehistorikk fra Seeker eller andre apper (§0 punkt 2).
- **Vet aldri hva som er bevis.** Funksjonen får ikke tilgang til `supports`, kanon eller mysterier. Testen sjekker dette ved å kjøre feeden på en verden der alle `supports` er fjernet, og kreve identisk resultat.
- Bevis-klipp ligger i feeden med samme sannsynlighet som et vanlig klipp i samme kategori. Ingen ekstra vekt, ingen skjult garanti.
- Når bassenget er brukt opp, begynner feeden å gjenta seg med små variasjoner. Det er bevisst: et uendelig internett laget av et endelig antall ting.

### 4.4 Felles for alle tre
- Hver app har egen tilbakestabel og bevart tilstand (eksisterende navigasjon).
- Lenker mellom appene bruker `returnTo`, så «◂ The Daily Record» fører tilbake fra en TokTok-profil.
- Alle appene leser bare det spilleren kan se. Ingen app markerer relevans, og ingen app sorterer etter relevans.

---

## 5. Det store narrativet i innholdet

Escalasjonsstigen (1: enkeltkontoer syntetiske → 7: spilleren tviler på seg selv) blir en skjult `layer`-tagg på innhold, ikke et system spilleren ser.

Hvert mysterium setter sine egne grenser i `mystery.json`, for eksempel:

```json
"layers": { "reveal": [1, 2], "hint": [3, 4], "background": [5] }
```

- `reveal`: lag saken kan avsløre og la spilleren bevise.
- `hint`: lag saken kan antyde gjennom tvil og sprekker, men ikke bekrefte.
- `background`: lag som kan finnes i bakgrunnsinnhold uten forklaring.
- Lag som ikke er listet, kan ikke berøres av saken.

Det finnes ingen global grense. Fremtidige mysterier kan avsløre lag 5–7. The Quiet Account bruker grensene i tabellen:

| Lag | Eksempel i innhold | The Quiet Account |
|---|---|---|
| 1 | Én konto er en marionett (Mara-kontoen) | `reveal`, kjernen i saken |
| 2 | Et nettverk av kontoer (Brightline-personas) | `reveal` |
| 3 | Selskapet bak har kanskje ingen mennesker | `hint` (tvil om Brightlines ledelse) |
| 4 | Avisene kan være syntetiske | `hint`: små sprekker, som en journalist som aldri svarer eller en byline som skriver for mye |
| 5 | Hendelser er oppdiktet | `background`: bare i bakgrunnsinnhold, uten forklaring |
| 6 | Finnes det andre mennesker? | ikke berørt |
| 7 | Er spilleren et menneske? | ikke berørt |

Konkrete «sprekker» som kan legges i bakgrunnsinnholdet nå, uten å forklare noe:
- To TokTok-skapere med identiske manus om forskjellige produkter.
- En Daily Record-journalist og en Unfiltered-skribent med samme skrivefeil i samme uke.
- En nekrolog over en person som postet på TokTok dagen etter.
- Et produkt som anmeldes av 30 skapere og ikke finnes på noen nettbutikk.
- En TokTok-skaper som lager en video om «hvordan du gjenkjenner AI-kontoer», med kommentarer fra kontoer som bruker de samme frasene.
- Forbrukere av appene blir aldri vist. Ingen «Your friend liked this».

Validatoren sjekker for hvert mysterium:
- Innhold som `supports` en påstand i saken, har bare lag fra `reveal`.
- Innhold på `hint`-lag er aldri nødvendig for å løse saken (blokkeringstesten).
- Saken selv og innhold den peker på som bevis bruker ingen lag utenfor `reveal`, `hint` og `background`.

---

## 6. Etterforskning på TokTok (og i nyhetsappene)

### 6.1 Konfigurerbart per mysterium
`mysteries.json` får `platforms` (valgfritt) som sier hvor saken har bevis. Det brukes bare av validatoren og verktøyene (dekning, rapporter). Spillet bruker det ikke, så det gir ingen hint.

### 6.2 Mekanikker og hvordan de bygges

| Mekanikk | Bygges med |
|---|---|
| Kjenne igjen person eller sted i bakgrunnen | Nøkkelbilder (`frames`) med `depicts`. Spilleren ser det selv, eller bildesøker på nøkkelbildet («Search by frame») og finner originalfoto eller andre klipp. |
| Gjenbrukt footage | `derivedFrom` på nøkkelbilder. Bildesøk og flip-søk som i dag. |
| Sammenligne publiseringsdatoer | `meta.uploaded`, artikkeldatoer og Timeline (spilleren bygger selv) |
| Videometadata | «Video info»: opplastet, enhet, koder, varighet, ev. «edited». Fiktiv, som EXIF i dag. |
| Identiske manus | Transkripsjon som tekst + frasesøk i Seeker og i TokTok-søket |
| Skaperidentitet | Profil, Connect-søk, kontekstmenyen, avatarbilde (bildesøk finner Faceless Stock) |
| Koordinert aktivitet | Profilene viser «Joined», antall klipp og datoer. Spilleren ser at 12 kontoer ble opprettet samme dag. Senere: Forensics «Account activity» (fase 7) viser observasjoner, aldri konklusjoner. |
| Motsigelser mellom video og nyhet | Samme hendelse (`covers`/`depicts`) med ulike detaljer. Ingen markering. |
| Slettede og endrede videoer | `versions[]` og `live: null` på video-artefakten. Cache via Seeker eller (senere) Archive. «This video is unavailable». |

### 6.3 Ingen bevis som bare finnes ved å scrolle
Ny validatorregel: hver artefakt (klipp, artikkel, kommentar) som `supports` en påstand i et aktivt mysterium må kunne nås på minst én måte som ikke er feeden:
- fritt søk (Seeker eller appsøk), eller
- profilen til en konto spilleren kan finne, eller
- en lenke eller referanse fra annet innhold som kan nås.

De automatiske spillerne i validatoren får **ikke** lov til å bruke feeden, så de beviser at saken kan løses uten å scrolle.

### 6.4 Ingen synlig relevans
- Bevis-klipp har samme produksjonskvalitet, lengde og tallnivå som klipp i samme kategori. `tools/media-report.mjs` advarer hvis bevis skiller seg ut (for eksempel mye lavere visningstall enn snittet for kategorien) med mindre det er bevisst (`"outlier": true`).
- Ingen spesiell ikon, farge eller animasjon i noen app.

### 6.5 Oppdagelse
- Å se et klipp i feeden: klippet blir `seen`, skaperen `encountered`. Navn i bildetekst blir `encountered`.
- Profil åpnet, konto søkt opp, eller valgt i kontekstmenyen: `investigated`, som i dag.
- Å like eller følge gir ingen kunnskap og fyller ingen verktøy.

### 6.6 Scrolling koster ingenting
- Tiden går fortsatt bare ved Sleep.
- Nye hendelser `video.view`, `video.like`, `feed.scroll` kan brukes av regler for stemning (for eksempel en melding fra en venn «stop doomscrolling 😂»), men validatoren nekter regler på disse hendelsene som endrer troverdighet, frister, tillit eller avslutninger.

---

## 7. Kontekstmenyen: nye handlinger
Registreres med `ctx.register` som i dag. `when` bruker bare det spilleren kan se.

| Handling | Når |
|---|---|
| Search TokTok | Alle tekster og navn |
| Search The Daily Record / Unfiltered | Alle tekster og navn |
| Open on TokTok | @handle som finnes på TokTok og er møtt |
| Author profile | Byline |
| Show transcript | Klipp |
| Video info | Klipp |
| Search by frame | Klipp (velg nøkkelbilde, så vanlig bildesøk) |
| Flip & search frame | Klipp |
| Save to Casebook | Klipp (lagres med versjon og tidspunkt), artikkel, kommentar |
| Add to Timeline | Dato i artikkel og «Uploaded» i Video info (kommer med fase 4) |
| Not interested | Klipp i feeden (påvirker bare feeden) |

---

## 8. Innholdsarkitektur og bassenger

### 8.1 Mapper
```
content/
  world/                 dagens verden (The Quiet Account) – urørt
  pools/                 delte bassenger, gjenbrukes av alle mysterier
    news-dailyrecord/    articles.json, authors.json
    news-unfiltered/     articles.json, authors.json, leaks.json
    toktok/              creators.json, videos.json, scripts.json, sounds.json, comments.json
    comments/            generelle kommentarmaler per tone (støttende, troll, bot-aktig …)
  manifest.json          lister hvilke world- og pool-filer som lastes
```
- Et basseng er bare JSON i samme format som verdenen. `content.js` laster dem som i dag via manifestet.
- Bassenginnhold er `filler: true`. Det støtter ingen påstand av seg selv, men et mysterium kan eksplisitt gjøre eksisterende bakgrunnsinnhold til bevis (`evidence: [{artifact, supports}]` i `mystery.json`). Innholdet endres ikke, og samme id gjelder. Ellers ligger bevis i mysteriets egne filer og kan bruke kontoer og steder fra bassengene (§0 punkt 6).
- Et nytt mysterium kan legge til i et basseng, men ikke endre eksisterende id-er.

### 8.2 Stabile id-er
| Type | Mønster | Eksempel |
|---|---|---|
| Artikkel, Daily Record | `DR-<år>-<nnnn>` | `DR-2026-0141` |
| Artikkel, Unfiltered | `UF-<år>-<nnnn>` | `UF-2026-0033` |
| TokTok-klipp (artefakt) | `TT-<nnnnn>` | `TT-00412` |
| Video (medieobjekt) | `VID<nnnn>` + `P` (poster), `F1…` (nøkkelbilder) | `VID0412`, `VID0412P`, `VID0412F1` |
| Manus | `SCR_<navn>` | `SCR_morning_routine` |
| Lyd | `SND_<navn>` | `SND_trend_017` |
| Konto i basseng | `acc_tt_<handle>`, `acc_dr_<navn>`, `acc_uf_<navn>` | `acc_tt_kaylacooks` |
| Bilde | `IMG<nn>` som i dag, nyhetsbilder `NIMG<nnnn>`, portretter `PORT<nnnn>`, annonser `AD<nnnn>` | `NIMG0007` |

Eksisterende id-er (`A11`, `IMG02` …) beholdes.

### 8.3 Generering under utvikling (ikke i spillet)
- `tools/expand-pools.mjs` lager kommentarer, visningstall, likes og relaterte artikler fra maler og en fast seed, og skriver resultatet til JSON som sjekkes inn. Kjøres manuelt. Kan bruke lokal AI eller Claude til tekstutkast, men resultatet er alltid statiske filer med manuell QA og validator.
- Spillet laster bare ferdige filer. Ingen AI ved kjøring, ingen nettverkskall ut av spillet.

### 8.4 Innholdsbehov (MVP)

**The Daily Record** (bygger på de 15 artiklene som finnes)
- 45–60 artikler fordelt på de ti seksjonene, spredt over ca. 18 måneder før spilldag 1, pluss 1–2 nye per spilldag.
- 8 journalister/forfattere med profil (Dana er en av dem) + «Staff» og «Wire».
- 6 rettelser, 4 endrede artikler, 3 slettede (minst én uten forklaring).
- 5 sponsede artikler (Northgate, Kestrel, et produkt som også finnes på TokTok).
- 6 nekrologer. Én av dem er en «sprekk» (§5).
- 12 artikler med kommentarfelt (ca. 8–30 kommentarer hver, fra bassenget).

**Unfiltered**
- 25–35 artikler: 6 gravesaker, 4 lekkasjer (med dokument på Docshare), 6 konspirasjoner, 6 sensasjonsoppslag, resten kommentar og «leserinnsendt».
- 4 skribenter, flere med bare pseudonym.
- 5 hendelser som dekkes av begge avisene med ulike detaljer. Minst én av hver: DR har rett, UF har rett, begge tar feil, ingen kan avgjøres.
- 2 bilder som også brukes av Daily Record, ett av dem beskåret eller manipulert.

**TokTok** (MVP med plassholdere)
- 40 skapere i 13 kategorier, pluss ca. 200 lette kontoer til kommentarer.
- 120–150 klipp (8–20 s), ca. 10 per kategori, som plassholdere. Første produksjonsrunde gir 20–30 ekte klipp (§9.2).
- Mønstre: 4 manusklynger (3–6 klipp hver), 3 gjenbrukte sett/bakgrunner, 3 produkter som ikke finnes, 2 skapere med livshistorier som motsier hverandre, 1 «slik avslører du AI-kontoer»-serie, 1 «skaper svarer på kommentarer fra en annen bot»-tråd.
- 6 lyder (trender) som går igjen.

**The Quiet Account på TokTok**
3–5 valgfrie klipp med relevante spor, som gir **ekstra** kilder, men aldri er nødvendige. Eksempler:
- En forbipasserende filmet fjerningen av Calder Mill-skiltet (nøkkelbilde matcher IMG03 fra en annen vinkel, med en tidsstempel som ikke stemmer med «Mara»-innlegget).
- En Waterfront-«influencer» med samme formulering som Mara-kontoen (manusklynge).
- Juno Park-kontoen har også TokTok, med samme syntetiske portrett.
Saken skal fortsatt kunne løses uten TokTok, og validatorens blokkeringstest skal vise det.

---

## 9. Grafikk og video (lokal ComfyUI)

### 9.1 Katalogen
`graphics/catalog.json` får en `videos`-seksjon, og bilder får nye `kind`-verdier (`news`, `portrait`, `ad`, `thumb`, `frame`, `poster`).

```json
{ "id": "VID0412", "file": "assets/video/vid0412.mp4", "alt": "assets/video/vid0412.webm",
  "poster": "VID0412P", "width": 720, "height": 1280, "duration": 14, "fps": 24,
  "status": "placeholder", "usedIn": ["TT-00412"], "pool": "toktok",
  "workflow": "comfy/tt-kitchen-v1", "seed": 418812, "refs": ["face_kayla"],
  "brief": "Woman in her twenties in a bright kitchen set, talking to camera, holding a jar." }
```
- `workflow` og `seed` gjør det mulig å lage klippet på nytt.
- `refs` peker på faste ansiktsreferanser (som Mara i dag), slik at samme skaper ser lik ut i alle klipp.
- Manipulerte og alternative versjoner er egne id-er med `derivedFrom`, som bildene.
- Nøkkelbildene (`F1`, `F2`) hentes fra den ferdige videoen med et verktøy (`tools/extract-frames.mjs`, ffmpeg lokalt), så de alltid matcher.

### 9.2 Format og størrelse
- 720×1280, 8–20 s, H.264 MP4 (+ WebM som alternativ), mål under 1,5 MB per klipp. Poster i WebP.
- Lazy loading, bare neste klipp forhåndslastes. Service workeren (fase 6) cacher bare det som er sett.
- Arkitekturen skal tåle 150+ klipp (ca. 200 MB ved 150). Første produksjonsrunde er 20–30 ekte klipp (ca. 30–45 MB), resten plassholdere. Vi utvider etter test av produksjonsflyt, kvalitet og ytelse (§0 punkt 4).

### 9.3 Plassholdere
- `make-placeholders.mjs` lager SVG-poster og nøkkelbilder per id, som i dag.
- Plassholder-videoen er ingen fil: TokTok viser posteren med en langsom zoom/pan, bildetekst og en fremdriftslinje i klippets lengde. Det føles som video og gjør feeden testbar før produksjon.
- Når filen finnes i `assets/video/`, brukes den automatisk (samme mønster som `media.js` i dag).

### 9.4 Produksjonsrekkefølge
1. Ansiktsreferanser for de 40 skaperne og 12 journalistene.
2. Originaler (sett, bakgrunner, fotografier) før avledninger.
3. Klipp.
4. Uttrekk av nøkkelbilder, så avledede og manipulerte versjoner.
5. `graphics-report.mjs` oppdaterer GRAPHICS.md med status per id.

---

## 10. Faser

Forutsetning: fase 4 (Timeline) og fase 5 (rapportering) er merget, og universdelingen i §13 (U1) er gjort. Medie-kjernen endrer `core/world.js`, `core/search.js`, `save.js` og validatoren, som Timeline-grenen også kan berøre, så vi starter ikke før Timeline er inne.

**M1 — Medie-kjerne uten UI** (ca. 1 økt)
- Artikkelfelt (seksjon, byline, rettelser, relaterte, refs, sponset, comments[], covers)
- `videos.json`, `scripts.json`, lette kontoer, `pools/` i manifestet
- `core/feed.js` (deterministisk, blind for relevans) og plattformfilter i søk
- Lagring versjon 3 (følger, likes, lagrede klipp, feed-posisjon) med migrering
- Validator: ingen feed-only-bevis, bakgrunnsinnhold støtter bare påstander når et mysterium eksplisitt peker på det, uavklart kanon, lag-grenser per mysterium, scroll-hendelser kan ikke ha konsekvenser
- Tester, inkludert «feeden er lik uten `supports`»

**M2 — The Daily Record og Unfiltered** (ca. 1–2 økter)
- `app/apps/news.js` med to temaer, forside, seksjoner, artikkel, forfatterside, kommentarer, søk, del
- Hjemskjerm med flere apper (rutenett + dokk)
- Kontekstmenyhandlinger og «Breaking»-varsler
- Innhold: Daily Record-pakke og Unfiltered-pakke (§8.4), `tools/media-report.mjs`
- Playwright-test på iPhone- og Pixel-størrelse

**M3 — TokTok med plassholdere** (ca. 2 økter)
- Vertikal sveip, For You og Following, profil, kommentarer, likes, lagre, del, søk
- Plassholder-video, tre gjenbrukte klippelementer, lyd av som standard
- Kontekstmeny: Video info, Show transcript, Search by frame
- Innhold: 40 skapere, 120–150 klipp som plassholdere, mønstrene i §8.4

**M4 — TokTok som etterforskningsplattform** (ca. 1 økt)
- Nøkkelbilde-søk, slettede/endrede klipp, cache
- 3–5 valgfrie Quiet Account-klipp, med blokkeringstest som viser at saken kan løses uten dem
- Koblingen til Forensics (ferdig før TokTok etter rekkefølgen)

**M5 — Produksjon** (løpende, utenfor kode)
- ComfyUI-videoer og bilder etter katalogen, nøkkelbilder, avledede versjoner, størrelsesbudsjett

### Plassering i den samlede planen (besluttet 24. nov: A)
**Valgt rekkefølge (§0):** Timeline → Rapportering og U0 → U1 → M1 → M2 → The Quiet Account ferdig → Mail/Files/Contacts/Forensics/Archive → M3 + M4 TokTok → videre mysterier. M5 (produksjon) går løpende, med 20–30 ekte klipp i første runde.

---

## 11. Endringer i DESIGN.md (gjøres av hovedtråden etter Timeline-merge)

1. **Nytt avsnitt øverst: «Premiss og narrativ retning».** Kort om at Dead Internet handler om muligheten for at det ikke er noen mennesker igjen på nettet, at The Quiet Account er første sprekk, og at spørsmålene ikke besvares der. De ti designprinsippene fra Anders legges inn som punkter.
2. **Prinsipper:** nytt punkt 7: «Ingen visuell relevans. Ingen app markerer, sorterer eller vekter etter hva som er bevis.» Nytt punkt 8: «Underholdning finnes uavhengig av etterforskningen. Å utforske koster ingen tid.»
3. **Mappestruktur:** `content/pools/`, `core/feed.js`, `app/apps/news.js`, `app/apps/toktok.js`, `assets/video/`, `tools/expand-pools.mjs`, `tools/media-report.mjs`, `tools/extract-frames.mjs`.
4. **Verdensmodellen:** nye rader for Video, Script, Sound, lette kontoer. Artikkel-raden får de nye feltene. Platform får `org` og `app`.
5. **Kanon:** nytt underavsnitt «Uavklart kanon og lag» (`isHuman: null`, `selfModel`, `layer`, lag-grenser per mysterium) fra §3.6 og §5.
6. **Søk:** plattformfilter, transkripsjoner og bildetekster indekseres, «Search by frame».
7. **Nytt avsnitt «Feed»:** algoritmen, determinisme, relevansblindhet, gjentakelse, ingen tidskostnad.
8. **Kontekstsystemet:** de nye handlingene fra §7.
9. **Oppdagelse:** regler for klipp i feed (§6.5).
10. **Tid og regler:** nye hendelser `video.view`, `video.like`, `feed.scroll`, `article.open` (finnes som `artifact.open`) og forbudet mot konsekvenser.
11. **Validator:** de nye reglene fra M1.
12. **Grafikk:** video i katalogen, plassholder-video, produksjonsrekkefølge.
13. **Nytt avsnitt «Univers og mysterier»** fra §13: hva som er felles, hva som hører til et mysterium, sakstilhørighet i Casebook, relative frister, varige konsekvenser.
14. **Appkart:** tolv apper i Anders' rekkefølge, med status og hva de bygger på:

| App | Status | Bygger på |
|---|---|---|
| Browser (inkl. Archive og cache) | ferdig, Archive planlagt | versjoner og cache |
| Connect | ferdig | – |
| Messages | ferdig | – |
| Casebook (Evidence, Theories, Notes, Timeline) | Timeline under arbeid | – |
| Settings | ferdig | – |
| Mail | planlagt | e-post-artefakter |
| Files | planlagt | vedlegg og lagrede dokumenter |
| Contacts | planlagt | `contacts()` |
| Forensics | planlagt | bildeviseren, bildesøk, videometadata |
| The Daily Record | planlagt (M2) | `news`-malen, artefakter |
| Unfiltered | planlagt (M2) | `news`-malen, artefakter |
| TokTok | planlagt (M3–M4) | video, feed, bildesøk |

## 12. Endringer i DEVPLAN.md (gjøres av hovedtråden etter Timeline-merge)

1. «Prioritert rekkefølge videre» erstattes av rekkefølgen i §0: Timeline → rapportering og U0 → U1 → M1 → M2 → The Quiet Account ferdig → resterende verktøyapper → TokTok (M3–M4) → videre mysterier.
2. Ny fase **«Medier: The Daily Record og Unfiltered»** med oppgavene fra M1 og M2.
3. Ny fase **«TokTok»** med oppgavene fra M3 og M4.
4. Fase 6 («levende verden og produksjon»): «60+ fyllartefakter» erstattes av innholdspakkene i §8.4. ComfyUI-video (M5) starter med 20–30 ekte klipp.
5. Fase 7: Forensics får «videometadata og nøkkelbilder» og «sammenligning av artikkelversjoner».
6. Fase 9 (utvidelse): lenke til narrativstigen (§5) som retning, ikke rekkefølge.
7. Fase 5 (rapportering) får oppgavene fra U0 i §13: rapporter, kanaler og vurdering per mysterium, ikke mot The Quiet Account.
8. Ny fase **«Univers og mysteriepakker» (U1)** før M1, med oppgavene i §13.

---

---

## 13. Flere mysterier i samme univers (krav fra Anders, 24. nov)

The Quiet Account er første mysterium, ikke spillet. Personer, medier, selskaper, apper og bakgrunnsinnhold skal gjenbrukes. Casebook, rapportering, bevis, teorier og Timeline skal ikke være knyttet til én sak. Valg av mysterium bygges ikke nå, men arkitekturen skal støtte hybridmodellen i §0 punkt 9.

### 13.1 Hva som er bundet til The Quiet Account i dag
Gjennomgang av `main` etter PR #50:

| Sted | Hva som er saksspesifikt |
|---|---|
| `world/meta.json` | `startDate`, `startKnown` (premisset), `logins` (Iris), `publishing.channels` (Dana som reviewer), `testing.coreClaims`/`maxDays` |
| `world/mysteries.json` | Riktig modell allerede, men alle mysterier evalueres hele tiden, og fristene (`beforeDay: 8`) er absolutte spilldager |
| `canon.json`, `rules.json`, `characters.json` | Felles universfakta og saksspesifikke påstander, regler og svar ligger i samme filer |
| `state` | Bevis, teorier, notater og publiseringer har ingen sakstilhørighet |
| `app/apps/casebook.js` | Tom-tekst med «Brightline operates @maraquinn» |
| Validator og simulator | Leser én `testing`-blokk, altså én sak |

Kjernen (`core/`) har ellers ingen hardkodede id-er fra saken. Det meste er altså en flytting av data, ikke en omskriving.

### 13.2 Målmodell
```
content/
  universe/            felles for alle mysterier
    meta.json          universets id, startdato, spiller, generelle strenger
    entities.json  accounts.json  platforms.json  images.json  videos.json
    canon.json         universfakta (inkl. uavklart kanon, §3.6)
    characters.json    personer, grunnkunnskap og generelle svar
    artifacts/         bakgrunnsinnhold som ikke tilhører en sak
  pools/               delte bassenger (§8)
  mysteries/
    quiet-account/
      mystery.json     id, tittel, start (premiss, startKnown, startArtifacts, logins),
                       startsWhen, frister, claims, endings, publishing (kanaler, reviewer),
                       testing (coreClaims, seedQueries, maxDays), layers (§5),
                       evidence (bakgrunnsinnhold som bevis), strings
      artifacts/  canon.json  rules.json  characters.json (tillegg per person)
  manifest.json        universe + liste over mysterier som lastes
```
- **Sammenslåing ved lasting.** `content.js` laster universet og så hvert mysterium. Et mysteriums `characters.json` utvider en eksisterende person (`extends: "dana"`) med kunnskap og svar for den saken. Id-er er globale og må være unike (validatoren sjekker). Nye mysterier bruker prefiks (`PE_` for Project Echo); eksisterende id-er beholdes.
- **Hybridmodell for mysterier.** `state.cases` = `{ quiet_account: { status: "active", startedDay: 1 } }`. Status: `locked` → `available` → `active` → `closed`.
  - `requires` (forutsetninger: flagg, avsluttede saker, oppdaget innhold) gjør en sak `available`. Ingen fast rekkefølge.
  - `start.menu: true` gjør at saken kan velges som startmysterium fra hovedmenyen.
  - `start.discover` (vanlig hendelse eller betingelse, for eksempel at spilleren åpner en bestemt artikkel eller får en melding) starter saken naturlig i verden.
  - Flere saker kan være `active` samtidig. Avslutninger evalueres bare for aktive saker.
  - En `closed` sak stopper ikke spillet. Verden, appene og andre saker fortsetter.
  - Kunnskap, bevis, relasjoner og konsekvenser følger alltid med, fordi de er universtilstand.
  - Hovedmenyen bygges ikke nå, men modellen støtter den uten endringer.
- **Relative frister.** Betingelser får `beforeCaseDay` (dag regnet fra sakens start). `beforeDay` beholdes for univershendelser. Quiet Account-avslutningene migreres til `beforeCaseDay`.
- **Casebook er spillerens, ikke sakens.** Bevis, teorier, notater og tidslinjehendelser lagres i én felles notatbok. Hvert element har `cases: [...]`, som er tomt (uklassifisert) til spilleren selv velger én, flere eller ingen saker. Ingenting knyttes automatisk. Casebook viser «Alle» som standard, med filter per sak og «Uklassifisert». Rapporter har alltid én sak (`case`).
- **Rapportering per sak.** En rapport har `case`. Påstander matches mot den sakens `claims` og universets kanon. Kanaler og reviewer kommer fra sakens `publishing`, så Dana er reviewer i The Quiet Account uten at det er en motorregel.
- **Varige konsekvenser.** `exposed`, `published`, flagg, slettede kontoer og troverdighet er universtilstand. En ny sak leser dem med vanlige betingelser (`{exposed: "S2"}`, `{flag: "ending_lights_out"}`). Det er slik «Varige konsekvenser fra The Quiet Account» i fase 9 blir mulig.
- **Oppdagelse er universell.** Det spilleren vet om Dana i én sak, vet hun i neste.
- **Lagring.** Nøkkel per univers (som i dag). Versjon 3 migrerer: eksisterende elementer får `cases: []` (uklassifisert), og `state.cases` opprettes med The Quiet Account som aktiv sak.

### 13.3 Validator og simulator
- Kjøres per mysterium: universet + mysteriet + (som varianter) avslutningene fra mysterier som kan ha kommet før.
- Et mysterium kan ikke avhenge av innhold fra et senere mysterium.
- Når universinnhold endres, kjøres alle mysterienes scenarioer på nytt, så en ny sak ikke ødelegger en gammel.
- Universinnhold og bassenger kan bli bevis i en sak, men bare når saken eksplisitt lister det (`evidence` i `mystery.json`). Validatoren sjekker at referansen finnes og at innholdet var publisert før saken trenger det, så en ny sak ikke stille endrer gamle saker.

### 13.4 Faser
- **U0 (i fase 5, rapportering):** rapport, kanaler og vurdering bygges per sak fra starten (`case` på rapporter, `publishing` i mysteriet). Tidslinjehendelser og andre Casebook-elementer får `cases`. Lite arbeid nå, dyrt å rette senere.
- **U1 (etter fase 5, før M1):** innholdet deles i `universe/` og `mysteries/quiet-account/`, `state.cases`, `beforeCaseDay`, `extends` for personer, lagring v3, validator per sak, tom-tekster i Casebook flyttes til sakens strenger. Ingen synlig endring for spilleren, og alle eksisterende tester skal passere uendret.
- Medieappene (M1–M4) legger innholdet sitt i `universe/` og `pools/`, og bare bevis i sakens mappe.

### 13.5 Timeline
Timeline bør allerede lagre `cases` på hver hendelse, tomt som standard (uklassifisert), og ikke anta én sak. Det er ett felt og ingen endring i grensesnittet.
