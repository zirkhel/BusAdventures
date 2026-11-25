# Dead Internet — teknisk design

Oppdatert 25. november 2026. PR #90 og #89 er godkjent og merget til main (`6a98828`).
Medieappene i detalj: [docs/MEDIA-APPS-PROPOSAL.md](docs/MEDIA-APPS-PROPOSAL.md).
Spilldesign og sak: [docs/THE-QUIET-ACCOUNT.md](docs/THE-QUIET-ACCOUNT.md). Casebook: [docs/CASEBOOK-DEDUCTION.md](docs/CASEBOOK-DEDUCTION.md). Nettsteder: [docs/WEBSITES.md](docs/WEBSITES.md). Saksavslutning: [docs/CASE-ENDINGS-REVIEW.md](docs/CASE-ENDINGS-REVIEW.md). Opprinnelig plan: [docs/PLAN.md](docs/PLAN.md). Oppgaver: [DEVPLAN.md](DEVPLAN.md).

## Prinsipper

1. **Kjernen kjenner ikke DOM.** Alt i `core/` kjører i Node og i nettleseren. Presentasjonen leser tilstand og sender handlinger, ingenting annet.
2. **Ett vedvarende univers, mange mysterier.** Alt innhold ligger i én verden. Et mysterium er en innholdspakke i den verdenen, ikke en egen installasjon eller kopi. The Quiet Account er det første mysteriet, ikke spillet. Se «Univers og mysterier».
3. **Innhold er data.** Personer, kontoer, artefakter, bilder, dialog, regler og kanon er JSON i `content/`. Ingen historie i koden. Motoren kan brukes til andre etterforskningsspill med et annet `content/`.
4. **Kanon, påstander og spillerens tro holdes adskilt** (se under). Spilleren ser aldri sannhetsverdier.
5. **Reproduserbart.** All endring går gjennom `Game.dispatch(action)`, loggføres, og kan spilles av på nytt med samme resultat.
6. **Ingen avhengigheter, ingen byggesteg.** Ren JavaScript med ES-moduler og `// @ts-check`. Tester med Nodes innebygde `node:test`.
7. **Ingen synlig relevans.** Ingen app markerer, sorterer eller vekter etter hva som er bevis.
8. **Det store spørsmålet står åpent.** Om det finnes ekte mennesker igjen på nettet, avgjøres ikke av tilfeldige bakgrunnskontoer eller tidlige mysterier.

**Overordnede designprinsipper (Anders, 24. nov):**
- Deduksjon er spillet. Søking er verktøyet.
- Casebook er spillerens arbeidsflate og eksterne hukommelse, ikke en fasit.
- Internett skal fremstå som et autentisk univers, ikke en samling spillspor.
- Karakterer, medier og offentlige institusjoner kan ta feil. Ingen karakter er en skjult fasitmekanisme.
- Spilleren skal kunne oppnå reelle resultater gjennom egne handlinger.
- Man skal kunne vinne en sak uten å vinne spillet. Senere hendelser som utfordrer en avsluttet sak er forfattet og konsistente med kanon, aldri tilfeldige, og undergraver ikke systematisk spillerens seire.
- Jo mer spilleren oppdager, desto bedre forstår hen de konkrete mysteriene, men desto mindre sikker kan hen bli på hvordan verden egentlig fungerer.
- Saker avsluttes gjennom handlinger og konsekvenser i verden, ikke en «Solve case»-knapp. Spillerens egne merker, kildevurderinger og teoristatus påvirker aldri utfallet i seg selv. Ingen poeng, stjerner eller løsningsgrad vises.

## Teknisk oversikt

Ren JavaScript med ES-moduler, uten byggesteg. Kjernen er uten DOM og I/O; appen viser data og sender handlinger. Innhold lastes fra `content/manifest.json`, med felles universfiler og mysteriepakker. Spillet serveres over HTTP fra `/games/dead-internet/`.

| Ansvar | Kode |
|---|---|
| Handlinger, replay og spilltilstand | `core/game.js`, `core/state.js` |
| Verdensmodell og innholdslasting | `core/world.js`, `core/content.js`, `content/manifest.json` |
| Tilgang, levende/lagrede versjoner | `core/artifacts.js` |
| Oppdagelse og tekstreferanser | `core/discovery.js`, `core/refs.js` |
| Synlig opphav og navn | `core/provenance.js` |
| Bevis, teorier, vurdering og publisering | `core/casebook.js`, `core/workbench.js` |
| Kildekort og rapportgrunnlag | `core/sources.js`, `core/reporting.js` |
| Timeline og saksstatus | `core/timeline.js`, `core/cases.js` |
| Dialog, regler og betingelser | `core/dialogue.js`, `core/rules.js`, `core/conditions.js` |
| Søk, medier, nettsteder og Archive | `core/search.js`, `core/feed.js`, `core/sites.js`, `core/archive.js` |
| Lagring og migrering | `core/save.js` |
| Telefon og apper | `app/phone.js`, `app/apps/`, `app/sites/` |

