# Dead Internet: Casebook som deduksjonsverktøy

_Status 25. november 2026: steg 0–2 er merget (steg 2 som PR #85 `d6dbb8c`), steg 3 (sammenligning og koblinger) er merget som PR #86 `5d64cbc`, W8 (Archive i Browser) som PR #87 `50f65fb`, steg 4 (kildevurdering) er merget som PR #88 `20d2f49` med Anders' beslutninger 25.11.2026 (se DESIGN.md, «Implementert steg 4»), og steg 5 (rapportering) er implementert 25.11.2026 på greina `casebook-step-5` som PR #89, justert etter Anders' beslutninger samme dag; punkt 9 (Dana leser skjulte `supports`) venter på hans avgjørelse før merge (se DESIGN.md, «Implementert steg 5», og DEVPLAN, «Steg 5»). Anders bestemte 25.11.2026 at en kobling alltid er mellom nøyaktig to bevis, med retning for «Supports» og «Possibly manipulated» (se DESIGN.md, «Implementert steg 2» og «Implementert steg 3», som gjelder foran forslaget der de avviker, særlig `against` som eget felt). Opprinnelig forslag til diskusjon, 24. november 2026. Ingenting var implementert da. Gjennomgangen er gjort mot `main` i zirkhel/BusAdventures (etter PR #64)._

## Kort fortalt

- Casebook har allerede et godt fundament: bevis, strukturerte teorier, notater, en spillerbygd Timeline, saker per element og rapporter med Dana som redaktør. Skillet mellom kanon og spillerkunnskap er stort sett holdt.
- **Jeg fant én reell lekkasje.** Tallet «uavhengige kilder» på en teori regnes ut fra bevisets skjulte opphav i kanon, ikke fra det spilleren kan se. Lenker spilleren profilene til Mike, Pat og Lindsay til samme teori, viser Casebook «3 evidence · 1 source» og en kildebrikke «Mike ×3». Det avslører at de tre «vennene» har samme opphav, som er nettopp det spilleren skal finne ut selv. Det samme skjer med @owenpike58 og truthseeker_88. Jeg har kjørt dette mot motoren og fått bekreftet det. Jeg foreslår at dette rettes før den eksterne spilltesten (steg 0).
- Det som mangler er spillerens egne vurderinger: markeringer, arkiv, sammenligning, koblinger mellom bevis, kildevurdering, bevis *mot* en teori og teoriens status. Uten disse blir Casebook en voksende liste.
- Forslaget legger til et tynt «spillerlag» i datamodellen som spillmotoren aldri leser når den avgjør utfall, og en kort mobilflyt: **sorter → sammenlign → koble → vurder kilde → teori for/mot → rapport**.
- Rekkefølge: steg 0 (lekkasjen) nå, så ekstern spilltest på dagens Casebook, og deretter steg 1–5 i små PR-er, styrt av det testspillerne faktisk sliter med.

---

## 1. Hva som allerede er implementert

| Funksjon | Hvor | Status i dag |
|---|---|---|
| Bevis (Evidence) | `core/casebook.js`, `app/apps/casebook.js` | Lagre side, versjon (cache), bilde eller melding. Duplikater stoppes. Gruppert «etter hvem det handler om» eller «nyeste først». Menyen har: koble til teori, vis til noen, sak, legg i Timeline, fest til hendelse, fjern. |
| Teorier (Theories) | samme | `[hvem] [relasjon] [hvem/hva]` med 8 relasjoner. Bevis kan kobles til (bare «støtter», ingen «mot»). Ett notatfelt. Redigere og slette. Viser «n evidence · n sources». |
| Notater (Notes) | samme | Fritekst, redigere/slette, sak. «Save» på et ord eller en markering i kontekstmenyen lager også et notat (med `about` og opphavslenke). |
| Timeline | `core/timeline.js` | Spillerbygd, med eksakt, omtrentlig, intervall eller ukjent dato. Bevis festes som *supports* eller *contradicts*. Kobles til teorier. Datoforslag hentes fra kilden, men spilleren velger. Ingenting sjekkes mot kanon. |
| Saker | `core/cases.js` | Alle elementer har `cases: []`, uklassifisert som standard. Filter: alle, per sak, uklassifisert. |
| Rapport | `publish()`, Casebook → Reports | Kanal, teorier som påstander, valgfrie hendelser, Danas gjennomgang. Konsekvenser kommer som varsler, meldinger og avslutninger. Casebook viser aldri sannhet eller poeng. |
| Kontekstmenyer | `app/context.js` | Ett felles system. Trykk på ord eller navn, markering av tekst, bilder og dokumenter. Ingen visuell markering av referanser. |
| Søkehistorikk | Seeker og Browser | «Recent searches» (8 siste) i Seeker og «History» i Browser. Ligger riktig nok utenfor Casebook. |
| Oppdagelsestilstander | `core/discovery.js` | unknown → encountered → investigated → saved. Velgere viser bare investigated/saved. |

## 2. Hva som mangler

Målt mot punktene i bestillingen:

| Ønsket | Finnes? |
|---|---|
| Markere bevis som gjennomgått, viktig, tvilsomt, irrelevant | Nei |
| Arkivere og gjenopprette | Nei. Bare permanent «Remove». |
| Egen kommentar på bevis | Feltet `evidence.note` finnes i datamodellen, men kan ikke redigeres i UI. |
| Knytte bevis til teorier | Ja, men bare som støtte. |
| Knytte bevis til andre bevis | Nei |
| Knytte til saker | Ja |
| Velge to eller flere bevis og sammenligne | Nei |
| Sammenhenger (supports, contradicts, related, same origin, possibly manipulated, unrelated) | Bare *supports/contradicts* mellom bevis og tidslinjehendelse |
| Kildevurdering (troverdighet, autentisitet, uavhengighet) | Nei. Kildetelling finnes, men er automatisk og bygger på kanon (se lekkasjen). |
| Teori: motstridende bevis, åpne spørsmål, alternativer, forkaste og gjenopprette | Nei. Bare notat og sletting. |
| Teorier som ikke passer i en trippel («nekrologen kan være falsk») | Nei. Relasjonene handler om personer, kontoer og organisasjoner, ikke om dokumenter. |
| Filtrering etter egne vurderinger, skjule arkivert | Nei. Bare filter per sak. |

## 3. Hvor dagens løsning kan gi informasjonsoverbelastning

1. **Bevislisten bare vokser.** Ingen markering av hva som er lest, ingen arkiv. Etter en full gjennomspilling ligger 20–40 bevis i samme liste.
2. **Teorivisningen lister alle andre bevis.** Under «Other evidence» står hele Casebook for å kunne trykke +. Med fem teorier ser spilleren samme liste fem ganger.
3. **Velgere viser alt.** «Attach evidence» på en hendelse og «Link to theory» viser alt uten filter eller søk.
4. **Notater blandes med sitater.** «Save» på et ord lager et notat. Notes-fanen blir en blanding av navn spilleren har lagret og egne tanker.
5. **Ingen beviskort.** Å trykke på et bevis åpner originalen. Det finnes ikke et sted som samler «hva mener jeg om dette beviset».
6. **Teorier har ingen status.** Gamle og forkastede teorier ligger side om side med de aktive, eller blir slettet med koblingene sine.
7. **Rapportbyggeren** viser alle teorier og hendelser i tre grupper. Det holder nå, men ikke når universet har flere saker.

### Lekkasjer funnet i gjennomgangen

| # | Hva | Alvor |
|---|---|---|
| L1 | `sourceCount` og kildebrikkene i teorivisningen og rapportbyggeren grupperer etter skjult `source` i kanon. Mike/Pat/Lindsay = 1 kilde (`garden`). @owenpike58 + truthseeker_88 = 1 kilde (`owen`). Brightlines Connect-konto + nettsider = 1 kilde. | Høy. Avslører «samme opphav», som er kjernen i punkt 4. |
| L2 | «Etter hvem det handler om»-grupperingen bruker forfattet `mentions`. 69 artikler har mentions som ikke står i teksten. De fleste er harmløse (bydel, bystyret), men mekanismen kan legge et bevis under en person spilleren ikke har sett nevnt. | Middels |
| L3 | Danas vurdering («strong/weak») teller samme skjulte kilder. Tre personakontoer gir «weak», og det er et hint fra UI-en forkledd som en karakter. | Middels. Hun er en karakter, men hun skal bare vite det hun kan vite. |
| L4 | Kildenavnet for dokumenter uten forfatter slås opp via «hvem har samme source-nøkkel». I dag gir det riktige navn, men et dokument spilleren fant selv kan få en karakter som avsender. | Lav, men skjør |

Scoring ved publisering *skal* bruke kanon, fordi konsekvensene i verden er spillet. Feilen er bare at de samme tallene vises i Casebook.

## 4. Hvordan deduksjon kan bli en naturlig del av spillet

Prinsippet: **UI-en viser fakta side om side og husker spillerens vurderinger. Verden reagerer på det spilleren publiserer eller viser til andre. Ingenting i grensesnittet sier om spilleren har rett.**

1. **Sammenligning gjør arbeidet.** Når to bevis ligger side om side med de synlige feltene (dato, avsender, plattform, metadata, bildetekst), ser spilleren selv at nekrologen er fra juli 2025 og innlegget fra mars 2026. Skjermen konkluderer ikke, men sammenligningen gjør det lett å se.
2. **Koblinger er påstander, ikke fasit.** «Same origin» mellom Mikes og Pats profiler er spillerens mening. Den teller i spillerens egen kildetelling («3 kilder, 2 etter dine koblinger»), men motoren sier aldri om den stemmer.
3. **Kildevurdering er på kilden, ikke på hvert bevis.** Mistror spilleren @maraquinn, gjelder det alle innleggene derfra. Det gir mindre administrasjon og er riktigere journalistikk.
4. **Bevis mot teller like mye som bevis for.** En teori med to for og to mot er et bedre arbeidsdokument enn en med fire for.
5. **Tilbakemelding kommer fra verden, ikke fra UI.** Dana vurderer ut fra synlige kilder og spillerens *egne* forbehold («Du har selv merket denne kilden som tvilsom»). Hun kan altså bli lurt av tre personakontoer, akkurat som spilleren. Konsekvensen kommer etter publisering, i verden. Det passer premisset: også journalisten tror på kilder som kanskje ikke finnes.
6. **Senere (innhold, ikke motor):** spilleren kan vise en kobling eller teori til en karakter, og karakteren svarer ut fra sin egen kunnskap og tro (lag 2 i punkt 9), som kan være feil.

## 5. Brukerflyt på mobil

Alt er én hånd: korte trykk, bunnark (`actionSheet`) og samme kontekstmeny som ellers. Ingen sveiping, fordi sveip fra venstre kant allerede betyr «tilbake».

### A. Samle (uendret, litt raskere)
Bokmerke eller «Save as evidence» fra kontekstmenyen. Toasten får to valg: **Angre** og **Kommentar**. Kommentar er én linje og valgfri.

### B. Evidence-fanen: triage øverst
```
[ Aktive ▾ ]  [ Alle saker ▾ ]                  ← én rad, to nedtrekk
Ikke gjennomgått (4)
  ▢ Obituary: Mara Quinn          Daily Record · dag 1
  ▢ @maraquinn: I've been away    @maraquinn · dag 1
Resten (12)  · gruppert etter kilde / nyeste
  ★ Invoice NGD-0114              Dana · dag 2
  ? Garden dashboard              Iris · dag 3
```
- Første nedtrekk: Aktive · Ikke gjennomgått · Viktige · Tvilsomme · Lagt bort. Andre: sakene (som i dag).
- **Trykk** åpner beviskortet (C). **⋯** gir hurtigmenyen: Gjennomgått · Viktig · Tvilsom · Legg bort · Sammenlign med… · Koble til teori… · Kommentar.
- **Langt trykk** gir valgmodus. Avkrysning, og en bunnlinje: «Sammenlign (2) · Koble · Legg bort».
- «Gjennomgått» settes også når spilleren åpner kortet. Det er spillerens egen handling, ikke kanon, og fjerner administrasjon.
- Ikonene ★ og ? er spillerens egne markeringer og vises i samme nøytrale farge. Ingen farger som kan forveksles med en vurdering fra spillet.

### C. Beviskortet (ny skjerm)
```
[miniatyr]  Obituary: Mara Quinn
            The Daily Record · publisert 2025-07-04
[ Åpne original ]                    ← tilbake gir samme rulleposisjon
Mine merker:  (✓ Gjennomgått) (★ Viktig) (? Tvilsom)
Min kommentar: «Dato stemmer ikke med innlegget i mars»
Kilde: The Daily Record ›             ← kildekortet (E)
Koblinger (2)      Motsier → @maraquinn: I've been away
                   Samme opphav? → Funeral notice, Calder Chapel
Teorier (1)        FOR  Brightline operates @maraquinn
Tidslinje (1)      2025-07-02  Mara dør
Saker              The Quiet Account
[ Legg bort ]  [ Fjern helt ]
```

### D. Sammenligne og koble
1. Valgmodus, kryss av 2 eller flere, trykk **Sammenlign**.
2. Kortene stables over hverandre, og hvert kort kan rulles. Synlige felter står på linje: dato, kilde, plattform, metadata (bilder), forfatter.
3. Bunnknappen **Hvordan henger de sammen?** gir et bunnark med seks valg: *Støtter · Motsier · Relatert · Samme opphav · Mulig manipulert · Urelatert*.
4. Valgfri linje: «Fordi …». Lagre.
5. Herfra kan spilleren også trykke **Ny teori fra dette** eller **Ny hendelse**, med bevisene ferdig festet.

Koblinger er ikke en egen fane. De ligger på beviskortet, i teoriene og i sammenligningen.

### E. Kildekortet
Én side per *synlig* kilde (konto, nettsted, avsender av en melding eller et vedlegg):
```
@harborwalkerpat på Connect          3 bevis
Stoler jeg på kilden?      ( Ja | Usikker | Nei )
Er den den den utgir seg for? ( Ja | Usikker | Nei )
Samme opphav som …  [+ Velg kilde]     → @eastfield_dad_mike, @lindsay.on.4th
Kommentar: «Alle tre poster bare reposter …»
```
Alle tre spørsmålene står tomme til spilleren svarer.

> **Implementert i steg 4 (25.11.2026):** kortet har de to spørsmålene (Yes / Unsure / No, et nytt trykk tar svaret tilbake), «Same origin as …» med søk, kommentar, kildens bevis og spørsmålene fra steg 2 som er koblet til kilden. Kildenøklene er de samme som spørsmålene bruker. Spillerens egen telling slår sammen kilder etter «Same origin as» på kortene og «Same origin»-koblinger mellom bevis, og teorikortet viser «3 sources · 1 in your count». Dana og rapportbyggeren leser ikke kortene ennå; det hører til steg 5.
>
> **Anders' beslutninger 25.11.2026:** punkt 1–6 godkjent med justeringer. «Unsure» er et aktivt svar, forskjellig fra ubesvart i data og på skjermen. Kortet viser nøyaktig hvilke «Same origin»-koblinger som slår det sammen, og de kan åpnes, endres og fjernes derfra; kortets egne svar overskrives aldri. Kjeder gir én gruppe, og en indirekte gruppering vises som «via Pat»; opptellingen beregnes på nytt når en kobling, et svar eller et bevis fjernes. Manglende tillit trekker ikke fra kilden: troverdighet og uavhengighet er forskjellige spørsmål. Tomme kort skjules bare når alle bevis faktisk er fjernet; «Set aside» er ikke fjerning. Svarene er knyttet til en stabil kilde-ID (`sourceViews[nøkkel]`), ikke visningsnavnet. Formuleringen «3 sources · 1 in your count» beholdes.

### F. Teori som arbeidsdokument
```
Brightline operates @maraquinn          [ Arbeidsteori ▾ ]
FOR (3 bevis · 3 kilder, 2 etter dine koblinger)
MOT (1)
Åpne spørsmål   ▢ Hvem betalte for kontoen?   [+ ]
Alternativer    Theo operates @maraquinn (forkastet dag 2)
Min vurdering   …
[ + For ]  [ + Mot ]  [ Rediger ]
```
- Status: *Arbeidsteori · Overbevist · Forkastet*. Endringer logges med dag. Forkastede teorier skjules i en sammenfoldet gruppe, og alle koblinger beholdes.
- **+ For / + Mot** åpner en velger som viser viktige og ikke-bortlagte bevis først, og som har søk. Den lange «Other evidence»-listen forsvinner.
- Åpne spørsmål er korte linjer som kan krysses av.
- Alternativer er bare en kobling til en annen teori. Konkurrerende teorier står side om side.

### G. Rapport
Som i dag, men hver påstand viser *for / mot / kilder etter dine koblinger*. Spillerens egne forbehold vises i byggeren, så spilleren ser at hen publiserer noe hen selv har merket som tvilsomt. Rapporten lagrer et øyeblikksbilde av teksten, så den ikke endres når teorien revideres senere.

> **Implementert i steg 5 (25.11.2026), justert etter Anders' beslutninger samme dag:** hver påstand i byggeren viser «3 marked as supporting by you · 1 marked against · 3 sources · 1 in your count» og spillerens egne forbehold; teorier med bare egne ord står i en egen liste. Rapporten lagrer `snapshot = { day, theories, events, cut }` med spillerens tellinger og forbehold. Dana kommenterer spillerens egne merker (bevis mot, egen telling, «No» på kildekortene, forkastet teori) i en egen del av vurderingen, som råd. Innenfor Anders' grenser 25.11.2026: `review()` og `publish()` er uendret, poengreglene er ikke endret, og Timeline-tallene er merket «in your count». Øyeblikksbildet fryser også ordlyden, spillerens notater og begrunnelser, og skiller publisert fra det Dana kuttet; historiske rapporter endres ikke når Casebook redigeres. Danas vurdering og det hun gjengir om spillerens forbehold står i to bokser. Fritekstteorier kan ikke publiseres, med en forklaring; bredere påstandstyper gjenstår. Strukturert publisering for manipulerte dokumenter er en eksplisitt restoppgave til designavklaringen om publisering og saksavslutning, ikke automatisk del av F-1/F-2.

### Hva skjer med «Save» på et ord?
I dag lager det et notat. Forslag: et lagret sitat blir et **bevis av typen sitat** (kilde + utdrag) og havner i triagen. Notes blir bare spillerens egne tanker. Det fjerner den største dupliseringen.

## 6. Skillet mellom funksjonene

| Funksjon | Spørsmål | Hvor | Eier dataene |
|---|---|---|---|
| Search History | Hva har jeg søkt etter? | Seeker/Browser (finnes) | `s.searches` |
| Evidence | Hva har jeg valgt å samle? | Casebook-fane | `s.evidence` |
| Notes | Hva tenker jeg? | Casebook-fane (frie notater) + én kommentar på hvert element | `s.notes`, `item.note` |
| Timeline | Når mener jeg det skjedde? | Casebook-fane (finnes) | `s.timeline` |
| Theories | Hva tror jeg har skjedd? | Casebook-fane | `s.hypotheses` |
| Connections | Hvordan henger det sammen? | Beviskort, sammenligning, teori (ingen fane) | `s.links` |
| Sources | Hvem stoler jeg på? | Kildekort (ingen fane) | `s.sourceViews` |
| Report | Hva kan jeg stå for offentlig? | Casebook → Reports (finnes) | `s.reports` |

Regel mot duplisering: **hver opplysning lagres ett sted og vises ved referanse.** En kommentar på et bevis kopieres ikke inn i Notes. Søket i Notes kan likevel finne kommentarer og vise dem som lenker.

Fanene er fortsatt fire: Evidence, Theories, Timeline og Notes.

## 7. Endringer i datamodell og spillmotor

### Lagring (SAVE_VERSION 6 → 7, med migrering)

```js
evidence[i] += {
  marks: { reviewed: day|null, important: bool, doubtful: bool },
  shelf: null | "irrelevant" | "archived", shelvedDay?,
  note,                         // finnes, blir redigerbar
  via?: { message } ,           // hvordan spilleren fikk den (vedlegg fra hvem)
  quote?: { text },             // nytt: lagret utdrag
}
links: [{ id: "L…", items: [evidenceId, …], kind: "supports"|"contradicts"|"related"|"same_origin"|"manipulated"|"unrelated", note, day, edited? }]
sourceViews: { [synligKildenøkkel]: { trust: null|"yes"|"unsure"|"no", authentic: null|"yes"|"unsure"|"no", sameAs: [nøkler], note } }
hypotheses[i]: evidence: [{ id, stance: "supports"|"contradicts" }]   // migrering: alt → supports
             += status: "open"|"convinced"|"rejected", statusLog: [{ day, status }],
                questions: [{ id, text, done }], alternatives: [hypId], title?: string
```

`irrelevant` og arkiv er slått sammen til én handling, «Legg bort», med en grunn. Det gir én ting å lære og ett filter. Det er et valg du må ta (se under).

### Motor

1. **Ny modul `core/provenance.js`:** `apparentSource(g, e)` gir kildenøkkel og navn bare fra synlige felt: melding → kontakt, innlegg → kontoens handle, dokument fått som vedlegg → avsender, ellers domenet. All Casebook-telling bruker denne. `evidenceFacts().source` (kanon) brukes bare i scoring.
2. **Ny modul `core/workbench.js`** for spillerlaget: merker, legg bort, koblinger, kildekort, teoristatus, spørsmål. Alt går gjennom `dispatch`, så replay og logg virker som før.
3. **Spillerlaget er usynlig for reglene.** Ingen betingelser i `conditions.js` leser `marks`, `links` eller `sourceViews` (samme regel som for følg og like i media). Da kan verden aldri «belønne» en riktig kobling og dermed røpe fasit.
4. **Gruppering etter hvem det handler om** bygges fra navn som faktisk står i teksten (`scanText`) og spillerens egne valg, ikke fra `mentions`.
5. **Dana** vurderer ut fra `apparentSource`, spillerens egne `sameAs`, og bevis spilleren selv har koblet som *mot*. Scoring og konsekvenser bruker fortsatt kanon. _Implementert i steg 5 som et eget lag (`editorNotes`): hennes kommentar til kildene (`review`) og kuttet er uendret, og spillerens forbehold kommer som råd ved siden av. **Funn 25.11.2026 (punkt 9):** `review` og kuttet bruker ikke kanon bare til scoring: for kanonpåstander avgjør de skjulte `supports`-merkene hvilke bevis som teller, så hun kan brukes som fasit for relevans (sannheten leses ikke). Kanon brukes altså ikke bare av scoring og konsekvenser, slik punktet forutsetter. Probetest og alternativer A–C i DEVPLAN, «Steg 5», «Punkt 9»; venter på Anders._
6. **Teorier utenfor trippelen:** jeg foreslår at en teori får en valgfri fri tittel («Nekrologen er konstruert»). Trippelen kreves først når teorien skal publiseres. Det beholder strukturerte hypoteser som det som kan vurderes, men lar spilleren tenke fritt.

### Lagene fra punkt 9, og hvor de bor

| Lag | Hva | Hvor | Kan Casebook lese det? |
|---|---|---|---|
| 0 Kanon | Hva som er sant | `canon.json`, `facts`, `claims`, `accounts.operatedBy`, `source`, `supports` | Nei. Bare scoring og regler. |
| 1 Karakterenes tro | Hva Dana, Theo, Owen tror | dialog og karakterdata | Nei, bare gjennom meldingene |
| 2 Kildenes påstand | Hva teksten sier | artikkelens synlige tekst, dato og metadata | Ja, det som står på skjermen |
| 3 Spillerens oppdagelser | Sett, møtt, undersøkt, lagret | `seen`, `encountered`, `known`, `saved` | Ja |
| 4 Spillerens slutninger | Merker, koblinger, kilder, teorier | Casebook-tilstanden | Ja, det er spillerens egne data |

En avsluttet sak låser ingenting. Teorier er universets, ikke sakens. «Overbevist» kan endres senere, og loggen viser at spilleren har skiftet mening.

## 8. Implementeringsrekkefølge

Hvert steg er én liten PR med egne tester og kan stoppes etter.

| Steg | Innhold | Når |
|---|---|---|
| **0** | Rett L1–L4: `apparentSource`, grupper etter synlige navn, Dana teller synlige kilder. Tvillingverden-test (punkt 9). Ingen ny UI. | **Før ekstern spilltest**, fordi en testspiller ellers kan få fasit fra kildetallet |
| — | Ekstern spilltest på dagens Casebook. Observer: hvor mange bevis, hva spilleren leter etter, om noen prøver å sammenligne. | Som planlagt |
| 1 | Triage: beviskort, merker, kommentar, «Legg bort», filternedtrekk, «Ikke gjennomgått» øverst. Sitat som bevis. Lagring v7. | Etter testen |
| 2 | Teorier: for/mot, status med logg, åpne spørsmål, alternativer, fri tittel. Velger med søk erstatter «Other evidence». | |
| 3 | Sammenligning og koblinger (valgmodus, sammenligningsskjerm, seks koblingstyper). | |
| 4 | Kildekort og spillerens egen uavhengighetstelling. ~~Dana bruker spillerens forbehold.~~ | Merget som PR #88 `20d2f49`. Dana-delen er flyttet til steg 5: planendring godkjent av Anders 25.11.2026. |
| 5 | Rapport: for/mot/egne forbehold i byggeren, øyeblikksbilde. Ett tips om sammenligning i tips-systemet. Dana bruker spillerens forbehold (flyttet fra steg 4). | Grenser fra Anders 25.11.2026: Danas vurdering før publisering holdes atskilt fra verdens poengberegning etterpå; at Dana leser spillerens forbehold, gir ikke i seg selv grunnlag for å endre poengreglene; nye tall i Timeline merkes som spillerens egen opptelling. Implementert 25.11.2026 (greina `casebook-step-5`, PR #89) innenfor disse grensene; tipset om sammenligning er med. Justert etter Anders' beslutninger 1–10 samme dag. Punkt 9 (Dana og kuttet leser skjulte `supports`) er undersøkt med probetest og venter på hans avgjørelse før merge. |
| 6 | Innhold: vise koblinger og teorier til karakterer. Forfatterveiledning: hvert mysterium skal ha motsigelser og «ekkokamre» (mange kilder, ett opphav). | Med neste mysterium |

Steg 1–5 er rundt 600–900 linjer i `app/apps/casebook.js` og to nye kjernemoduler. Rekkefølgen kan justeres etter spilltesten. Viser testen at triage er nok, kan 3 og 4 vente.

## 9. Testing uten informasjonslekkasje

1. **Tvillingverden-test (den viktigste).** Bygg verden to ganger. I den andre endres bare skjulte felt: `source`-nøkler deles opp eller slås sammen, `operatedBy`, `isHuman`, `facts`, `claims.truth`, `supports`. Kjør samme spillerskript i begge. Alle Casebook-visninger (`casebookView`, beviskort, sammenligning, kildekort, teorier, Danas tekst) skal være *identiske*. Bare publiseringsresultat og konsekvenser får avvike. Testen ville feilet på dagens kode, og det er poenget.
2. **Importgrense.** En test leser kildekoden og sjekker at `workbench.js`, `provenance.js` og `app/apps/casebook.js` ikke importerer `truthOf`, `supportOf`, `matchClaim`, `supportsOf`, `sourceOf` eller leser `w.claims`/`w.facts`.
3. **Spillerlaget endrer ikke verden.** Tilfeldige sekvenser av merker, koblinger og statusendringer (fuzz) skal ikke endre `flags`, `counters`, `trust`, `credibility`, `fired`, `notifications` eller `endings`.
4. **Ingen nye regelbetingelser.** Validatoren avviser innhold som leser spillerlaget i `if`/`when`.
5. **Innholdslint.** Validatoren varsler om `mentions` som ikke står i teksten, og om dokumenter der kildenavnet ville hentes fra en karakter spilleren ikke har fått det fra.
6. **DOM-test i Playwright.** Samme skript i begge tvillingverdener, og sammenlign tekst og CSS-klasser i Casebook. Det fanger farger og ikoner som avslører noe.
7. **Migrering v6 → v7.** Gamle lagringer åpnes, alle teorikoblinger blir «for», ingenting forsvinner.
8. **Spilltest.** Spør testspilleren hva de tror et ikon eller tall betyr. Tror noen at ✓ betyr «riktig», er det en ordlyd- eller ikonfeil.

## Det du må ta stilling til

1. **Rette kildelekkasjen (steg 0) før den eksterne spilltesten?** Jeg anbefaler ja. Det er lite arbeid, og det er en fasitlekkasje.
2. **Skal Dana kunne bli lurt?** Jeg anbefaler at hun bare teller synlige kilder og spillerens egne forbehold. Konsekvensen kommer i verden etterpå.
3. **Fri tittel på teorier, trippel bare ved publisering?** Jeg anbefaler ja. Det lar spilleren tvile på dokumenter, ikke bare på personer.
4. **Slå sammen «irrelevant» og «arkiv» til «Legg bort» med grunn?** Jeg anbefaler ja, for én handling og ett filter.
5. **Bygge steg 1–5 etter spilltesten, styrt av observasjonene?** Jeg anbefaler ja, i tråd med at fase 9 avsluttes med grafikk og test før noe nytt.

Designprinsippet ditt passer godt med modellen: jo flere kilder spilleren vurderer selv, desto bedre forstår hen den konkrete saken. Samtidig avslører ikke systemet hvilke kilder som har samme opphav, og da kan spilleren aldri være helt sikker på hvordan verden henger sammen.
