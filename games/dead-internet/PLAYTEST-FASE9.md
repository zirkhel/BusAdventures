# The Quiet Account: gjennomspillingsrapport, fase 9

_24. november 2026. Spilt i Playwright på iPhone 13 og Pixel 7, kun via brukergrensesnittet, med motoren og simulatoren som kontroll._

## Kort fortalt

The Quiet Account kan spilles fra start til slutt på mobil uten utviklerhjelp. Alle elleve scenarioer når avslutningene sine, også de fire som ikke var testet før: Too late og de tre Collateral-avslutningene. Jeg fant 13 konkrete feil underveis og rettet dem. Tre av dem kunne ødelegge mysteriet for en ny spiller:

- Plassholderbildene avslørte at et bilde var beskåret fra et annet.
- Profiler inneholdt fortellerlinjer som pekte rett på sporene.
- Et vedlegg kunne ikke lagres før spilleren hadde åpnet det.

Én ting står igjen før en ekstern testspiller får prøve: spillet forklarer ikke mekanikkene. Spilleren må selv oppdage at man trykker på navn, lagrer bevis, bygger teorier og publiserer. Det er forslag 1 under «Nødvendige forbedringer».

## 1. Gjennomspilling som ny spiller

Ruten «bror og journalist» ble spilt med bare trykk og tekstfelt på telefonen. Antall trykk er talt fra startskjermen.

| Milepæl | Trykk | Dag |
|---|---|---|
| Telefonen låst opp | 3 | 1 |
| Originalbildet fra mai funnet (omvendt bildesøk) | 13 | 1 |
| Theo videresender e-postene sine | 31 | 1 |
| Brightline funnet via gjenopprettingsadressen | 50 | 2 |
| Dana gir fakturaen | 71 | 2 |
| Iris gir dashbordet og briefen | 92 | 3 |
| To teorier med tre og to uavhengige kilder | 117 | 3 |
| Publisert i The Daily Record, Lights out | 127 | 3 |

Ingen JavaScript-feil på noen av enhetene. Ruten er rask for en spiller som vet hva hen gjør. En ny spiller vil bruke mer tid på å lese og prøve, og det er meningen.

## 2. Introduksjon og motivasjon

- Kroken virker. «Mara Quinn died on July 2nd. You were at the funeral.», og så en melding fra Mara på låseskjermen. Det avslører ingenting om løsningen.
- Det mangler et mål. Spilleren får ikke vite hva spillet forventer, og fristen (avstemningen 16. mars) dukker først opp som varsel på dag 3. Maras melding nevner bare infomøtet torsdag.
- Mekanikkene forklares ikke. Se forslag 1.

## 3. Kan sporene oppdages gjennom naturlig etterforskning?

| Spor | Hvordan spilleren finner det | Vurdering |
|---|---|---|
| Mara er død (S1) | Søk på «Mara Quinn», nekrologen, Theos profil, ulykkesrapporten | Lett |
| Kontoen er ikke Mara (S8) | Bildet i Mill-innlegget, omvendt bildesøk, originalen fra mai | Naturlig. Bildemenyen tilbyr søket. |
| Brightline styrer kontoen (S2) | Theos e-poster (gjenoppretting til bl-ops.net), Brightline-sidene, Iris' dokumenter | Naturlig. «bl-ops.net» i e-posten kan søkes direkte. |
| Northgate betalte Brightline (S3) | Danas faktura, lobbyregisteret, Iris' dashbord | Fakturaen og dashbordet kommer gjennom samtaler. Lobbyregisteret var bare søkbart med riktige ord, så Dana nevner det nå når man spør henne om Northgate. |
| Calvin finnes ikke (S7) | Teamsiden, stockfoto via bildesøk, foretaksregisteret | Lag 3–4, krever nysgjerrighet. Det er i orden. |

Blindveier jeg fant:
- Theo og Dana kan ikke kontaktes fra en byline eller et navn i en artikkel før spilleren har funnet Connect-profilen deres («Find Connect profile» og så «Send message»). Det gir to ekstra trykk, men henger sammen med regelen om at man må finne folk før man kan skrive til dem.
- Navn i sidetitler (for eksempel «Northgate Development» i overskriften på lobbyregisteret) kunne ikke trykkes på. Det er rettet.
- Teoribyggeren og «Ask about…» viser bare navn spilleren har undersøkt, og det ble ikke forklart noe sted. Nå står det et hint nederst i velgeren.
- Søk er strengt. «Brightline Northgate payment» gir null treff, fordi minst halvparten av ordene må treffe. Siden for null treff sier «Try fewer or different words». Det holder for nå.

