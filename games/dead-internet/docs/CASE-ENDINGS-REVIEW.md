# Saksavslutning — mekanikk og åpne funn

Oppdatert 25. november 2026. Avslutningsdefinisjonene er ikke endret av PR #89. Den tidligere gjennomgangen ble gjort før regel P; den er bevart som [historisk gjennomgang](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/docs/CASE-ENDINGS-REVIEW.md). Kanttilfellene nedenfor må reproduseres på dagens gren før retting. Dette dokumentet godkjenner ikke nye utfall.

## Publisering og konsekvenser

Daily Record krever tillit og minst to kvalifiserende synlige opphav etter [regel P](PUNKT9-SYNLIG-VURDERINGSREGEL.md). Connect og Threadline har ikke det samme redaksjonelle filteret. Først etter publisering brukes skjult sannhet og reell støtte til verdens vurdering, troverdighet og eksponerte påstander. Egne kildekort og forbehold endrer ikke verdens poengregel. Supports-koblinger kan endre hva Dana slipper gjennom.

Publiserte rapporter i PR #89 fryser Casebook-grunnlaget. Tidslinjehendelser følger rapporten, men er ikke en ny poengmekanisme. Saken avsluttes gjennom publisering, tid og verdens regler, ikke en løsningsknapp. Interne poeng og sannhetsverdier vises ikke til spilleren.

## 1. Hvilke avslutninger finnes

Ni avslutninger i `mystery.json`. «Lukker» betyr `closes: true`: saken blir *Resolved* i Casebook, verden går videre.

| ID (arbeidstittel) | Lukker | Utløses når | Hva skjer i verden |
|---|---|---|---|
| `lights_out` | ja | S2 (Brightline styrer @maraquinn) **og** S3 (Northgate betalte Brightline) avslørt med sterk støtte gjennom **Daily Record**, før saksdag 8 | Maras profil blir minneprofil, Juno/Mike/Pat/Lindsay slettes, Brightlines sider A19–A21 skjules, varsel om 41 suspenderte kontoer, Dana skriver, Theo skriver dagen etter. Dag 8: avstemningen utsettes (A67). |
| `too_late` | ja | S2 og S3 avslørt (hvilken kanal som helst), avstemningen er holdt, `lights_out` ikke nådd | Minneprofil, kontoene slettes, varsel: «The Waterfront vote stands; Ruiz calls for an inquiry». |
| `ghost_story` | ja | S1 (Mara er død) og S8 eller S2 avslørt, avstemningen holdt, S3 **ikke** publisert (heller ikke svakt) | Minneprofil, varsel fra Unfiltered: «goes viral … Brightline blames a rogue contractor. Northgate is not mentioned.» |
| `who_paid_whom` | ja | En av de tre over **og** S7 (Calvin finnes ikke) avslørt | Dana: «So who's Meridian?» Dagen etter: ukjent avsender, «You found the garden. You haven't found the gardener.» Frø til senere mysterier. |
| `wrong_murder` | nei | F1 (Mara ble drept) publisert, uansett kanal og støtte | Dana −3, Theo −3, Owen +3, Northgate truer med søksmål, Owen jubler. |
| `collateral_theo` | nei | F2 (Theo poster som Mara) publisert | Theo −10 og blokkert, Threadline finner adressen hans. |
| `collateral_owen` | nei | F3 (Owen hacket kontoen) publisert | Owen −5, «They're calling me a hacker now». |
| `collateral_iris` | nei | F5 (Iris står bak kontoen, delvis sant) publisert | Iris' konto slettes, hun bryter kontakten. |
| `silence` | nei | Ingen rapport publisert før avstemningen | «The vote passed. Nobody said anything. @maraquinn is still posting.» |

I tillegg finnes reaksjoner i `rules.json` som ikke er avslutninger, men som allerede gjør noe av det §5 og §6 beskriver:

- **Tidlig varsling (embryo til Cover-Up):** spør Calvin om Mara/Juno/hagen, eller vis @maraquinn bevis for S1/S2/S5, og Brightline fjerner A21 og sender Juno for å sjekke deg ut (`D3_brightline_alert`). Bruk av Iris' innlogging gjør at Iris mister kontoen og portalen stenges (`D7_portal_used`).
- **Etter første rapport, uansett innhold:** Brightline publiserer en uttalelse dagen etter (A42).
- **Publisering på Connect/Threadline:** «hundrevis av svar som høres … kjente ut» (hagen svarer), og Unfiltered plukker opp saken dagen etter (A69).
- **Avstemningen dag 8:** utsatt (A67) hvis S3 er avslørt med sterk støtte før dag 8, ellers vedtatt 6–5 (A68) og @maraquinn feirer (A50).
- **Etter en avslutning:** Dana og Theo har egne replikker. Paul lekker noe dersom han er presset og spillerens troverdighet er minst 40.

## 2. Hvordan de utløses

- `checkEndings()` kjøres etter hver publisering og etter hver **Sleep**. Den går gjennom avslutningene i alle startede saker, i rekkefølgen i filen. En avslutning kan bare inntreffe én gang. `requiresEnding` finnes, men brukes ikke i dag (`who_paid_whom` bruker flagg i stedet).
- Betingelsene er deklarative (`core/conditions.js`). Avslutningene bruker bare tre typer: `exposed` (sann påstand publisert med støtte, med valgfri kanal, frist og `allowWeak`), `published` (påstanden publisert, sann eller ikke) og flagg satt av regler (`vote_held`, `silent_vote`, `ending_*`).
- Fristen er `beforeCaseDay: 8`, regnet fra dagen saken startet. Avstemningen skjer i `day.start` på saksdag 8, før `checkEndings`. Publisering på dag 8 er altså etter avstemningen.
- Når en avslutning inntreffer: den registreres med dag, saken lukkes hvis `closes`, effektene kjøres, og spilleren får et varsel «The Quiet Account: Lights out» som åpner Reports.


## Gjenstående funn og designspørsmål

- F-1: `vote_held` er ikke det samme som `vote_passed`. Hele historien på Connect/Threadline før avstemningen kan gi både utsatt avstemning og Too late-epilog. Forslaget om `vote_passed` må kontrolleres og avklares før retting.
- F-2: bare S2 gjennom Daily Record mangler et planlagt Partial Truth-utfall. Om det skal bli ny avslutning eller utvidelse av Ghost story, er ikke avgjort.
- Lights out kommer i publiseringshandlingen. Forslaget om neste-morgen-klimaks og egen DR-artikkel er ikke implementert.
- Silence etterfulgt av senere publisering og Brightlines generelle uttalelse etter enhver rapport bør gjennomgås for sammenheng.
- Nøytral saksstatus, Buried Story, Cover-Up, nye publiseringskanaler og endret Threadline-vekt er forslag, ikke dagens funksjon.

Samlet prioritering står i [BACKLOG](BACKLOG.md). Før en endring bør en utfallsmatrise dekke påstander, kanal og før/etter frist, inkludert feilaktige teorier. En test som bevarer dagens utfall er ikke i seg selv bevis på at det utfallet er riktig design.
