# The Quiet Account: hvordan saken avsluttes i dag

Gjennomgang av dagens mekanikk for avslutning, rapporter og konsekvenser, vurdert mot designkravene i §3–8 i Anders' melding 24.11.2026. Svarer på punkt 1–9 i §16.

Ingenting er implementert. Grunnlaget er koden på grenen `dead-internet-steg0-lekkasjer` (PR 68), som er nyeste versjon av spillet, pluss egne kjøringer av scenarioer for kanttilfeller.

Kildefiler: `core/casebook.js` (publisering og vurdering), `core/game.js` (`checkEndings`, søvn), `core/cases.js` (saksstatus, frister), `core/conditions.js`, `content/mysteries/quiet-account/mystery.json` (kanaler, frist, avslutninger), `…/rules.json` (reaksjoner), `…/artifacts/news-consequences.json` (A67–A69), `content/universe/meta.json` (kanaler og poengtabell), `tools/lib/scenarios.mjs`.

---

## Kort oppsummert

- **Fundamentet holder, og det meste av det Anders beskriver finnes allerede.** Saken avsluttes gjennom handlinger i verden (publisering og tid), ikke en «Solve case»-knapp. Utfallene er regelbaserte, uten samlet poengsum. Kanon leses bare etter publisering. Spillerens egne markeringer påvirker ingenting. Dana kan lures. Flere avslutninger kan inntreffe samtidig.
- **Seks av de sju dimensjonene/utfallene i §5 og §7 finnes i en eller annen form.** De tydeligste hullene er *The Partial Truth*, *The Buried Story* og *The Cover-Up* som egne, gjennomtenkte utfall.
- **Jeg fant to feil og fire svakheter** ved å kjøre scenarioer som de eksisterende testene ikke dekker (se §7.1). Den alvorligste: publiserer spilleren hele historien på Connect eller Threadline før avstemningen, blir avstemningen utsatt, men spilleren får avslutningen *Too late* med teksten «the towers are approved».
- **Anbefaling:** behold motoren. Rett feilene, legg til to–tre avslutninger og en «neste morgen»-avisartikkel som innhold, og gjør saksstatusen i Casebook nøytral (Active / Published / Closed). Det meste er innhold i `mystery.json` og `rules.json`, ikke ny motor. Rapportdelen av steg 5 er uavhengig av dette og kan gå som planlagt.

---

## 1. Hvilke avslutninger finnes

Ni avslutninger i `mystery.json`. «Lukker» betyr `closes: true`: saken blir *Resolved* i Casebook, verden går videre.

| ID (arbeidstittel) | Lukker | Utløses når | Hva skjer i verden |
|---|---|---|---|
| `lights_out` | ja | S2 (Brightline styrer @maraquinn) **og** S3 (Northgate betalte Brightline) avslørt med sterk støtte gjennom **Daily Record**, før saksdag 8 | Maras profil blir minneprofil, Juno/Mike/Pat/Lindsay slettes, Brightlines sider A19–A21 skjules, varsel om 41 suspenderte kontoer, Dana skriver, Theo skriver dagen etter. Dag 8: avstemningen utsettes (A67). |
| `too_late` | ja | S2 og S3 avslørt (hvilken kanal som helst), avstemningen er holdt, `lights_out` ikke nådd | Minneprofil, kontoene slettes, varsel: «The Waterfront vote stands; Ruiz calls for an inquiry». |
| `ghost_story` | ja | S1 (Mara er død) og S8 eller S2 avslørt, avstemningen holdt, S3 **ikke** publisert (heller ikke svakt) | Minneprofil, varsel fra Unfiltered: «goes viral … Brightline blames a rogue contractor. Northgate is not mentioned.» |
| `who_paid_whom` | ja | En av de tre over **og** S7 (Calvin finnes ikke) avslørt | Dana: «So who's Meridian?» Dagen etter: ukjent avsender, «You found the garden. You haven't found the gardener.» Frø til senere mysterier. |
| `wrong_murder` | nei | F1 (Mara ble drept) publisert, uansett kanal og støtte | Dana −3, Theo −3, Owen +3, Northgate truer med søksmål, Owen jubler. |
| `collateral_theo` | nei | F2 (Theo poster som Mara) publisert | Theo −10 og blokkert, Threadline finner adressen hans. |
| `collateral_owen` | nei | F3 (Owen hacket kontoen) publisert | Owen −5, «They're calling me a hacker now». |
| `collateral_iris` | nei | F5 (Iris står bak kontoen, delvis sant) publisert | Iris' konto slettes, hun bryter kontakten. |
| `silence` | nei | Ingen rapport publisert før avstemningen | «The vote passed. Nobody said anything. @maraquinn is still posting.» |