## 4. Alternative veier, feil teorier og alle avslutninger

| Scenario | Avslutning | Dag |
|---|---|---|
| Bror og journalist, publisert før avstemningen | Lights out | 4 |
| Lights out, så CEO-en som ikke finnes | Lights out + Who paid whom | 5 |
| Tro på Owen, drapsteori på Threadline | The wrong murder | 1 |
| Død kvinnes konto går viralt, ingen pengespor | A ghost story | 8 |
| Ingenting publisert | Silence | 8 |
| Hele historien, publisert etter avstemningen (ny) | Silence, så Too late | 10 |
| Anklage Theo på Threadline (ny) | Collateral: Theo | 2 |
| Anklage Owen på Connect (ny) | Collateral: Owen | 2 |
| Peke ut Iris (ny) | Collateral: Iris | 2 |
| Bruke Iris' innlogging og nekte for det | Lights out, Iris bryter kontakten | 5 |
| Vise Juno sannheten tre ganger | (ingen avslutning, Juno forsvinner) | 2 |

Too late utløser først Silence (ingen publiserte før avstemningen) og så Too late. Det er logisk, men to avslutningstekster etter hverandre kan forvirre. Bør vurderes i spilltest.

## 5. Navigasjon og tastetrykk

- Det fungerer godt at et vedlegg i en melding kan åpnes, lagres og legges i tidslinjen fra samme meny.
- Teorier bygges raskest fra kontekstmenyen («Create theory» på et navn fyller ut subjektet).
- Rapportflyten (velg kanal, kryss av teorier, spør Dana, publiser) tar fire til fem trykk og er tydelig.
- Avslutninger som skjer om morgenen (Silence, Ghost story, Too late) ble før bare vist i Casebook under Reports. Spilleren fikk ikke beskjed. Nå kommer et varsel som åpner Reports.

## 6. Kontekstmenyer i alle sju apper

Jeg trykket på navn, organisasjoner, datoer og fritekst i Browser, Connect, Messages, Casebook, The Daily Record, Unfiltered og Settings.

- Samme type ting gir samme meny i alle apper. Personer gir «Send message» når de kan kontaktes, organisasjoner gir «Visit website», datoer gir «Add to Timeline», og avisene legger til «Search …» og «Author page in …».
- Settings har ikke lesbart innhold og ingen meny. Det er riktig.
- Ett avvik var designet slik fra før: et kallenavn (for eksempel «Kestrel» for Kestrel Logistics) gir ikke «Ask someone about this…» eller «Create theory» før navnet er undersøkt. Det fulle navnet gir dem med en gang. Avviket skal hindre at menyen røper at to navn er det samme, men det kan virke inkonsekvent.
- Navn i sidetitler manglet meny. Det er rettet (se over).

## 7. Nyhetsappene, meldingene og tiden sammen

- Breaking-varsler, meldinger og spillets egne hendelser kommer i riktig rekkefølge på låseskjermen etter «Sleep until tomorrow».
- Avisene skriver om spillerens handlinger: Unfiltered plukker opp en publisert post dagen etter, og Daily Record skriver om at avstemningen blir utsatt eller vedtatt.
- Saker i The Quiet Account som dukker opp på en dag spilleren styrer, hadde fast dato: Brightlines uttalelse, Calvins innlegg, Junos siste innlegg, Northgates uttalelse, Maras svar og fire andre. Nå dateres de dagen de dukker opp.
- Varselet «Daily Record: Council confirms …» gjentok avisnavnet. Det er rettet.
- Varsler uten kilde (for eksempel «Connect has suspended 41 accounts») merkes «News». Det er en app som ikke finnes. Bør endres til avsenderen.

## 8. Avslører menyer, forslag eller varsler noe?

- **Plassholderbilder (rettet, alvorlig).** Plassholderne viste produksjonsbeskrivelsen: «Not generated: crop of IMG02 … so image search can match» og «from IMG02». Det er selve løsningen på bildesporet. Nå viser de bare id og bildetekst.
- **Fortellerlinjer i innhold (rettet).** Disse linjene beskrev mønstrene spilleren skal oppdage selv:
  - «Every post lands on the hour or the half hour» (Maras profil)
  - «The first four comments arrive within four minutes»
  - «(all on the hour or half hour)» og «(always exactly on the hour)»
  - «No photos of herself. Every post is a repost of @calvinmarsh»
  - «Original capture date preserved in file metadata»

  Nå er mønstrene bare data: klokkeslett, reposter, metadata. Owens tråd sier fortsatt det samme med sine egne ord, og det er troverdig.
