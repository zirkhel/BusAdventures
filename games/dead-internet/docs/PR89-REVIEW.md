# PR #89 — kontroll før merge

Kontrollgrunnlag 25. november 2026: [PR #89](https://github.com/zirkhel/BusAdventures/pull/89), head `50d5643703a9f7e136809e788eefb64059971383`, base `20d2f49`. PR-en er åpen og ikke merget. Denne dokumentasjonsgrenen bygger på head og endrer ingen spillkode.

## Bekreftet ved egen kontroll

- [x] `21fc5a1` implementerer regel P, hjelp og tips. `50d5643` er pushet etter denne og inneholder den siste avtalte presiseringen; Groks arbeid ble ikke stående bare i chatten.
- [x] Synlig avsender beholdes: @harborwalkerpat har kontoens opphav og navngis som konto, ikke som personen. Løse Pat/Mike/Lindsay/Tom i annen tekst blir ikke automatisk disse kontoene. Tilsvarende tester dekker Mike, Lindsay og Toms kommentar.
- [x] Alle fem berørte Dana-replikker sier «with the supporting connections you've made».
- [x] `review()` og publiseringskuttet bruker `apparentSupportOf`; regel P bruker bare for-listen, synlige navn, rettede Supports, ett ledd og ulike synlige opphav.
- [x] Navne-, Dana-probe- og tvillingtestene kjørt sekvensielt: **30 bestått**, ingen feil eller todo.
- [x] `tips-help.test.mjs`: **6 bestått**. Nytt spill, omstart/lasting, reset, kø og hjelpetekst dekket.
- [x] Full `validate.mjs`: **456 artefakter, 8 karakterer, 85 bilder; 0 feil, 0 advarsler**.
- [x] Tillitsfarmen er fortsatt til stede og er ikke skjult som «fikset» av denne PR-en.

- [x] Under dokumentasjonsoppryddingen: hele Node-pakken kjørt én gang med `--test-concurrency=1`: **287/287 bestått**, 0 feil, 0 hoppet over, 0 todo (ca. 96 sekunder).
- [x] `simulate.mjs` kjørt etter testpakken: **12/12 scenarioer består**; begge utforskere når Lights out (362/463 bevis). Kode og innhold er identisk med `50d5643`. Det er ikke kjørt en ny simulator på basegrenen for separat differanseberegning.

## Tidligere rapport og gjenværende UI-kontroll

DEVPLAN ved `50d5643` rapporterer 287/287 Node-tester, validator uten feil/advarsler, simulator med samme dager, troverdighet og avslutninger som base, samt Casebook UI 7/7, Archive UI 3/3 og tips UI 1/1 ved 390×844. PR-beskrivelsen og regelbeskrivelsens gamle måleavsnitt viste fortsatt 285. Dette var forskjellige dokumenterte måletidspunkter. Den nye Node-kjøringen ovenfor bekrefter nå 287. UI-resultatene er fortsatt tidligere rapporterte resultater.

Simulatorens rapporterte forskjell er antall handlinger: +1 i design_as_clue, lights_out, portal_lie og too_late; +4 i who_paid_whom. Skriptene lager nå uttrykkelige støttekoblinger og sistnevnte lagrer også A09. Uendret simulatorutfall beviser ikke i seg selv at informasjon ikke lekker.

## Sjekk eller avklar før merge

- [ ] Full gjennomgang av PR-ens samlede diff, utover de siste navne-/replikkendringene. Den smale kontrollen ovenfor er ikke en full revisjon av alle rapport-, migrerings- og UI-endringene.
- [ ] Verifiser mobilflyten på head: støtteretning, aliasforklaring, Help uten tipspåvirkning, kø, reset når tips er av/på, lasting og Start over. Tidligere skjermbilder fra en annen arbeidsmaskin er ikke lokalt kontrollert.
- [ ] Knytt fullpakke, simulator og UI-resultater til commit som faktisk skal merges. Fullpakke og simulator er nå kjørt på uendret runtime fra `50d5643`; UI gjenstår som egen kontroll. Gjenbruk dokumenterte kjøringer når tilstrekkelig; ved kodeendring kjøres nødvendige kontroller sekvensielt etter DEVPLAN, ikke kontinuerlig.
- [ ] Avklar avgrensningen av navneoppslaget: hva betyr «synlig kandidat» sammenlignet med «allerede møtt»? Ikke legg inn en ny oppdagelsesregel i dokumentasjonen alene.
- [ ] Vurder om den engelske bokstavtesten for løse fornavn også skal håndtere annen kapitalisering og aksenter. Ingen utvidelse av navneparseren er gjort her.
- [ ] Bekreft UX for «Show intro tips again» når tips er av: den nullstiller sett-listen, men bryteren må fortsatt slås på separat. Dette er implementert oppførsel, ikke en ny anbefaling.
- [ ] Registrer at gjenværende dialogreaksjoner på `showSupports` og tillitsfarmen tas separat. Ikke omtale hele Dana/personsystemet som lekkasjefritt.
- [ ] Oppdater PR-beskrivelsen med presis navneregel og verifiseringsgrunnlag før godkjenning.
- [ ] Anders gjennomgår og gir eksplisitt mergegodkjenning. Assistentanbefalinger i tidligere referater er ikke denne godkjenningen.

## Utenfor PR #89

Tillitsfarm, øvrig persondialog, F-1/F-2, nye avslutninger, nye påstandstyper og nye apper. Se [BACKLOG](BACKLOG.md). Disse skal ikke snikes inn for å få kontrollisten grønn.

## Dokumentasjonsopprydding i PR #90

PR #90 bygger på #89 og samler gjeldende beskrivelse, restoppgaver og denne kontrollisten. Historiske fullkopier er erstattet av lenker til `50d5643`. Ingen spillkode eller tester er endret. De registrerte 287 testene, validatoren og simulatoren gjenbrukes; dokumentasjonsoppfølgingen kontrollerer lenker og diff uten å starte spilltestene på nytt. Åpne punkter ovenfor er ikke dermed godkjent.
