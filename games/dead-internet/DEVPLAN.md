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
- [x] Entiteter, alias, kontoer, e-post, domener, adresser, datoer, referansenummer og begreper (`universe/terms.json`)
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
- [x] Startskjerm med tilgjengelige etterforskninger (`mysteries[].menu`): «Continue investigation», spillbare saker kan startes eller fortsettes, og frø vises som «Future investigation». Plassholderbilder til grafikken er klar.

## Fase 6 — Universdeling U1
_Implementert 24. november 2026. Ingen synlig endring for spilleren utover startskjermen. Testet i Playwright (iPhone 13, Pixel 7, desktop)._
- [x] Innholdet deles i `content/universe/` og `content/mysteries/quiet-account/`
- [x] `mystery.json` med start (premiss, startartefakter, innlogging, intro), forutsetninger, frister, påstander, bevisliste, avslutninger, publisering, testoppsett, lag og tekster
- [x] `state.cases` med `locked`, `available`, `active` og `closed`. Flere aktive saker samtidig, og en avsluttet sak stopper ikke spillet. Lagringsversjon 5.
- [x] Start fra startskjermen (`start.menu`) og naturlig oppdagelse i verden (`start.discover`). Forutsetninger med `requires`.
- [x] Relative frister (`beforeCaseDay`, `caseDay` i regler), og `beforeDay` beholdes for univershendelser
- [x] Personer kan utvides per mysterium (`extends`). Personene i The Quiet Account er ikke delt opp ennå, det gjøres når neste mysterium trenger det.
- [x] Validator og simulator per mysterium. Bakgrunnsinnhold kan bli bevis når et mysterium lister det i `evidence`. Den absolutte `filler`-regelen er erstattet.
- [x] Narrative lag (`layer` 1–7) konfigureres per mysterium (`layers.reveal`, `hint`, `background`). The Quiet Account: reveal 1–2, hint 3–4, bakgrunn 5. Validatoren sjekker grensen.
- [x] Saksspesifikke tekster flyttet: eksempelteorien til sakens tekster, «Port Calder» til plattformdata. `.pf-brightline_site` er universets plattformstil og blir værende.

## Fase 7 — Mediekjerne (M1)
_Implementert 24. november 2026. Bare motor, validator og verktøy. Ingen synlig endring i spillet._
- [x] Artikkelfelt: seksjon, byline, rettelser, relaterte, referanser, sponset, strukturerte kommentarer (med `deletedIn`), dekker (skjult)
- [x] `videos.json` og `scripts.json` (plakat, nøkkelbilder, transkripsjon, fiktiv «Video info»), og lette kontoer uten operatør (uavklart kanon). Modellen skal tåle 150 klipp eller flere.
- [x] Delte innholdsbassenger (`universe/pools/`) lastes som vanlige universfiler. Første innhold kommer i fase 8.
- [x] Deterministisk feed som er blind for relevans (`core/feed.js`). Feeden bygger bare på likes, følger og «Not interested» på plattformen, aldri søkehistorikk. Lagringsversjon 6.
- [x] Søk i én app (`platform`), transkripsjoner i søk, og bildesøk på nøkkelbilder
- [x] Validator: ingen bevis som bare kan finnes ved å scrolle, scrolling har ingen konsekvenser, uavklart kanon, video- og artikkelfelt
- [x] Innholdsrapport (`tools/media-report.mjs`) som viser fordelingen av sanne og usanne påstander per plattform (ingen kvote) og bevis som skiller seg ut i visningstall