I tillegg finnes reaksjoner i `rules.json` som ikke er avslutninger, men som allerede gjør noe av det §5 og §6 beskriver:

- **Tidlig varsling (embryo til Cover-Up):** spør Calvin om Mara/Juno/hagen, eller vis @maraquinn bevis for S1/S2/S5, og Brightline fjerner A21 og sender Juno for å sjekke deg ut (`D3_brightline_alert`). Bruk av Iris' innlogging gjør at Iris mister kontoen og portalen stenges (`D7_portal_used`).
- **Etter første rapport, uansett innhold:** Brightline publiserer en uttalelse dagen etter (A42).
- **Publisering på Connect/Threadline:** «hundrevis av svar som høres … kjente ut» (hagen svarer), og Unfiltered plukker opp saken dagen etter (A69).
- **Avstemningen dag 8:** utsatt (A67) hvis S3 er avslørt med sterk støtte før dag 8, ellers vedtatt 6–5 (A68) og @maraquinn feirer (A50).
- **Etter en avslutning:** Dana og Theo har egne replikker. Paul lekker noe dersom han er presset og spillerens troverdighet er minst 40.

## 2. Hvordan de utløses

- `checkEndings()` kjøres etter hver publisering og etter hver **Sleep**. Den går gjennom avslutningene i alle startede saker, i rekkefølgen i filen. En avslutning kan bare inntreffe én gang. `requiresEnding` finnes, men brukes ikke i dag (`who_paid_whom` bruker flagg i stedet).
- Betingelsene er deklarative (`core/conditions.js`). Avslutningene bruker bare tre typer: `exposed` (sann påstand publisert med støtte, med valgfri kanal, frist og `allowWeak`), `published` (påstanden publisert, sann eller ikke) og flagg satt av regler (`vote_held`, `silent_vote`, `ending_*`).
- Fristen er `beforeCaseDay: 8`, regnet fra dagen saken startet. Avstemningen skjer i `day.start` på saksdag 8, før `checkEndings`. Publisering på dag 8 er altså etter avstemningen.
- Når en avslutning inntreffer: den registreres med dag, saken lukkes hvis `closes`, effektene kjøres, og spilleren får et varsel «The Quiet Account: Lights out» som åpner Reports.

## 3. Hvordan rapporter evalueres

`publish(kanal, teorier, {case, events})` i `core/casebook.js`:

1. **Kanalvalg.** Tre kanaler i dag:
   | Kanal | Krav | Troverdighetsvekt |
   |---|---|---|
   | Daily Record (via Dana) | Danas tillit ≥ 3, og hver påstand må *se* sterk ut for henne (to synlige kilder), ellers kuttes den | 1,0 |
   | Egen Connect-profil | ingen | 0,8 |
   | Threadline (anonym) | ingen | 0,5 |
2. **Danas gjennomgang** (`review`) bruker bare det hun kan se (`apparentSupportOf`): synlige kilder, ikke skjult opphav. Tre hagekontoer er tre kilder for henne. Hun kommenterer kildestyrke og dristighet (`bold`), aldri sannhet. Hun kan altså lures, slik Anders ønsker.
3. **Verdens dom** (kanon) for hver påstand som ikke ble kuttet:
   - *Sannhet:* påstanden matches mot sakens `claims` (S1–S8, F1–F5). Ellers utledes sannheten fra verdensmodellen (for eksempel `operatedBy`, `isHuman`). Ukjent kanon gir «unknown».
   - *Støtte:* antall ulike **skjulte** kilder blant de koblede bevisene som faktisk støtter påstanden. To eller flere er sterk, én er svak.
