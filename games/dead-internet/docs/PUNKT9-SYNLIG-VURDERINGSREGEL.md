# Punkt 9: synlig vurderingsregel for Dana (forslag)

_Forslag 25. november 2026, etter Anders' valg av alternativ B med bindende rammer. **Ikke implementert.** Danas tekst og Daily Record-kuttet er uendret på greina til Anders har godkjent denne beskrivelsen. Tallene under er målt med en prototype utenfor repoet (patch: `/workspace/notes/punkt9-proto.patch` på boksen)._

Anders' rammer (25.11.2026):
1. Samme vurderingsgrunnlag for tekst og kutt: synlig innhold og synlig opphav. Aldri skjulte `supports`, sannhetsverdier eller særbehandling basert på om påstanden er forhåndsdefinert.
2. Navnetreff er ikke bevis på støtte. Dana sier aldri «I can stand behind that»; vurderingen er kildegrunnlag pluss redaksjonelle forbehold.
3. F1 og F4 skrives om. Hun kan etterlyse dokumentasjon og alternative forklaringer, men ikke avsi fasiten.
4. Verdens vurdering etter publisering beholdes. Endrede utfall dokumenteres.
5. Lekkasjetesten blir blokkerende, varierer `supports` og sannhet, og dekker vurdering, kutt og avvist publisering.

## 1. Hva Dana leser

**Påstanden:** spillerens `subject`, `predicate` og `object`, og predikatets definisjon i `predicates.json` (`arity`, `template`, `bold`). Ikke `claims` i kanon, ikke `matchClaim`, ikke påstandens `bold` eller `review`.

**Bevisene:** bare spillerens *for*-liste (`h.evidence`). Bevis koblet *mot* (`h.against`) påvirker ikke nivået eller kuttet (Anders, beslutning 3); de kommenteres i den andre boksen (`editorNotes`).

For hvert bevis:
- **Synlige navn:** `visibleRefsOfEvidence` (`core/provenance.js`). For en side: navn i URL, tittel, tekst, kommentarer og bildetekster i den lagrede versjonen, pluss forfatter, byline og kommentarforfattere. For en melding: navn i teksten og avsenderen (personens konto eller person).
- **Synlig opphav:** `apparentSource(g, e).key`, som i Casebook i dag: kontoen som postet, personen som sendte et vedlegg, adressen til et dokument eller en forumtråd, eller nettstedet.

**Spillerens koblinger:** `g.s.links` med typene `supports`, `related`, `same_origin` og `manipulated`, i begge retninger. `contradicts` og `unrelated` teller ikke. Begge bevisene må ligge i påstandens for-liste.

**Kanalen:** `reviewer`, `minTrust`, `requiresStrong` og et nytt synlig felt `outlet` (`"daily_record"` for The Daily Record), som sier hvilken organisasjon kanalen er.

**Leses aldri:** `supports` på artefakter, versjoner, bilder, svar og regelmeldinger; `supports` som er kopiert inn i lagrede meldinger (`g.s.messages[].supports`, `core/dialogue.js:62–68` og `:95`) ligger igjen i lagringen fordi verdens regler og personene bruker dem, men regelen leser dem aldri; skjult `source`; `truth`, `facts`, `operatedBy`, `isHuman`; påstandslisten i kanon; spillerens kildekort (`sameAs`, tillit, «who it claims to be»; Anders, beslutning 4: spillerens gruppering skal ikke bli Danas overbevisning).

**Ett unntak å vurdere (åpent spørsmål 1):** `visibleRefsOfEvidence` bruker forfatterens `mentions` som port for *aliaser*: et kallenavn i teksten (for eksempel «Pat») gjelder bare personen hvis innholdet lister henne. Dette er slik Casebook har vist «about» siden steg 0. Det er forfatterens bestemmelse av hva en synlig tekst betyr, ikke en skjult fasit, men det er et skjult felt.

## 2. Når et bevis teller («handler om påstanden»)

La *partene* være `subject`, og `object` hvis predikatet har to ledd. Id-ene må stemme nøyaktig: en person og en konto er forskjellige (`mara` er ikke `acc_maraquinn`).

