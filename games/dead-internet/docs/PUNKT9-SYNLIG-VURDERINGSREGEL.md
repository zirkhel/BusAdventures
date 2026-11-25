# Punkt 9: synlig vurderingsregel for Dana (forslag, revisjon 2)

_Revidert 25. november 2026 etter Anders' svar på de åtte åpne spørsmålene (se DEVPLAN, Steg 5). **Ikke implementert.** Danas tekst, Daily Record-kuttet og innholdet er uendret på greina til Anders har godkjent denne beskrivelsen og tekstendringene i 5. Tallene er målt med en prototype utenfor repoet (patch på boksen: `/workspace/notes/punkt9v2-proto.patch`; skriptene ligger samme sted)._

Anders' rammer (25.11.2026), første runde:
1. Samme vurderingsgrunnlag for tekst og kutt: synlig innhold og synlig opphav. Aldri skjulte `supports`, sannhetsverdier eller særbehandling av forhåndsdefinerte påstander.
2. Navnetreff er ikke bevis på støtte. Dana sier aldri «I can stand behind that».
3. F1 og F4 skrives om uten fasit.
4. Verdens vurdering etter publisering beholdes. Endrede utfall dokumenteres.
5. Lekkasjetesten blir blokkerende.

Andre runde (svar på de åtte spørsmålene):
1. Skjulte `mentions` skal ikke avgjøre aliaser. Bare navn, brukernavn og aliaser som er synlig etablert for spilleren. «Pat» forblir tvetydig. Testen må variere `mentions`.
2. Alternativ P, men bare med eksplisitte, rettede «Supports»-koblinger.
3. Synlige hendelsesnavn der innholdet allerede omtaler hendelsen. Tekstendringene vises først.
4. Terskelen er fortsatt to opphav. Ordlyden sier at grunnlaget er nok til behandling, uten å bekrefte.
5. «Related», «Contradicts», «Same origin» og «Possibly manipulated» gir aldri støtte. Ingen skjult kontroll av om spillerens begrunnelse er riktig.
6. Spilleren gjør koblingen bl-ops.net–Brightline selv. Ingen automatisk avsløring. Gjennomspillingene gjør den samme handlingen.
7. Ikke noe forbud mot påstander om Daily Record. Dana opplyser om interessekonflikten og følger samme regel. Teksten skal stemme med handlingen.
8. Kildekortene påvirker bare spillerens egen opptelling. Dana omtaler aldri ulike opphav som bekreftet uavhengige.

## 1. Hva Dana leser

**Påstanden:** spillerens `subject`, `predicate` og `object`, og predikatets `arity`, `template` og `bold` i `predicates.json`. Ikke påstandslisten i kanon, ikke `matchClaim`, ikke påstandenes `bold` eller `review`.

**Bevisene:** bare påstandens for-liste (`h.evidence`). Bevis koblet *mot* teller ikke.

For hvert bevis:
- **Synlige navn:** `namesIn` (avsnitt 2) brukt på det synlige: for en side URL, tittel, tekst, kommentarer og bildetekster i den lagrede versjonen, pluss forfatter, byline og kommentarforfattere; for en melding teksten og avsenderen (personens konto eller person).
- **Synlig opphav:** `apparentSource(g, e).key` som i dag (kontoen som postet, personen som sendte en fil, adressen til et dokument eller en forumtråd, eller nettstedet).

**Spillerens koblinger:** bare `kind: "supports"` med retningen `a` → `b` («a supports b»), der begge ligger i for-listen. Notatet leses ikke. «Related», «Contradicts», «Same origin», «Possibly manipulated» og «Unrelated» leses ikke av Dana.

**Kanalen:** `reviewer`, `minTrust`, `requiresStrong` og et nytt synlig felt `outlet: "daily_record"`.

**Leses aldri:** `supports` noe sted, også kopiene i lagrede meldinger (`g.s.messages[].supports`, `core/dialogue.js:62–68` og `:95`, som ligger igjen fordi regler og personer bruker dem); `mentions`; skjult `source`; `truth`, `facts`, `operatedBy`, `isHuman`; påstandslisten; spillerens kildekort, «same origin»-svar og tillit (beslutning 4 og svar 8). Ingenting sjekker om en «Supports»-kobling er riktig.

