# Dead Internet: arkitektur og MVP-plan

_Første leveranse, 24. november 2026. Plan, ingen kode._

**Kort fortalt:** Spillet bør bygges som en ny, frittstående modul i Bus Adventures med samme teknologi som resten (ren HTML/JS med ES-moduler, ingen byggesteg, Vercel). Ingen av de eksisterende motorene (teksteventyr eller Empire) passer, men flere mønstre kan gjenbrukes. Det viktigste grepet er en streng tredeling mellom **kanon** (hva som faktisk skjedde), **påstander** (hva kilder og personer sier) og **spillerens tro** (hva spilleren har samlet og konkludert). Den største risikoen er ikke teknisk, men innholdsproduksjon og hvordan spillet skal vurdere spillerens teorier. Derfor foreslår jeg å designe og papirteste den første saken *før* telefongrensesnittet bygges, og at hypoteser lages av strukturerte byggeklosser i stedet for fritekst.

---

## 1. Hva finnes i repoet, og hva kan gjenbrukes

> **Forbehold:** Vurderingen bygger på den lokale klonen, som ligger 102 commits bak GitHub (lokalt 18. okt, GitHub 18. nov, blant annet med lyd i alle spill og nyere `empire/`, `games/` og `tools/`). Tabellen bør sjekkes på nytt mot oppdatert kode før fase 1, særlig PWA-oppsettet, lydsystemet og verktøyene.

| Det som finnes | Gjenbruk? | Hvorfor |
|---|---|---|
| Statisk hosting på Vercel, push til main gir deploy | **Ja** | Ingen driftskostnad. Dekker hele MVP-en. |
| ES-moduler uten byggesteg (`<script type="module">`) | **Ja** | Samme arbeidsflyt som resten, lett for AI-assistert utvikling. |
| Data adskilt fra motor (`rooms.js`, `items.js`, `theme.json`) | **Ja, som mønster** | Samme prinsipp, men innholdet blir JSON med en annen struktur. |
| Betingelser og effekter i teksteventyrmotoren (`flag`, `counterGte`, `setFlag` osv.) | **Ja, som mønster** | Et lite deklarativt betingelse/effekt-språk er nettopp det simulering og innholdsgating trenger. Ny implementasjon, kjent syntaks. |
| Valideringsverktøy (`validate-empire.mjs`, `ADVENTURE-VALIDATION.md`) og simulator (`simulate-empire.mjs`) | **Ja, som mønster** | Node-skript som sjekker innhold og kjører gjennom spillet automatisk. Blir enda viktigere her. |
| Lagring i Empire (`save.js`): injisert storage, versjonsnummer, eksport/import som JSON | **Ja, nesten direkte** | Riktig design. Gjør at kjernen kan testes i Node. |
| iOS-lærdom: overlay for tekstinput i stedet for fast input-felt | **Ja** | Gjelder søkefelt og meldingsfelt. |
| PWA-manifest | **Delvis** | Manifestet finnes, men ikonene det peker på (`icon-192.png`, `icon-512.png`) ligger ikke i repoet, og det finnes ingen service worker. Må fikses uansett. |
| Teksteventyrmotoren (rom, verb-parser, inventar) | **Nei** | Feil modell: spillet handler om informasjon og relasjoner, ikke rom og gjenstander. |
| `ui/shell.js` og `renderer.js` | **Nei** | Skreddersydd for teksteventyr-skjermene. |
| Empire-motoren | **Nei** | Idle-økonomi, helt andre mekanikker (som briefen også sier). |
| Editoren (`editor/`, GitHub-API) | **Senere** | Kan bli et innholdsverktøy når datamodellen har satt seg. Ikke i MVP. |

## 2. Vurdering av den foreslåtte arkitekturen

Briefen deler systemet i seks motorer (presentasjon, verden, simulering, etterforskning, dialog og lagring). Skillet er riktig i prinsippet, men seks separate motorer er for mye for en MVP. Jeg foreslår fire moduler i kjernen pluss presentasjon:

1. **World** (statisk innhold): entiteter, kontoer, fakta, artefakter, påstander. Leses fra JSON, endres aldri under spill.
2. **State** (alt som endrer seg): hva spilleren har sett, lagret og konkludert, flagg, tillit, tid, endrede eller slettede artefakter. Én serialiserbar struktur. Dette er også lagringen.
3. **Rules**: ett felles betingelse/effekt-system som driver både «simulering» (hendelser), tilgang til innhold og skriptet dialog. Simulering og dialog trenger ikke egne motorer, de er regler med ulike utløsere.
4. **Case** (etterforskning): bevismappe, hypoteser, rapport og vurdering mot kanon.
5. **Presentasjon**: telefon-OS og appene. Leser state, sender handlinger. Har ingen spillogikk.

All endring går gjennom `dispatch(handling)`, som kjører regler, oppdaterer state og sender ut hendelser som UI-et lytter på. Kjernen rører aldri DOM, slik at den kan testes og simuleres i Node, og slik at et desktop-grensesnitt senere bare er en ny presentasjon.

### Steder der briefen bør utfordres

- **«Tusenvis av sammenkoblede informasjonsbiter»**: Med håndskrevet innhold er det urealistisk, og prosedyregenerert innhold blir fort støy som spilleren lærer å ignorere. Mål for MVP: 25 til 30 artefakter der nesten alle betyr noe. Fylltekst (vanlige poster, bot-spam) kan genereres, men holdes tydelig adskilt fra innhold som bærer saken.
- **Fritekst-teorier kan ikke vurderes uten AI.** Hvis spilleren skriver teorier fritt, kan spillet ikke sammenligne dem med kanon på en pålitelig måte. Hypoteser bør derfor bygges av strukturerte deler: *[entitet] [relasjon] [entitet]*, for eksempel «Brightline Media → driver kontoen → @maraquinn», med bevis koblet til. Spilleren kan fortsatt ta feil, men spillet kan vurdere det. Samme prinsipp som i deduksjonsspill med utfyllingsskjema.
- **Fri etterforskning uten oppdragsmarkører gir lett spillere som står fast.** Spillet trenger myk retning uten å avsløre svar: varsler fra personer, en liste over «åpne spørsmål» generert fra det spilleren har *sett* (aldri fra sannheten), og søkeord som dukker opp i det spilleren leser.
- **«Verifisert fakta» i bevissystemet**: Hvis spillet merker noe som verifisert, avslører det sannheten. Forslag: spillet merker bare *kildetype* (primærkilde, påstand fra person, metadata, arkivert kopi), mens spilleren selv setter sin egen grad av tillit. «Verifisert» betyr da «bekreftet av to uavhengige kilder i mappen din», noe spillet kan beregne uten å vite noe om sannheten.
- **Rekkefølgen på fasene**: Briefen bygger telefongrensesnittet (fase 2) før verdensmodell og første sak (fase 3 og 4). Det er risikabelt: man bygger UI uten å vite hvilket innhold det skal vise. Jeg foreslår å designe saken og kjernen først (se §9).

## 3. Anbefalt teknologi

- **Ren JavaScript med ES-moduler, ingen rammeverk og ingen byggesteg.** Det passer repoet. Antallet skjermer er moderat, og et lite eget mønster (`render(state)` per app, med hendelsesdelegering) holder. Rammeverk kan vurderes på nytt hvis UI-et vokser kraftig.
- **`// @ts-check` og JSDoc-typer** i kjernen gir typekontroll i editoren uten byggesteg. Det er nyttig når datamodellen blir stor.
- **Innhold som JSON**, delt opp per sak (`content/case-01/…`). JSON kan valideres, oversettes og senere redigeres i et verktøy. All visningstekst ligger i innholdsfilene eller i egne strengfiler, aldri i koden.
- **Lagring i `localStorage`** for MVP (state blir noen titalls kB). Med versjonsnummer, eksport/import av lagring som i Empire, og migrering når innhold endres. IndexedDB først hvis det trengs.
- **Service worker** med enkel pre-caching, slik at spillet virker offline og laster raskt på mobil.
- **Tester og verktøy som Node-skript**, som i Empire: `validate-world.mjs` og `simulate-case.mjs`.
- **AI-dialog (senere, valgfritt)**: krever en liten Vercel-funksjon som holder API-nøkkelen og begrenser bruk. Det betyr at spillet ikke lenger er rent statisk, så det bør være en egen beslutning. Spillet må alltid virke uten.