**Regel L (anbefalt).** Et bevis X i for-listen teller hvis
- (a) X synlig nevner alle partene, eller
- (b) spilleren har koblet X (typene over) til et annet bevis Y i for-listen som synlig nevner alle partene.

(b) gir spilleren en måte å vise sin egen slutning på: Theos e-poster (A32) nevner verken Brightline eller kontoen, men spilleren kan koble dem til Brightline-briefen (A22), som nevner begge. Dana leser koblingen som spillerens påstand, ikke som bevis. Én overgang, ikke kjeder.

**Alternativ P (målt, ikke anbefalt).** Som L, men også: X og Y teller hvis spilleren har koblet dem og de *til sammen* nevner alle partene. P gjør S5 («Brightline Media secretly altered eastfieldnotes.blog») mulig å publisere i Daily Record, men åpner for misbruk: Theos profil (A06, nevner Theo) koblet «related» til et @maraquinn-innlegg (A47, nevner kontoen) gir to kilder, og F2 «Theo Quinn operates @maraquinn» slipper gjennom kuttet (målt: credibility 50 → 40 og avslutningen `collateral_theo`). Under L og i dag blir det kuttet.

## 3. Telling og nivåer

Antall uavhengige synlige kilder *n* = antall ulike `apparentSource`-nøkler blant bevisene som teller. Spillerens egne «same origin»-svar og -koblinger slår ikke sammen kilder her (beslutning 4); de står i den andre boksen («By your own count…»).

| n | Nivå | Daily Record (`requiresStrong`) |
|---|---|---|
| 0 | `none` | kuttes |
| 1 | `one` | kuttes |
| ≥ 2 | `several` | kuttes ikke |

**Kuttet:** `publish()` kutter en påstand nøyaktig når kanalen har `requiresStrong` og *n* < 2, med samme funksjon som teksten. Et avslag viser de samme linjene. Ingenting annet i `publish()` endres: poengene etter publisering (`supportOf`, `truthOf`, poengtabellen), `exposed`, regler og avslutninger er som før.

**Tekstvalg** (første som passer): egen avis (`outlet` er subjekt eller objekt) → predikatets egne linjer (`paid`, `caused`) → «stor påstand» (predikatets `bold`: `not_real`, `caused`) → vanlige linjer. Alt avhenger bare av relasjonen spilleren valgte og kanalen, aldri av om påstanden finnes i kanon.

## 4. Alle linjer hun kan si

`{claim}` er påstanden som setning, `{n}` antall kilder, `{object}` objektets navn.

**Lav tillit** (uendret, fra steg 5): «I don't go through sources for people I don't know yet, so I won't review this. Show me you know something about this story first.»

**Vanlige** (`review.dana.v`):
- `none`: «"{claim}": nothing you've linked for this even names who it's about. Cut it or find something.»
- `one`: «"{claim}": one source that's about them. That's a lead, not a story. Find me a second, independent one, and make sure it shows this, not just mentions them.»
- `several`: «"{claim}": {n} sources that look independent and are about them. That's enough to take to the desk, but being mentioned isn't proof. Check that each one actually shows this, and that they don't trace back to the same place.»

**Store påstander** (`v.bold`, predikatets `bold`):
- `none`: «"{claim}": that's a big claim, and nothing you've linked even names who it's about.»
- `one`: «"{claim}": that's a big claim. One source that's about them isn't enough for it.»
- `several`: «"{claim}": a big claim, on {n} sources that look independent. I'll take it to the desk, but it's on you that they show it, not just name them. What else could explain what you've found?»

**Penger** (`v.predicate.paid`, erstatter S3-linjen; `none` bruker den vanlige):
- `one`: «"{claim}": one source for the money. A story about money needs a second, independent one, and ideally the paper trail.»
- `several`: «"{claim}": {n} sources that look independent and are about them. For money I want the paper trail too: an invoice, a contract, a transfer. Being named together isn't a payment.»

**Årsak** (`v.predicate.caused`, erstatter F1):
- `none`: «"{claim}": you want me to print that someone caused {object}? Nothing you've linked even names both.»
- `one`: «"{claim}": you want me to print that someone caused {object}? One source that names both says nothing about what anyone did. Show me documents, and tell me what else could explain it.»
- `several`: «"{claim}": {n} sources that name both. That shows they turn up in the same story, not that one caused the other. I'd need documents that show what was done and by whom, and a reason the other explanations don't fit.»