## 2. Synlig etablerte navn (`namesIn`)

Et navn i en synlig tekst gjelder en enhet bare hvis det er etablert slik. Rekkefølgen er den samme som i dagens oppslag (`core/refs.js`).

1. **Fullt navn** (`name` i `entities.json`, også bakgrunnsfilene) for enheter som ikke er `secret`.
2. **Brukernavn:** `@handle` (eller brukernavn på andre plattformer) gir kontoen. Visningsnavnet gir kontoen bare når det er ulikt alle fulle navn, som i dag. En konto og en person er aldri det samme: «Mara» og «Mara Quinn» er personen, `@maraquinn` er kontoen.
3. **Kortformer** av det fulle navnet. Et forfattet alias teller som kortform når det er en sammenhengende del av navnet, eventuelt med «the» foran («Brightline», «Northgate», «Kestrel», «Mara», «Theo», «the Mill», «the Waterfront»), eller inneholder hele navnet («Brightline Media LLC»). For personer gjelder også «forbokstav. etternavn» («M. Quinn», «P. Navarro», «R. Okafor», «L. Adair»), avledet av det fulle navnet. **En kortform teller bare når den er entydig.** Hvert ord i et personnavn regnes som en mulig kortform for å avgjøre dette, så «Quinn» (Mara og Theo) er tvetydig og teller for ingen. Andre ord i et navn («Media», «Development») blir ikke kortformer.
4. **Kallenavn:** andre forfattede alias («NGD», «the old girl», «Walt») teller bare når de er **innført i spillerens Casebook**: et lagret bevis som synlig skriver «Fullt navn (alias)» eller «alias (Fullt navn)». I dag gjelder det bare «Northgate Development (NGD)» på klientportalen (A24). Har spilleren lagret A24, nevner dashbordet (A23, «Client: NGD») Northgate; ellers ikke (målt).
5. **Hendelser** med navn av formen «‹fullt navn›'s ‹substantiv›» («Mara Quinn's death») nevnes av det fulle navnet, eller av «‹form›'s ‹substantiv›» og «‹substantiv› of ‹form›» for hver entydig form av personen («Mara's death», «death of M. Quinn»). Store og små bokstaver spiller ingen rolle, som ellers i oppslaget.

Alt annet nevner ingen: et tvetydig navn, et alias som ikke er innført, en enhet som er `secret`. **«Pat»:** personen heter «Pat (harborwalkerpat)», og navn med parentes er aldri med i oppslaget. Et naket «Pat» nevner derfor ingen, og kontoen @harborwalkerpat nevnes bare med brukernavnet.

Den samme funksjonen bør brukes for «About» i Casebook (`evidenceAbout`, `core/casebook.js:245`), slik at det spilleren ser og det Dana teller er det samme. Med alt lagret endrer det navnene for partene i påstandene i ni artefaktversjoner, og ingen mister et navn: B16 og B24 (+ Northgate), UF-2026-0004 og W-kestrel-0016 (+ Kestrel), A24 og A25 (+ Paul, «P. Navarro»), A28 (+ Mara, «M. Quinn»), og A17 og A32 (+ hendelsen, etter tekstendringene i 5). Meldinger fra personer der «Mara» står uten at `mentions` lister henne (for eksempel Owens «murder»-svar), nevner nå Mara.

## 3. Når et bevis teller, og hvordan opphav telles

La *partene* være `subject`, og `object` hvis predikatet har to ledd. *N(X)* er navnene i bevis X (avsnitt 2).

Et bevis X i for-listen **teller** hvis
- (a) *N(X)* inneholder alle partene, eller
- (b) spilleren har en kobling «X supports Y», Y ligger i for-listen, og *N(X)* ∪ *N(Y)* inneholder alle partene.

**Retning:** i «X supports Y» er X beviset som støtter og Y beviset som blir støttet. X arver navnene til Y for denne påstanden: spilleren sier at X peker på det samme som Y. Y får ingenting fra X. Y teller bare hvis det teller på egen hånd (a), eller selv støtter et annet bevis (b).