4. **Registrering.** Alle publiserte påstander havner i `state.published`. Sanne påstander med støtte havner i `state.exposed` med dag, kanal og styrke. Svak eksponering oppgraderes hvis den senere publiseres sterkt.
5. **Troverdighet** (skjult tall 0–100, start 50) endres etter tabellen i `meta.json`: sann og sterk +8, sann og svak +3, sann uten støtte −2, delvis −3, usann −10, ukjent −2, ganget med kanalvekten. Den vises aldri. Den brukes i dag bare av Pauls lekkasje.
6. Hendelsen `report.published` sendes til reglene, og avslutningene sjekkes.

Tidslinjehendelser kan tas med i rapporten, men vurderes ikke.

## 4. Hvordan bevis, teorier, kanal og tidspunkt påvirker utfallet

| Faktor | Påvirkning i dag |
|---|---|
| **Bevis** | Bare bevisene spilleren har koblet til teorien teller. Antall uavhengige *skjulte* kilder avgjør om eksponeringen er sterk eller svak. De fleste avslutningene krever sterk. Danas kutt bruker *synlige* kilder, så spilleren kan få en påstand gjennom Dana som verden likevel regner som svak. |
| **Teorier** | Teoriens trippel (subjekt, predikat, objekt) er selve påstanden. Den må matche en kanonisk påstand for å utløse avslutninger. Teoriens status, notater og spillerens merker leses aldri. |
| **Kanal** | Bare `lights_out` krever Daily Record. Alle andre avslutninger er kanaluavhengige. Kanalen avgjør i tillegg: Danas filter (bare DR), troverdighetsvekt, «hundrevis av svar» og Unfiltered-oppfølging (bare Connect/Threadline). |
| **Tidspunkt** | Én frist: avstemningen på saksdag 8. S3 sterkt før dag 8 (uansett kanal) utsetter avstemningen. S2 + S3 gjennom DR før dag 8 gir `lights_out`. Etter dag 8 gir hele historien `too_late`. Det finnes ingen straff for å publisere *for tidlig* (Cover-Up). |

## 5. Hvilke konsekvenser spilleren faktisk opplever

Det spilleren ser, i rekkefølge:

1. **Rett etter publisering:** skjermen «Published» med påstandene som gikk ut, det Dana kuttet, og eventuelle avslutninger med epilog. Nye varsler og meldinger (Dana, «hundrevis av svar»). Ved `lights_out` skjer suspensjonen av 41 kontoer og Danas «It ran. Front page.» umiddelbart, i samme handling.
2. **Neste morgen:** Brightlines uttalelse (A42), Unfiltered-saken (A69) ved Connect/Threadline, Theos takk ved `lights_out`, ukjent avsender ved `who_paid_whom`.
3. **Saksdag 8:** Daily Record skriver at avstemningen er utsatt (A67) eller vedtatt (A68). @maraquinn feirer hvis kontoen fortsatt er i drift.
4. **Varige endringer i verden:** minneprofil på A02, slettede kontoer, skjulte Brightline-sider (som fortsatt finnes i cachen), endret tillit hos Dana, Theo, Owen og Iris, nye replikker hos Dana og Theo.

Av listen i §6 finnes i dag: Theo sender personlig melding, Brightline publiserer uttalelse, nettside blir utilgjengelig, syntetiske kontoer slutter å publisere, kommunen utsetter beslutningen, Unfiltered skriver om saken. Delvis: journalist følger opp (Danas replikker, ingen artikkel). Mangler: Threadline diskuterer avsløringen, Unfiltered med *konkurrerende* forklaring, aktørene forsøker å diskreditere spilleren (finnes bare ved feil anklage), og **en Daily Record-artikkel om spillerens egen sak**.

## 6. Hvordan spilleren forstår at saken er avsluttet