**Egen avis** (`v.ownOutlet`, erstatter F4; gjelder enhver påstand der kanalens `outlet` er subjekt eller objekt):
- `none`: «"{claim}": that's my own paper, and nothing you've linked names both. Leave it out unless you have documents.»
- `one`: «"{claim}": that's my own paper, so I'm the wrong person to wave it through. One source isn't enough. Bring documents, like a contract, an invoice or a payment, and tell me what else the connection could be.»
- `several`: «"{claim}": that's my own paper, so I'm the wrong person to wave it through. {n} sources that name both show a connection, not what it is. Bring documents, and tell me what else it could be.»

**Spillerens egne merker** (andre boks, uendret fra steg 5, `review.dana.own`):
- `rejected`: «"{claim}": you've rejected this theory yourself. Why put it out under your name?»
- `against`: «"{claim}": you've linked {against} against it yourself. I won't pick a side for you, but readers will want to see that you weighed it.»
- `ownCount`: «"{claim}": you've marked some of these as the same origin yourself. By your own count that's {own}, not {visible}.»
- `notTrusted`: «"{claim}": you told me you don't trust {notTrusted} behind it. If you don't, why should readers?»
- `notAuthentic`: «"{claim}": you doubt {notAuthentic}. Don't lean on it until you know.»

**Under boksene** (uendret): «These are my concerns, not a guarantee that your conclusions are right.»

**Fjernes:** `review.dana.strong` («…two independent sources. I can stand behind that.»), `weak`, `none`, `bold`, og alle `review`-felt og `bold` på påstandene i `canon.json` (S3, F1, F4, og `bold` på S6, S7, F1). S6 («knew about») får da de vanlige linjene, fordi `knew_about` ikke er et stort predikat; S7 og F1 får fortsatt «stor påstand» via predikatet. `validate-world.mjs` sjekker de nye nøklene i stedet for de gamle.

## 5. Virkning på gjennomspillingene (`simulate.mjs`)

Prototypen (regel L, nøyaktig tekstene over) ble kjørt mot `simulate.mjs` og et sporingsskript som logger hver vurdering og publisering. Regel P gir identisk `simulate.mjs`-utdata.

**A. Regelen alene, skriptene uendret.** Fire scenarioer feiler, og begge utforskerne mister Lights Out:

```
design_as_clue  PASS → FAIL  ✗ Lights Out reached ✗ S2 and S3 exposed through the Daily Record   credibility 66 → 58, endings lights_out → none
lights_out      PASS → FAIL  ✗ Lights Out reached ✗ S2 and S3 exposed … ✗ Mara's profile is memorialized ✗ Juno's account is suspended
                             ✗ Theo writes back the next day ✗ the dead account stops posting once memorialized   credibility 66 → 58, endings → none
who_paid_whom   PASS → FAIL  ✗ Who Paid Whom reached ✗ the unknown sender writes   75 actions (72), credibility 74 → 66, endings → none
portal_lie      PASS         credibility 66 → 58, endings lights_out → none
too_late        PASS → FAIL  ✗ Too Late reached ✗ the player is told the case closed   credibility 66 → 58, endings → silence
EXPLORER cautious  362 → 410 evidence, endings lights_out → none
EXPLORER reckless  463 → 471 evidence, endings lights_out → none
(wrong_murder, ghost_story, silence, collateral_theo/owen/iris, juno: uendret)
```

*Forklaring.* Alle fire bygger på `gather`, som publiserer «Brightline Media operates @maraquinn» med A32 (Theos e-poster, kilde Theo: nevner Theo og Mara, men verken Brightline eller kontoen; koblingen går via domenet bl-ops.net, som spilleren selv må slutte seg til), A23 (dashbordet, kilde Iris: nevner kontoen, ikke Brightline) og A22 (briefen, kilde Iris: nevner begge). Bare A22 teller → én kilde → påstanden kuttes, bare «paid» publiseres, og Lights Out (som krever S2 og S3 i Daily Record) uteblir. Utforskerne lenker bevis etter skjulte `supports` og får samme problem. `who_paid_whom` og `too_late` bygger på Lights Out. Endringen i antall bevis hos utforskerne følger av at verden utvikler seg annerledes uten Lights Out.

