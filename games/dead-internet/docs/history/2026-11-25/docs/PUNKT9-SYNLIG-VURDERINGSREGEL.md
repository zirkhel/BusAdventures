> HISTORIKK: kopi fra PR #89, commit `50d5643`. Ikke gjeldende status eller arbeidsordre.
> Se [gjeldende DEVPLAN](../../../../DEVPLAN.md). Gamle godkjenningspåstander er historiske referater, ikke ny godkjenning.

# Punkt 9: synlig vurderingsregel for Dana (revisjon 2, implementert)

_Revidert 25. november 2026 etter Anders' svar på de åtte åpne spørsmålene, og **implementert 25. november 2026** etter Anders' svar på de sju spørsmålene i 10 (se 12 og DEVPLAN, Steg 5). Endelige linjer, hjelpetekster og målinger står i 12; der 12 og tidligere avsnitt er uenige, gjelder 12._

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
2. **Brukernavn:** `@handle` (eller brukernavn på andre plattformer) gir kontoen. Visningsnavnet gir kontoen når det er ulikt alle fulle navn, som i dag. Synlig kontoidentitet (avsender og brukernavn) beholdes; et løst fornavn tolkes ikke som en konto (Anders, 25.11.2026). Et innlegg eller en kommentar som synlig er postet av @harborwalkerpat (visningsnavn «Pat»), har fortsatt den kontoen som synlig opphav og nevner kontoen gjennom avsenderen, aldri personen. Står «Pat», «Mike», «Lindsay» eller «Tom» løst i teksten, eller som et naket visningsnavn i teksten, tolkes det ikke som kontoen eller personen. En konto og en person er aldri det samme: «Mara» og «Mara Quinn» er personen, `@maraquinn` er kontoen.
3. **Kortformer** av det fulle navnet. Et forfattet alias teller som kortform når det er en sammenhengende del av navnet, eventuelt med «the» foran («Brightline», «Northgate», «Kestrel», «Mara», «Theo», «the Mill», «the Waterfront»), eller inneholder hele navnet («Brightline Media LLC»). For personer gjelder også «forbokstav. etternavn» («M. Quinn», «P. Navarro», «R. Okafor», «L. Adair»), avledet av det fulle navnet. **En kortform teller bare når den er entydig.** Hvert ord i et personnavn regnes som en mulig kortform for å avgjøre dette, så «Quinn» (Mara og Theo) er tvetydig og teller for ingen. Andre ord i et navn («Media», «Development») blir ikke kortformer.
4. **Kallenavn:** andre forfattede alias («NGD», «the old girl», «Walt») teller bare når de er **innført i spillerens Casebook**: et lagret bevis som synlig skriver «Fullt navn (alias)» eller «alias (Fullt navn)». I dag gjelder det bare «Northgate Development (NGD)» på klientportalen (A24). Har spilleren lagret A24, nevner dashbordet (A23, «Client: NGD») Northgate; ellers ikke (målt).
5. **Hendelser** med navn av formen «‹fullt navn›'s ‹substantiv›» («Mara Quinn's death») nevnes av det fulle navnet, eller av «‹form›'s ‹substantiv›» og «‹substantiv› of ‹form›» for hver entydig form av personen («Mara's death», «death of M. Quinn»). Store og små bokstaver spiller ingen rolle, som ellers i oppslaget.

Alt annet nevner ingen: et tvetydig navn, et alias som ikke er innført, en enhet som er `secret`. **«Pat»:** personen heter «Pat (harborwalkerpat)», og navn med parentes er aldri med i oppslaget. Synlig kontoidentitet (avsender og brukernavn) beholdes; et løst fornavn tolkes ikke som en konto (Anders, 25.11.2026). Et løst «Pat» i teksten tolkes derfor verken som personen eller som kontoen @harborwalkerpat. Kontoen nevnes med brukernavnet, og et innlegg som synlig er postet av @harborwalkerpat, nevner kontoen gjennom avsenderen og har den som synlig opphav (se 12).

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

## 12. Implementert (25.11.2026): endelige linjer, hjelp og målinger

Anders' svar på spørsmålene i 10 (25.11.2026) står i DEVPLAN, Steg 5, «Punkt 9: implementert». Kort: tekstendring 1–3 gjort, 4–5 holdt tilbake (for å begrense innholdsendringene, ikke for å blokkere F1); gjensidige koblinger gir to opphav bare ved ulikt synlig opphav; kortformer avgjøres blant synlige kandidater; innførte kallenavn forklares på beviskortet; «About» viser bare egne navn; hjelpetekst for «Supports»; tall med ord.