**Ett ledd:** X arver bare de navnene Y har selv, ikke det Y har arvet. Med kjeder ville én side som nevner partene kunne låne dekning gjennom vilkårlig mange koblinger, og tellingen ville måle antall koblinger i stedet for antall dokumenter. Med ett ledd står hvert bevis som teller, i en eksplisitt påstand fra spilleren om et dokument som selv nevner det som mangler.

**Opphav:** *n* = antall ulike `apparentSource`-nøkler blant bevisene som teller. Et bevis som teller via (b), bidrar med **sitt eget** opphav, ikke med Ys. Gjensidige koblinger («X supports Y» og «Y supports X») lar to bevis som hver nevner én part, telle med hvert sitt opphav. Det er spillerens slutning, og den kan være feil (svar 2).

**Eksempler (målt):**
- «Brightline Media operates @maraquinn» med Theos e-poster (A32), dashbordet (A23) og briefen (A22): bare A22 nevner begge, og A23 har samme opphav (Iris) → *n* = 1, kuttes. Med «A32 supports A22» arver A32 Brightline og @maraquinn fra briefen og teller med Theos opphav → *n* = 2. Det sporet spilleren bruker, er synlig: gjenopprettingsadressen r•••••@bl-ops.net i A32 og «Client portal: portal.bl-ops.net» på Brightlines tjenesteside (A19). Ingenting kobler dem automatisk.
- «Theo Quinn operates @maraquinn» (F2, usann) med Theos profil (A06) og et @maraquinn-innlegg (A47): ingen kobling → 0; «A06 supports A47» → 1, kuttes; begge veier → 2, publiseres (verden: −10).
- «Northgate Development knew about Mara Quinn's death» (S6): klientportalen (A24) nevner Northgate, men ikke dødsfallet («briefed on MARA_Q backstory»); at «backstory» betyr dødsfallet, er spillerens slutning. «A24 supports A32» (Theos e-poster, som nevner «mara's death» etter endringen i 5) → A24 teller, *n* = 1, kuttes. Med også «A12 supports A32» (Daily Record-artikkelen som nevner Northgate) → 2, publiseres (verden: sann, `weak`, +3). At A12 ikke handler om dødsfallet, er spillerens feil å gjøre; Dana sjekker det ikke.

## 4. Terskel, kutt og ordlyd

| *n* | Nivå | Daily Record (`requiresStrong`) | Ordlyden |
|---|---|---|---|
| 0 | `none` | kuttes | ingenting nevner partene |
| 1 | `one` | kuttes | ett synlig opphav, ikke nok til å ta videre |
| ≥ 2 | `several` | går videre | nok til å ta til desken, ikke bekreftet |

Kuttet: `publish()` kutter nøyaktig når kanalen har `requiresStrong` og *n* < 2, med samme funksjon som teksten. Et avslag viser de samme linjene. Poeng, `exposed`, regler og avslutninger er som før.

**Tekst og handling stemmer:** linjene for `none` og `one` sier at påstanden ikke går videre, linjene for `several` at den går videre. Det holder fordi Dana bare vurderer for Daily Record, som har `requiresStrong`. `validate-world.mjs` skal kreve at en kanal med `reviewer: "dana"` har `requiresStrong`; en ny kanal uten kutt trenger egne linjer.

**Tekstvalg** (første som passer): egen avis (`outlet` er subjekt eller objekt) → predikatets egne linjer (`paid`, `caused`) → stor påstand (predikatets `bold`: `not_real`, `caused`) → vanlige linjer. Ingenting avhenger av om påstanden finnes i kanon.

## 5. Synlige hendelsesnavn: tekstendringer til godkjenning

Uten et synlig navn på hendelsen kan ingen påstand med «Mara Quinn's death» som objekt (S6, F1) komme gjennom kuttet (målt: S6 og F1 *n* = 0 selv med koblinger). Navnet «Mara Quinn's death» finnes i `entities.json` i dag, men står ikke i noen tekst. Endringene under setter navnet bare der teksten allerede omtaler dødsfallet. Ingen nye hendelser, ingen nye opplysninger, ingen endring i `entities.json` (formene i 2.5 avledes av navnet).

**Anbefalt:**