## 4. Mappestruktur

```
games/dead-internet/
  index.html            inngang, laster app/main.js
  manifest.json         egen PWA (egen ikon og navn), sw.js
  core/                 ingen DOM, kjører i Node
    world.js            laster og indekserer innhold
    state.js            spillerstate, dispatch, hendelser
    rules.js            betingelser og effekter
    search.js           søkemotoren i spillet
    knowledge.js        hva personer vet, tror og skjuler
    casebook.js         bevis, hypoteser, rapport og vurdering
    dialogue.js         skriptet samtale (AI-adapter senere)
    save.js             lagring, versjon, migrering
    rng.js              seedet tilfeldighet
  app/                  presentasjon
    os.js               hjemskjerm, appbytte, varsler, tilbake-navigasjon
    apps/browser.js  connect.js  messages.js  casebook.js
    components/         lister, ark (bottom sheets), kontekstmeny
    style.css
  content/
    case-01/            entities, accounts, facts, artifacts, rules, dialogue
    strings/en.json     UI-tekster (nb.json senere)
  tools/
    validate-world.mjs  struktur, referanser og tre-kilde-regelen
    simulate-case.mjs   automatiske gjennomspillinger
  DESIGN.md             levende designdokument
```

## 5. Minste levedyktige verdensmodell

Sju typer holder for MVP-en. Steder og egne hendelsesobjekter fra briefen er slått sammen inn i disse.

- **Entity**: person eller organisasjon. Felt: `id`, `kind`, `name`, `bio`, `isHuman` (sann/falsk/uklar), `relations[]`.
- **Account**: en identitet på en plattform (Connect-profil, forumbruker, e-postadresse). Peker til entiteten som *faktisk* styrer den (`operatedBy`), som kan være en annen enn den kontoen utgir seg for å være. Det er kjernen i temaet.
- **Fact**: en kanonisk påstand om verden, alltid sann i kanon. `{ id, subject, predicate, object, time? }`. Eksempel: `{ subject: "brightline", predicate: "operates", object: "acct_mara" }`. Hendelser er fakta med tidspunkt.
- **Claim**: noe en kilde *hevder*. `{ id, source, statement, matches?: factId, contradicts?: factId }`. Feilinformasjon er påstander som motsier kanon.
- **Artifact**: alt spilleren kan lese: post, profil, artikkel, nettside, forumtråd, melding, e-post, dokument. Felt: `type`, `platform`, `author` (konto), `timestamp`, `body`, `versions[]` (for endring og sletting), `claims[]`, `supports[]` (fakta den gir bevis for, med styrke), `keywords[]` (søkeord den låser opp), `visibleIf` (betingelse).
- **Rule**: `when` (utløser og betingelse) og `do` (effekter). Driver alle endringer i verden.
- **DialogueNode**: emne-basert samtale per person (se §7).

Plattformer som Connect, Threadline og The Daily Record er ikke egne datatyper. De er visninger av artefakter og kontoer med samme `platform`-verdi. Det gjør at en person ser lik ut overalt, og at nye plattformer i hovedsak er nytt UI.

## 6. Kanon, personkunnskap og spillerens tro

Dette er tre lag som aldri blandes:

1. **Kanon** (`facts`): forfattet, skrivebeskyttet. Bare vurderingen av rapporten og innholdsvalidatoren leser den. UI-et viser den aldri.
2. **Personkunnskap** (per person i `knowledge`): `knows: [factId]`, `believes: [claimId]` (kan være usant), `hides: [factId]` med betingelser for når de deler (tillit, vist bevis, flagg). En person kan bare si noe hen vet eller tror. Dette er også grensen en AI-modell senere får: den får bare personens kunnskap, aldri kanon.
3. **Spillerens tro** (i `state`): sette artefakter, lagret bevis, egne merknader og tillitsgrad, hypoteser, publiserte rapporter. Spillet registrerer i tillegg internt hvilke fakta spilleren har *sett støtte for* (via artefaktenes `supports`), for å kunne gi myk retning og vurdere rapporter. Spilleren ser aldri den listen.