**Avsender og omtale (presisert 25.11.2026):** Synlig kontoidentitet (avsender og brukernavn) beholdes; et løst fornavn tolkes ikke som en konto (Anders, 25.11.2026). Avsenderen, forfatteren, bylinen og kommentarforfatterne legges til med konto-id (`visibleRefsOfArtifact`, `visibleRefsOfMessage`), og det synlige opphavet kommer fra `apparentSource`. Det var slik også i prototypen og er uendret. Bare tekstoppslaget er endret: i prototypen ble et løst «Pat» i teksten lest som kontoen @harborwalkerpat; nå tolkes et løst fornavn som bare er en kontos visningsnavn («Pat», «Mike», «Lindsay», «Tom»), ikke som kontoen. Testene i `tests/names.test.mjs` viser begge deler. Ellers som beskrevet i 2–4.

### Danas linjer (endelige)

Alle begynner med `"{claim}": `. `{n}` skrives med ord («two», «three»). Valg: egen avis → predikat (`paid`, `caused`) → stor påstand (`not_real`, `caused`) → generell. `none` = samlet dekning mangler; `one` = samlet dekning fra ett synlig opphav (kuttes); `several` = samlet dekning fra {n} ulike synlige opphav (går videre).

**Generell (`v`)**
- `none`: «"{claim}": what you've marked as supporting doesn't, taken together, cover who this is about. As it stands, it doesn't go forward.»
- `one`: «"{claim}": taken together, what you've marked as supporting covers who this is about, but only from one visible origin. That's a lead, not enough to take forward. I need a second visible origin, and material that shows this, not just names them.»
- `several`: «"{claim}": taken together, the material you've marked as supporting, with the supporting connections you've made, covers who this is about, across {n} different visible origins. That's enough for me to take it to the desk, not to say it's true. Being named isn't being shown: check that each one shows this, and that they don't trace back to the same place.»

**Stor påstand (`v.bold`)**
- `none`: «"{claim}": that's a big claim, and what you've marked as supporting doesn't, taken together, cover who it's about. It doesn't go forward.»
- `one`: «"{claim}": that's a big claim. Taken together, your material covers who it's about, but only from one visible origin. That's not enough to take forward.»
- `several`: «"{claim}": a big claim. Taken together, the material you've marked as supporting, with the supporting connections you've made, covers who it's about, across {n} different visible origins, so I'll take it to the desk. That doesn't make it true. Being named isn't being shown: what else could explain what you've found?»

**Betaling (`v.predicate.paid`)**
- `none`: «"{claim}": what you've marked as supporting doesn't, taken together, cover both parties, let alone show a payment. It doesn't go forward.»
- `one`: «"{claim}": taken together, your material covers both parties, but only from one visible origin. That doesn't establish a payment, and one visible origin isn't enough to take forward.»
- `several`: «"{claim}": taken together, the material you've marked as supporting, with the supporting connections you've made, covers both parties, across {n} different visible origins. That's enough to take to the desk, but it doesn't establish a payment. For money I want the paper trail: an invoice, a contract, a transfer.»

**Forårsaket (`v.predicate.caused`)**
- `none`: «"{claim}": you want me to print that someone caused {object}? What you've marked as supporting doesn't, taken together, even cover both. It doesn't go forward.»
- `one`: «"{claim}": taken together, your material covers both, but only from one visible origin. Covering both says nothing about what anyone did, and one visible origin isn't enough to take forward. Show me documents, and tell me what else could explain it.»
- `several`: «"{claim}": taken together, the material you've marked as supporting, with the supporting connections you've made, covers both, across {n} different visible origins, so I'll take it to the desk. That shows they turn up in the same story, not that one caused the other. I'd need documents that show what was done and by whom, and a reason the other explanations don't fit.»