| # | Artefakt | Felt | Gammel tekst | Ny tekst |
|---|---|---|---|---|
| 1 | A17/v1 (Threadline, side 4; `artifacts/threadline.json`) | `body` | `Stop using my sister's death for clicks.` | `Stop using Mara's death for clicks.` |
| 2 | A32/v1 (Theos videresendte e-poster; `artifacts/misc.json`) | `body` | `(theo: she died july 2. I have the certificate. I just couldn't send it.)` | `(theo: she died july 2. I have mara's death certificate. I just couldn't send it.)` |
| 3 | Dana, svaret `mara` (`universe/characters.json`) | `text` | `I wrote her death notice in July.` | `I wrote Mara's death notice in July.` |

**Valgfritt, anbefales ikke nå:**

| # | Artefakt | Felt | Gammel tekst | Ny tekst |
|---|---|---|---|---|
| 4 | A11/v1 (nekrologen; `artifacts/news-blog.json`) | `body` | `No charges are expected.` | `No charges are expected over Mara Quinn's death.` |
| 5 | A28/v1 (ulykkesrapporten; `artifacts/records.json`) | `title` | `Collision report PD-2025-07-0211 (redacted)` | `Collision report PD-2025-07-0211: death of M. Quinn (redacted)` |

Begrunnelse for å vente med 4 og 5: begge nevner også Kestrel. Med begge endringene publiseres «Kestrel Logistics caused Mara Quinn's death» (F1) uten en eneste kobling, bare fra to dokumenter som beskriver en ulykke (målt: credibility 50 → 40). Det følger regelen, men gjør den mest misvisende bruken av navnetreff til den enkleste. Med 1–3 krever F1 og S6 en «Supports»-kobling fra spilleren.

Målt med 1–3: S6 og F1 kan publiseres når spilleren kobler (utforskeren: S6 *n* = 3, F1 *n* = 3). `simulate.mjs` er identisk med og uten 4–5.

## 6. Alle Danas linjer (nye eller endrede)

`{claim}` er påstanden som setning, `{n}` antallet (foreslås skrevet med ord: «two», «three» …), `{object}` objektets navn.

**Vanlige** (`review.dana.v`):
- `none`: «"{claim}": nothing you've linked even names who this is about. Cut it or find something.»
- `one`: «"{claim}": what you've linked names who this is about, but it all comes from one visible origin. That's a lead, not enough to take forward. Find a second origin, and make sure it shows this, not just names them.»
- `several`: «"{claim}": {n} different visible origins name who this is about. That's enough for me to take it to the desk, not to say it's true. Being named isn't being shown: check that each one shows this, and that they don't trace back to the same place.»

**Store påstander** (`v.bold`):
- `none`: «"{claim}": that's a big claim, and nothing you've linked even names who it's about.»
- `one`: «"{claim}": that's a big claim, and everything that names them comes from one visible origin. That's not enough to take forward.»
- `several`: «"{claim}": a big claim. {n} different visible origins name who it's about, so I'll take it to the desk. That doesn't make it true. Being named isn't being shown: what else could explain what you've found?»

**Penger** (`v.predicate.paid`):
- `none`: «"{claim}": nothing you've linked names both parties, let alone a payment.»
- `one`: «"{claim}": one source names both parties. That doesn't establish a payment, and one visible origin isn't enough to take forward.»
- `several`: «"{claim}": {n} different visible origins name both parties, so I'll take it to the desk. That doesn't establish a payment. For money I want the paper trail: an invoice, a contract, a transfer.»

**Årsak** (`v.predicate.caused`, erstatter F1):
- `none`: «"{claim}": you want me to print that someone caused {object}? Nothing you've linked even names both.»
- `one`: «"{claim}": one source names both. That says nothing about what anyone did, and one visible origin isn't enough to take forward. Show me documents, and tell me what else could explain it.»
- `several`: «"{claim}": {n} different visible origins name both, so I'll take it to the desk. That shows they turn up in the same story, not that one caused the other. I'd need documents that show what was done and by whom, and a reason the other explanations don't fit.»

**Egen avis** (`v.ownOutlet`, erstatter F4; samme regel, interessekonflikten opplyses):
- `none` (kuttes): «"{claim}": first, that's my own paper, so I have a stake in this. Nothing you've linked names both, so it stays out.»
- `one` (kuttes): «"{claim}": that's my own paper, so you should know I have a stake in this. One source names both, and one visible origin isn't enough to take forward, for my paper or anyone's. Bring a second, and documents if you have them: a contract, an invoice, a payment.»
- `several` (går videre): «"{claim}": that's my own paper, so you should know I have a stake in this. I'm holding it to the same rule as anyone: {n} different visible origins name both, so it goes to the desk. That shows a connection, not what it is. Bring documents, and tell me what else it could be.»