- **Søkeforslag** viser bare tidligere søk og navn spilleren har undersøkt.
- **Varsler** er konsekvenser, ikke hint.
- Maras profil viste et innlegg klokka 18:30 samme morgen som spillet starter. Det er rettet.

## 9. Er bakgrunnsinnholdet nok?

Før fase 9 ga sakens egne navn nesten bare sakens egne sider. De ti første treffene på «Brightline» var 4 av 4 fra mysteriet, på «Calvin Marsh» 3 av 3 og på «Waterfront» 9 av 10. Alt man fant, var altså relevant. Det er lagt til 19 bakgrunnssider rundt de samme navnene, og ingen av dem støtter noen påstand:

- Høringen og leserbrev om Waterfront, Northgates rekordår og fotballdrakter
- Sykkelfeltet i Route 9, gjenforeningen for Mill-arbeiderne og en annen Iris Bell som dyrker dahlia
- Brightlines prisutdeling og et sponset innlegg fra Brightline
- To Unfiltered-saker, et saksframlegg, fem Connect-innlegg og to Threadline-tråder

Etterpå: «Brightline» gir 4 bakgrunnstreff blant de 10 første, «Northgate» 5 og «Waterfront» 6. Unntaket er «Mara Quinn», der det meste fortsatt er relevant, og det er naturlig.

## 10. Etter avslutningen

- Saken lukkes, verden går videre. Søk, Casebook, meldinger og søvn virker.
- Nyheter fortsatte bare til dag 8. Nå kommer det saker dag 9–11 (oppfølging av flommen, biblioteket, fergekaien og «samme adresse igjen» i Unfiltered).
- Dana og Theo svarte som før saken. Nå har de egne replikker etter en avslutning der historien kom ut.

## 11. Rettet i fase 9

1. Plassholderbilder røpet at et bilde var beskåret fra et annet.
2. Fortellerlinjer i profiler, innlegg og metadata pekte ut sporene.
3. «Save as evidence» på et vedlegg feilet før det var åpnet.
4. Navn i sidetitler kunne ikke trykkes på.
5. Emnevelgeren forklarte ikke hvorfor et navn manglet.
6. Avslutninger om morgenen ga ingen beskjed til spilleren.
7. Ni saker hadde fast dato, selv om de dukker opp på dagen spilleren utløser dem (`datedOnShow`).
8. Varselet om avstemningen gjentok avsendernavnet.
9. Maras profil viste et innlegg fra senere samme dag.
10. Lobbyregisteret var bare søkbart med riktige ord. Dana nevner det nå.
11. Sakens navn hadde nesten ikke bakgrunnstreff (19 nye sider).
12. Nyhetene stoppet på dag 8.
13. Karakterene sa ingenting nytt etter avslutningen.

I tillegg er det fire nye scenarioer i simulatoren og testene (Too late, Collateral: Theo, Owen og Iris).

## 12. Nødvendige forbedringer før ekstern spilltest

1. **Kort innføring i mekanikkene.** En ekstern testspiller trenger å vite fire ting: trykk på et navn eller ord for å se hva du kan gjøre, lagre det du finner, bygg en teori og koble bevis til den, og publiser når kildene holder. Forslag: tre til fire korte tips første gang hver app åpnes, i telefonens egen stemme, uten å nevne sakens navn. Dette er en liten ny funksjon, så den er ikke laget uten ditt ja.
2. **Fristen tidligere.** Avstemningen bør være kjent fra dag 1, for eksempel i Maras første melding eller på kalendersiden, slik at spilleren vet hva som står på spill.
3. **Avsender på varsler uten kilde** i stedet for «News».
4. **Spilltest med 2–3 personer** etter punkt 1–2, med tid til første funn og tid uten fremgang målt (står allerede i fase 9 i DEVPLAN).
5. **Grafikk** (se under). Spillet kan testes med plassholdere, men bildesporene er mye sterkere med ekte bilder.

## 13. Gjenstående grafikkarbeid