Rapportvurdering: hver påstand i rapporten sjekkes mot kanon (sann/usann) og mot bevisene spilleren har koblet til (er den faktisk underbygget?). Utfallet styres av kombinasjonen: sanne og godt underbyggede påstander gir gjennomslag, sanne men udokumenterte påstander kan avvises, og usanne påstander gir konsekvenser (tapt troverdighet, en uskyldig blir hengt ut, de skyldige bruker det til å avfeie hele saken). Ingen poengsum for «antall ledetråder».

## 7. Etterforskningsmekanikk (MVP)

- **Søk er hovedverktøyet.** Søkemotoren i nettleseren gir bare treff på ord spilleren har grunn til å kjenne (navn, brukernavn, steder og begreper som dukker opp i det hen leser), pluss et lite sett åpne startord. Dette gir fri rekkefølge og mange veier inn, og hindrer at alt kan finnes på første søk.
- **Tre-kilde-regelen:** Hvert sentralt faktum må kunne underbygges av minst tre uavhengige artefakter eller samtaler. Validatoren sjekker dette automatisk, slik at ingen oppdagelse avhenger av ett bestemt dokument.
- **Lagre som bevis:** Langt trykk eller en knapp på hvilken som helst artefakt, profil eller melding. Hele utsnitt, ikke markering av tekst (det er upresist på mobil).
- **Bevismappe på mobil:** Ingen fri tavle med tråder (fungerer dårlig på telefon). I stedet: lister gruppert per person og organisasjon, og et ark for å koble bevis til en hypotese. En enkel nettverksvisning kan komme senere som ren visning.
- **Samtaler:** Emnebaserte. Spilleren velger et emne (en person, et begrep) eller *viser* et bevis fra mappen. Personen svarer ut fra kunnskap, tillit og hva hen skjuler. Ingen fritekst i MVP.
- **Tid:** Spilltiden går fram med handlinger (for eksempel når spilleren sender meldinger eller publiserer), ikke med klokken. Det gjør simuleringen reproduserbar og hindrer at noe skjer mens spilleren er borte fra telefonen.

## 8. Første spillbare sak (forslag)

**Arbeidstittel: «The Quiet Account».** En del av det større Project Echo-mysteriet, men selvstendig.

**Krok:** @maraquinn er en populær lokal Connect-profil som skriver om nabolaget sitt. Hun poster fortsatt hver dag. Ifølge en kort notis i The Daily Record døde hun for åtte måneder siden.

**Sannhet i kanon:** Mara døde i en ulykke. Kontoen ble kjøpt via en datamegler av Brightline Media, som driver «personakontinuitet»: kjøper kontoer til døde og inaktive brukere og holder dem i live med syntetisk innhold. Kunden er Northgate Development, som trenger positiv lokal stemning før en reguleringsavstemning. Mara-kontoen er én av rundt 40 kontoer i det samme nettverket.

**Falske spor:**
- Threadline-teorien om at Mara ble *drept* for å bli tauet, og at kontoen skjuler drapet. Den bruker ekte tidsstempler, men konklusjonen er feil.
- Broren Theo har innloggingen, og noen mistenker at han poster selv. Han gjør det ikke.
- En tilfeldig sammenheng: en Northgate-ansatt kommenterte en av Maras gamle poster. Det betyr ingenting.

**Åtte personer:** Mara Quinn (død, kontoen hennes svarer på meldinger, et sentralt øyeblikk), Theo Quinn (broren, sint og sørgende, har gamle e-poster), Dana Reyes (journalist i The Daily Record, ble bedt om å legge saken bort), Owen Pike / truthseeker_88 (oppriktig, men tar feil), Iris Bell (tidligere «personaskribent» i Brightline, redd, krever høy tillit), Calvin Marsh (Brightline-sjef, PR-svar), Juno Park (Maras «venninne» på Connect, selv en syntetisk persona som ikke er sikker på hva hun er), Paul Navarro (Northgate-talsperson).