## Fase 8 — The Daily Record og Unfiltered (M2)
_Implementert 24. november 2026. Testet i Playwright (iPhone 13, Pixel 7)._
- [x] Én nyhetsmotor (`app/apps/news.js`) med to profiler fra plattformdata (`platforms[].app`). Unfiltered har egen logo, farger og tone. En tredje avis er bare innhold.
- [x] Forside (nyeste først, aldri rangert), seksjoner, artikkel, forfatterside, kommentarer (Top/Newest), søk i avisen og del (kopier lenke, åpne i Browser, lagre, send til kontakt, versjoner)
- [x] Rettelser, relaterte saker, kilder og sponsormerking vises både i appen og i Browser
- [x] Hjemskjerm med flere apper (rutenett + dokk)
- [x] Kontekstmeny: «Search The Daily Record», «Search Unfiltered» og «Author page in …» fra en byline
- [x] «Breaking»-varsler når en ny sak kommer på `day.start`. Nye saker hver dag fra dag 2 til 8.
- [x] Innhold: The Daily Record 62 saker (48 nye), 8 skribenter med side, 6 rettelser, 4 endrede og 3 fjernede saker, 5 sponsede, 6 nekrologer, 12 kommentarfelt. Unfiltered 26 saker, 4 skribenter, 4 lekkasjer med dokument på Docshare.
- [x] Fem hendelser dekkes av begge aviser: Unfiltered har rett (kaien), Daily Record har rett (brannen), begge tar feil (strømbruddet), ingen kan avgjøres (fiskedøden), og Unfiltered beskjærer Daily Records festivalbilde.
- [x] Sprekker uten forklaring (lag 4–5): samme skrivefeil hos en Daily Record- og en Unfiltered-skribent samme uke, en avdød festivalfrivillig som siteres måneder senere, en lampe ingen butikk har.
- [x] Saker utvikler seg: vannledningssaken får to åpne oppdateringer (dag 3 og 5) med rettelse og «Updated», mens Unfiltered endrer tipset sitt stille. Tidligere versjoner ligger i cachen. Oppfølgingssaker lenker tilbake.
- [x] Avisene skriver om spillerens handlinger: Unfiltered plukker opp en publisert rapport (Connect/Threadline) neste dag, og Daily Record skriver om bystyrevedtaket (utsatt eller vedtatt). Slike saker dateres den dagen de dukker opp (`datedOnShow`).
- [x] Playwright-test på iPhone- og Pixel-størrelse

## Fase 9 — The Quiet Account ferdig
_Gjennomspilling 24. november 2026: se `PLAYTEST-FASE9.md`._
- [x] Hele The Quiet Account spilt gjennom på mobil kun via UI (iPhone 13, Pixel 7): Lights out på dag 3 etter 127 trykk
- [x] Alle avslutninger testet i simulatoren (11 scenarioer, 4 nye: Too late og tre Collateral)
- [x] Spoilere fjernet: plassholdere viser ikke opphav, ingen fortellerlinjer i innhold eller metadata
- [x] Bakgrunnsinnhold rundt sakens navn (19 sider), nyheter etter avstemningen (dag 9–11), replikker etter avslutningen
- [x] Avslutninger gir varsel, saker spilleren utløser dateres den dagen de dukker opp, navn i sidetitler kan trykkes på
- [x] Grafikkatalogen dekker alle bilder, profilbilder og logoer med prioritet, ansiktsreferanser og avhengigheter
- [x] Kort, generell introduksjon ved første opplåsing og kontekstuelle tips første gang en mekanikk brukes (`app/tips.js`). Tips kan hoppes over, slås av, leses igjen og nullstilles i Settings. De nevner aldri personer, steder eller saker.
- [x] Avstemningsdatoen kan finnes fra dag 1 i en vanlig «The week ahead»-sak i Daily Record, sammen med fem andre hendelser
- [x] Varsler har riktig avsender (`notify.from`), og validatoren krever ref eller from
- [x] Søk: lette stammer (-s, -es, -ing, -ed), små skrivefeil i ord på 5+ bokstaver og delvise treff merket som delvise. Kun på «full»-sider, uten relevans for saken i rangeringen.
- [x] Avslutninger vises som utvikling i saken («The Quiet Account: Lights out», «How the case developed» med dag). Saken heter «Resolved», og spilleren kan fortsette å etterforske.
- [x] ComfyUI-produksjonsliste: `tools/comfyui-list.mjs` → `graphics/COMFYUI.md` og `graphics/comfyui-jobs.json`, med prompter, størrelser, referanser og avledninger
- [ ] Papirtest-funn innarbeidet i innholdet
- [ ] Spilltest med 2–3 personer, måling av tid til første funn og tid uten fremgang
- [ ] Grafikk produsert etter `graphics/COMFYUI.md`, originaler før kopier (status i `graphics/COMFYUI.md`; de første ferdige bildene ligger inne)
- [x] Flere dynamiske hendelser og reaksjoner på publisering (avisene melder konsekvenser, fase 8)
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