Katalogen (`graphics/catalog.json`, oversikt i `graphics/GRAPHICS.md`) har nå 61 bilder: 50 påkrevde og 11 valgfrie. Ingen ferdige filer ennå.

- **Ansiktsreferanser først:** Mara, Theo, Dana, Owen og Iris har faste beskrivelser. Bilder som viser dem er merket «face: …».
- **Originaler før kopier:**
  - IMG02 → IMG01 (beskåret)
  - IMG05O → IMG05 (speilvendt)
  - IMG04S → IMG04 og IMG06S → IMG06 (stockportretter brukt som profiler)
  - NIMG0001 → NIMG0002
- **Logoer:** 16 logoer (alle nettsteder spilleren møter, pluss appikonene for avisene). Nye er Unfiltered, Kestrel, Calderpedia og Eastfield Notes.
- **Profilbilder:**
  - Nye påkrevde: Owen på Connect (IMG24) og Northgate og Brightline på Connect, laget av logoene.
  - Valgfrie: sju ansattbilder i Daily Record og fire Unfiltered-avatarer. Til de finnes, viser spillet plassholder.
- Produksjonsrekkefølgen står i GRAPHICS.md.

## Testing

- `node --test games/dead-internet/tests/*.test.mjs`: 90/90 (5 nye i `tests/playtest.test.mjs`)
- Validator: 0 feil, 0 advarsler (192 artefakter, 45 bilder)
- Simulator: 11/11 scenarioer. Utforskerne åpner 161 av 192 artefakter og når Lights out.
- Playwright, iPhone 13 og Pixel 7, uten feil og uten horisontal overflyt:
  - hele ruten til Lights out kun via UI
  - kontekstmenyer i alle apper
  - nyhetsappene, startskjermen, rapportflyten og Timeline fra tidligere faser

## 14. Oppfølging før ekstern spilltest

Anders godkjente rapporten og ba om seks punkter før fase 9 avsluttes. Alle seks er gjort i en egen PR.

1. **Introduksjon og tips.** Første gang telefonen låses opp vises «Your phone», med fem korte punkter om mekanikkene og knappene «Start» og «Start without tips». Deretter kommer ni kontekstuelle tips, ett om gangen og bare første gang:
   - lese og trykke
   - bilder
   - søk
   - lagre
   - meldinger
   - teorier
   - publisering
   - tid
   - utvikling i saken

   Tipsene dukker opp som et kort nederst og stopper ikke spillet. Settings har bryter, «Show the introduction again», «Read all tips» og nullstilling. En test sjekker at ingen tips nevner personer, steder, kontoer eller saker.
2. **Fristen.** «The week ahead in Port Calder» (DR-2026-0085, 8. mars) står på forsiden fra dag 1. Den lister seks hendelser, og avstemningen 16. mars er én av dem. Når spilleren har lest saken, står datoen under «Dates you know about». Det sies ikke noe om at avstemningen er viktig.
3. **Varsler.** Alle varsler har avsender: Messages, en app (Connect, Daily Record, Unfiltered), et nettsted (Threadline) eller Casebook. «News» er borte. Svarflommen etter publisering kommer fra den kanalen spilleren publiserte i.
4. **Søk.** Søket bøyer enkle endelser, tåler én skrivefeil i ord fra fem bokstaver og to fra ni, og viser delvise treff med en merknad når ingen side har nok av ordene. Typo og delvise treff gjelder bare vanlige sider som de riktige ordene også ville funnet. Cache, svake og eksakte sider krever fortsatt presise ord, så ingenting skjult avsløres.
5. **Avslutninger.** Varselet heter nå «The Quiet Account: Lights out», ikke «Case closed». Under Reports står «How the case developed» med dag og epilog, og en linje om at etterforskningen kan fortsette. Startmenyen viser «Case resolved · still open».
6. **Grafikk.** `graphics/COMFYUI.md` deler arbeidet i fire: generere i ComfyUI (engelske prompter, generering og endelig størrelse, seed, referanse, eksakt tekst, avhengigheter), avlede (beskjæring, speiling, logo til avatar), lage for hånd (faktura, dashboard, kollasj) og logoer som vektor. Ferdige bilder legges inn etter hvert (status i COMFYUI.md). Fem ansiktsreferanser ligger i `graphics/references/`, og IMG02 er referanse for mølla.

Endring i canon: skiltet på mølla henger på fasaden og ikke på taket, slik bildene viser. A13 er oppdatert.