- Et varsel med sakens navn og avslutningens tittel («The Quiet Account: Lights out»), som åpner Casebook → Reports.
- I Reports står saken som **Resolved** (eller **Open**), med avslutningene som «utviklinger» med dag, tittel og epilog.
- Spillet fortsetter: søk, meldinger og søvn virker, og nyheter kommer til og med dag 11.

Vurdering: det er tydelig nok for de lukkende avslutningene. To ting trekker ned. Arbeidstitlene («Lights out», «Collateral: Theo») vises direkte til spilleren og leses som spillmeny-språk, ikke som noe i verden. Og ved `lights_out` kommer selve klimakset (kontoene forsvinner, Dana sier «front page») i samme sekund som spilleren trykker Publiser, ikke neste morgen i avisen.

---

## 7. Dekker eksisterende mekanikk designprinsippene?

### 7.1 Feil og svakheter funnet under gjennomgangen

Kjørt med egne scenarioer i tillegg til de elleve i `scenarios.mjs`:

| # | Hva | Funn | Alvor |
|---|---|---|---|
| F-1 | Hele historien (S2 + S3, sterk) på **Connect eller Threadline før avstemningen** | Avstemningen utsettes (A67), men spilleren får `too_late`: «the towers are approved». Årsak: regelen `D11_vote_held` setter `vote_held` på dag 8 også når avstemningen utsettes, og `too_late` sjekker bare det flagget. | **Feil.** Epilogen motsier avisen. |
| F-2 | **Bare S2 gjennom Daily Record** før avstemningen (kontoen er overtatt, men ingen penger) | Ingen avslutning, verken nå eller etter avstemningen. `ghost_story` krever også S1, `silence` krever null rapporter. Saken står åpen for alltid. Akkurat «The Partial Truth» i §5. | **Hull.** |
| S-1 | `lights_out` inntreffer i publiseringsøyeblikket | Epilogen sier «the vote was postponed» seks dager før A67 kommer. Klimakset skjer ikke «neste morgen». | Svakhet |
| S-2 | Ingen artikkel i Daily Record om spillerens egen sak | DR-kanalen gir ingen avisartikkel spilleren kan lese i appen. A67 sier til og med «posts online this week», også når saken sto på DRs forside. | Svakhet |
| S-3 | `silence` + senere publisering | Spilleren får først «Silence» (lukker ikke), så eventuelt «Too late». Allerede notert i gjennomspillingen fra fase 9. Publiseres bare S2 etter avstemningen, kommer ingenting. | Svakhet |
| S-4 | Brightlines uttalelse etter *hvilken som helst* rapport | A42 sier «we have paused the program», også etter en drapsteori på Threadline, og @maraquinn fortsetter å poste. | Liten inkonsistens |

### 7.2 Mot §3: forstå, dokumentere, oppnå

| Krav | Status |
|---|---|
| Skille mellom å forstå, dokumentere og oppnå | **Dekket i motoren.** Forstå = spillerens teorier (leses aldri). Dokumentere = `exposed` med styrke. Oppnå = kanal og frist. |
| Forstå alt, men mangle bevis | **Dekket.** Svak eller manglende støtte gir ikke `exposed` som sterk, og Dana kutter. Men det finnes ingen avslutning for det (se Buried Story). |
| Gode bevis, dårlig kanal | **Delvis.** DR er eneste vei til `lights_out`. Connect/Threadline gir i praksis samme verdensreaksjon som DR, bortsett fra den (og F-1). |
| Avsløre deler uten å forstå helheten | **Delvis.** `ghost_story` dekker «kontoen er falsk, ingen penger». F-2 viser at «Brightline driver kontoen, men ingen penger» ikke gir noe utfall. |

### 7.3 Mot §4: handlinger