**To organisasjoner:** Brightline Media og Northgate Development.

**Sentrale fakta spilleren kan etablere (hver med minst tre kilder):**
1. Mara døde før de fleste postene ble skrevet (notis, Theos meldinger, bilde med snø postet midt på sommeren, minneside).
2. Kontoen styres av Brightline (stillingsannonse for «persona writer», felles tidsmønster med andre kontoer, Iris).
3. Northgate betaler Brightline (lekket faktura, Dana, Paul som snubler i et svar).
4. Postene presser reguleringssaken (innholdsmønster, tidspunkter rett før høringer).
5. Juno og andre kontoer er del av samme nettverk (identiske formuleringer, opprettelsesdatoer).
6. Mara ble ikke drept (politirapport i lokalavis, Theo, Owens egne kilder lest nøye).

**Dynamiske hendelser (eksempler):** Når spilleren sender melding til Maras konto, svarer «Mara» vagt og poster noe nytt dagen etter. Når spilleren kontakter Calvin, forsvinner stillingsannonsen fra Brightlines nettsted, men en bufret kopi kan fortsatt finnes. Når spilleren viser Juno et bevis, begynner hun å stille spørsmål om seg selv.

**Avslutning:** Spilleren publiserer en rapport gjennom Dana eller anonymt på Threadline. Fire til fem mulige utfall, avhengig av hva som er sant, hva som er dokumentert og om spilleren hang ut feil person.

**Omfang:** ca. 25 artefakter, 8 personer, 2 organisasjoner, 6 sentrale fakta, 3 falske spor. Mål: 30 til 60 minutter.

## 9. MVP-omfang

**Med:**
- Telefon-OS: hjemskjerm, appbytte, varsler, tilbakeknapp, automatisk lagring.
- Browser med søkemotor og de fiktive nettstedene (The Daily Record, Threadline, Brightline, Northgate). En enkel «bufret kopi»-funksjon i stedet for egen Archive-app.
- Connect: profiler, poster, kommentarer, følgere.
- Messages: emnebasert samtale og «vis bevis».
- Casebook: bevis, egne notater, hypoteser, rapport. Erstatter egne Evidence- og Notes-apper i MVP.
- Én sak, flere utfall, eksport og import av lagring.
- Engelsk tekst (som de andre spillene), men alt i strengfiler fra dag én.

**Ikke med i MVP:** Mail som egen app (e-poster vises som vedlegg i Messages), Files, egen Archive-app, AI-dialog, sanntidssimulering, flere saker, desktop-layout, nettverksgraf, innholdseditor.

## 10. Tekniske og designmessige risikoer

| Risiko | Alvor | Tiltak |
|---|---|---|
| **Innholdsproduksjon og konsistens.** Hver artefakt må passe med kanon, tidslinje og alle personer. Feil oppdages sent. | Høy | Validator fra start (referanser, tidslinje, tre-kilde-regelen). Simulator som spiller gjennom automatisk. AI-generert innhold alltid via validatoren, som i `ADVENTURE-GENERATION.md`. |
| **Vurdering av spillerens teorier.** | Høy | Strukturerte hypoteser (§2). Bestemmes før koding. |
| **Spilleren står fast eller finner alt med en gang.** | Høy | Søkeord-gating, myk retning via varsler og «åpne spørsmål», papirtest av saken med en ekte person før koding. |
| **Bevismappen blir for tung på mobil.** | Middels | Lister og ark, ikke fri tavle. Tidlig test på ekte telefon. |
| **Omfangsglidning** (simulering, AI, mange apper). | Middels | Fast MVP-liste over. Nye apper bare når saken trenger dem. |
| **AI-dialog:** API-nøkkel kan ikke ligge i en statisk side, kostnad per samtale, modellen kan lekke fakta personen ikke kjenner. | Middels (senere) | Egen fase, serverfunksjon, modellen får bare personens kunnskap og en liste over hva den får avsløre, motoren avgjør alltid hva som er sagt. Skriptet dialog er alltid reserve. |
| **Lagring forsvinner.** Safari kan slette lokale data for nettsider som ikke er installert etter en tids inaktivitet. | Middels | Oppfordre til «Legg til på Hjem-skjerm», eksport av lagring, `navigator.storage.persist()`. |
| **Lagringer brekker når innhold endres.** | Middels | Stabile ID-er, innholdsversjon i lagringen, migreringsfunksjon (som `SAVE_VERSION` i Empire). |
| **Temaet.** Spillet handler om konspirasjoner, og det må ikke bli en reklame for ekte desinformasjon eller ligne ekte merkevarer og personer. | Lav til middels | Bare fiktive navn og plattformer. Spillet belønner kildekritikk, ikke å tro mest mulig. |
| **Repo-tilstand.** Lokal klone ligger 102 commits bak GitHub, så gjenbruksvurderingen kan være utdatert. | Lav | Spillet ligger i egen mappe. Synk først, så en rask ny gjennomgang av §1 før fase 1. |