**Egen avis (`v.ownOutlet`)**
- `none`: «"{claim}": first, that's my own paper, so I have a stake in this. What you've marked as supporting doesn't, taken together, cover both, so it stays out.»
- `one`: «"{claim}": that's my own paper, so you should know I have a stake in this. Taken together, your material covers both, but only from one visible origin, and that isn't enough to take forward, for my paper or anyone's. Bring a second, and documents if you have them: a contract, an invoice, a payment.»
- `several`: «"{claim}": that's my own paper, so you should know I have a stake in this. I'm holding it to the same rule as anyone: taken together, the material you've marked as supporting, with the supporting connections you've made, covers both, across {n} different visible origins, so it goes to the desk. That shows a connection, not what it is. Bring documents, and tell me what else it could be.»

Uendret: `noTrust` («I don't go through sources for people I don't know yet, so I won't review this. Show me you know something about this story first.») og `own.*`.

### Hjelpetekster (Casebook → Help)

- **Supporting links and Dana** (`supports_dana`): «Dana considers the supporting links you make between evidence added in support of the claim. The link is your assessment. It doesn't confirm that the evidence or the claim is correct.»
- **Which way a supporting link points** (`supports_direction`): «“A supports B” means you think A backs up B. When Dana reviews a claim, A also counts as being about whoever B itself names. B gains nothing from A, and it goes only one step: A doesn't pick up names that B only has through another link. Only supporting links count. Your other connections are your own notes.»
- **Short names and nicknames** (`aliases`): «Evidence counts as naming someone when it uses their full name or handle, or a short form that can only mean one of the people or things you can see. A first name on its own doesn't count. A nickname or abbreviation only counts once something you've saved introduces it, such as a full name followed by the short form in brackets. The evidence shows where it was introduced. Setting that evidence aside keeps the nickname; removing it from your Casebook drops it. Reports you have already published don't change.»
- **Your count, visible origins and what is proven** (`sources`): «These are three different things. Your own count follows your own answers: source cards and “Same origin” connections. Visible origins are where each piece visibly comes from, such as the account that posted it, the person who sent it or the site. Neither says what is proven. Different visible origins can still trace back to the same place, and being named in something isn't being shown by it.»
- **What Dana's review means** (`dana`): «Dana looks at two things: whether what you've marked as supporting, taken together, covers who a claim is about, and from how many different visible origins. With fewer than two, the claim is cut before publishing. A claim that goes forward isn't confirmed: Dana never says whether it is true and never calls your origins independent, and she tells you when the story touches her own paper.»

I koblingsdialogen, når «Supports» er valgt: «Dana considers this connection when reviewing evidence linked as supporting your claim. It doesn't confirm that either item proves the claim.» med lenken «How supporting links work» til temaet om retning.

På beviskortet, under «Short names»: «{alias} → {name}, introduced in {evidence}», for eksempel «NGD → Northgate Development, introduced in Brightline Client Portal — NGD / CSP-EF», med lenke til «Short names and nicknames».

### Nye og endrede tips (universelle, nevner ingen personer, steder eller saker)

- **Connections are yours** (`link`): «A connection records your own reading of how two pieces relate. Nothing checks it. An editor may take supporting links into account, but a link never confirms that either piece, or a claim, is right.»
- **Short names** (`alias`): «A nickname or abbreviation only counts as naming someone once something you have saved introduces it. The evidence shows where it was introduced.»
- **An editor's review** (`review`): «An editor looks at whether your supporting evidence, taken together, covers who a claim is about, and how many different visible origins it comes from. Going forward is not the same as being proven.»
- **Theories** (`theory`): «A theory says who did what. Link evidence to it. The Casebook counts the different visible sources behind it. It cannot tell you whether you are right.»
- Introduksjonen, punkt 2: «Save what you find to your Casebook. Build theories from it and see how many different visible sources back them.»
- Settings: «Show intro tips again». Bekreftelse: «Tips you've seen will appear again, one at a time, when you next use each thing.» (tips av: «Tips you've seen are cleared. Turn on Show tips to see them again.»). Hint: «Tips appear one at a time, the first time you use something. Showing them again doesn't change your game. They never mention people, places or cases.»

### Målinger

`simulate.mjs` mot `main` (`20d2f49`): bare antall handlinger endres (design_as_clue 83→84, lights_out 59→60, who_paid_whom 72→76, portal_lie 71→72, too_late 64→65); dager, troverdighet, avslutninger og utforskerne er identiske. Node-tester 285/285, 0 `todo`; `validate.mjs` 0 feil, 0 advarsler; UI-testene hver for seg ved 390×844 (casebook 7/7, arkiv 3/3, tips 1/1).