**Gjennomgått for samme problem, uendret:** `noTrust`; `own.rejected`, `own.against`, `own.ownCount`, `own.notTrusted`, `own.notAuthentic`; linjen under boksene («These are my concerns, not a guarantee that your conclusions are right.»); toasten «Nothing was published.» Ingen av dem omtaler navnetreff som bevis eller opphav som uavhengige.

**Fjernes:** `review.dana.strong` («…two independent sources. I can stand behind that.»), `weak`, `none`, `bold`; `review`-feltene (S3, F1, F4) og `bold` (S6, S7, F1) på påstandene i `canon.json`; de gamle nøklene i `validate-world.mjs`.

**Utenfor Danas vurdering, til godkjenning sammen med tillitsforslaget (8):** personsvaret `dana.evidence` sier «Good. Save it. I'll need two independent sources for every claim, and I mean independent.» Forslag: «Good. Save it. I'll need two sources from different places for every claim, and they have to show it, not just name names.»

## 7. Virkning på gjennomspillingene (målt på nytt)

Prototypen: navnene i 2, regelen i 3, linjene i 6 og tekstendringene 1–3. `simulate.mjs` er uendret; skriptene (`tools/lib/scenarios.mjs`) og utforskeren (`tools/lib/explorer.mjs`) er endret som under.

**A. Regelen alene, skriptene uendret** (diff mot `main`):

```
design_as_clue  PASS → FAIL  ✗ Lights Out reached ✗ S2 and S3 exposed through the Daily Record   credibility 66 → 58, endings → none
lights_out      PASS → FAIL  ✗ Lights Out reached ✗ S2 and S3 exposed … ✗ Mara's profile is memorialized
                             ✗ Juno's account is suspended ✗ Theo writes back the next day
                             ✗ the dead account stops posting once memorialized   credibility 66 → 58, endings → none
who_paid_whom   PASS → FAIL  ✗ Who Paid Whom reached ✗ the unknown sender writes   75 actions (72), credibility 74 → 66
portal_lie      PASS         credibility 66 → 58, endings lights_out → none
too_late        PASS → FAIL  ✗ Too Late reached ✗ the player is told the case closed   credibility 66 → 58, endings → silence
EXPLORER cautious  362 → 410 evidence, endings lights_out → none
EXPLORER reckless  463 → 471 evidence, endings lights_out → none
```

Årsaken er den samme som i første runde: «Brightline Media operates @maraquinn» har bare briefen som synlig nevner begge partene, så den kuttes, og Lights Out (S2 og S3 i Daily Record) uteblir.

**B. Skriptene gjør den samme «Supports»-handlingen som spilleren:**
- `gather` (brukes av design_as_clue, lights_out, who_paid_whom, portal_lie, too_late) og `designAsClue`: `g.addLink({ a: emails /* A32 */, b: brief /* A22 */, kind: "supports", note: "The recovery address is on bl-ops.net, Brightline's client portal domain (services page)." })`.
- `whoPaidWhom`: lagrer Calvins profil (A09), legger den i «Calvin Marsh is not a real person» og kobler `{ a: stock /* A31 */, b: profile /* A09 */, kind: "supports", note: "Same face as the stock photo" }`. Grunnen er at bildet fra teamsiden (IMG08) ikke kan lagres i skriptet, og stockbildet (A31) nevner ikke Calvin.
- Utforskeren, i `hypothesisFor`, etter å ha lagt til bevis (som før, valgt etter skjulte `supports`; utforskeren er et forfatterverktøy): (1) nevner ingen bevis en part, legger den til et lagret bevis som synlig nevner den (flest parter først); (2) for hvert bevis som ikke nevner alle partene, legger den til «X supports Y» mot et bevis Y som gjør det, eller som sammen med X gjør det.