## Informasjonsgrenser

| Lag | Hva det inneholder | Bruk |
|---|---|---|
| Skjult kanon | Sannhet, faktisk operatør/opphav, `supports`, `mentions` | Verdens regler og vurdering etter publisering, validator og forfatterverktøy |
| Karakterens kunnskap | Det personen vet, tror og har sett | Skriptet dialog innenfor personens kunnskap |
| Synlig kildeinnhold | Tekst, bilder, avsender, dato, metadata | Det spilleren kan lese og sammenligne |
| Oppdagelser | Sett, møtt, undersøkt, lagret | Tilgang til handlinger og allerede oppdaget informasjon |
| Egne vurderinger | Merker, teorier, for/mot, koblinger, kildekort | Spillerens organisering og resonnement |

Konto er ikke person. Tre kontoer kan se ut som tre opphav selv om samme skjulte aktør styrer dem. `apparentSource` bygger bare synlig opphav; `namesIn` gjenkjenner navn etter [regel P](docs/PUNKT9-SYNLIG-VURDERINGSREGEL.md). Presentasjonen får hvitelistede data, ikke kanonfelt som den må huske å skjule.

Spillerens vurderinger er ikke fasit. Rettede Supports-koblinger kan påvirke Danas dekning og dermed kuttet. Kildekort og egne forbehold påvirker ikke hennes opptelling eller verdens poengregel. Redaksjonell gjennomgang og konsekvenser etter publisering er forskjellige lag.

**Kjent avvik:** flere personreaksjoner bruker fortsatt `showSupports`, og Danas bevisreaksjon kan gi gjentatt tillit. PR #89 retter hennes redaksjonelle vurdering/kutt, ikke alle dialogreaksjoner. Se [BACKLOG](docs/BACKLOG.md).

## Verdensmodell og tid

Artefakter har stabile ID-er, tilgang og versjoner. Levende side kan endres eller slettes; tilgjengelig cache og spillerens lagrede kopier er egne lesemuligheter. Bilder har metadata, original/avledning og transformasjoner. Video- og feedmodellen finnes, men TokTok-appen gjenstår.

Søk bruker indeksering og synlig innhold, ikke skjult relevans. Feeder bruker offentlige egenskaper og eksplisitte liker/følger-valg, ikke Seeker-historikk. En kilde blir ikke viktig fordi den kan trykkes på. Lesing, søk og scrolling flytter ikke dagen.

Sleep kjører planlagte effekter, dagsregler og avslutninger. Dialog velger første passende skriptede svar fra emne, vist bevis eller svarvalg; `once` begrenser engangsreaksjoner. Ikke innfør fri AI-dialog uten eget avklart omfang.

Mysterier er pakker i samme univers, ikke kopier av verden. De har egne forutsetninger, frister, påstander, avslutninger og grenser for narrative lag. Spillerens bevis kan være uklassifiserte eller knyttet til flere saker. Senere mysterier kan bruke eksisterende bakgrunnsinnhold som bevis når det er eksplisitt registrert og validert.

## Lagring og grensesnitt

Spillet bruker v12; eldre lagringer migreres. Rapporter uten historisk øyeblikksbilde får `snapshot: null`, ikke oppdiktet historikk. Tips lagres separat per enhet. Eksport/import og nytt spill ligger i Settings.

Telefonen eier hjemskjerm, varsler, bilder og navigasjon. Hver app har sin tilbakestabel. Connect-adresser åpnes i Connect; nettsteder i Browser. Browser-bokmerker er adskilt fra Casebook-bevis. Archive ligger i Browser; sammenligning ligger i Casebook.

Browser, Connect, Messages, Casebook, Settings, The Daily Record og Unfiltered finnes. Mail, Files, Contacts, Forensics og TokTok er senere utviklingsretninger.

## Detaljer og kontroller

- [Casebook](docs/CASEBOOK-DEDUCTION.md): arbeidsflate, kildekort, rapporter, hjelp og tips.
- [Regel P](docs/PUNKT9-SYNLIG-VURDERINGSREGEL.md): redaksjonell dekning, navn og kutt.
- [Nettsteder](docs/WEBSITES.md), [inventar](docs/WEBSITE-INVENTORY.md) og [medier](docs/MEDIA-APPS-PROPOSAL.md).
- [Saksavslutninger](docs/CASE-ENDINGS-REVIEW.md): eksisterende utfall og åpne funn.
- [Teststrategi](DEVPLAN.md#teststrategi-og-belastning) og [kontrollgrunnlag](docs/PR89-REVIEW.md).

Tvillingtester skal gi samme spillerinformasjon, redaksjonelle vurdering, avslag og kutt når bare skjult kanon endres. Verdens konsekvenser etter publisering kan avvike. Validatoren kontrollerer referanser, kunnskapsgrenser, tilgang, innhold og blokkeringer. Tester og simulator erstatter ikke ekstern spilltest.