| Handling | Finnes i dag | Vurdering for The Quiet Account |
|---|---|---|
| Publisere gjennom Daily Record | ja, via Dana | Behold. |
| Publisere gjennom Unfiltered | **nei**, Unfiltered reagerer bare på Connect/Threadline | Gir mening som egen kanal: ingen redaktørkrav, publiserer også svake og spekulative påstander, lav troverdighetsvekt, og Unfiltered setter sin egen vinkel på saken. Det gir «gode bevis, dårlig kanal» et reelt valg. Anbefalt, men som innhold etter steg 5. |
| Lekke anonymt | delvis: Threadline er merket «anonymous», men endrer spillerens troverdighet som om det sto navn på | Anbefaler at Threadline ikke flytter troverdigheten (vekt 0). Ingen ny kanal. |
| Kontakte offentlige instanser | nei | Ikke nødvendig nå. Ruiz finnes i kanon, men en ny kanal krever ny dialog. Kandidat for senere mysterier. |
| Kontakte berørte | ja: vise Theo, Iris, Juno bevis gir reaksjoner (Juno forsvinner etter tre bevis) | Behold. |
| Konfrontere involverte | ja: spør Calvin, vis @maraquinn bevis → Brightline varsles og rydder | Behold. Dette er grunnlaget for Cover-Up. |
| Avvente | ja: Sleep | Behold. |
| Ikke gjøre noe | ja: `silence` | Behold. |

### 7.4 Mot §5: de seks utfallene

| Utfall | Dagens dekning |
|---|---|
| The Exposure | `lights_out` (+ `who_paid_whom`). **Dekket.** |
| The Partial Truth | `ghost_story`, men bare når avstemningen har gått og S1 er med. F-2 faller utenfor. **Delvis.** |
| The Buried Story | Ingen avslutning. Dana kutter, og «Nothing was published» er alt spilleren ser. Rett, men for svak dokumentasjon etter fristen gir ingenting. **Mangler.** |
| The False Accusation | `wrong_murder`, `collateral_theo/owen/iris`. **Dekket.** F4 (Northgate betalte avisen) har ingen konsekvens. |
| The Cover-Up | Tidlig varsling (Calvin, @maraquinn, portalen) finnes, men å *publisere* for tidlig og for tynt straffes ikke. **Delvis.** |
| Business as Usual | `silence`. **Dekket**, men lukker ikke saken (se §6 og S-3). |

Utfallene er allerede ikke-gjensidig utelukkende: Collateral kan komme sammen med `lights_out`, og `who_paid_whom` bygger på de andre.

### 7.5 Mot §6: konsekvenser og saksstatus

- Konsekvenser i verden: **i hovedsak dekket** (se punkt 5), men klimakset bør flyttes til neste morgen med en avisartikkel (S-1, S-2).
- Tydelig milepæl: **dekket** med varsel og Resolved.
- Nøytral saksstatus: i dag Open/Resolved. Foreslått Active / Published / Closed / Reopened passer motoren direkte: `active` og `closed` finnes, «Published» er «aktiv med minst én rapport», og «Reopened» trengs først når et senere mysterium gjenåpner saken.
- Ingen prosent, stjerner eller poeng: **dekket**. Troverdighet vises aldri.

### 7.6 Mot §7: intern evaluering

| Dimensjon | Hvor det finnes i dag |
|---|---|
| Accuracy | `truthOf`: sann, delvis, usann, ukjent per påstand. Usanne påstander gir egne avslutninger. |
| Evidence | `supportOf` (skjulte kilder, sterk/svak) for verden, `apparentSupportOf` for Dana. |
| Coverage | Hvilke av S1–S8 som er `exposed`. Avslutningene kombinerer dem (S1+S8 / S2+S3 / +S7). S4, S5 og S6 gir i dag ingen egen konsekvens. |
| Impact | Kanal (bare DR gir `lights_out`) og om avstemningen utsettes. |
| Collateral damage | F2, F3, F5 (og F1) som egne ikke-lukkende avslutninger. |
| Timing | `beforeCaseDay: 8` og `vote_held`. Ingen «for tidlig». |

Konklusjon: alle seks dimensjonene finnes som **regelbetingelser**, ikke som tall. Det er i tråd med §7, og jeg anbefaler å ikke innføre en samlet score. Troverdighetstallet er det eneste tallet, og det bør forbli internt og brukes sparsomt (i dag bare Paul).

