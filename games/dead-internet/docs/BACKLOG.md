# Utestående arbeid og forslag

Oppdatert 25. november 2026. PR #90 og #89 er godkjent og merget til main (`6a98828`).

## Videre arbeid

Gjennomgangen av PR #89 er avsluttet. Se [sluttrapporten](PR89-REVIEW.md). Velg en avgrenset oppgave nedenfor; nye designvalg krever avklaring.

## Kjente problemer som gjenstår

| Sak | Status og neste handling |
|---|---|
| Danas tillitsfarm | Rettet og merget i PR #92: én reaksjon og +1 tillit totalt. Gamle lagringer beholder opptjent tillit. Relevanslekkasjen er separat. |
| Owens samtalehukommelse | Godkjente engelske svar for ukjente personer/emner og gjentakelser implementeres på `codex/owen-dialogue-memory`. Eksisterende fremdrift beholdes. Hendelsesstyrt utvikling og `showSupports`-rettingen tas separat. |
| Reaksjoner på skjulte relevansmerker | `showSupports` brukes fortsatt i dialogen. Gjennomgå persona-Mara, Dana ved lav tillit, Dana evidence og Pauls gjentatte juridiske svar. Theo proof, Dana invoice og Owen agency må vurderes mot synlig innhold og personens dokumenterte kunnskap. Ikke erstatt alle karakterreaksjoner automatisk. |
| Danas dialog vs redaksjon | Bevisreplikken sier fortsatt «two independent sources» og bruker skjult utløser. PR #89 retter redaksjonens gjennomgang/kutt, ikke hele dialogsystemet. Samordne ordlyden i den separate rettingen. |
| F-1: motstridende avslutning | `vote_held` kan gi Too late selv når avstemningen utsettes. Reproduser på PR #89 før endring; forslag er å kreve `vote_passed`. |
| F-2: bare kontoovertakelsen avslørt | Manglende avslutning når bare S2 publiseres. Designavgjørelse: ny Partial Truth eller utvidelse av eksisterende utfall. |
| Andre avslutningssvakheter | Umiddelbart klimaks, manglende egen DR-artikkel, Silence etterfulgt av ny epilog og Brightlines generelle uttalelse. Se [saksavslutning](CASE-ENDINGS-REVIEW.md). |

## Spilltest etter gjennomgangen

- Ekstern test med 2–3 personer: naturlig oppdagelse av spor, forståelse av kildeopptelling, støtte/kutt og hjelpetekster; tid uten fremgang og opplevelsen av avslutninger.
- Navnebelastning: observer om bakgrunnsnavn oppfattes som obligatoriske spor. Lag et avgrenset forslag etter observasjon; ingen automatisk fjerning av navn eller innføring av relevansmarkører.
- Undersøk søk med det utvidede internettet og om utseende eller bilder røper hvilke sider som er viktige.
- Prøv feilaktige teorier, delvise avsløringer, gamle lagringer og fortsatt utforskning etter avslutning.

## Forslag som trenger designavklaring

- Strukturert påstand om manipulert dokument og andre påstandstyper utover dagens trippel. Ikke automatisk del av F-1/F-2.
- Nøytral saksstatus, tydeligere kanalbeskrivelser, neste-morgen-klimaks og avisartikkel om spillerens sak.
- Buried Story, Cover-Up, Unfiltered som publiseringskanal og eventuell endring av Threadlines troverdighetsvekt.
- Flere arkivkopier der det krever ny kanon. Nåværende Archive gjenbruker eksisterende versjoner.
- Vise teorier/koblinger til karakterer. Ingen fasitrespons som bekrefter spillerens slutning.
- Maras møllebilde på Calderpedia er utsatt; Brightlines kundecaser skal fortsatt være anonyme.

## Senere utviklingsretninger — ikke aktive oppgaver

- Mail, Files, Contacts og Forensics. Archive finnes allerede i Browser; sammenligning finnes i Casebook. Nye apper må ha en egen begrunnelse og ikke duplisere disse.
- TokTok: grensesnitt og videoproduksjon gjenstår. Mediekjerne og nyhetsapper finnes. Planrammer: 3–5 valgfrie klipp med spor i The Quiet Account, saken løses uten dem; første produksjonsrunde 20–30 klipp, arkitektur for 150 eller flere. Ingen bevis eksklusivt i feeden. Se [medier](MEDIA-APPS-PROPOSAL.md).
- Nye mysterier i samme univers: Project Echo, Missing Millions, Memory Rewrite og Ghost Network er retninger/frø, ikke ferdige saker. Varige konsekvenser følger med, det store spørsmålet holdes åpent.
- Innholdseditor, lokalisering og eventuell AI-dialog er senere vurderinger. AI-dialog krever eget omfang, kunnskapsgrenser, kostnadskontroll og reserve til skriptet dialog.

## Sporbarhet

Detaljer og historiske begrunnelser er bevart i [tidligere DEVPLAN](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/DEVPLAN.md), [avslutningsgjennomgangen](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/docs/CASE-ENDINGS-REVIEW.md) og [medieplanen](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/docs/MEDIA-APPS-PROPOSAL.md). Historiske forslag er ikke implisitte godkjenninger.
