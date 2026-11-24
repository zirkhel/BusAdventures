# Dead Internet — utviklingsplan

_Avkrysningsliste. Oppdateres når oppgaver blir ferdige. Sist oppdatert 24. november 2026 (fase 4 og ny rekkefølge)._

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

## Rekkefølge videre (Anders, 24. nov)
Ingen unødvendig utvidelse av fasen som pågår.
1. ~~Global kontekstmeny, kunnskapsgrenser og navigasjon (fase 3b)~~ ✅
2. ~~Timeline (fase 4)~~ ✅
3. Rapportering og U0 (fase 5)
4. Universdeling U1 (fase 6)
5. Mediekjerne M1 (fase 7)
6. The Daily Record og Unfiltered, M2 (fase 8)
7. Ferdigstille The Quiet Account (fase 9)
8. Resterende verktøyapper: Mail, Files, Contacts, Forensics, Archive (fase 10)
9. TokTok, M3 og M4 (fase 11)
10. Videre mysterier (fase 12)

Medieproduksjon (M5) går løpende ved siden av, med 20–30 ekte videoklipp i første runde.

## Fase 4 — Timeline ✅
_Timeline implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] Timeline er den fjerde fanen i Casebook. Den er tom ved start, bygges av spilleren og genereres aldri automatisk.
- [x] Hendelser kan opprettes:
  - fra en dato («Add to Timeline»)
  - fra markert tekst («Event» i markeringslinjen, eller «Create event»)
  - fra et bilde, et dokument eller et bevis
  - manuelt («New event»)
- [x] Bevis kan knyttes til en eksisterende hendelse («Attach to existing event…»), som støttende eller motstridende. Flere bevis per hendelse er mulig.
- [x] Hver hendelse har:
  - tittel, beskrivelse og notat
  - dato: eksakt (med valgfri tid), omtrentlig (år eller måned), intervall eller ukjent
  - personer, organisasjoner og steder (bare det som er undersøkt)
  - støttende og motstridende bevis
  - teorier
  - kilde
- [x] Datoene på kilden tilbys som valg: publisert, kopiens dato, bildemetadata og datoer i teksten. Spilleren velger, og motoren løser aldri motsetninger.
- [x] Gale, motstridende og oppdiktede hendelser er tillatt, og intervaller kan stå feil vei. Ingen riktighetsindikator. Sorteringen bruker bare spillerens egne datoer.
- [x] Teorier viser tilknyttede hendelser.
- [x] Lagringsversjon 3. Eldre lagringer får en tom tidslinje.


