# Dead Internet — utviklingsplan

_Avkrysningsliste. Oppdateres når oppgaver blir ferdige. Sist oppdatert 24. november 2026._

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
- [ ] Commit og push (venter på klarsignal)

## Fase 2 — Telefonen og lesing
- [ ] `index.html` + eget `manifest.json` (egen PWA) + `app/main.js` som laster verden med `fetch`
- [ ] Telefon-skall: låseskjerm med varsler, hjemskjerm, appbytte, tilbakeknapp/sveip, statuslinje med dag
- [ ] Navnevalg ved start (standard Sam)
- [ ] Browser: adresselinje, Seeker-søk, resultater med «Cached copy», sidevisning per plattform
- [ ] Connect: profil, innlegg, kommentarer, bilder
- [ ] Bildevisning med zoom, «Image info», «Search by image» og «Flip & search»
- [ ] Lagre som bevis (langt trykk / bokmerke)
- [ ] Automatisk lagring etter hver handling, eksport og import av lagring
- [ ] Bilder: bruk `assets/images/<fil>` hvis den finnes, ellers plassholder
- [ ] Test på ekte telefon (iOS Safari og Android Chrome), portrett, én hånd
- [ ] Kort på landingssiden i `index.html` (etter avtale)

## Fase 3 — Samtaler og Casebook
- [ ] Messages: tråder, «spør om», «vis bevis», svaralternativer, ulest-markering
- [ ] Casebook: bevisliste gruppert per person/organisasjon, notater, hypotesebygger med ark
- [ ] Visning av antall bevis og kilder per hypotese (ingen vurdering)
- [ ] Sleep-knapp og nattlige hendelser på låseskjermen

## Fase 4 — Rapport og avslutninger
- [ ] Publiseringsflyt med kanalvalg og Danas gjennomgang
- [ ] Visning av reaksjoner og avslutninger (epiloger)
- [ ] Papirtest-funn innarbeidet i innholdet
- [ ] Spilltest med 2–3 personer, måling av tid til første funn og tid uten fremgang

## Fase 5 — Levende verden og produksjon
- [ ] Grafikk produsert etter `graphics/GRAPHICS.md` (ComfyUI), originaler før kopier
- [ ] Mer bakgrunnsinnhold (mål: 60+ fyllartefakter), generert med AI og kvalitetssikret med validatoren
- [ ] Service worker for offline og rask lasting
- [ ] Flere dynamiske hendelser og reaksjoner på publisering

## Fase 6 — Valgfri AI-dialog (eksperiment)
- [ ] Vurdere AI for `autopilot`-personer bak et flagg, med personens kunnskap som eneste kilde
- [ ] Kostnadsmåling og reserve til skriptet dialog

## Fase 7 — Utvidelse
- [ ] Neste mysterium (Project Echo, Missing Millions, Memory Rewrite eller Ghost Network) i samme verden
- [ ] Varige konsekvenser fra The Quiet Account leses av neste mysterium
- [ ] Vurdere innholdseditor
