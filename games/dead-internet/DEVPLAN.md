# Dead Internet — utviklingsplan

_Avkrysningsliste. Oppdateres når oppgaver blir ferdige. Sist oppdatert 24. november 2026 (fase 3)._

## Fase 0 — Design ✅
- [x] Arkitekturforslag og MVP-omfang (docs/PLAN.md)
- [x] Designbeskrivelse for The Quiet Account (docs/THE-QUIET-ACCOUNT.md)
- [x] Avklaringer fra Anders (språk, plassering, hypoteser, tid, tone, grafikk)
- [ ] Papirtest med minst én person (kan gjøres parallelt med fase 2)

## Fase 1 — Kjerne uten grensesnitt ✅
- [x] Prosjektstruktur i `games/dead-internet/`
- [x] Datamodell og verdensmodell (`core/world.js`, `content/`)
- [x] State og lagring med versjon, migrering og eksport (`core/state.js`, `core/save.js`)
- [x] Regelmotor med hendelser, betingelser, effekter og planlagte effekter (`core/rules.js`)
- [x] Fritt søk med indekseringsnivåer, cache og bildesøk (`core/search.js`)
- [x] Personkunnskap, tillit, tilgangsbetingelser og skriptet dialog (`core/dialogue.js`)
- [x] Artefakter med versjonshistorikk og cache (`core/artifacts.js`)
- [x] Casebook med strukturerte hypoteser, notater, vurdering og publisering (`core/casebook.js`)
- [x] The Quiet Account som testverden (88 artefakter, 8 personer, 19 kontoer, 26 bilder)
- [x] Innholdsvalidator med referanser, tidslinjer, kildeuavhengighet, tilgang og blokkeringer
- [x] Simulator med 7 scenarioer og to automatiske spillere
- [x] 28 automatiserte tester
- [x] Grafikkatalog, plassholdere og GRAPHICS.md
- [x] Commit og push (PR #46)

## Fase 2 — Telefonen og lesing
_Implementert 24. november 2026, ukommittet. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] `index.html` + eget `manifest.json` (egen PWA) + `app/main.js` som laster verden med `fetch`
- [x] Telefon-skall: låseskjerm med varsler, hjemskjerm, appbytte, tilbakeknapp/sveip, statuslinje med dag
- [x] Navnevalg ved start (standard Sam)
- [x] Browser: adresselinje, Seeker-søk, resultater med «Cached copy», sidevisning per plattform
- [x] Connect: profil, innlegg, kommentarer, bilder
- [x] Bildevisning med zoom, «Image info», «Search by image» og «Flip & search»
- [x] Lagre som bevis (langt trykk / bokmerke)
- [x] Automatisk lagring etter hver handling, eksport og import av lagring
- [x] Bilder: bruk `assets/images/<fil>` hvis den finnes, ellers plassholder
- [x] Lesevisning i Messages (tråder og vedlegg) og bevisliste i Casebook, så fase 2 kan spilles
- [ ] Test på ekte telefon (iOS Safari og Android Chrome), portrett, én hånd
- [x] Kort på landingssiden i `index.html` (MISC GAME, merket WIP)

## Fase 3 — Samtaler og Casebook
_Implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] Messages: tråder, «spør om», «vis bevis», svaralternativer, ulest-markering
- [x] Ny melding til personer man har funnet, «skriver …»-pause før svar, lagre meldinger som bevis
- [x] Casebook: bevisliste gruppert per person/organisasjon/konto, notater, hypotesebygger med ark
- [x] Hypoteser: opprette, redigere, slette, koble bevis, eget notat
- [x] Visning av antall bevis og kilder per hypotese (ingen vurdering)
- [x] Notater kan redigeres og slettes (`updateNote`, `deleteNote` i motoren)
- [x] Sleep-knapp på hjemskjermen (ikke en egen app) og nattlige hendelser på låseskjermen
- [ ] Mer variasjon i reserve-svar (i dag ett per type per person)