**B. Spilleren viser sin slutning med en kobling.** Med tre skriptendringer: `gather` kobler A32 → A22 («related», «bl-ops.net is Brightline's client portal»); `who_paid_whom` lagrer også Calvins profil (A09) og kobler den til stockbildet; utforskeren kobler hvert bevis som ikke nevner partene til et som gjør det. Da består alle scenarioene, med samme avslutninger og troverdighet som `main`. Eneste forskjell i `simulate.mjs` er antall handlinger (de nye stegene):

```
design_as_clue 83 → 84, lights_out 59 → 60, who_paid_whom 72 → 76, portal_lie 71 → 72, too_late 64 → 65 actions
```

Sporingen av hver publisering er identisk med `main` bortsett fra Danas ordlyd.

**C. Hva som slipper gjennom kuttet nå, per påstand** (utforskerens bevis på dag 6, valgt etter skjulte `supports`, med koblinger som i B):

| | I dag | Regel L | Regel P |
|---|---|---|---|
| S1–S4, S7, S8 (sanne) | slipper gjennom | slipper gjennom | slipper gjennom |
| S5 «altered» (sann) | slipper gjennom | **kuttes** (ingen enkelt side nevner begge partene synlig) | slipper gjennom |
| S6 «knew about» (sann) | slipper gjennom | **kuttes** (hendelsen «Mara Quinn's death» nevnes ikke synlig noe sted) | **kuttes** |
| F1 «caused» (usann) | **slipper gjennom** | kuttes | kuttes |
| F3 «Owen operates» (usann) | **slipper gjennom** | kuttes | kuttes |
| F2, F4, F5 | kuttes | kuttes | F2 kan presses gjennom med en «related»-kobling (se 2) |

I tillegg slipper sanne påstander gjennom på navnetreff alene: «Mara Quinn is dead» med B22 (Danas egen artikkel) og A47 (et @maraquinn-innlegg) blir publisert; verden gir `true_none` (credibility 50 → 48) og ingen eksponering. Det er verdens vurdering etter publisering, som Anders vil beholde.

**Probetesten** med prototypen: 0 ulike enkeltsvar og 0 ulike helhetssvar, både med sannheten snudd og med `supports` tømt (i dag 22 og 11).

## 6. Blokkerende lekkasjetest

`tests/dana-probe.test.mjs` blir en vanlig test uten `todo`, og `tools/lib/dana-probe.mjs` utvides:

**Tvillinger** (samme spilling, så endres bare skjult kanon, slik at alt spilleren har sett og lagret er identisk):
1. `truth`: alle påstander snudd (true ↔ false, partial → true), og `facts` tømt.
2. `supports-empty`: alle `supports` tømt i verden (artefakter, versjoner, bilder, svar, regelmeldinger) **og i lagringen** (`g.s.messages[].supports`).
3. `supports-shuffled`: hver påstands `supports` flyttet til en annen påstand (S1 → F1, …), så en regel som bare sjekker «ikke tom» også fanges.
4. `claims-gone` og `claims-decoy`: påstandslisten tømt, og lokkepåstander lagt til som matcher hver trippel proben spør om, med egne `bold`- og `review`-felt. Fanger særbehandling av forhåndsdefinerte påstander.
5. `provenance`: skjult opphav, `operatedBy`, `isHuman` og skjulte `mentions` (for navn som ikke står i teksten), som `tests/twin.test.mjs`.

**Spørsmål** i hver tvilling:
- For hver påstand i proben (de 13 kanonpåstandene pluss én ikke-kanonisk trippel per predikat med kjente parter): Danas linjer med hvert enkelt lagret bevis, med alle bevis, og med alle bevis pluss spillerkoblinger (hvert bevis koblet «related» til det neste), så regel (b) dekkes.
- **Kuttet:** for «alle bevis» og «alle bevis med koblinger» publiseres det gjennom Daily Record i en kopi av spillet. Det som sammenlignes, er `refused`, linjene, `cut` og hvilke teori-id-er som ble publisert (ikke poeng eller verdens reaksjon, som skal avhenge av kanon).
- **Avvist publisering:** når det avvises, sjekkes også at tilstanden er byte for byte uendret (bortsett fra handlingsloggen), og at linjene er de samme i alle tvillinger.
- Steg 5s notater og øyeblikksbildet (som nå).

Testen feiler ved første forskjell og skriver stien (for eksempel `S2|A32/v1: "…" ≠ "…"`). Forventet kjøretid: rundt 1–2 sekunder per tvilling. I tillegg: `tests/twin.test.mjs` får tvillingene 2–4 for Danas linjer og kuttet, og forbudstesten utvides til funksjonen som bygger grunnlaget (ingen `supports`, `matchClaim`, `claims`, `truth`, `evidenceFacts`, `sourceOf`).

## 7. Risikoer og åpne spørsmål for Anders

1. **Alias-porten** (se 1): godtar du at forfatterens `mentions` avgjør hva et kallenavn i synlig tekst betyr, eller skal regelen bare bruke fulle navn og håndtak? Det siste endrer også hva Casebook viser som «about».
2. **L eller P:** L stenger misbruk via koblinger (F2/F3/F5 kan ikke presses gjennom), men gjør S5 og S6 umulige å publisere i Daily Record. P åpner S5, men lar spilleren presse usanne påstander gjennom med en enkel «related»-kobling. Anbefaling: L, og vurder innhold (se 3).
3. **Hendelser nevnes nesten aldri synlig.** Bare `evt_festival` gjenkjennes i noen tekst; «Mara Quinn's death» aldri. Dermed kan ingen påstand med en hendelse som objekt («caused», «knew about») komme gjennom Daily Record. Forslag: synlige aliaser for hendelser («Mara's death», «the Route 9 crash») i innholdet. Det er innholdsarbeid og endrer også Casebook.
4. **Kuttet blir et dekningsfilter, ikke et støttefilter.** To kilder som nevner partene er nok; Dana sier tydelig at det ikke er bevis. Verden straffer etterpå (`true_none` −2, `false` −10). Ønsker du strengere kutt for store påstander (for eksempel *n* ≥ 3 for `bold`)? Det er ikke målt.
5. **Koblinger kan misbrukes også under L:** når ett bevis nevner partene, kan spilleren koble hva som helst til det og få en ny kilde. Verden vurderer fortsatt ut fra kanon, så det koster etterpå.
6. **Scenarioene og utforskeren må endres** (B over) for at de designede rutene skal nå sine avslutninger. Spilleren må nå registrere slutningen bl-ops.net → Brightline som en kobling. Er det en ønsket del av spillet, eller skal innholdet gi Dana et synlig spor (for eksempel en side som nevner både domenet og kontoen)?
7. **Egen avis:** skal Daily Record nekte påstander om seg selv uansett *n* (en synlig redaksjonell regel), i stedet for bare å si det?
8. **Spillerens kildekort** brukes ikke i telling eller kutt (beslutning 4). Bekreft at det fortsatt gjelder når grunnlaget nå er synlig.

## 8. Gjennomgang av andre personers reaksjoner på bevis (ikke endret i denne PR-en)

Mekanismen: når spilleren viser en side (`show`), beregnes `supportsOf` for den viste versjonen (`core/dialogue.js:68`), og et svar med `on.showSupports` slår til hvis sidens skjulte `supports` inneholder en av de oppgitte påstandene (`core/dialogue.js:45`). Svarteksten skiller seg fra personens vanlige svar (`fallback.show`), så hvert slikt svar er et ja/nei-signal om skjult relevans. I tillegg sender `message.send` `supports` videre til regler (`core/dialogue.js:83`), og regelen `D3b_brightline_alert_via_persona` (`rules.json`) reagerer på det. Personenes dokumenterte kunnskap står i `knows`, `believes` og `observed` i `characters.json`.

| Person og svar | Utløses av | Grense | Følger personens kunnskap? | Relevanstester? | Anbefaling |
|---|---|---|---|---|---|
| `persona_mara` `evidence` | S1, S8, S2 | ubegrenset | Nei. En automatisk persona (`knows: []`) kan ikke kjenne igjen innhold. | **Ja**: «Aw, old stuff!…» mot «Omg yes!!…» for hver side, gratis og ubegrenset. | Utløs på synlig innhold (siden nevner Mara eller viser bildet hennes) eller gi samme svar på alt. |
| `theo` `murder` | F1 | ubegrenset, −2 tillit og `theo_hurt` hver gang | Ja: han kjenner ulykken (`knows: S1`) og blir såret av mordteorier. | Delvis: signalet koster tillit. | Behold. Utløs gjerne på det synlige (sider som snakker om mord eller drap) i stedet for F1-merket. |
| `theo` `proof` | S8, S2, S5 | én gang | Delvis: teksten («that's her photo. she took that in may») passer bare bildet A33, men utløses av enhver S2/S5/S8-side, også en Brightline-brief. | Ett signal. | Knytt til det han faktisk kan kjenne igjen (`show: ["A33"]` eller originalbildet). |
| `dana` `invoice` | S2, S5, tillit ≥ 1 | én gang | Delvis: hun er journalist og vurderer det hun får se, men via skjulte merker. | Ett signal. | Knytt til synlig innhold (siden nevner Brightline eller bl-ops.net, eller arkivendringen hun kjenner). |
| `dana` `evidence_low` | S2, S5, S3, S8, tillit < 1 | ubegrenset | Nei. | **Ja**: «Interesting. Who are you…» mot «Noted. What does it prove…». | Samme svar på alt ved lav tillit. |
| `dana` `evidence` | S2, S3, S4, S7, S8 | ubegrenset, **+1 tillit hver gang** | Nei: hun reagerer på merket, ikke på det hun ser. | **Ja, og en tillitsfabrikk**: hver relevant side gir +1. | Viktigst å rette: én gang per side eller én gang totalt, og på synlig grunnlag (som Danas nye regel). |
| `owen` `agency` | S2, S3, S4 | én gang | Ja i ånden: han reagerer på at det er et byrå, noe som står synlig. | Ett signal. | Utløs på synlig innhold (siden nevner Brightline). |
| `iris` `shown1`/`shown2` | S2, S8, S5 (+ S4) | to ganger (teller), +2 tillit første gang | Ja: hun er innsider (`knows: S2–S6, S8, F5`) og kjenner igjen arbeidet sitt. | To signaler. | Behold (legitim kunnskap). Synlig utløser er en mulighet, ikke nødvendig. |
| `juno` `stage1–3` | S4 | tre ganger, så forsvinner kontoen | Designet: «vis Juno sannheten» får personaen til å bryte sammen (`observed: S4`). | Tre signaler, med varig følge i verden. | Behold. Vurder synlig utløser (bilder fra hagen eller av Juno). |
| `paul` `pressed` | S3 | én gang, setter i gang en uttalelse | Ja: han vet om betalingen (`knows: S3`). | Ett signal. | Behold. |
| `paul` `pressed_again` | S3 | ubegrenset | Ja i ånden, men svaret skiller seg fra fallback («As I said: legal team.» mot «I'd refer you to our website.»). | **Ja**: gratis og ubegrenset for S3. | Svar «legal team» på *alt* som vises etter `paul_pressed`, eller på synlig grunnlag. |
| Regel `D3b_brightline_alert_via_persona` | vise persona_mara S1, S2, S5 | én gang (flagg) | Verdens reaksjon: operatørene ser kontoen. | Ett signal, forsinket (Juno skriver dagen etter). | Behold som verdensreaksjon; vurder synlig utløser. |
| `dana` `edit` (A12), `owen` `police` (A28), `paul` `leak` (A42/A23/A22) | bestemte sider | — | Ja: personen kjenner igjen et bestemt dokument. | Nei, ikke generelt. | Behold. |

**Oppsummert:** fire svar er generelle relevanstestere som bør rettes i en egen runde: `persona_mara.evidence`, `dana.evidence_low`, `dana.evidence` (også tillitsfabrikk) og `paul.pressed_again`. Svarene til Iris, Theo (mord), Juno og Paul (første gang) følger dokumentert kunnskap og kan beholdes. `theo.proof`, `dana.invoice` og `owen.agency` bør knyttes til det personen faktisk kan se.