Resultat: alle scenarioer består med samme avslutninger og troverdighet som `main`. Eneste forskjell er antall handlinger: design_as_clue 83 → 84, lights_out 59 → 60, who_paid_whom 72 → 76, portal_lie 71 → 72, too_late 64 → 65. Utforskerne beholder Lights Out og antall bevis (362/463). Sporingen av hver vurdering og publisering er identisk med `main` bortsett fra Danas ordlyd.

**C. Per påstand ved kuttet** (forsiktig utforsker, dag 6, med koblingene i B):

| | I dag | Første forslag (L) | Revisjon 2 |
|---|---|---|---|
| S1–S5, S7, S8 (sanne) | går videre | S5 kuttes | går videre |
| S6 (sann, hendelse) | går videre | kuttes | går videre (*n* = 3) |
| F1 (usann, hendelse) | går videre | kuttes | går videre (*n* = 3) |
| F2, F3 (usanne) | F3 går videre | kuttes | går videre (*n* = 2) |
| F4 (usann, egen avis) | kuttes | kuttes | kuttes (*n* = 1) |
| F5 (delvis) | kuttes | kuttes | går videre (*n* = 2) |

Utforskeren kobler alt den kan, så tabellen viser det som er *mulig*, ikke det som er vanlig. Den viser det Anders har godtatt: kuttet er et dekningsfilter, og usanne påstander kommer gjennom på samme vilkår som sanne. Verden straffer etterpå (`false` −10, `partial` −3). Uten tekstendringene i 5 er S6 og F1 0.

## 8. Blokkerende lekkasjetest

`tests/dana-probe.test.mjs` uten `todo`. Tvillingene lages etter samme spilling (skriptet `gather`, så lagres alt som kan nås), og bare skjult kanon endres:

| Tvilling | Endrer | Prototype |
|---|---|---|
| `truth` | alle påstander snudd, `facts` tømt | 0 forskjeller |
| `supports` | `supports` tømt i verden | 0 |
| `supportsAll` | som over, og kopiene i lagringen (`g.s.messages[].supports`) | 0 |
| `supportsShuffled` | hver påstands `supports` flyttet til neste påstand, også i lagringen | 0 |
| `mentionsEmpty` | `mentions` tømt overalt, også der aliaset står i teksten | 0 |
| `mentionsAll` | `mentions` lister alle enheter og kontoer | 0 |
| `claimsGone` | påstandslisten tømt | 0 |
| `claimsDecoy` | påstandene får motsatt `bold`, egne `review`-tekster og `truth: true` | 0 |
| `provenance` | `operatedBy`, `isHuman` og skjult `source` endret | 0 |

**Følsomhet:** med dagens alias-port (`mentions`) gir `mentionsEmpty` 13 ulike enkeltsvar og 4 ulike helhetssvar, og `mentionsAll` 1 og 2. Testen fanger altså avhengigheten.

**Hva som sammenlignes,** for de 13 kanonpåstandene (listen tas fra verden *før* tvillingen endres, så `claimsGone` spør om det samme) pluss én ikke-kanonisk trippel per predikat:
- **Vurdering:** Danas linjer med hvert lagret bevis alene (7 059 spørsmål), med alle bevis, og med alle bevis der hvert støtter det neste (regel b).
- **Kutt og avslag:** en ekte `g.publish("daily_record", …)` på en kopi av tilstanden, med og uten koblingene. Det som sammenlignes, er `refused`, linjene, `cut` og publiserte teori-id-er, ikke poeng eller verdens reaksjon. Tilstanden settes tilbake etterpå.
- **Avslag endrer ingenting:** ved avslag er tilstanden lik før og etter, bortsett fra handlingsloggen.
- Steg 5s notater og rapportgrunnlaget (som nå).

**Usanne påstander på samme vilkår (ny test):**
- «Theo Quinn operates @maraquinn» (F2) med A06 og A47, koblet begge veier, publiseres. Danas linje er ordrett den samme som for «Brightline Media operates @maraquinn» (S2) med *n* = 2, bare med en annen påstand.
- Med én kobling kuttes begge med samme `one`-linje.
- I `truth`-tvillingen er utfallene for F2 og S2 de samme.