## Fase 3b — Kontekstmenyer, navigasjon og kunnskapsgrenser
_Implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] Felles kontekstsystem (`app/context.js`, `core/refs.js`): ett trykk på et ord gir et handlingsark, uten synlig markering
- [x] Entiteter, alias, kontoer, e-post, domener, adresser, datoer, referansenummer og begreper (`world/terms.json`)
- [x] Fritekst: markér tekst for søk, kopi og lagring
- [x] Søkehistorikk, nylige søk, forslag, ett-trykks gjentak, direkte til resultater fra menyen
- [x] Bevart app-tilstand og rulleposisjon, retur til opphav på tvers av apper, «Recently visited»
- [x] Oppdagelsestilstander (unknown, encountered, investigated, saved) med migrering av gamle lagringer
- [x] Revisjon av Browser, Connect, Messages, Casebook, søkeforslag og kontekstmenyen for lekkasjer, med automatiske tester

## Prioritert rekkefølge videre (Anders, 24. nov)
1. ~~Global kontekstmeny~~ ✅
2. ~~Fjerne informasjonslekkasje~~ ✅
3. ~~Navigasjon på tvers av apper~~ ✅
4. Timeline-fane i Casebook (fase 4)
5. Teste hele etterforskningen på mobil (fase 4)
6. Rapportering, publisering og konsekvenser (fase 5)
7. Fullføre The Quiet Account som spillbart mysterium (fase 6)
8. Resten av appene (fase 7)

## Fase 4 — Timeline og helhetlig mobiltest
- [ ] Timeline som fjerde fane i Casebook. Den bygges av spilleren og genereres aldri automatisk.
- [ ] Hendelser kan opprettes på flere måter:
  - fra en dato («Add to Timeline»)
  - fra markert tekst («Create event»)
  - fra et bevis
  - manuelt
- [ ] Bevis kan knyttes til en eksisterende hendelse.
- [ ] Hver hendelse har:
  - tittel og beskrivelse
  - dato: eksakt (med valgfri tid), omtrentlig, intervall eller ukjent
  - personer, organisasjoner og steder
  - støttende og motstridende bevis
  - teorier og notater
- [ ] Spilleren velger hvilken dato som gjelder: opprettet, publisert, endret, påstått eller metadata. Motoren løser aldri motsetninger.
- [ ] Gale, motstridende og oppdiktede hendelser er tillatt. Ingen riktighetsindikator. Sortering bare etter spillerens egne datoer.
- [ ] Kontekstmenyen får «Add to Timeline» og «Attach to existing event».
- [ ] Hele The Quiet Account spilles gjennom på mobil, og friksjonen måles.

## Fase 5 — Rapport, publisering og konsekvenser
- [ ] Publiseringsflyt med kanalvalg og Danas gjennomgang
- [ ] Valgte tidslinjehendelser kan tas med i rapporter. Evalueringen holdes adskilt fra Timeline.
- [ ] Visning av reaksjoner og avslutninger (epiloger)
- [ ] Papirtest-funn innarbeidet i innholdet
- [ ] Spilltest med 2–3 personer, måling av tid til første funn og tid uten fremgang

## Fase 6 — The Quiet Account ferdig, levende verden og produksjon
- [ ] Grafikk produsert etter `graphics/GRAPHICS.md` (ComfyUI), originaler før kopier
- [ ] Mer bakgrunnsinnhold (mål: 60+ fyllartefakter), generert med AI og kvalitetssikret med validatoren
- [ ] Service worker for offline og rask lasting
- [ ] Flere dynamiske hendelser og reaksjoner på publisering

## Fase 7 — Flere apper
- [ ] Mail: innboks, tråder, vedlegg, videresending og metadata
- [ ] Files: dokumenter, bilder og vedlegg som spilleren eksplisitt har lastet ned
- [ ] Archive: historiske versjoner av sider, profiler og dokumenter. Bygges på motorens versjoner og Browser-cachen.
- [ ] Contacts: adressebok som spilleren selv styrer. Kontakter legges til eksplisitt eller gjennom legitime hendelser. Kontekstmenyen får «Add to Contacts».
- [ ] Forensics: bildemetadata, bildesøk og bildesammenligning, transformasjon, dokument- og versjonssammenligning, kontoaktivitet. Viser observasjoner, aldri konklusjoner.

## Fase 8 — Valgfri AI-dialog (eksperiment)
- [ ] Vurdere AI for `autopilot`-personer bak et flagg, med personens kunnskap som eneste kilde
- [ ] Kostnadsmåling og reserve til skriptet dialog

## Fase 9 — Utvidelse
- [ ] Neste mysterium (Project Echo, Missing Millions, Memory Rewrite eller Ghost Network) i samme verden
- [ ] Varige konsekvenser fra The Quiet Account leses av neste mysterium
- [ ] Vurdere innholdseditor