Spillerens egne markeringer, kildevurderinger og teoristatus påvirker ikke utfallet. Det er bekreftet både i `DESIGN.md` («Spillerlaget er usynlig for reglene») og i koden: `conditions.js` har ingen betingelse som leser spillerlaget. Bør beholdes som test når steg 1–4 legger til merker og kildevurderinger.

### 7.7 Mot §8: vinne saken uten å vinne spillet

**Godt dekket allerede.** `who_paid_whom` avslutter med «You haven't found the gardener» fra en ukjent avsender, Meridian er et åpent spor, Brightline-sidene ligger i cachen, og `layers` i `mystery.json` begrenser hva saken kan avsløre (lag 1–2 avsløres, 3–4 bare som tvil). Seirene undergraves ikke: kontoene forsvinner, avstemningen utsettes, Theo takker. Det balanserer slik §8 ber om.

---

## 8. Endringer som bør inngå i Casebook steg 5

Steg 5 slik det er godkjent (rapportbygger med for/mot, egne forbehold, øyeblikksbilde) trenger ingen ny utfallsmekanikk og kan gå som planlagt. Jeg foreslår å legge til tre små ting som hører naturlig hjemme der, og å la resten vente til etter diskusjonen.

**Inn i steg 5 (Casebook-UI, ingen ny utfallsmekanikk):**

1. **Nøytral saksstatus:** Active, Published, Closed (Reopened forberedt). Erstatter Open/Resolved. Ren visning av eksisterende tilstand.
2. **Kanalbeskrivelse i rapportbyggeren** fra kanalens egen data, i verdens språk: «Dana will want two independent sources for every claim», «Goes out under your name», «Anonymous». Aldri noe om sannhet eller sjanse.
3. **Rapporten lagrer øyeblikksbilde** av påstandene, bevisene og spillerens egne forbehold slik de var ved publisering (står allerede i planen). Det gir grunnlaget for at et senere mysterium kan utfordre en gammel rapport (§8).

**Egen liten PR etter diskusjonen, før ekstern spilltest (innhold og én motorendring):**