## 11. Anbefalt rekkefølge

Hver fase gir noe som kan testes.

0. **Avklaringer og papirprototyp (ingen kode).** Ta beslutningene i §12. Skriv saken ferdig som en «sakens bibel»: kanon, tidslinje, personer, alle artefakter i kortform. Test den på en person med utskrevne ark eller et enkelt dokument. *Test: er det gøy å nøste opp? Står man fast?*
1. **Kjerne og verktøy (uten UI).** Datamodell, lasting, state, regler, søk, lagring. Validator og simulator. *Test: et Node-skript spiller gjennom saken og rapporterer hvilke fakta som kan nås, og fra hvor mange kilder.*
2. **Telefonen og lesing.** OS-skall, Browser med søk, Connect. Bare lesing og lagring av bevis. *Test: på ekte telefon, kan man nøste i saken uten konklusjon?*
3. **Samtaler og bevismappe.** Messages med emner og «vis bevis», Casebook med hypoteser. *Test: hele etterforskningen uten slutt.*
4. **Rapport og utfall.** Publisering, vurdering mot kanon, epiloger. Hele saken innholdsmessig ferdig. *Test: første fullstendige MVP, spilltest med 2–3 personer.*
5. **Levende verden.** Regelstyrte hendelser: sletting, endrede poster, varsler, reaksjoner. Bufret kopi. Offline og ikoner. *Test: føles verden som om den svarer?*
6. **Eksperiment med AI-dialog.** Bak et flagg, én person, serverfunksjon, målt kostnad. *Test: tilfører det nok til å være verdt kostnaden og risikoen?*
7. **Utvidelse.** Neste sak (Missing Millions eller Memory Rewrite), flere apper, eventuelt innholdseditor.

## 12. Beslutninger som trengs før utvikling

1. **Språk i spillet:** engelsk (som de andre spillene og briefens navn), norsk, eller begge fra start? Anbefaling: engelsk, men alt i strengfiler.
2. **Plassering:** `games/dead-internet/` i samme repo og på samme domene, men med eget manifest slik at det kan installeres som egen app? Anbefaling: ja.
3. **Strukturerte hypoteser i stedet for fritekst:** greit? Anbefaling: ja, det er det som gjør vurdering mulig.
4. **AI-dialog:** ønsket på sikt, og hva er akseptabel kostnad? Det krever en serverfunksjon. Anbefaling: utsett til etter fase 4.
5. **Tid:** drevet av handlinger (anbefalt) eller ekte klokke?
6. **Konsekvenser:** skal feil konklusjoner kunne gi en «dårlig» slutt man ikke kan angre, eller skal man kunne publisere flere ganger?
7. **Tone og stil:** jordnær og troverdig, eller med satire og humor? Visuelt: realistisk, men fiktivt telefon-OS, eller mer stilisert?
8. **Bilder:** trengs profilbilder og nettsidebilder (AI-genererte, som i de andre spillene), eller holder tekst og enkle avatarer i MVP?
9. **Hvem skriver saken:** du, AI med din gjennomgang, eller en blanding? Det påvirker hvor mye verktøy fase 1 trenger.