## Fase 5 — Rapportering og U0
_Implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
_Rapporter og publisering bygges per sak fra starten, så de ikke må skrives om når neste mysterium kommer._
- [x] Publiseringsflyt med kanalvalg og Danas gjennomgang (Casebook → Reports)
- [x] En rapport har alltid én sak (`case`). Påstander vurderes mot den sakens påstander og universets kanon.
- [x] Kanaler og reviewer leses fra sakens `publishing`, ikke fra en motorregel. Universets kanaler er åpne for alle saker.
- [x] Valgte tidslinjehendelser kan tas med i rapporter, med antall kilder for og mot. Ingen vurdering i Timeline.
- [ ] Vurdering av tidslinjehendelsers nøyaktighet. Krever kanoniske hendelsesdatoer i innholdet, så det venter til det trengs.
- [x] Bevis, teorier, notater og tidslinjehendelser får `cases: []`. Tomt betyr uklassifisert. Ingenting knyttes automatisk, og spilleren velger én, flere eller ingen saker. Casebook har filter (alle, per sak, uklassifisert).
- [x] Lagringsversjon 4 med migrering: eksisterende elementer blir uklassifiserte, gamle rapporter får sin sak
- [x] Visning av reaksjoner og avslutninger (epiloger). En avsluttet sak stopper ikke spillet.
- [ ] Startskjerm med tilgjengelige etterforskninger (avhenger av Anders' valg om når)

## Fase 6 — Universdeling U1
_Ingen synlig endring for spilleren. Alle eksisterende tester skal passere._
- [ ] Innholdet deles i `content/universe/` og `content/mysteries/quiet-account/`
- [ ] `mystery.json` med start (premiss, startKnown, startArtifacts, logins, intro), forutsetninger, frister, påstander, avslutninger, publisering, testoppsett og tekster
- [ ] `state.cases` med `locked`, `available`, `active` og `closed`. Flere aktive saker samtidig, og en avsluttet sak stopper ikke spillet.
- [ ] Start fra hovedmenyen (`start.menu`) og naturlig oppdagelse i verden (`start.discover`)
- [ ] Relative frister (`beforeCaseDay`), og `beforeDay` beholdes for univershendelser
- [ ] Personer kan utvides per mysterium (`extends`)
- [ ] Validator og simulator per mysterium. Bakgrunnsinnhold kan bli bevis når et mysterium eksplisitt peker på det. Den absolutte `filler`-regelen erstattes av dette.
- [ ] Narrative lag (`layer` 1–7) konfigureres per mysterium. The Quiet Account avslører ikke lag 5–7. Validatoren sjekker grensen for hvert mysterium.
- [ ] Saksspesifikke tekster i grensesnittet flyttes til sakens tekster (Theories-tomtekst, «Port Calder», `.pf-brightline_site`)

## Fase 7 — Mediekjerne (M1)
- [ ] Artikkelfelt: seksjon, byline, rettelser, relaterte, sponset, strukturerte kommentarer
- [ ] `videos.json` og lette kontoer. Modellen skal tåle 150 klipp eller flere.
- [ ] Delte innholdsbassenger (`pools/`) i universet
- [ ] Deterministisk feed som er blind for relevans. TokTok-feeden bygger bare på likes, følger og eksplisitt interaksjon i TokTok, aldri søkehistorikk.
- [ ] Validator: ingen bevis som bare kan finnes ved å scrolle, og scrolling har ingen konsekvenser
- [ ] Innholdsrapport som viser fordelingen av sanne og usanne påstander per kanal (ingen kvote)

## Fase 8 — The Daily Record og Unfiltered (M2)
- [ ] Én nyhetsmotor med to profiler. Unfiltered med egen logo og identitet.
- [ ] Forside, seksjoner, artikkel, forfatterside, kommentarer, søk og del
- [ ] Hjemskjerm med flere apper
- [ ] Innholdspakker for begge aviser
- [ ] Playwright-test på iPhone- og Pixel-størrelse

## Fase 9 — The Quiet Account ferdig
- [ ] Hele The Quiet Account spilles gjennom på mobil, og friksjonen måles
- [ ] Papirtest-funn innarbeidet i innholdet
- [ ] Spilltest med 2–3 personer, måling av tid til første funn og tid uten fremgang
- [ ] Grafikk produsert etter `graphics/GRAPHICS.md` (ComfyUI), originaler før kopier
- [ ] Flere dynamiske hendelser og reaksjoner på publisering
- [ ] Service worker for offline og rask lasting

## Fase 10 — Resterende verktøyapper
- [ ] Mail: innboks, tråder, vedlegg, videresending og metadata
- [ ] Files: dokumenter, bilder og vedlegg som spilleren eksplisitt har lastet ned
- [ ] Archive: historiske versjoner av sider, profiler og dokumenter. Inntil videre er dette en del av Browser (cache, «View cached versions», «View available versions»).
- [ ] Contacts: adressebok som spilleren selv styrer. Kontakter legges til eksplisitt eller gjennom legitime hendelser. Kontekstmenyen får «Add to Contacts».
- [ ] Forensics: gjenbruker bildeverktøyene (metadata, bildesøk, speilvendt søk), og legger til bildesammenligning, transformasjon, dokument- og versjonssammenligning, videometadata og kontoaktivitet. Viser observasjoner, aldri konklusjoner.

## Fase 11 — TokTok (M3 og M4)
- [ ] Vertikal sveip, For You og Following, profil, kommentarer, likes, lagre, del, søk. Egen logo og identitet.
- [ ] Plassholder-video. Første produksjonsrunde er 20–30 ekte klipp, resten plassholdere.
- [ ] Kontekstmeny: Video info, Show transcript, Search by frame
- [ ] Søk på nøkkelbilder, slettede og endrede klipp, cache
- [ ] 3–5 valgfrie klipp med spor i The Quiet Account. Validatoren viser at saken kan løses uten TokTok.
- [ ] Utvide klippmengden etter at produksjonsflyt, kvalitet og ytelse er testet

## Fase 12 — Videre mysterier
- [ ] Neste mysterium (Project Echo, Missing Millions, Memory Rewrite eller Ghost Network) som innholdspakke i samme univers
- [ ] Varige konsekvenser fra The Quiet Account leses av neste mysterium
- [ ] Det store spørsmålet om ekte mennesker på nettet holdes åpent
- [ ] Vurdere innholdseditor

## Senere — Valgfri AI-dialog (eksperiment)
- [ ] Vurdere AI for `autopilot`-personer bak et flagg, med personens kunnskap som eneste kilde
- [ ] Kostnadsmåling og reserve til skriptet dialog