4. **Rett F-1:** `too_late` (og `ghost_story`) skal kreve `vote_passed`, ikke `vote_held`. En-linjes innholdsendring pluss scenario «hele historien på Connect før avstemningen».
5. **Rett F-2 / Partial Truth:** et utfall for «kontoen er overtatt, ingen penger». Enklest: utvid `ghost_story` til S8 *eller* S2 uten krav om S1, og gjør epilogen kanalnøytral. Alternativt en egen avslutning med DR-vri: Dana får saken på trykk, Brightline skylder på en underleverandør, avstemningen går.
6. **«Neste morgen»-avslutning:** la `lights_out` sette flagg ved publisering, men vise klimakset neste morgen: en skjult DR-artikkel med `datedOnShow` («Council suspends Eastfield waterfront vote following media manipulation allegations» eller tilsvarende), suspensjonene, Danas melding. A67 justeres så den ikke sier «posts online» når saken sto i DR. Dette er ren bruk av `later` og `show`, som finnes.
7. **Buried Story:** når avstemningen er gått og spilleren har publisert minst én sann påstand uten at noe av S2/S3 ble eksponert sterkt, lukkes saken med en stille epilog (Dana: «You were onto something. I couldn't run it.»). Krever ingen ny betingelse.
8. **Cover-Up:** publiserer spilleren S2 eller S8 *svakt* på Connect/Threadline før S3 er dokumentert, rydder Brightline dagen etter (skjuler portalen og en av fakturakildene). Må testes med blokkeringstesten i validatoren så saken fortsatt kan løses, bare vanskeligere. Krever ingen ny motor, men nøye innhold.
9. **Skjul arbeidstitlene for spilleren:** varselet bruker en overskrift fra verden («Daily Record: Council suspends Waterfront vote») i stedet for «The Quiet Account: Lights out». Epilogen kan stå i Reports. Dette er en designbeslutning (se spørsmål under).
10. **Unfiltered som kanal** og **Threadline uten troverdighetseffekt:** to små innholdsendringer i `mystery.json` / `meta.json`. Kan vente til etter spilltesten hvis vi vil holde omfanget nede.

Alt fra punkt 4 og nedover dekkes av eksisterende betingelser og effekter. Eneste mulige motorendring er punkt 9, hvis varselets tekst skal komme fra avslutningen i stedet for tittelen (et valgfritt felt `headline`).

## 9. Hvordan saksavslutninger kan fungere for fremtidige mysterier

Dagens modell er generell nok. Jeg foreslår å formalisere den som en kontrakt hvert mysterium oppfyller, i stedet for ny motor:

1. **Påstander er byggeklossene.** Hvert mysterium deklarerer `claims` (sanne, usanne, delvise) med `core`/`bold`. Utfall leser bare hva som er *publisert* og *eksponert* (med kanal, dag og reell styrke), aldri spillerens tanker.
2. **Tre lag av avslutninger:**
   - *Milepæler* (`closes: true`): det spilleren opplever som at saken er ferdig. Hvert mysterium skal ha minst én for hvert hovedspor: full avsløring, delvis, begravet, feil og ingenting.
   - *Sidekonsekvenser* (ikke-lukkende): skade på uskyldige, ødelagte relasjoner. Kan inntreffe sammen med en milepæl.
   - *Ettervirkninger* (`requiresEnding` + `later`): forfattede hendelser dager senere, også frø til neste mysterium. Alltid i kanon, aldri tilfeldige.
3. **Dimensjonene som sjekkliste for forfatteren, ikke som tall.** For hvert mysterium bør forfatteren kunne svare: hvilke påstander er nøkkelen (Coverage), hva krever sterk støtte (Evidence), hvilke usanne påstander rammer noen (Collateral), hvilke kanaler gir hvilken effekt (Impact) og hvilke frister finnes (Timing). Svarene blir betingelser.
4. **Frister er data** (`deadlines` med `knownIf`/`until`), og hvert mysterium med frist må ha utfall både før og etter, og for «for tidlig» der det gir mening.
5. **Kanaler per mysterium** med redaktør (som kan lures), krav og vekt. Universets kanaler (Connect, Threadline, senere Unfiltered) er alltid åpne.
6. **Tester per mysterium:**
   - *Utfallsmatrise:* et testverktøy som publiserer alle relevante kombinasjoner av påstander × kanal × før/etter frist og sjekker at hver kombinasjon gir minst én milepæl eller en bevisst åpen tilstand, og at ingen to avslutninger med motstridende flagg (utsatt/vedtatt) inntreffer sammen. Det ville fanget både F-1 og F-2.
   - Tvillingverden-testen dekker allerede at visningen er lik, og bør utvides med rapportbyggeren og den nye statusen i steg 5.
   - Eksisterende krav: alle avslutninger har epilog, scenarioene når sine avslutninger, saken kan løses med hver kilde blokkert.
7. **Saksstatus er universell:** Active → Published → Closed → (Reopened). Et nytt mysterium kan gjenåpne en gammel sak når det utfordrer en konklusjon, med en forfattet hendelse som grunn.

---

## Spørsmål til Anders

1. **Arbeidstitler synlige?** Skal spilleren se avslutningenes titler («Lights out», «Collateral: Theo») og epilogen i Reports, eller bare overskrifter og hendelser i verden? Min anbefaling: behold epilogen i Reports (den gir den tydelige milepælen §6 ber om), men bytt tittelen i varselet med en overskrift fra verden.
2. **Unfiltered som publiseringskanal i The Quiet Account,** eller vente til etter ekstern spilltest? Min anbefaling: ta det med i PR-en etter steg 5, fordi det gjør kanalvalget meningsfullt før spilltesten.
3. **Skal `silence` lukke saken?** I dag står saken åpen etter avstemningen hvis ingenting er publisert, slik at spilleren kan komme for sent med `too_late`. Min anbefaling: la den stå åpen som i dag, men vis status «Active» med avstemningen som passert frist.