Testen feiler ved første forskjell og skriver nøkkelen (for eksempel `S2|A32/v1`). Prototypen bruker cirka 9–10 sekunder per tvilling, fordi `namesIn` leser hele Casebook for å finne innførte kallenavn. Implementeringen må mellomlagre dette (per Casebook-endring), så målet er ≤ 3 sekunder per tvilling. `tests/twin.test.mjs` får de samme tvillingene, og forbudslisten for Danas funksjoner utvides med `mentions`.

## 9. Tillitsfabrikken i `dana.evidence` (eget forslag, ikke i denne PR-en)

**I dag:** svaret `evidence` (`on.showSupports: S2, S3, S4, S7, S8`) gir +1 tillit hos Dana hver gang spilleren viser en slik side, uten grense. Målt: de 12 scenarioene utløser det 0 ganger (de når tillit 3 via `first`, `mara` og `edit`). Utforskerne utløser det 148 og 191 ganger og ender på taket (10).

**Forslag (avgrenset):** `"once": true` på `dana.evidence`. Det er en innholdsendring, motoren er uendret. Målt i prototypen: alle 12 scenarioer består, og utforskerne utløser det én gang, ender på tillit 5 (≥ 3 for Daily Record) og beholder Lights Out. Senere visninger får Danas vanlige svar («Noted. What does it prove, and who else says so?»).

**Alternativer:**
- Én gang per side: krever en ny motorregel, og er fortsatt en fabrikk med mange sider.
- Et tak (`trustLt 3`): beholder det gjentatte signalet.

Om svaret skal slå til på synlig innhold i stedet for skjulte merker, hører til den egne gjennomgangen av personreaksjonene (se 11). Ordlyden i svaret er foreslått endret i 6.

## 10. Risikoer og åpne spørsmål

1. **Tekstendringene i 5:** godkjenner du 1–3? Skal 4–5 vente (anbefalt), eller tas med likevel?
2. **Gjensidige koblinger** («X supports Y» og «Y supports X») gir to opphav fra to bevis som hver nevner én part. Godtas, eller skal et par bare telle med det ene opphavet?
3. **Formene «forbokstav. etternavn»** er nye (avledet av koden, ikke forfattet): de gir Paul i A24/A25 og Mara i A28. Godtas?
4. **Kallenavn innføres bare** av «Fullt navn (alias)» eller «alias (Fullt navn)» i et *lagret* bevis. Dermed kan Danas vurdering av ett bevis endre seg når spilleren lagrer eller fjerner et annet (synlig, men overraskende). Andre formuleringer («known as») er ikke med.
5. **«About» i Casebook** bør bruke den samme navnefunksjonen (anbefalt). Det endrer hva noen kort viser (se 2).
6. **Synlighet for spilleren:** kommentaren i `core/workbench.js` («no rule, score or reviewer reads them») blir feil. Skal hjelpeteksten for «Supports» si at Dana teller et bevis som støtter et annet? Anbefalt, siden regelen skal være synlig.
7. **Tester som må endres ved implementering:** i prototypen feiler 7 av 260 uten skriptendringene: de fire scenarioene og utforskertesten (løses av B), og «endings carry epilogues…» og «casebook shows counts only…», som må gjennomgås.
8. **Tall med ord** i linjene («two different visible origins»).

## 11. Andre personers reaksjoner på bevis (egen gjennomgang senere)

Gjennomgangen fra første runde står ved lag og endres ikke i denne PR-en. Mekanismen: `on.showSupports` (`core/dialogue.js:45`) slår til på skjulte `supports` for siden som vises, og svaret skiller seg fra personens vanlige svar.

**Generelle relevanstestere:** `persona_mara.evidence`, `dana.evidence_low`, `dana.evidence` (også tillitsfabrikken, se 9) og `paul.pressed_again`.

**Bør knyttes til det personen faktisk kan se:** `theo.proof` (teksten passer bare bildet A33), `dana.invoice` og `owen.agency`.

**Følger dokumentert kunnskap:** `theo.murder`, `iris.shown1/shown2`, `juno.stage1–3`, `paul.pressed` og svarene på bestemte sider (Dana A12, Owen A28, Paul A42/A23/A22).

Regelen `D3b_brightline_alert_via_persona` er en forsinket ettbits tester, men fungerer som verdens reaksjon.

Anders vil ha disse gjennomgått separat. Bare tillitsfabrikken (9) foreslås rettet for seg.
